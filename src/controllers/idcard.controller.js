const QRCode = require('qrcode');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

function idCardData(user) {
  const verifyBaseUrl = process.env.VERIFY_BASE_URL || `${process.env.PUBLIC_BASE_URL || process.env.API_BASE_URL || 'http://localhost:3000'}/api/verify`;
  return {
    user: user.toJSON(),
    verifyUrl: `${verifyBaseUrl}/${user.id}`,
  };
}

const getMyIdCard = asyncHandler(async (req, res) => {
  res.json({ success: true, data: idCardData(req.user) });
});

const getQrCode = asyncHandler(async (req, res) => {
  const user = req.params.userId ? await User.findById(req.params.userId) : req.user;
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const verifyBaseUrl = process.env.VERIFY_BASE_URL || `${process.env.PUBLIC_BASE_URL || process.env.API_BASE_URL || 'http://localhost:3000'}/api/verify`;
  const dataUrl = await QRCode.toDataURL(`${verifyBaseUrl}/${user.id}`);
  res.json({ success: true, data: { qrCode: dataUrl, userId: user.id } });
});

const verifyUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId || req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'Invalid member ID' });
  res.json({ success: true, data: { valid: true, user: user.toJSON() } });
});

module.exports = { getMyIdCard, getQrCode, verifyUser };
