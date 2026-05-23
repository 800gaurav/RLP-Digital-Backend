const mongoose = require('mongoose');
const baseOptions = require('./baseOptions');

const reelSchema = new mongoose.Schema({
  mediaUrl: { type: String, required: true },
  mediaType: { type: String, enum: ['image', 'video'], required: true },
  caption: { type: String, required: true, trim: true },
}, baseOptions);

module.exports = mongoose.model('Reel', reelSchema);
