const { Router } = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const { uploadMedia } = require('../middleware/upload.middleware');
const { listNotifications, createNotification } = require('../controllers/notifications.controller');

const router = Router();

router.get('/', requireAuth, listNotifications);
router.post('/', requireAuth, requireAdmin, uploadMedia.single('media'), createNotification);

module.exports = router;
