const mongoose = require('mongoose');
const baseOptions = require('./baseOptions');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  body: { type: String, required: true, trim: true },
  message: { type: String, trim: true },
  mediaUrl: String,
  priority: { type: Boolean, default: false },
}, baseOptions);

notificationSchema.pre('save', function setMessage() {
  if (!this.message) this.message = this.body;
});

module.exports = mongoose.model('Notification', notificationSchema);
