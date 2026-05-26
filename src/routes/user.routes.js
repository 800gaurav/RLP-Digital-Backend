const { Router } = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const { uploadProfile, uploadRoot } = require('../middleware/upload.middleware');
const { optimizeUploads } = require('../middleware/optimize-upload.middleware');
const { getMe, updateMe, updatePhoto, removePhoto, saveFcmToken, savePushToken, getUsers, updateUserPermissions } = require('../controllers/user.controller');

const router = Router();

router.get('/me', requireAuth, getMe);
router.put('/me', requireAuth, updateMe);
router.put('/me/photo', requireAuth, uploadProfile.single('photo'), optimizeUploads({ uploadRoot }), updatePhoto);
router.delete('/me/photo', requireAuth, removePhoto);
router.post('/me/photo/remove', requireAuth, removePhoto);
router.post('/me/fcm-token', requireAuth, saveFcmToken);
router.post('/push-token', requireAuth, savePushToken);

router.get('/', requireAuth, requireAdmin, getUsers);
router.patch('/:id/permissions', requireAuth, requireAdmin, updateUserPermissions);

module.exports = router;
