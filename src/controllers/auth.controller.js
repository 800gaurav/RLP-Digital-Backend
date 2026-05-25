const bcrypt = require('bcryptjs');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const asyncHandler = require('../utils/asyncHandler');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { fileUrl } = require('../middleware/upload.middleware');
const { serializeUser } = require('../utils/media-response');

function tokenExpiry(days = 30) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function issueTokens(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await RefreshToken.create({ token: refreshToken, user: user._id, expiresAt: tokenExpiry(30) });
  return { accessToken, refreshToken };
}

const register = asyncHandler(async (req, res) => {
  const body = req.body;
  const email = String(body.email || '').toLowerCase().trim();
  const voterId = String(body.voterId || '').toUpperCase().trim();

  const existing = await User.findOne({ $or: [{ email }, { voterId }] });
  if (existing) return res.status(409).json({ success: false, message: 'Email or Voter ID already registered' });

  const password = await bcrypt.hash(body.password, 12);
  const firstUser = (await User.countDocuments()) === 0;
  const photoAsset = req.processedMedia?.profilePhoto;
  const user = await User.create({
    fullName: body.fullName,
    email,
    password,
    dob: body.dob,
    gender: body.gender,
    voterId,
    address: body.address,
    state: body.state,
    district: body.district,
    city: body.city,
    pincode: body.pincode,
    profilePhoto: photoAsset?.imageUrl || fileUrl(req, req.file),
    profileThumbnailUrl: photoAsset?.thumbnailUrl || '',
    profilePhotoSize: photoAsset?.size || 0,
    role: firstUser ? 'admin' : 'user',
  });

  const tokens = await issueTokens(user);
  res.status(201).json({ success: true, data: { user: serializeUser(user), tokens } });
});

const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(req.body.password || '', user.password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const tokens = await issueTokens(user);
  res.json({ success: true, data: { user: serializeUser(user), tokens } });
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.body.refreshToken;
  if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token required' });

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    const message = error.name === 'TokenExpiredError' ? 'Refresh token expired. Please login again.' : 'Invalid refresh token';
    return res.status(401).json({ success: false, code: 'REFRESH_TOKEN_INVALID', message });
  }

  const stored = await RefreshToken.findOne({ token: refreshToken, user: payload.userId });
  if (!stored || stored.expiresAt < new Date()) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }

  const user = await User.findById(payload.userId);
  if (!user) return res.status(401).json({ success: false, message: 'User not found' });

  const accessToken = signAccessToken(user);
  res.json({ success: true, accessToken, data: { accessToken, tokens: { accessToken, refreshToken } } });
});

const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.body.refreshToken;
  if (refreshToken) await RefreshToken.deleteOne({ token: refreshToken });
  res.json({ success: true, message: 'Logged out' });
});

const forgotPassword = (_req, res) => {
  res.json({ success: true, message: 'Password reset flow is not enabled yet' });
};

const verifyOtp = (_req, res) => {
  res.json({ success: true, message: 'OTP verified' });
};

const resetPassword = (_req, res) => {
  res.json({ success: true, message: 'Password reset flow is not enabled yet' });
};

module.exports = { register, login, refresh, logout, forgotPassword, verifyOtp, resetPassword };
