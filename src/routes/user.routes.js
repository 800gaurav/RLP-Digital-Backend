const { Router } = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const { uploadProfile, uploadRegisterMedia, uploadRoot } = require('../middleware/upload.middleware');
const { optimizeUploads } = require('../middleware/optimize-upload.middleware');
const { getMe, updateMe, updatePhoto, updateVoterIdPhoto, removePhoto, saveFcmToken, savePushToken, getUsers, updateUserPermissions } = require('../controllers/user.controller');

const router = Router();

router.get('/me', requireAuth, getMe);
router.put('/me', requireAuth, updateMe);
router.put('/me/photo', requireAuth, uploadProfile.single('photo'), optimizeUploads({ uploadRoot }), updatePhoto);
router.put('/me/voter-id-photo', requireAuth, uploadRegisterMedia.single('voterIdPhoto'), optimizeUploads({ uploadRoot }), updateVoterIdPhoto);
router.delete('/me/photo', requireAuth, removePhoto);
router.post('/me/photo/remove', requireAuth, removePhoto);
router.post('/me/fcm-token', requireAuth, saveFcmToken);
router.post('/push-token', requireAuth, savePushToken);

router.get('/', requireAuth, requireAdmin, getUsers);
router.patch('/:id/permissions', requireAuth, requireAdmin, updateUserPermissions);

module.exports = router;
