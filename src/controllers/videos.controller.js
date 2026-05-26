const TrainingVideo = require('../models/TrainingVideo');
const asyncHandler = require('../utils/asyncHandler');
const { fileUrl } = require('../middleware/upload.middleware');
const { hasRenderableTrainingVideo, serializeTrainingVideo } = require('../utils/media-response');
const { deleteRemovedUploadFiles, deleteUploadFiles } = require('../utils/upload-cleanup');
const { notifyAllUsers } = require('../utils/push-notifications');

const getTrainingVideos = asyncHandler(async (req, res) => {
  const hasPaginationQuery = req.query.page !== undefined || req.query.limit !== undefined;

  if (!hasPaginationQuery) {
    const videos = await TrainingVideo.find().sort({ createdAt: -1 }).limit(100);
    return res.json({ success: true, data: videos.filter(hasRenderableTrainingVideo).map(serializeTrainingVideo) });
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
    data: videos.filter(hasRenderableTrainingVideo).map(serializeTrainingVideo),
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
  res.json({ success: true, data: serializeTrainingVideo(video) });
});

const createTrainingVideo = asyncHandler(async (req, res) => {
  const thumbnailAsset = req.processedMedia?.thumbnail;
  const videoAsset = req.processedMedia?.video;
  const thumbnailFile = req.files?.thumbnail?.[0] || req.file;
  const videoFile = req.files?.video?.[0];
  const imageUrl = thumbnailAsset?.imageUrl || videoAsset?.thumbnailUrl || fileUrl(req, thumbnailFile) || req.body.imageUrl || '';
  const thumbnailUrl = thumbnailAsset?.thumbnailUrl || videoAsset?.thumbnailUrl || imageUrl || req.body.thumbnailUrl;
  const videoUrl = videoAsset?.videoUrl || fileUrl(req, videoFile) || req.body.videoUrl;
  if (!req.body.title?.trim()) {
    return res.status(400).json({ success: false, message: 'Training title is required' });
  }
  if (!videoUrl) return res.status(400).json({ success: false, message: 'Video URL or upload is required' });
  const video = await TrainingVideo.create({
    title: req.body.title,
    description: req.body.description,
    imageUrl,
    videoUrl,
    duration: videoAsset?.duration || req.body.duration,
    language: req.body.language || 'Hindi',
    thumbnailUrl,
    size: videoAsset?.size || 0,
  });
  res.status(201).json({ success: true, data: serializeTrainingVideo(video) });
  notifyAllUsers('New Training Video', video.title || 'New training video available hai.', {
    type: 'training_video',
    screen: 'TrainingVideos',
  }).catch((error) => console.error('[push] Training video broadcast failed', error));
});

const updateTrainingVideo = asyncHandler(async (req, res) => {
  const existing = await TrainingVideo.findById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Video not found' });
  const thumbnailAsset = req.processedMedia?.thumbnail;
  const videoAsset = req.processedMedia?.video;
  const thumbnailFile = req.files?.thumbnail?.[0] || req.file;
  const videoFile = req.files?.video?.[0];
  const update = {};
  ['title', 'description', 'duration', 'language', 'imageUrl', 'thumbnailUrl', 'videoUrl'].forEach((key) => {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  });
  const imageUrl = thumbnailAsset?.imageUrl || videoAsset?.thumbnailUrl || fileUrl(req, thumbnailFile);
  const thumbnailUrl = thumbnailAsset?.thumbnailUrl || videoAsset?.thumbnailUrl || imageUrl;
  const videoUrl = videoAsset?.videoUrl || fileUrl(req, videoFile);
  if (imageUrl) update.imageUrl = imageUrl;
  if (thumbnailUrl) update.thumbnailUrl = thumbnailUrl;
  if (videoUrl) update.videoUrl = videoUrl;
  if (videoAsset?.duration) update.duration = videoAsset.duration;
  if (videoAsset?.size) update.size = videoAsset.size;
  const video = await TrainingVideo.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  await deleteRemovedUploadFiles(
    [existing.imageUrl, existing.thumbnailUrl, existing.videoUrl],
    [video.imageUrl, video.thumbnailUrl, video.videoUrl],
  );
  res.json({ success: true, data: serializeTrainingVideo(video) });
});

const deleteTrainingVideo = asyncHandler(async (req, res) => {
  const video = await TrainingVideo.findByIdAndDelete(req.params.id);
  if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
  await deleteUploadFiles([video.imageUrl, video.thumbnailUrl, video.videoUrl]);
  res.json({ success: true, message: 'Video deleted' });
});

module.exports = { getTrainingVideos, getTrainingVideo, createTrainingVideo, updateTrainingVideo, deleteTrainingVideo };
