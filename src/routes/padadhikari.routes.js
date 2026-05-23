const { Router } = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const { uploadProfile } = require('../middleware/upload.middleware');
const { listPadadhikari, getPadadhikari, createPadadhikari, updatePadadhikari, deletePadadhikari } = require('../controllers/padadhikari.controller');

const router = Router();

router.get('/', requireAuth, listPadadhikari);
router.get('/:id', requireAuth, getPadadhikari);
router.post('/', requireAuth, requireAdmin, uploadProfile.single('photo'), createPadadhikari);
router.put('/:id', requireAuth, requireAdmin, uploadProfile.single('photo'), updatePadadhikari);
router.delete('/:id', requireAuth, requireAdmin, deletePadadhikari);

module.exports = router;
