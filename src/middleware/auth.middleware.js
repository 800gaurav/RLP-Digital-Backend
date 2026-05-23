const User = require('../models/User');
const { verifyAccessToken } = require('../utils/jwt');
const asyncHandler = require('../utils/asyncHandler');

const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });

  const payload = verifyAccessToken(token);
  const user = await User.findById(payload.userId);
  if (!user) return res.status(401).json({ success: false, message: 'User not found' });

  req.user = user;
  req.userId = user.id;
  next();
});

module.exports = { requireAuth };
