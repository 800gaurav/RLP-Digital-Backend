const AppSettings = require('../models/AppSettings');

async function ensureDefaultSettings() {
  await AppSettings.findOneAndUpdate(
    { key: 'global' },
    {
      $setOnInsert: {
        key: 'global',
        subscriptionPrice: 99,
        monthlyTemplateDownloadLimit: 30,
        posterCategories: ['Rally', 'Tyohaar', 'Shubhkamnayen', 'Leadership', 'Election 2024'],
      },
    },
    { upsert: true, returnDocument: true },
  );
}

async function getSettings() {
  await ensureDefaultSettings();
  return AppSettings.findOne({ key: 'global' });
}

module.exports = { ensureDefaultSettings, getSettings };
