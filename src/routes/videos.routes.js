const { Router } = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const { uploadRoot, uploadTraining } = require('../middleware/upload.middleware');
const { optimizeUploads } = require('../middleware/optimize-upload.middleware');
const { getTrainingVideos, getTrainingVideo, createTrainingVideo, updateTrainingVideo, deleteTrainingVideo } = require('../controllers/videos.controller');

const router = Router();

router.get('/', requireAuth, getTrainingVideos);
router.get('/:id', requireAuth, getTrainingVideo);
router.post(
  '/',
  requireAuth,
  requireAdmin,
  uploadTraining.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'video', maxCount: 1 }]),
  optimizeUploads({ uploadRoot }),
  createTrainingVideo,
);
router.put(
  '/:id',
  requireAuth,
  requireAdmin,
  uploadTraining.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'video', maxCount: 1 }]),
  optimizeUploads({ uploadRoot }),
  updateTrainingVideo,
);
router.delete('/:id', requireAuth, requireAdmin, deleteTrainingVideo);

module.exports = router;
