const mongoose = require('mongoose');
const baseOptions = require('./baseOptions');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  body: { type: String, required: true, trim: true },
  message: { type: String, trim: true },
  mediaUrl: { type: String, default: '' },
  mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
  thumbnailUrl: { type: String, default: '' },
  videoUrl: { type: String, default: '' },
  duration: { type: String, default: '' },
  size: { type: Number, default: 0 },
  priority: { type: Boolean, default: false },
}, baseOptions);

notificationSchema.pre('save', function setMessage() {
  if (!this.message) this.message = this.body;
});

module.exports = mongoose.model('Notification', notificationSchema);
