const jwt = require('jwt-simple');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-key';
const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL || 'sunil@verticalinfinity.in').toLowerCase();

const DAY_MS = 24 * 60 * 60 * 1000;

// jwt-simple doesn't enforce expiry itself — we set our own `exp` claim and check it
// on every decode below, so stolen/leaked tokens don't stay valid forever.
function signToken(payload, ttlMs = 12 * 60 * 60 * 1000) {
  return jwt.encode({ ...payload, iat: Date.now(), exp: Date.now() + ttlMs }, JWT_SECRET);
}

function getToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' ? token : null;
}

function decodeValid(token) {
  const decoded = jwt.decode(token, JWT_SECRET);
  if (decoded.exp && Date.now() > decoded.exp) {
    const err = new Error('Token expired');
    err.expired = true;
    throw err;
  }
  return decoded;
}

function requireSuperAdmin(req, res, next) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: 'Missing authorization token' });
  try {
    const decoded = decodeValid(token);
    if (decoded.role !== 'super-admin' || decoded.email !== SUPER_ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Super admin access required' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: err.expired ? 'Session expired — please sign in again' : 'Invalid token' });
  }
}

function requirePortalAdmin(req, res, next) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: 'Missing authorization token' });
  try {
    const decoded = decodeValid(token);
    const tenantSlug = req.params.tenantSlug;
    if (decoded.role !== 'portal-admin' || decoded.tenantSlug !== tenantSlug) {
      return res.status(403).json({ error: 'Portal admin access required for this tenant' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: err.expired ? 'Session expired — please sign in again' : 'Invalid token' });
  }
}

function requireEndUser(req, res, next) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: 'Please verify your mobile number to continue' });
  try {
    const decoded = decodeValid(token);
    const tenantSlug = req.params.tenantSlug;
    if (decoded.role !== 'end-user' || decoded.tenantSlug !== tenantSlug) {
      return res.status(403).json({ error: 'Please verify your mobile number to continue' });
    }
    req.endUser = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired — please verify your mobile number again' });
  }
}

module.exports = {
  signToken, requireSuperAdmin, requirePortalAdmin, requireEndUser, JWT_SECRET, SUPER_ADMIN_EMAIL,
  ADMIN_TOKEN_TTL_MS: 12 * 60 * 60 * 1000,
  END_USER_TOKEN_TTL_MS: 30 * DAY_MS
};
