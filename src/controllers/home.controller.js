const Notification = require('../models/Notification');
const Padadhikari = require('../models/Padadhikari');
const Reel = require('../models/Reel');
const TrainingVideo = require('../models/TrainingVideo');
const asyncHandler = require('../utils/asyncHandler');
const {
  serializeNotification,
  serializePadadhikari,
  hasRenderableReel,
  hasRenderableTrainingVideo,
  serializeReel,
  serializeTrainingVideo,
} = require('../utils/media-response');

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
      notifications: notifications.map(serializeNotification),
      officials: officials.map(serializePadadhikari),
      reels: reels.filter(hasRenderableReel).map(serializeReel),
      trainings: trainings.filter(hasRenderableTrainingVideo).map(serializeTrainingVideo),
    },
  });
});

module.exports = { getHomeFeed };
