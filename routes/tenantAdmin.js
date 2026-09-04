const express = require('express');
const { AudioContent, Event, Advertisement, Donation, GalleryPhoto, Tenant, THEME_KEYS } = require('../models/Schemas');
const { requirePortalAdmin } = require('../middleware/auth');
const { resolveTenant } = require('../middleware/tenant');
const { upload, fileUrl } = require('../middleware/upload');

const router = express.Router({ mergeParams: true });
router.use(resolveTenant, requirePortalAdmin);

// Same rationale as the public portal routes: these lists were fully unbounded.
const LIST_CAP = 500;

// Generic upload used by audio / advertisement / branding forms
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: fileUrl(req, req.file) });
});

// Branding
router.get('/branding', (req, res) => {
  const { name, slug, logoUrl, theme, adminEmail } = req.tenant;
  res.json({ name, slug, logoUrl, theme, adminEmail });
});

router.patch('/branding', async (req, res, next) => {
  try {
    const { name, logoUrl, theme } = req.body;
    if (theme !== undefined && !THEME_KEYS.includes(theme)) {
      return res.status(400).json({ error: 'Invalid theme' });
    }
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (logoUrl !== undefined) updates.logoUrl = logoUrl;
    if (theme !== undefined) updates.theme = theme;
    const tenant = await Tenant.findByIdAndUpdate(req.tenant._id, updates, { new: true, runValidators: true });
    res.json(tenant);
  } catch (err) {
    next(err);
  }
});

// Audio content
router.get('/audio', async (req, res, next) => {
  try {
    const audio = await AudioContent.find({ tenant: req.tenant._id }).sort({ createdAt: -1 }).limit(LIST_CAP);
    res.json(audio);
  } catch (err) {
    next(err);
  }
});

router.post('/audio', async (req, res, next) => {
  try {
    const { title, audioUrl, thumbnailUrl, lyrics, isFeatured } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const audio = await AudioContent.create({
      tenant: req.tenant._id,
      title,
      audioUrl: audioUrl || '',
      thumbnailUrl: thumbnailUrl || '',
      lyrics: lyrics || {},
      isFeatured: !!isFeatured
    });
    res.status(201).json(audio);
  } catch (err) {
    next(err);
  }
});

router.patch('/audio/:id', async (req, res, next) => {
  try {
    const { title, audioUrl, thumbnailUrl, lyrics, isFeatured } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (audioUrl !== undefined) updates.audioUrl = audioUrl;
    if (thumbnailUrl !== undefined) updates.thumbnailUrl = thumbnailUrl;
    if (lyrics !== undefined) updates.lyrics = lyrics;
    if (isFeatured !== undefined) updates.isFeatured = isFeatured;
    const audio = await AudioContent.findOneAndUpdate(
      { _id: req.params.id, tenant: req.tenant._id }, updates, { new: true, runValidators: true }
    );
    if (!audio) return res.status(404).json({ error: 'Audio track not found' });
    res.json(audio);
  } catch (err) {
    next(err);
  }
});

router.delete('/audio/:id', async (req, res, next) => {
  try {
    await AudioContent.deleteOne({ _id: req.params.id, tenant: req.tenant._id });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// Events / program calendar
router.get('/events', async (req, res, next) => {
  try {
    const events = await Event.find({ tenant: req.tenant._id }).sort({ startTime: 1 }).limit(LIST_CAP);
    res.json(events);
  } catch (err) {
    next(err);
  }
});

router.post('/events', async (req, res, next) => {
  try {
    const { title, description, startTime, endTime } = req.body;
    if (!title || !startTime || !endTime) {
      return res.status(400).json({ error: 'Title, startTime and endTime are required' });
    }
    const event = await Event.create({ tenant: req.tenant._id, title, description, startTime, endTime });
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
});

router.patch('/events/:id', async (req, res, next) => {
  try {
    const { title, description, startTime, endTime } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (startTime !== undefined) updates.startTime = startTime;
    if (endTime !== undefined) updates.endTime = endTime;
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, tenant: req.tenant._id }, updates, { new: true, runValidators: true }
    );
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) {
    next(err);
  }
});

router.delete('/events/:id', async (req, res, next) => {
  try {
    await Event.deleteOne({ _id: req.params.id, tenant: req.tenant._id });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// Advertisements
router.get('/advertisements', async (req, res, next) => {
  try {
    const ads = await Advertisement.find({ tenant: req.tenant._id }).sort({ createdAt: -1 }).limit(LIST_CAP);
    res.json(ads);
  } catch (err) {
    next(err);
  }
});

router.post('/advertisements', async (req, res, next) => {
  try {
    const { imageUrl, targetLink } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'imageUrl is required' });
    const ad = await Advertisement.create({ tenant: req.tenant._id, imageUrl, targetLink: targetLink || '' });
    res.status(201).json(ad);
  } catch (err) {
    next(err);
  }
});

router.patch('/advertisements/:id', async (req, res, next) => {
  try {
    const { imageUrl, targetLink, isActive } = req.body;
    const updates = {};
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (targetLink !== undefined) updates.targetLink = targetLink;
    if (isActive !== undefined) updates.isActive = isActive;
    const ad = await Advertisement.findOneAndUpdate(
      { _id: req.params.id, tenant: req.tenant._id }, updates, { new: true }
    );
    if (!ad) return res.status(404).json({ error: 'Advertisement not found' });
    res.json(ad);
  } catch (err) {
    next(err);
  }
});

router.delete('/advertisements/:id', async (req, res, next) => {
  try {
    await Advertisement.deleteOne({ _id: req.params.id, tenant: req.tenant._id });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// Donations
router.get('/donations', async (req, res, next) => {
  try {
    const donations = await Donation.find({ tenant: req.tenant._id }).sort({ createdAt: -1 }).limit(LIST_CAP);
    res.json(donations);
  } catch (err) {
    next(err);
  }
});

router.patch('/donations/:id', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['RECEIVED', 'REJECTED', 'PENDING'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const donation = await Donation.findOneAndUpdate(
      { _id: req.params.id, tenant: req.tenant._id }, { status }, { new: true }
    );
    if (!donation) return res.status(404).json({ error: 'Donation not found' });
    req.io.to(req.tenant.slug).emit('donation-update', donation);
    res.json(donation);
  } catch (err) {
    next(err);
  }
});

// Gallery moderation
router.get('/gallery', async (req, res, next) => {
  try {
    const photos = await GalleryPhoto.find({ tenant: req.tenant._id }).sort({ createdAt: -1 }).limit(LIST_CAP);
    res.json(photos);
  } catch (err) {
    next(err);
  }
});

router.patch('/gallery/:id', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const photo = await GalleryPhoto.findOneAndUpdate(
      { _id: req.params.id, tenant: req.tenant._id }, { status }, { new: true }
    );
    if (!photo) return res.status(404).json({ error: 'Photo not found' });
    req.io.to(req.tenant.slug).emit('gallery-update', photo);
    res.json(photo);
  } catch (err) {
    next(err);
  }
});

// Aarti alert trigger
router.post('/aarti/trigger', (req, res) => {
  const { message } = req.body;
  if (message !== undefined && (typeof message !== 'string' || message.length > 300)) {
    return res.status(400).json({ error: 'Message must be a string under 300 characters' });
  }
  const payload = {
    message: message || `🙏 Aarti time at ${req.tenant.name}!`,
    triggeredAt: new Date().toISOString()
  };
  req.io.to(req.tenant.slug).emit('aarti-alert', payload);
  res.json({ sent: true, ...payload });
});

module.exports = router;
