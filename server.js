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

// Named SERVER_PORT (not PORT) so it doesn't collide with a platform-injected
// PORT env var meant for whichever process is the public-facing one (here, Vite).
const PORT = process.env.SERVER_PORT || 5000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const CORS_ORIGIN = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim());

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();
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

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
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
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
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
