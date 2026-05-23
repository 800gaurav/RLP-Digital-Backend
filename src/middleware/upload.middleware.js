const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadRoot = path.join(__dirname, '..', 'uploads');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function makeUpload(folder, allowedTypes = /jpeg|jpg|png|webp|mp4|mov|pdf/) {
  const destination = path.join(uploadRoot, folder);
  ensureDir(destination);

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, destination),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
      if (allowedTypes.test(ext)) return cb(null, true);
      cb(new Error('Unsupported file type'));
    },
  });
}

function fileUrl(req, file) {
  if (!file) return '';
  const baseUrl = process.env.API_BASE_URL || `${req.protocol}://${req.get('host')}`;
  const relative = path.relative(uploadRoot, file.path).replace(/\\/g, '/');
  return `${baseUrl}/uploads/${relative}`;
}

module.exports = {
  uploadProfile: makeUpload('profiles', /jpeg|jpg|png|webp/),
  uploadMedia: makeUpload('media', /jpeg|jpg|png|webp|mp4|mov/),
  uploadTemplate: makeUpload('poster-templates', /jpeg|jpg|png|webp/),
  uploadTraining: makeUpload('training', /jpeg|jpg|png|webp|mp4|mov/),
  fileUrl,
};
