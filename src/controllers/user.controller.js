const User = require('../models/User');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const { fileUrl } = require('../middleware/upload.middleware');
const { serializeUser } = require('../utils/media-response');
const { deleteRemovedUploadFiles } = require('../utils/upload-cleanup');
const { isValidExpoPushToken } = require('../utils/push-notifications');

const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: serializeUser(req.user) });
});

const updateMe = asyncHandler(async (req, res) => {
  const allowed = ['fullName', 'email', 'mobileNumber', 'voterId', 'state', 'district', 'vidhansabha', 'gender', 'dob', 'category'];
  const update = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  });
  if (req.body.password) update.password = await bcrypt.hash(req.body.password, 12);

  if (update.mobileNumber) {
    const existingMobile = await User.findOne({ mobileNumber: update.mobileNumber, _id: { $ne: req.userId } });
    if (existingMobile) {
      return res.status(409).json({ success: false, message: 'Mobile number already registered' });
    }
  }

  if (update.voterId) {
    const normalizedVoterId = String(update.voterId).trim().toUpperCase();
    const existingVoterId = await User.findOne({ voterId: normalizedVoterId, _id: { $ne: req.userId } });
    if (existingVoterId) {
      return res.status(409).json({ success: false, message: 'Voter ID already registered' });
    }
    update.voterId = normalizedVoterId;
  }

  if (update.email) {
    const normalizedEmail = String(update.email).toLowerCase().trim();
    const existingEmail = await User.findOne({ email: normalizedEmail, _id: { $ne: req.userId } });
    if (existingEmail) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    update.email = normalizedEmail;
  }

  const user = await User.findByIdAndUpdate(req.userId, update, { new: true, runValidators: true });
  res.json({ success: true, data: serializeUser(user) });
});

const updatePhoto = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No photo uploaded' });
  const photoAsset = req.processedMedia?.photo;
  const existing = await User.findById(req.userId);
  if (!existing) return res.status(404).json({ success: false, message: 'User not found' });
  const user = await User.findByIdAndUpdate(req.userId, {
    profilePhoto: photoAsset?.imageUrl || fileUrl(req, req.file),
    profileThumbnailUrl: photoAsset?.thumbnailUrl || '',
    profilePhotoSize: photoAsset?.size || 0,
  }, { new: true });
  await deleteRemovedUploadFiles(
    [existing.profilePhoto, existing.profileThumbnailUrl],
    [user.profilePhoto, user.profileThumbnailUrl],
  );
  res.json({ success: true, data: serializeUser(user) });
});

const updateVoterIdPhoto = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No voter ID photo uploaded' });
  const photoAsset = req.processedMedia?.voterIdPhoto || req.processedMedia?.[req.file.filename];
  const existing = await User.findById(req.userId);
  if (!existing) return res.status(404).json({ success: false, message: 'User not found' });
  const user = await User.findByIdAndUpdate(req.userId, {
    voterIdPhoto: photoAsset?.imageUrl || fileUrl(req, req.file),
    voterIdThumbnailUrl: photoAsset?.thumbnailUrl || '',
    voterIdPhotoSize: photoAsset?.size || 0,
  }, { new: true });
  await deleteRemovedUploadFiles(
    [existing.voterIdPhoto, existing.voterIdThumbnailUrl],
    [user.voterIdPhoto, user.voterIdThumbnailUrl],
  );
  res.json({ success: true, data: serializeUser(user) });
});

const removePhoto = asyncHandler(async (req, res) => {
  const existing = await User.findById(req.userId);
  if (!existing) return res.status(404).json({ success: false, message: 'User not found' });
  const user = await User.findByIdAndUpdate(req.userId, {
    profilePhoto: '',
    profileThumbnailUrl: '',
    profilePhotoSize: 0,
  }, { new: true });
  await deleteRemovedUploadFiles([existing.profilePhoto, existing.profileThumbnailUrl], []);
  res.json({ success: true, data: serializeUser(user) });
});

const saveFcmToken = asyncHandler(async (req, res) => {
  if (!req.body.token) return res.status(400).json({ success: false, message: 'FCM token required' });
  await User.findByIdAndUpdate(req.userId, { fcmToken: req.body.token });
  res.json({ success: true, message: 'FCM token saved' });
});

const savePushToken = asyncHandler(async (req, res) => {
  const pushToken = String(req.body.pushToken || req.body.token || '').trim();
  if (!pushToken) return res.status(400).json({ success: false, message: 'Expo push token required' });
  if (!isValidExpoPushToken(pushToken)) {
    return res.status(400).json({ success: false, message: 'Invalid Expo push token' });
  }

  await User.findByIdAndUpdate(req.userId, { pushToken, fcmToken: pushToken });
  console.log('[push] Token saved for user', { userId: req.userId, tokenTail: pushToken.slice(-10) });
  res.json({ success: true, message: 'Push token saved' });
});

const getUsers = asyncHandler(async (req, res) => {
  const {
    q,
    role,
    subscriptionStatus,
    stampPadAccess,
    district,
    vidhansabha,
    category,
    paymentStatus,
    accountStatus,
  } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (subscriptionStatus) filter.subscriptionStatus = subscriptionStatus;
  if (stampPadAccess !== undefined) filter.stampPadAccess = stampPadAccess === 'true';
  if (district) filter.district = new RegExp(district, 'i');
  if (vidhansabha) filter.vidhansabha = new RegExp(vidhansabha, 'i');
  if (category) filter.category = new RegExp(category, 'i');
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (accountStatus) filter.accountStatus = accountStatus;
  if (q) {
    filter.$or = [
      { fullName: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') },
      { mobileNumber: new RegExp(q, 'i') },
      { voterId: new RegExp(q, 'i') },
      { district: new RegExp(q, 'i') },
      { vidhansabha: new RegExp(q, 'i') },
      { category: new RegExp(q, 'i') },
      { city: new RegExp(q, 'i') },
    ];
  }

  const users = await User.find(filter).sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, data: users.map(serializeUser) });
});

const updateUserPermissions = asyncHandler(async (req, res) => {
  const update = {};
  if (req.body.stampPadAccess !== undefined) update.stampPadAccess = !!req.body.stampPadAccess;
  if (req.body.subscriptionStatus) update.subscriptionStatus = req.body.subscriptionStatus;
  if (req.body.accountStatus && ['active', 'suspended'].includes(req.body.accountStatus)) update.accountStatus = req.body.accountStatus;
  if (req.body.role && ['user', 'admin'].includes(req.body.role)) update.role = req.body.role;

  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: serializeUser(user) });
});

const updatePaymentStatus = asyncHandler(async (req, res) => {
  const status = String(req.body.paymentStatus || '').trim();
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Valid payment status is required' });
  }

  const update = {
    paymentStatus: status,
    paymentReviewedAt: new Date(),
    paymentReviewedBy: req.userId,
    subscriptionStatus: status === 'approved' ? 'active' : 'inactive',
  };
  if (status === 'approved') {
    update.subscriptionStartDate = new Date();
    update.subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: serializeUser(user) });
});

module.exports = { getMe, updateMe, updatePhoto, updateVoterIdPhoto, removePhoto, saveFcmToken, savePushToken, getUsers, updateUserPermissions, updatePaymentStatus };
