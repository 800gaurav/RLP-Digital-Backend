const { Router } = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const { uploadProfile } = require('../middleware/upload.middleware');
const { getMe, updateMe, updatePhoto, saveFcmToken, getUsers, updateUserPermissions } = require('../controllers/user.controller');

const router = Router();

router.get('/me', requireAuth, getMe);
router.put('/me', requireAuth, updateMe);
router.put('/me/photo', requireAuth, uploadProfile.single('photo'), updatePhoto);
router.post('/me/fcm-token', requireAuth, saveFcmToken);

router.get('/', requireAuth, requireAdmin, getUsers);
router.patch('/:id/permissions', requireAuth, requireAdmin, updateUserPermissions);

module.exports = router;
