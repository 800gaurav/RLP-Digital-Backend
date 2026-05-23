const User = require('../models/User');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const { fileUrl } = require('../middleware/upload.middleware');

const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user.toJSON() });
});

const updateMe = asyncHandler(async (req, res) => {
  const allowed = ['fullName', 'email', 'address', 'state', 'district', 'city', 'pincode', 'gender', 'dob'];
  const update = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  });
  if (req.body.password) update.password = await bcrypt.hash(req.body.password, 12);

  const user = await User.findByIdAndUpdate(req.userId, update, { new: true, runValidators: true });
  res.json({ success: true, data: user.toJSON() });
});

const updatePhoto = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No photo uploaded' });
  const user = await User.findByIdAndUpdate(req.userId, { profilePhoto: fileUrl(req, req.file) }, { new: true });
  res.json({ success: true, data: user.toJSON() });
});

const saveFcmToken = asyncHandler(async (req, res) => {
  if (!req.body.token) return res.status(400).json({ success: false, message: 'FCM token required' });
  await User.findByIdAndUpdate(req.userId, { fcmToken: req.body.token });
  res.json({ success: true, message: 'FCM token saved' });
});

const getUsers = asyncHandler(async (req, res) => {
  const { q, role, subscriptionStatus, stampPadAccess, district } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (subscriptionStatus) filter.subscriptionStatus = subscriptionStatus;
  if (stampPadAccess !== undefined) filter.stampPadAccess = stampPadAccess === 'true';
  if (district) filter.district = new RegExp(district, 'i');
  if (q) {
    filter.$or = [
      { fullName: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') },
      { voterId: new RegExp(q, 'i') },
      { city: new RegExp(q, 'i') },
    ];
  }

  const users = await User.find(filter).sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, data: users.map((user) => user.toJSON()) });
});

const updateUserPermissions = asyncHandler(async (req, res) => {
  const update = {};
  if (req.body.stampPadAccess !== undefined) update.stampPadAccess = !!req.body.stampPadAccess;
  if (req.body.subscriptionStatus) update.subscriptionStatus = req.body.subscriptionStatus;
  if (req.body.role && ['user', 'admin'].includes(req.body.role)) update.role = req.body.role;

  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: user.toJSON() });
});

module.exports = { getMe, updateMe, updatePhoto, saveFcmToken, getUsers, updateUserPermissions };
