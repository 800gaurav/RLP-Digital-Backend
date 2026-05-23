const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { fileUrl } = require('../middleware/upload.middleware');

const listNotifications = asyncHandler(async (_req, res) => {
  const notifications = await Notification.find().sort({ priority: -1, createdAt: -1 }).limit(100);
  res.json({ success: true, data: notifications.map((item) => item.toJSON()) });
});

const createNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.create({
    title: req.body.title,
    body: req.body.body || req.body.message,
    message: req.body.message || req.body.body,
    priority: req.body.priority === true || req.body.priority === 'true',
    mediaUrl: fileUrl(req, req.file) || req.body.mediaUrl,
  });
  res.status(201).json({ success: true, data: notification.toJSON() });
});

module.exports = { listNotifications, createNotification };
