const mongoose = require('mongoose');
const baseOptions = require('./baseOptions');

const stampDraftSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true, trim: true },
  body: { type: String, required: true },
  template: { type: String, default: 'standard' },
  stampEnabled: { type: Boolean, default: true },
}, baseOptions);

module.exports = mongoose.model('StampDraft', stampDraftSchema);
