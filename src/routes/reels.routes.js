const { Router } = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const { uploadMedia } = require('../middleware/upload.middleware');
const { getReels, createReel, updateReel, deleteReel } = require('../controllers/reels.controller');

const router = Router();

router.get('/', requireAuth, getReels);
router.post('/', requireAuth, requireAdmin, uploadMedia.single('media'), createReel);
router.put('/:id', requireAuth, requireAdmin, uploadMedia.single('media'), updateReel);
router.delete('/:id', requireAuth, requireAdmin, deleteReel);

module.exports = router;
