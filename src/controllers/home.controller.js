const Notification = require('../models/Notification');
const Padadhikari = require('../models/Padadhikari');
const Reel = require('../models/Reel');
const TrainingVideo = require('../models/TrainingVideo');
const asyncHandler = require('../utils/asyncHandler');

const getHomeFeed = asyncHandler(async (_req, res) => {
  const [notifications, officials, reels, trainings] = await Promise.all([
    Notification.find().sort({ priority: -1, createdAt: -1 }).limit(3),
    Padadhikari.find().sort({ createdAt: -1 }).limit(5),
    Reel.find().sort({ createdAt: -1 }).limit(5),
    TrainingVideo.find().sort({ createdAt: -1 }).limit(3),
  ]);

  res.json({
    success: true,
    data: {
      notifications: notifications.map((item) => item.toJSON()),
      officials: officials.map((item) => item.toJSON()),
      reels: reels.map((item) => item.toJSON()),
      trainings: trainings.map((item) => item.toJSON()),
    },
  });
});

module.exports = { getHomeFeed };
