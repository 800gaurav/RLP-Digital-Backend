const mongoose = require('mongoose');
const baseOptions = require('./baseOptions');

const trainingVideoSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  imageUrl: { type: String, default: '' },
  thumbnailUrl: { type: String, default: '' },
  videoUrl: { type: String, required: true },
  duration: { type: String, default: '' },
  size: { type: Number, default: 0 },
  language: { type: String, default: 'Hindi' },
}, baseOptions);

module.exports = mongoose.model('TrainingVideo', trainingVideoSchema);
