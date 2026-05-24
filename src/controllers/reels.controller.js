const Reel = require('../models/Reel');
const asyncHandler = require('../utils/asyncHandler');
const { fileUrl } = require('../middleware/upload.middleware');
const { hasRenderableReel, serializeReel } = require('../utils/media-response');

const getReels = asyncHandler(async (req, res) => {
  const hasPaginationQuery = req.query.page !== undefined || req.query.limit !== undefined;

  if (!hasPaginationQuery) {
    const reels = await Reel.find().sort({ createdAt: -1 }).limit(100);
    return res.json({ success: true, data: reels.filter(hasRenderableReel).map(serializeReel) });
  }

  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 30);
  const skip = (page - 1) * limit;
  const [reels, total] = await Promise.all([
    Reel.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Reel.countDocuments(),
  ]);
  const totalPages = Math.ceil(total / limit);

  return res.json({
    success: true,
    data: reels.filter(hasRenderableReel).map(serializeReel),
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

const createReel = asyncHandler(async (req, res) => {
  const mediaAsset = req.processedMedia?.media;
  const mediaUrl = mediaAsset?.videoUrl || mediaAsset?.imageUrl || fileUrl(req, req.file) || req.body.mediaUrl;
  if (!mediaUrl) return res.status(400).json({ success: false, message: 'Media file is required' });
  const caption = typeof req.body.caption === 'string' ? req.body.caption.trim() : '';
  const reel = await Reel.create({
    mediaUrl,
    mediaType: mediaAsset?.kind || req.body.mediaType || (req.file?.mimetype?.startsWith('video') ? 'video' : 'image'),
    thumbnailUrl: mediaAsset?.thumbnailUrl || '',
    duration: mediaAsset?.duration || '',
    size: mediaAsset?.size || 0,
    caption,
  });
  res.status(201).json({ success: true, data: serializeReel(reel) });
});

const updateReel = asyncHandler(async (req, res) => {
  const mediaAsset = req.processedMedia?.media;
  const update = {};
  if (req.body.caption !== undefined) update.caption = typeof req.body.caption === 'string' ? req.body.caption.trim() : '';
  if (req.body.mediaType !== undefined) update.mediaType = req.body.mediaType;
  const uploaded = mediaAsset?.videoUrl || mediaAsset?.imageUrl || fileUrl(req, req.file);
  if (uploaded) {
    update.mediaUrl = uploaded;
    update.mediaType = mediaAsset?.kind || req.body.mediaType || (req.file?.mimetype?.startsWith('video') ? 'video' : 'image');
    update.thumbnailUrl = mediaAsset?.thumbnailUrl || '';
    update.duration = mediaAsset?.duration || '';
    update.size = mediaAsset?.size || 0;
  }
  const reel = await Reel.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!reel) return res.status(404).json({ success: false, message: 'Reel not found' });
  res.json({ success: true, data: serializeReel(reel) });
});

const deleteReel = asyncHandler(async (req, res) => {
  const reel = await Reel.findByIdAndDelete(req.params.id);
  if (!reel) return res.status(404).json({ success: false, message: 'Reel not found' });
  res.json({ success: true, message: 'Reel deleted' });
});

module.exports = { getReels, createReel, updateReel, deleteReel };
