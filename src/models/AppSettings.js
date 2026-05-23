const mongoose = require('mongoose');
const baseOptions = require('./baseOptions');

const appSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'global', unique: true },
  subscriptionPrice: { type: Number, default: 99, min: 0 },
}, baseOptions);

module.exports = mongoose.model('AppSettings', appSettingsSchema);
