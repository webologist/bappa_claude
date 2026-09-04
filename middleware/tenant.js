const { Tenant } = require('../models/Schemas');

async function resolveTenant(req, res, next) {
  try {
    const slug = (req.params.tenantSlug || '').toLowerCase();
    const tenant = await Tenant.findOne({ slug });
    if (!tenant) return res.status(404).json({ error: 'Portal not found' });
    if (!tenant.isActive) return res.status(403).json({ error: 'This portal has been deactivated' });
    req.tenant = tenant;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { resolveTenant };
