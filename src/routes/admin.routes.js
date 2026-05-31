const { Router } = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const { overview, contentSummary, getUsers } = require('../controllers/admin.controller');
const { updateUserPermissions, updatePaymentStatus } = require('../controllers/user.controller');
const { createNotification } = require('../controllers/notifications.controller');
const { updateSubscriptionSettings } = require('../controllers/poster.controller');
const { uploadMedia, uploadRoot } = require('../middleware/upload.middleware');
const { optimizeUploads } = require('../middleware/optimize-upload.middleware');

const router = Router();

router.use(requireAuth, requireAdmin);
router.get('/overview', overview);
router.get('/content-summary', contentSummary);
router.get('/users', getUsers);
router.patch('/users/:id/permissions', updateUserPermissions);
router.patch('/users/:id/payment-status', updatePaymentStatus);
router.post('/notifications/broadcast', uploadMedia.single('media'), optimizeUploads({ uploadRoot }), createNotification);
router.put('/subscriptions/settings', updateSubscriptionSettings);

module.exports = router;
