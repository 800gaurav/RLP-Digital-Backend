const mongoose = require('mongoose');
const baseOptions = require('./baseOptions');

const padadhikariSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  designation: { type: String, required: true, trim: true },
  rank: { type: String, enum: ['national', 'state', 'district'], default: 'district' },
  district: { type: String, trim: true, default: '' },
  state: { type: String, trim: true, default: 'Rajasthan' },
  photoUrl: String,
  phone: String,
  email: String,
  contactVisible: { type: Boolean, default: false },
}, baseOptions);

padadhikariSchema.index({ fullName: 'text', designation: 'text', district: 'text', state: 'text' });

module.exports = mongoose.model('Padadhikari', padadhikariSchema);
