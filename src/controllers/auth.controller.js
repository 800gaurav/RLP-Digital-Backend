const bcrypt = require('bcryptjs');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const asyncHandler = require('../utils/asyncHandler');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { fileUrl } = require('../middleware/upload.middleware');
const { serializeUser } = require('../utils/media-response');
const { getSettings } = require('../utils/settings');

function tokenExpiry(days = 30) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function issueTokens(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await RefreshToken.create({ token: refreshToken, user: user._id, expiresAt: tokenExpiry(30) });
  return { accessToken, refreshToken };
}

function getUploadedFile(req, fieldName) {
  const fileList = req.files?.[fieldName];
  if (Array.isArray(fileList) && fileList[0]) return fileList[0];
  return req.file;
}

const register = asyncHandler(async (req, res) => {
  const body = req.body;
  const email = body.email ? String(body.email).toLowerCase().trim() : '';
  const mobileNumber = String(body.mobileNumber || '').trim();
  const voterId = String(body.voterId || '').toUpperCase().trim();

  const duplicateChecks = [{ mobileNumber }, { voterId }];
  if (email) duplicateChecks.push({ email });
  const existing = await User.findOne({ $or: duplicateChecks });
  if (existing) {
    const message = existing.mobileNumber === mobileNumber
      ? 'Mobile number already registered'
      : (existing.voterId === voterId ? 'Voter ID already registered' : 'Email already registered');
    return res.status(409).json({ success: false, message });
  }

  const password = await bcrypt.hash(body.password, 12);
  const settings = await getSettings();
  const photoAsset = req.processedMedia?.profilePhoto;
  const voterIdAsset = req.processedMedia?.voterIdPhoto;
  const profilePhotoFile = getUploadedFile(req, 'profilePhoto');
  const voterIdPhotoFile = getUploadedFile(req, 'voterIdPhoto');
  const user = await User.create({
    fullName: body.fullName,
    email: email || undefined,
    mobileNumber,
    password,
    dob: body.dob,
    gender: body.gender,
    category: body.category,
    voterId,
    state: body.state,
    district: body.district,
    vidhansabha: body.vidhansabha,
    pincode: body.pincode,
    profilePhoto: photoAsset?.imageUrl || fileUrl(req, profilePhotoFile),
    profileThumbnailUrl: photoAsset?.thumbnailUrl || '',
    profilePhotoSize: photoAsset?.size || 0,
    voterIdPhoto: voterIdAsset?.imageUrl || fileUrl(req, voterIdPhotoFile),
    voterIdThumbnailUrl: voterIdAsset?.thumbnailUrl || '',
    voterIdPhotoSize: voterIdAsset?.size || 0,
    role: 'user',
    accountStatus: 'active',
    subscriptionStatus: 'inactive',
    paymentStatus: 'under_review',
    paymentAmount: settings.subscriptionPrice,
  });

  res.status(201).json({ success: true, data: { user: serializeUser(user) } });
});

const validateRegistration = asyncHandler(async (req, res) => {
  const body = req.body;
  const email = body.email ? String(body.email).toLowerCase().trim() : '';
  const mobileNumber = String(body.mobileNumber || '').trim();
  const voterId = String(body.voterId || '').toUpperCase().trim();

  const duplicateChecks = [{ mobileNumber }, { voterId }];
  if (email) duplicateChecks.push({ email });
  const existing = await User.findOne({ $or: duplicateChecks });
  if (existing) {
    const message = existing.mobileNumber === mobileNumber
      ? 'Mobile number already registered'
      : (existing.voterId === voterId ? 'Voter ID already registered' : 'Email already registered');
    return res.status(409).json({ success: false, message });
  }

  res.json({ success: true, data: { valid: true } });
});

const login = asyncHandler(async (req, res) => {
  const rawIdentifier = String(req.body.identifier || '').trim();
  const normalizedIdentifier = rawIdentifier.toUpperCase();
  const user = await User.findOne({
    $or: [
      { mobileNumber: rawIdentifier },
      { voterId: normalizedIdentifier },
      { email: rawIdentifier.toLowerCase() },
    ],
  });
  if (!user || !(await bcrypt.compare(req.body.password || '', user.password))) {
    return res.status(401).json({ success: false, message: 'Invalid mobile number, voter ID or password' });
  }
  if (user.role !== 'admin' && user.accountStatus === 'suspended') {
    return res.status(403).json({
      success: false,
      code: 'ACCOUNT_SUSPENDED',
      message: 'Account suspended by admin. Please contact support.',
    });
  }
  const paymentStatus = user.paymentStatus || 'approved';
  if (user.role !== 'admin' && paymentStatus !== 'approved') {
    const rejected = paymentStatus === 'rejected';
    return res.status(403).json({
      success: false,
      code: rejected ? 'PAYMENT_REJECTED' : 'PAYMENT_UNDER_REVIEW',
      message: rejected
        ? 'Payment failed. Please complete registration payment again or contact support.'
        : 'Payment pending hai. Payment success ke baad login hoga.',
    });
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

module.exports = { register, validateRegistration, login, refresh, logout, forgotPassword, verifyOtp, resetPassword };
