const mongoose = require('mongoose');
const baseOptions = require('./baseOptions');

const appSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'global', unique: true },
  subscriptionPrice: { type: Number, default: 99, min: 0 },
  monthlyTemplateDownloadLimit: { type: Number, default: 30, min: 1 },
  posterCategories: {
    type: [String],
    default: ['Rally', 'Tyohaar', 'Shubhkamnayen', 'Leadership', 'Election 2024'],
  },
}, baseOptions);

module.exports = mongoose.model('AppSettings', appSettingsSchema);
