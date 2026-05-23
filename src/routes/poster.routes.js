const { Router } = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const { uploadRoot, uploadTemplate } = require('../middleware/upload.middleware');
const { optimizeUploads } = require('../middleware/optimize-upload.middleware');
const { getTemplates, createTemplate, updateTemplate, deleteTemplate, getSubscriptionStatus, updateSubscriptionSettings, consumeTemplateDownload } = require('../controllers/poster.controller');

const router = Router();

router.get('/templates', requireAuth, getTemplates);
router.post(
  '/templates',
  requireAuth,
  requireAdmin,
  uploadTemplate.single('image'),
  optimizeUploads({
    uploadRoot,
    image: {
      maxWidth: Number(process.env.POSTER_IMAGE_MAX_WIDTH) || 2200,
      quality: Number(process.env.POSTER_IMAGE_QUALITY) || 88,
      thumbnailWidth: Number(process.env.POSTER_THUMB_WIDTH) || 720,
      thumbnailHeight: Number(process.env.POSTER_THUMB_HEIGHT) || 960,
      thumbnailQuality: Number(process.env.POSTER_THUMB_QUALITY) || 82,
    },
  }),
  createTemplate,
);
router.put(
  '/templates/:id',
  requireAuth,
  requireAdmin,
  uploadTemplate.single('image'),
  optimizeUploads({
    uploadRoot,
    image: {
      maxWidth: Number(process.env.POSTER_IMAGE_MAX_WIDTH) || 2200,
      quality: Number(process.env.POSTER_IMAGE_QUALITY) || 88,
      thumbnailWidth: Number(process.env.POSTER_THUMB_WIDTH) || 720,
      thumbnailHeight: Number(process.env.POSTER_THUMB_HEIGHT) || 960,
      thumbnailQuality: Number(process.env.POSTER_THUMB_QUALITY) || 82,
    },
  }),
  updateTemplate,
);
router.delete('/templates/:id', requireAuth, requireAdmin, deleteTemplate);
router.post('/templates/:id/consume-download', requireAuth, consumeTemplateDownload);
router.get('/subscription', requireAuth, getSubscriptionStatus);
router.put('/subscription/settings', requireAuth, requireAdmin, updateSubscriptionSettings);

module.exports = router;
