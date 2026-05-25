const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { fileUrl } = require('../middleware/upload.middleware');
const { serializeNotification } = require('../utils/media-response');
const { deleteRemovedUploadFiles, deleteUploadFiles } = require('../utils/upload-cleanup');

const listNotifications = asyncHandler(async (_req, res) => {
  const notifications = await Notification.find().sort({ priority: -1, createdAt: -1 }).limit(100);
  res.json({ success: true, data: notifications.map(serializeNotification) });
});

const createNotification = asyncHandler(async (req, res) => {
  if (!req.body.title?.trim()) {
    return res.status(400).json({ success: false, message: 'Notification title is required' });
  }
  if (!req.body.body?.trim() && !req.body.message?.trim()) {
    return res.status(400).json({ success: false, message: 'Notification message is required' });
  }
  const mediaAsset = req.processedMedia?.media;
  const notification = await Notification.create({
    title: req.body.title,
    body: req.body.body || req.body.message,
    message: req.body.message || req.body.body,
    priority: req.body.priority === true || req.body.priority === 'true',
    mediaUrl: mediaAsset?.videoUrl || mediaAsset?.imageUrl || fileUrl(req, req.file) || req.body.mediaUrl,
    mediaType: mediaAsset?.kind || req.body.mediaType || (req.file?.mimetype?.startsWith('video') ? 'video' : 'image'),
    thumbnailUrl: mediaAsset?.thumbnailUrl || '',
    videoUrl: mediaAsset?.videoUrl || '',
    duration: mediaAsset?.duration || '',
    size: mediaAsset?.size || 0,
  });
  res.status(201).json({ success: true, data: serializeNotification(notification) });
});

const updateNotification = asyncHandler(async (req, res) => {
  const existing = await Notification.findById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Notification not found' });
  const mediaAsset = req.processedMedia?.media;
  const update = {};
  ['title', 'body', 'message', 'mediaUrl', 'mediaType'].forEach((key) => {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  });
  if (req.body.priority !== undefined) update.priority = req.body.priority === true || req.body.priority === 'true';
  const uploaded = mediaAsset?.videoUrl || mediaAsset?.imageUrl || fileUrl(req, req.file);
  if (uploaded) update.mediaUrl = uploaded;
  if (mediaAsset?.kind) update.mediaType = mediaAsset.kind;
  if (uploaded) {
    update.thumbnailUrl = mediaAsset?.thumbnailUrl || '';
    update.videoUrl = mediaAsset?.videoUrl || '';
    update.duration = mediaAsset?.duration || '';
    update.size = mediaAsset?.size || 0;
  }
  if (update.body && !update.message) update.message = update.body;
  const notification = await Notification.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (uploaded) {
    await deleteRemovedUploadFiles(
      [existing.mediaUrl, existing.thumbnailUrl, existing.videoUrl],
      [notification.mediaUrl, notification.thumbnailUrl, notification.videoUrl],
    );
  }
  res.json({ success: true, data: serializeNotification(notification) });
});

const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndDelete(req.params.id);
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
  await deleteUploadFiles([notification.mediaUrl, notification.thumbnailUrl, notification.videoUrl]);
  res.json({ success: true, message: 'Notification deleted' });
});

module.exports = { listNotifications, createNotification, updateNotification, deleteNotification };
