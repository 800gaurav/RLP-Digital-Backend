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
  const reel = await Reel.create({
    mediaUrl,
    mediaType: req.body.mediaType || (req.file?.mimetype?.startsWith('video') ? 'video' : 'image'),
    caption: req.body.caption,
  });
  res.status(201).json({ success: true, data: reel.toJSON() });
});

module.exports = { getReels, createReel };
