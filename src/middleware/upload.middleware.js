const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadRoot = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, '..', '..', 'uploads');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function normalizeConfigMap(fieldConfigs = {}) {
  return Object.fromEntries(
    Object.entries(fieldConfigs).map(([fieldName, config]) => ([
      fieldName,
      {
        folder: config.folder,
        allowedTypes: config.allowedTypes || /jpeg|jpg|png|webp|mp4|mov|mkv|avi|pdf/,
      },
    ])),
  );
}

function makeUpload(folder, allowedTypes = /jpeg|jpg|png|webp|mp4|mov|mkv|avi|pdf/, maxFileSizeMb = 50) {
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
      const mime = file.mimetype
        ?.split('/')?.[1]
        ?.replace('quicktime', 'mov')
        ?.replace('x-matroska', 'mkv')
        ?.replace('x-msvideo', 'avi')
        ?.replace('jpeg', 'jpg') || '';
      if (allowedTypes.test(ext) || allowedTypes.test(mime)) return cb(null, true);
      cb(new Error(`Unsupported file type: ${file.mimetype || file.originalname}`));
    },
  });
}

function makeFieldUpload(fieldConfigs, maxFileSizeMb = 50) {
  const configMap = normalizeConfigMap(fieldConfigs);
  Object.values(configMap).forEach(({ folder }) => ensureDir(path.join(uploadRoot, folder)));

  const storage = multer.diskStorage({
    destination: (_req, file, cb) => {
      const config = configMap[file.fieldname];
      if (!config) return cb(new Error(`Unsupported upload field: ${file.fieldname}`));
      return cb(null, path.join(uploadRoot, config.folder));
    },
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
      const config = configMap[file.fieldname];
      if (!config) return cb(new Error(`Unsupported upload field: ${file.fieldname}`));
      const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
      const mime = file.mimetype
        ?.split('/')?.[1]
        ?.replace('quicktime', 'mov')
        ?.replace('x-matroska', 'mkv')
        ?.replace('x-msvideo', 'avi')
        ?.replace('jpeg', 'jpg') || '';
      if (config.allowedTypes.test(ext) || config.allowedTypes.test(mime)) return cb(null, true);
      return cb(new Error(`Unsupported file type for ${file.fieldname}: ${file.mimetype || file.originalname}`));
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
  uploadRegisterMedia: makeFieldUpload({
    profilePhoto: { folder: 'profiles', allowedTypes: /jpeg|jpg|png|webp/ },
    voterIdPhoto: { folder: 'voter_id', allowedTypes: /jpeg|jpg|png|webp/ },
  }, 25),
  uploadMedia: makeUpload('media', /jpeg|jpg|png|webp|mp4|mov|mkv|avi/, 250),
  uploadTemplate: makeUpload('poster-templates', /jpeg|jpg|png|webp/, 25),
  uploadTraining: makeUpload('training', /jpeg|jpg|png|webp|mp4|mov|mkv|avi/, 300),
  fileUrl,
  uploadRoot,
};
