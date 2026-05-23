const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { fileUrl } = require('../middleware/upload.middleware');

const listNotifications = asyncHandler(async (_req, res) => {
  const notifications = await Notification.find().sort({ priority: -1, createdAt: -1 }).limit(100);
  res.json({ success: true, data: notifications.map((item) => item.toJSON()) });
});

const createNotification = asyncHandler(async (req, res) => {
  if (!req.body.title?.trim()) {
    return res.status(400).json({ success: false, message: 'Notification title is required' });
  }
  if (!req.body.body?.trim() && !req.body.message?.trim()) {
    return res.status(400).json({ success: false, message: 'Notification message is required' });
  }
  const notification = await Notification.create({
    title: req.body.title,
    body: req.body.body || req.body.message,
    message: req.body.message || req.body.body,
    priority: req.body.priority === true || req.body.priority === 'true',
    mediaUrl: fileUrl(req, req.file) || req.body.mediaUrl,
  });
  res.status(201).json({ success: true, data: notification.toJSON() });
});

const updateNotification = asyncHandler(async (req, res) => {
  const update = {};
  ['title', 'body', 'message', 'mediaUrl'].forEach((key) => {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  });
  if (req.body.priority !== undefined) update.priority = req.body.priority === true || req.body.priority === 'true';
  const uploaded = fileUrl(req, req.file);
  if (uploaded) update.mediaUrl = uploaded;
  if (update.body && !update.message) update.message = update.body;
  const notification = await Notification.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
  res.json({ success: true, data: notification.toJSON() });
});

const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndDelete(req.params.id);
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
  res.json({ success: true, message: 'Notification deleted' });
});

module.exports = { listNotifications, createNotification, updateNotification, deleteNotification };
