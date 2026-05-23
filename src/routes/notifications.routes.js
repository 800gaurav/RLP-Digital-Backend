const { Router } = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const { uploadMedia, uploadRoot } = require('../middleware/upload.middleware');
const { optimizeUploads } = require('../middleware/optimize-upload.middleware');
const { listNotifications, createNotification, updateNotification, deleteNotification } = require('../controllers/notifications.controller');

const router = Router();

router.get('/', requireAuth, listNotifications);
router.post('/', requireAuth, requireAdmin, uploadMedia.single('media'), optimizeUploads({ uploadRoot }), createNotification);
router.put('/:id', requireAuth, requireAdmin, uploadMedia.single('media'), optimizeUploads({ uploadRoot }), updateNotification);
router.delete('/:id', requireAuth, requireAdmin, deleteNotification);

module.exports = router;
