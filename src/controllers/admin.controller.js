const User = require('../models/User');
const Padadhikari = require('../models/Padadhikari');
const Reel = require('../models/Reel');
const TrainingVideo = require('../models/TrainingVideo');
const Notification = require('../models/Notification');
const { getSettings } = require('../utils/settings');
const asyncHandler = require('../utils/asyncHandler');
const { getUsers } = require('./user.controller');

const overview = asyncHandler(async (_req, res) => {
  const [users, activeSubscriptions, pendingPayments, suspendedUsers, totalPadadhikari, recentRegistrations, reels, trainingVideos, notifications] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ subscriptionStatus: 'active' }),
    User.countDocuments({ paymentStatus: 'under_review' }),
    User.countDocuments({ accountStatus: 'suspended' }),
    Padadhikari.countDocuments(),
    User.find().sort({ createdAt: -1 }).limit(5),
    Reel.countDocuments(),
    TrainingVideo.countDocuments(),
    Notification.countDocuments(),
  ]);

  res.json({
    success: true,
    data: {
      users,
      totalUsers: users,
      activeSubscriptions,
      pendingPayments,
      paymentRequests: pendingPayments,
      suspendedUsers,
      totalPadadhikari,
      pendingApprovals: 0,
      recentRegistrations: recentRegistrations.map((user) => user.toJSON()),
      reels,
      trainingVideos,
      notifications,
    },
  });
});

const contentSummary = asyncHandler(async (_req, res) => {
  const settings = await getSettings();
  const [officials, reels, trainingVideos, notifications] = await Promise.all([
    Padadhikari.countDocuments(),
    Reel.countDocuments(),
    TrainingVideo.countDocuments(),
    Notification.countDocuments(),
  ]);
  res.json({
    success: true,
    data: {
      officials,
      reels,
      trainingVideos,
      notifications,
      pendingUploads: 0,
      subscriptionPrice: settings.subscriptionPrice,
      monthlyTemplateDownloadLimit: settings.monthlyTemplateDownloadLimit,
      posterCategories: settings.posterCategories,
    },
  });
});

module.exports = { overview, contentSummary, getUsers };
