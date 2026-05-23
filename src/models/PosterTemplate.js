const mongoose = require('mongoose');
const baseOptions = require('./baseOptions');

const posterTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  imageUrl: { type: String, required: true },
  thumbnailUrl: { type: String, default: '' },
  size: { type: Number, default: 0 },
  isPremium: { type: Boolean, default: false },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  active: { type: Boolean, default: true },
}, baseOptions);

module.exports = mongoose.model('PosterTemplate', posterTemplateSchema);
