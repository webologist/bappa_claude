const express = require('express');
const crypto = require('crypto');
const { Tenant } = require('../models/Schemas');
const { signToken, SUPER_ADMIN_EMAIL } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();
router.use(authLimiter);

// Constant-time string compare, padded to a fixed length first so timingSafeEqual
// never throws on a length mismatch (which would itself leak length via a 500 vs 401).
function safeEqual(a, b) {
  const buf = (s) => Buffer.from(String(s).padEnd(128), 'utf8');
  return crypto.timingSafeEqual(buf(a), buf(b));
}

router.post('/super-admin/login', (req, res) => {
  const { email, secret } = req.body;
  if (!email || !secret) return res.status(400).json({ error: 'Email and secret are required' });

  const validEmail = email.toLowerCase() === SUPER_ADMIN_EMAIL;
  const validSecret = safeEqual(secret, process.env.SUPER_ADMIN_SECRET || '');
  if (!validEmail || !validSecret) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken({ role: 'super-admin', email: SUPER_ADMIN_EMAIL });
  res.json({ token, email: SUPER_ADMIN_EMAIL });
});

router.post('/portal-admin/login', async (req, res, next) => {
  try {
    const { tenantSlug, email, token: adminToken } = req.body;
    if (!tenantSlug || !email || !adminToken) {
      return res.status(400).json({ error: 'Tenant slug, email and token are required' });
    }

    const tenant = await Tenant.findOne({ slug: tenantSlug.toLowerCase() });
    if (!tenant || !tenant.isActive) return res.status(404).json({ error: 'Portal not found' });

    const validEmail = tenant.adminEmail.toLowerCase() === email.toLowerCase();
    const validToken = safeEqual(adminToken, tenant.adminToken);
    if (!validEmail || !validToken) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ role: 'portal-admin', tenantSlug: tenant.slug, email: tenant.adminEmail });
    res.json({ token, tenant: { name: tenant.name, slug: tenant.slug, logoUrl: tenant.logoUrl } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
