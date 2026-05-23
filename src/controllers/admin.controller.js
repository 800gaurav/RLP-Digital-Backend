const User = require('../models/User');
const Padadhikari = require('../models/Padadhikari');
const Reel = require('../models/Reel');
const { getSettings } = require('../utils/settings');
const asyncHandler = require('../utils/asyncHandler');
const { getUsers } = require('./user.controller');

const overview = asyncHandler(async (_req, res) => {
  const [users, activeSubscriptions, totalPadadhikari, recentRegistrations, reels] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ subscriptionStatus: 'active' }),
    Padadhikari.countDocuments(),
    User.find().sort({ createdAt: -1 }).limit(5),
    Reel.countDocuments(),
  ]);

  res.json({
    success: true,
    data: {
      users,
      totalUsers: users,
      activeSubscriptions,
      totalPadadhikari,
      pendingApprovals: 0,
      recentRegistrations: recentRegistrations.map((user) => user.toJSON()),
      reels,
    },
  });
});

const contentSummary = asyncHandler(async (_req, res) => {
  const settings = await getSettings();
  const [officials, reels] = await Promise.all([Padadhikari.countDocuments(), Reel.countDocuments()]);
  res.json({
    success: true,
    data: {
      officials,
      reels,
      pendingUploads: 0,
      subscriptionPrice: settings.subscriptionPrice,
    },
  });
});

module.exports = { overview, contentSummary, getUsers };
