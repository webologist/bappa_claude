const express = require('express');
const crypto = require('crypto');
const { Tenant } = require('../models/Schemas');
const { requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireSuperAdmin);

router.get('/tenants', async (req, res, next) => {
  try {
    const tenants = await Tenant.find().sort({ createdAt: -1 }).limit(500);
    res.json(tenants);
  } catch (err) {
    next(err);
  }
});

router.post('/tenants', async (req, res, next) => {
  try {
    const { name, slug, adminEmail, logoUrl } = req.body;
    if (!name || !slug || !adminEmail) {
      return res.status(400).json({ error: 'Name, slug and adminEmail are required' });
    }

    const existing = await Tenant.findOne({ slug: slug.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'A portal with this slug already exists' });

    const adminToken = crypto.randomBytes(12).toString('hex');
    const tenant = await Tenant.create({
      name,
      slug: slug.toLowerCase(),
      adminEmail: adminEmail.toLowerCase(),
      logoUrl: logoUrl || '',
      adminToken
    });
    res.status(201).json(tenant);
  } catch (err) {
    next(err);
  }
});

router.patch('/tenants/:id', async (req, res, next) => {
  try {
    const { name, logoUrl, adminEmail, isActive } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (logoUrl !== undefined) updates.logoUrl = logoUrl;
    if (adminEmail !== undefined) updates.adminEmail = adminEmail.toLowerCase();
    if (isActive !== undefined) updates.isActive = isActive;

    const tenant = await Tenant.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    res.json(tenant);
  } catch (err) {
    next(err);
  }
});

router.post('/tenants/:id/reset-token', async (req, res, next) => {
  try {
    const adminToken = crypto.randomBytes(12).toString('hex');
    const tenant = await Tenant.findByIdAndUpdate(req.params.id, { adminToken }, { new: true });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    res.json(tenant);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
