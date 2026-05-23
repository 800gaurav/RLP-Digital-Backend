const AppSettings = require('../models/AppSettings');

async function ensureDefaultSettings() {
  await AppSettings.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { key: 'global', subscriptionPrice: 99 } },
    { upsert: true, returnDocument: true },
  );
}

async function getSettings() {
  await ensureDefaultSettings();
  return AppSettings.findOne({ key: 'global' });
}

module.exports = { ensureDefaultSettings, getSettings };
