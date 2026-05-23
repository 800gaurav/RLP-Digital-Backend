const { Router } = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const { overview, contentSummary, getUsers } = require('../controllers/admin.controller');
const { updateUserPermissions } = require('../controllers/user.controller');
const { createNotification } = require('../controllers/notifications.controller');
const { updateSubscriptionPrice } = require('../controllers/poster.controller');
const { uploadMedia } = require('../middleware/upload.middleware');

const router = Router();

router.use(requireAuth, requireAdmin);
router.get('/overview', overview);
router.get('/content-summary', contentSummary);
router.get('/users', getUsers);
router.patch('/users/:id/permissions', updateUserPermissions);
router.post('/notifications/broadcast', uploadMedia.single('media'), createNotification);
router.put('/subscriptions/price', updateSubscriptionPrice);

module.exports = router;
