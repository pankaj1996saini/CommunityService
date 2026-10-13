const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const HttpError = require('../utils/httpError');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/heic': '.heic',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // don't trust the original name, phones send all sorts of things
    const ext = EXT_BY_MIME[file.mimetype] || '.jpg';
    cb(null, `${Date.now()}-${crypto.randomBytes(5).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 4 },
  fileFilter: (_req, file, cb) => {
    if (EXT_BY_MIME[file.mimetype]) return cb(null, true);
    cb(new HttpError(400, 'Only JPG, PNG, WEBP or HEIC images are allowed'));
  },
});

// "/uploads/abc.jpg" - the path the app will prefix with the server address
const publicPath = (file) => `/uploads/${file.filename}`;

module.exports = { upload, UPLOAD_DIR, publicPath };
