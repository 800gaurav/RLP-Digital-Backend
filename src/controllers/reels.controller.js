const Reel = require('../models/Reel');
const asyncHandler = require('../utils/asyncHandler');
const { fileUrl } = require('../middleware/upload.middleware');

const getReels = asyncHandler(async (req, res) => {
  const hasPaginationQuery = req.query.page !== undefined || req.query.limit !== undefined;

  if (!hasPaginationQuery) {
    const reels = await Reel.find().sort({ createdAt: -1 }).limit(100);
    return res.json({ success: true, data: reels.map((item) => item.toJSON()) });
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
    data: reels.map((item) => item.toJSON()),
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
  const mediaUrl = fileUrl(req, req.file) || req.body.mediaUrl;
  if (!mediaUrl) return res.status(400).json({ success: false, message: 'Media file is required' });
  const caption = typeof req.body.caption === 'string' ? req.body.caption.trim() : '';
  const reel = await Reel.create({
    mediaUrl,
    mediaType: req.body.mediaType || (req.file?.mimetype?.startsWith('video') ? 'video' : 'image'),
    caption,
  });
  res.status(201).json({ success: true, data: reel.toJSON() });
});

const updateReel = asyncHandler(async (req, res) => {
  const update = {};
  if (req.body.caption !== undefined) update.caption = typeof req.body.caption === 'string' ? req.body.caption.trim() : '';
  if (req.body.mediaType !== undefined) update.mediaType = req.body.mediaType;
  const uploaded = fileUrl(req, req.file);
  if (uploaded) {
    update.mediaUrl = uploaded;
    update.mediaType = req.body.mediaType || (req.file?.mimetype?.startsWith('video') ? 'video' : 'image');
  }
  const reel = await Reel.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!reel) return res.status(404).json({ success: false, message: 'Reel not found' });
  res.json({ success: true, data: reel.toJSON() });
});

const deleteReel = asyncHandler(async (req, res) => {
  const reel = await Reel.findByIdAndDelete(req.params.id);
  if (!reel) return res.status(404).json({ success: false, message: 'Reel not found' });
  res.json({ success: true, message: 'Reel deleted' });
});

module.exports = { getReels, createReel, updateReel, deleteReel };
