const { Router } = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const { uploadMedia } = require('../middleware/upload.middleware');
const { getReels, createReel } = require('../controllers/reels.controller');

const router = Router();

router.get('/', requireAuth, getReels);
router.post('/', requireAuth, requireAdmin, uploadMedia.single('media'), createReel);

module.exports = router;
