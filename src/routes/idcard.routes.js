const { Router } = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { getMyIdCard, getQrCode, verifyUser } = require('../controllers/idcard.controller');

const router = Router();

router.get('/', requireAuth, getMyIdCard);
router.get('/qr', requireAuth, getQrCode);
router.get('/qr/:userId', requireAuth, getQrCode);
router.get('/:userId', verifyUser);

module.exports = router;
