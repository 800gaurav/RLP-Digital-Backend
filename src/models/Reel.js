const mongoose = require('mongoose');
const baseOptions = require('./baseOptions');

const reelSchema = new mongoose.Schema({
  mediaUrl: { type: String, required: true },
  mediaType: { type: String, enum: ['image', 'video'], required: true },
  thumbnailUrl: { type: String, default: '' },
  duration: { type: String, default: '' },
  size: { type: Number, default: 0 },
  caption: { type: String, trim: true, default: '' },
}, baseOptions);

module.exports = mongoose.model('Reel', reelSchema);
