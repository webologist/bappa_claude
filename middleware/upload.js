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

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    // Accept video/mp4 too — phones/browsers sometimes tag an audio-only .mp4/.m4a
    // recording that way, and it's still played back as audio-only on the client.
    const allowed = /^(image|audio)\//.test(file.mimetype) || file.mimetype === 'video/mp4';
    if (!allowed) return cb(new Error('Only image or audio files are allowed'));
    cb(null, true);
  }
});

function fileUrl(req, file) {
  const tenantSlug = (req.params.tenantSlug || 'shared').toLowerCase();
  return `/uploads/${tenantSlug}/${file.filename}`;
}

module.exports = { upload, fileUrl, UPLOAD_DIR };
