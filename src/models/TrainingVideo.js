const mongoose = require('mongoose');
const baseOptions = require('./baseOptions');

const trainingVideoSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  thumbnailUrl: String,
  videoUrl: { type: String, required: true },
  duration: String,
  language: { type: String, default: 'Hindi' },
}, baseOptions);

module.exports = mongoose.model('TrainingVideo', trainingVideoSchema);
