const fs = require('fs');
const path = require('path');
const multer = require('multer');

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tenantSlug = (req.params.tenantSlug || 'shared').toLowerCase();
    const dir = path.join(UPLOAD_DIR, tenantSlug);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  }
});

// Explicit allowlist rather than the "image/*" wildcard — that wildcard also matches
// image/svg+xml, and an uploaded SVG can carry a <script> that executes if the file is
// ever opened directly (not just embedded in an <img>), which would run in this app's
// own origin. Raster formats only.
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/x-m4a',
  // Phones/browsers sometimes tag an audio-only .mp4/.m4a recording as video/mp4 —
  // still played back as audio-only on the client.
  'video/mp4'
]);

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      const err = new Error('Only JPG/PNG/WebP/GIF images or MP3/MP4/WAV/OGG audio are allowed');
      err.status = 400;
      return cb(err);
    }
    cb(null, true);
  }
});

function fileUrl(req, file) {
  const tenantSlug = (req.params.tenantSlug || 'shared').toLowerCase();
  return `/uploads/${tenantSlug}/${file.filename}`;
}

module.exports = { upload, fileUrl, UPLOAD_DIR };
