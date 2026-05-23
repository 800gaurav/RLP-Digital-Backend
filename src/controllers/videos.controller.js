const TrainingVideo = require('../models/TrainingVideo');
const asyncHandler = require('../utils/asyncHandler');
const { fileUrl } = require('../middleware/upload.middleware');

const getTrainingVideos = asyncHandler(async (req, res) => {
  const hasPaginationQuery = req.query.page !== undefined || req.query.limit !== undefined;

  if (!hasPaginationQuery) {
    const videos = await TrainingVideo.find().sort({ createdAt: -1 }).limit(100);
    return res.json({ success: true, data: videos.map((item) => item.toJSON()) });
  }

  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 30);
  const skip = (page - 1) * limit;
  const [videos, total] = await Promise.all([
    TrainingVideo.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    TrainingVideo.countDocuments(),
  ]);
  const totalPages = Math.ceil(total / limit);

  return res.json({
    success: true,
    data: videos.map((item) => item.toJSON()),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      nextPage: page < totalPages ? page + 1 : null,
    },
  });
});

const getTrainingVideo = asyncHandler(async (req, res) => {
  const video = await TrainingVideo.findById(req.params.id);
  if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
  res.json({ success: true, data: video.toJSON() });
});

const createTrainingVideo = asyncHandler(async (req, res) => {
  const thumbnailFile = req.files?.thumbnail?.[0] || req.file;
  const videoFile = req.files?.video?.[0];
  const thumbnailUrl = fileUrl(req, thumbnailFile) || req.body.thumbnailUrl;
  const videoUrl = fileUrl(req, videoFile) || req.body.videoUrl;
  if (!req.body.title?.trim()) {
    return res.status(400).json({ success: false, message: 'Training title is required' });
  }
  if (!videoUrl) return res.status(400).json({ success: false, message: 'Video URL or upload is required' });
  const video = await TrainingVideo.create({
    title: req.body.title,
    description: req.body.description,
    videoUrl,
    duration: req.body.duration,
    language: req.body.language || 'Hindi',
    thumbnailUrl,
  });
  res.status(201).json({ success: true, data: video.toJSON() });
});

const updateTrainingVideo = asyncHandler(async (req, res) => {
  const thumbnailFile = req.files?.thumbnail?.[0] || req.file;
  const videoFile = req.files?.video?.[0];
  const update = {};
  ['title', 'description', 'duration', 'language', 'thumbnailUrl', 'videoUrl'].forEach((key) => {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  });
  const thumbnailUrl = fileUrl(req, thumbnailFile);
  const videoUrl = fileUrl(req, videoFile);
  if (thumbnailUrl) update.thumbnailUrl = thumbnailUrl;
  if (videoUrl) update.videoUrl = videoUrl;
  const video = await TrainingVideo.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
  res.json({ success: true, data: video.toJSON() });
});

const deleteTrainingVideo = asyncHandler(async (req, res) => {
  const video = await TrainingVideo.findByIdAndDelete(req.params.id);
  if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
  res.json({ success: true, message: 'Video deleted' });
});

module.exports = { getTrainingVideos, getTrainingVideo, createTrainingVideo, updateTrainingVideo, deleteTrainingVideo };
