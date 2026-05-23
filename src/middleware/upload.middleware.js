const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadRoot = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, '..', '..', 'uploads');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function makeUpload(folder, allowedTypes = /jpeg|jpg|png|webp|mp4|mov|pdf/, maxFileSizeMb = 50) {
  const destination = path.join(uploadRoot, folder);
  ensureDir(destination);

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, destination),
    filename: (_req, file, cb) => {
      const mimeExt = file.mimetype?.split('/')?.[1]?.replace('jpeg', 'jpg');
      const ext = path.extname(file.originalname).toLowerCase() || `.${mimeExt || 'jpg'}`;
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: maxFileSizeMb * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
      const mime = file.mimetype?.split('/')?.[1]?.replace('quicktime', 'mov')?.replace('jpeg', 'jpg') || '';
      if (allowedTypes.test(ext) || allowedTypes.test(mime)) return cb(null, true);
      cb(new Error(`Unsupported file type: ${file.mimetype || file.originalname}`));
    },
  });
}

function fileUrl(req, file) {
  if (!file) return '';
  const baseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
  const relative = path.relative(uploadRoot, file.path).replace(/\\/g, '/');
  return `${baseUrl}/uploads/${relative}`;
}

module.exports = {
  uploadProfile: makeUpload('profiles', /jpeg|jpg|png|webp/, 25),
  uploadMedia: makeUpload('media', /jpeg|jpg|png|webp|mp4|mov/, 250),
  uploadTemplate: makeUpload('poster-templates', /jpeg|jpg|png|webp/, 25),
  uploadTraining: makeUpload('training', /jpeg|jpg|png|webp|mp4|mov/, 300),
  fileUrl,
};
