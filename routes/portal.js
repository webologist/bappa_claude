const express = require('express');
const crypto = require('crypto');
const { AudioContent, Event, Advertisement, Donation, GalleryPhoto, EndUser, OtpCode } = require('../models/Schemas');
const { resolveTenant } = require('../middleware/tenant');
const { upload, fileUrl } = require('../middleware/upload');
const { signToken, requireEndUser, END_USER_TOKEN_TTL_MS } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router({ mergeParams: true });
router.use(resolveTenant);

// Generous ceilings, not real pagination — these lists are naturally small
// (one celebration's worth of content) but were previously fully unbounded,
// so a bulk-inserted or scripted flood could still return an unbounded payload.
const LIST_CAP = 200;

router.get('/', (req, res) => {
  const { name, slug, logoUrl, theme } = req.tenant;
  res.json({ name, slug, logoUrl, theme });
});

router.get('/audio', async (req, res, next) => {
  try {
    const audio = await AudioContent.find({ tenant: req.tenant._id }).sort({ isFeatured: -1, createdAt: -1 }).limit(LIST_CAP);
    res.json(audio);
  } catch (err) {
    next(err);
  }
});

router.get('/events', async (req, res, next) => {
  try {
    const events = await Event.find({ tenant: req.tenant._id }).sort({ startTime: 1 }).limit(LIST_CAP);
    res.json(events);
  } catch (err) {
    next(err);
  }
});

router.get('/advertisements', async (req, res, next) => {
  try {
    const ads = await Advertisement.find({ tenant: req.tenant._id, isActive: true }).sort({ createdAt: -1 }).limit(LIST_CAP);
    res.json(ads);
  } catch (err) {
    next(err);
  }
});

// --- End-user mobile OTP registration -------------------------------------
// No SMS provider is wired up here — the code is logged server-side, and in
// non-production environments returned directly in the response so the flow
// is testable without one. Swap sendOtpSms() for a real provider (Twilio,
// MSG91, etc.) before this goes anywhere near real users.
function cleanPhone(phone) {
  return String(phone || '').replace(/\s+/g, '');
}
function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}
function sendOtpSms(tenantSlug, phone, code) {
  console.log(`📱 [OTP] ${tenantSlug} → ${phone}: ${code} (expires in 5 min)`);
}

router.post('/auth/otp/request', authLimiter, async (req, res, next) => {
  try {
    const phone = cleanPhone(req.body.phone);
    if (!/^[0-9]{7,15}$/.test(phone)) {
      return res.status(400).json({ error: 'Enter a valid phone number' });
    }
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await OtpCode.findOneAndUpdate(
      { tenant: req.tenant._id, phone },
      { code, expiresAt, verified: false, attempts: 0 },
      { upsert: true }
    );
    sendOtpSms(req.tenant.slug, phone, code);
    const isDev = process.env.NODE_ENV !== 'production';
    res.json({ sent: true, ...(isDev && { devCode: code }) });
  } catch (err) {
    next(err);
  }
});

router.post('/auth/otp/verify', authLimiter, async (req, res, next) => {
  try {
    const phone = cleanPhone(req.body.phone);
    const { code } = req.body;
    if (!phone || !code) return res.status(400).json({ error: 'Phone and code are required' });

    const otp = await OtpCode.findOne({ tenant: req.tenant._id, phone });
    if (!otp || otp.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Code expired — request a new one' });
    }
    if (otp.attempts >= 5) {
      return res.status(429).json({ error: 'Too many attempts — request a new code' });
    }
    if (otp.code !== code) {
      otp.attempts += 1;
      await otp.save();
      return res.status(400).json({ error: 'Incorrect code' });
    }

    otp.verified = true;
    otp.expiresAt = new Date(Date.now() + 10 * 60 * 1000); // grace period to finish registering
    await otp.save();

    const existing = await EndUser.findOne({ tenant: req.tenant._id, phone });
    if (existing) {
      const token = signToken({ role: 'end-user', tenantSlug: req.tenant.slug, phone, userId: existing._id.toString() }, END_USER_TOKEN_TTL_MS);
      return res.json({ status: 'existing', token, user: existing });
    }
    res.json({ status: 'new' });
  } catch (err) {
    next(err);
  }
});

router.post('/auth/register', authLimiter, async (req, res, next) => {
  try {
    const phone = cleanPhone(req.body.phone);
    const { firstName, lastName, address, sex, age, reference } = req.body;
    if (!phone || !firstName || !lastName) {
      return res.status(400).json({ error: 'First name, last name and phone are required' });
    }
    const otp = await OtpCode.findOne({ tenant: req.tenant._id, phone });
    if (!otp || !otp.verified || otp.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Please verify your mobile number again' });
    }

    const user = await EndUser.findOneAndUpdate(
      { tenant: req.tenant._id, phone },
      { firstName, lastName, address: address || '', sex: sex || '', age: age || undefined, reference: reference || '' },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );
    await OtpCode.deleteOne({ _id: otp._id });

    const token = signToken({ role: 'end-user', tenantSlug: req.tenant.slug, phone, userId: user._id.toString() }, END_USER_TOKEN_TTL_MS);
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
});
// ---------------------------------------------------------------------------

router.post('/donations', requireEndUser, async (req, res, next) => {
  try {
    const amount = Number(req.body.amount);
    // Number(...) on '', null, or a non-numeric string yields NaN, which the schema's
    // `min: 0` validator does not catch (NaN fails every comparison, so Mongoose's
    // min-check silently passes it through) — reject it explicitly here instead.
    if (!Number.isFinite(amount) || amount <= 0 || amount > 10000000) {
      return res.status(400).json({ error: 'Enter a valid donation amount' });
    }
    const user = await EndUser.findById(req.endUser.userId);
    if (!user) return res.status(401).json({ error: 'Please verify your mobile number again' });

    const donation = await Donation.create({
      tenant: req.tenant._id,
      donorName: `${user.firstName} ${user.lastName}`,
      donorPhone: user.phone,
      amount
    });
    req.io.to(req.tenant.slug).emit('donation-update', donation);
    res.status(201).json(donation);
  } catch (err) {
    next(err);
  }
});

router.get('/gallery', async (req, res, next) => {
  try {
    const photos = await GalleryPhoto.find({ tenant: req.tenant._id, status: 'APPROVED' }).sort({ createdAt: -1 }).limit(LIST_CAP);
    res.json(photos);
  } catch (err) {
    next(err);
  }
});

router.post('/gallery/upload', requireEndUser, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    const user = await EndUser.findById(req.endUser.userId);
    if (!user) return res.status(401).json({ error: 'Please verify your mobile number again' });

    const { caption } = req.body;
    const photo = await GalleryPhoto.create({
      tenant: req.tenant._id,
      uploaderName: `${user.firstName} ${user.lastName}`,
      uploaderPhone: user.phone,
      caption: caption || '',
      watermarkedImageUrl: fileUrl(req, req.file)
    });
    req.io.to(req.tenant.slug).emit('gallery-update', photo);
    res.status(201).json(photo);
  } catch (err) {
    next(err);
  }
});

router.post('/gallery/:id/like', requireEndUser, async (req, res, next) => {
  try {
    const photo = await GalleryPhoto.findOneAndUpdate(
      { _id: req.params.id, tenant: req.tenant._id, status: 'APPROVED' },
      { $inc: { likeCount: 1 } },
      { new: true }
    );
    if (!photo) return res.status(404).json({ error: 'Photo not found' });
    req.io.to(req.tenant.slug).emit('gallery-update', photo);
    res.json(photo);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
