const { Router } = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const { uploadTraining } = require('../middleware/upload.middleware');
const { getTrainingVideos, getTrainingVideo, createTrainingVideo } = require('../controllers/videos.controller');

const router = Router();

router.get('/', requireAuth, getTrainingVideos);
router.get('/:id', requireAuth, getTrainingVideo);
router.post(
  '/',
  requireAuth,
  requireAdmin,
  uploadTraining.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'video', maxCount: 1 }]),
  createTrainingVideo,
);

module.exports = router;
