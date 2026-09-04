require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const superAdminRoutes = require('./routes/superAdmin');
const tenantAdminRoutes = require('./routes/tenantAdmin');
const portalRoutes = require('./routes/portal');
const { apiLimiter } = require('./middleware/rateLimit');

// Named SERVER_PORT (not PORT) so it doesn't collide with a platform-injected
// PORT env var meant for whichever process is the public-facing one (here, Vite).
const PORT = process.env.SERVER_PORT || 5000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const CORS_ORIGIN = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim());
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Refuse to boot in production with the placeholder dev secrets that ship in this
// repo's example config — those values are public (they're in source control), so
// running with them in production means anyone can forge admin/end-user JWTs or
// log in as the super admin.
const DEV_SECRET_VALUES = new Set(['dev-jwt-secret-key', 'dev-super-admin-secret-key']);
if (IS_PRODUCTION) {
  const problems = [];
  if (!process.env.JWT_SECRET || DEV_SECRET_VALUES.has(process.env.JWT_SECRET)) {
    problems.push('JWT_SECRET is missing or set to the known dev placeholder');
  }
  if (!process.env.SUPER_ADMIN_SECRET || DEV_SECRET_VALUES.has(process.env.SUPER_ADMIN_SECRET)) {
    problems.push('SUPER_ADMIN_SECRET is missing or set to the known dev placeholder');
  }
  if (problems.length) {
    console.error('✗ Refusing to start in production with insecure configuration:');
    problems.forEach((p) => console.error(`  - ${p}`));
    process.exit(1);
  }
}

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();
// Needed for correct client IPs (and therefore correct rate limiting) behind a
// reverse proxy / load balancer, which is the normal production deployment shape.
app.set('trust proxy', 1);
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CORS_ORIGIN, methods: ['GET', 'POST', 'PATCH', 'DELETE'] },
  pingInterval: Number(process.env.SOCKET_PING_INTERVAL) || 25000,
  pingTimeout: Number(process.env.SOCKET_PING_TIMEOUT) || 20000
});

io.on('connection', (socket) => {
  socket.on('join-tenant', (tenantSlug) => {
    if (typeof tenantSlug === 'string' && tenantSlug) socket.join(tenantSlug.toLowerCase());
  });
});

// crossOriginResourcePolicy is relaxed only in dev, where the frontend (Vite, a
// different origin) loads images straight off this API's /uploads. In production
// everything is served from one origin, so the stricter default applies.
app.use(helmet({ crossOriginResourcePolicy: IS_PRODUCTION ? undefined : false }));
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => { req.io = io; next(); });

app.use('/uploads', express.static(path.resolve(UPLOAD_DIR)));

function healthCheck(req, res) {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    status: 'OK',
    message: '🙏 Ganesh Utsav Server',
    database: dbStates[mongoose.connection.readyState] || 'unknown'
  });
}
app.get('/health', healthCheck);
app.get('/api/health', healthCheck);

app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/portal/:tenantSlug/admin', tenantAdminRoutes);
app.use('/api/portal/:tenantSlug', portalRoutes);

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// Serve the built frontend in production
const distDir = path.join(__dirname, 'frontend/dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

app.use((err, req, res, next) => {
  console.error(err);

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((e) => e.message).join(' ');
    return res.status(400).json({ error: message });
  }
  // Malformed Mongo ObjectId (e.g. a garbage :id in the URL) — treat as "not found"
  // rather than surfacing Mongoose/driver internals in the response.
  if (err.name === 'CastError') {
    return res.status(404).json({ error: 'Not found' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: 'That value is already in use' });
  }
  // Multer's own errors (file too large, etc.) and our fileFilter rejections are
  // already user-safe, single-sentence messages — fine to pass straight through.
  if (err.name === 'MulterError' || err.status === 400) {
    return res.status(400).json({ error: err.message });
  }

  // Anything else is unexpected — don't leak internals (stack traces, driver/library
  // error text) to the client in production; still show it in dev for debugging.
  const message = IS_PRODUCTION ? 'Internal server error' : (err.message || 'Internal server error');
  res.status(err.status || 500).json({ error: message });
});

mongoose.connection.on('connected', () => console.log('✓ MongoDB connected'));
mongoose.connection.on('error', (err) => console.error('✗ MongoDB error:', err.message));
mongoose.connection.on('disconnected', () => console.warn('✗ MongoDB disconnected'));

mongoose.connect(process.env.MONGODB_URI)
  .catch((err) => console.error('✗ MongoDB initial connection failed:', err.message));

server.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  server.close(() => process.exit(0));
});
