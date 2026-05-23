const { Router } = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { checkAccess, getDrafts, saveDraft, updateDraft } = require('../controllers/stamppad.controller');

const router = Router();

router.get('/access', requireAuth, checkAccess);
router.get('/drafts', requireAuth, getDrafts);
router.post('/drafts', requireAuth, saveDraft);
router.put('/drafts/:id', requireAuth, updateDraft);

module.exports = router;
