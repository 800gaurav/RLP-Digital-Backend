const { Router } = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { getHomeFeed } = require('../controllers/home.controller');

const router = Router();

router.get('/', requireAuth, getHomeFeed);

module.exports = router;
