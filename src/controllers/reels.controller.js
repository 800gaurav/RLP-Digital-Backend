const Reel = require('../models/Reel');
const asyncHandler = require('../utils/asyncHandler');
const { fileUrl } = require('../middleware/upload.middleware');

const getReels = asyncHandler(async (_req, res) => {
  const reels = await Reel.find().sort({ createdAt: -1 }).limit(100);
  res.json({ success: true, data: reels.map((item) => item.toJSON()) });
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
