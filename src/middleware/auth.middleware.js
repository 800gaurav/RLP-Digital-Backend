const User = require('../models/User');
const { verifyAccessToken } = require('../utils/jwt');
const asyncHandler = require('../utils/asyncHandler');

const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, code: 'TOKEN_EXPIRED', message: 'Session expired. Refresh token required.' });
    }
    return res.status(401).json({ success: false, code: 'INVALID_TOKEN', message: 'Invalid authentication token' });
  }

  const user = await User.findById(payload.userId);
  if (!user) return res.status(401).json({ success: false, message: 'User not found' });
  if (user.role !== 'admin' && user.accountStatus === 'suspended') {
    return res.status(403).json({
      success: false,
      code: 'ACCOUNT_SUSPENDED',
      message: 'Account suspended by admin. Please contact support.',
    });
  }

  req.user = user;
  req.userId = user.id;
  next();
});

module.exports = { requireAuth };
