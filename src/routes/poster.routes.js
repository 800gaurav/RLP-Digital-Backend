const { Router } = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const { uploadTemplate } = require('../middleware/upload.middleware');
const { getTemplates, createTemplate, updateTemplate, deleteTemplate, getSubscriptionStatus, updateSubscriptionPrice } = require('../controllers/poster.controller');

const router = Router();

router.get('/templates', requireAuth, getTemplates);
router.post('/templates', requireAuth, requireAdmin, uploadTemplate.single('image'), createTemplate);
router.put('/templates/:id', requireAuth, requireAdmin, uploadTemplate.single('image'), updateTemplate);
router.delete('/templates/:id', requireAuth, requireAdmin, deleteTemplate);
router.get('/subscription', requireAuth, getSubscriptionStatus);
router.put('/subscription/price', requireAuth, requireAdmin, updateSubscriptionPrice);

module.exports = router;
