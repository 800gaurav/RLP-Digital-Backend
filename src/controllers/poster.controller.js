const PosterTemplate = require('../models/PosterTemplate');
const asyncHandler = require('../utils/asyncHandler');
const { fileUrl } = require('../middleware/upload.middleware');
const { getSettings } = require('../utils/settings');
const { hasRenderablePosterTemplate, serializePosterTemplate } = require('../utils/media-response');
const { consumePosterDownload, getPosterUsage } = require('../utils/poster-access');
const { deleteRemovedUploadFiles, deleteUploadFiles } = require('../utils/upload-cleanup');
const { notifyAllUsers } = require('../utils/push-notifications');

function normalizeCategories(input) {
  const rawValues = Array.isArray(input)
    ? input
    : String(input || '')
      .split(',')
      .map((item) => item.trim());
  return rawValues
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, items) => items.findIndex((value) => value.toLowerCase() === item.toLowerCase()) === index);
}

const getTemplates = asyncHandler(async (req, res) => {
  const filter = { active: true };
  if (req.query.category && !['all', 'all templates'].includes(String(req.query.category).toLowerCase())) {
    filter.category = req.query.category;
  }
  const templates = await PosterTemplate.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: templates.filter(hasRenderablePosterTemplate).map(serializePosterTemplate) });
});

const createTemplate = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  const imageAsset = req.processedMedia?.image;
  const imageUrl = imageAsset?.imageUrl || fileUrl(req, req.file) || req.body.imageUrl;
  if (!imageUrl) return res.status(400).json({ success: false, message: 'Template image is required' });
  if (!settings.posterCategories.includes(req.body.category)) {
    return res.status(400).json({ success: false, message: 'Selected category is not allowed' });
  }
  const template = await PosterTemplate.create({
    name: req.body.name,
    category: req.body.category,
    imageUrl,
    thumbnailUrl: imageAsset?.thumbnailUrl || imageUrl,
    size: imageAsset?.size || 0,
    isPremium: req.body.isPremium === true || req.body.isPremium === 'true',
    metadata: req.body.metadata || {},
  });
  res.status(201).json({ success: true, data: serializePosterTemplate(template) });
  notifyAllUsers('New Poster Template', template.name || 'New poster template available hai.', {
    type: 'poster_template',
    screen: 'PosterTemplates',
  }).catch((error) => console.error('[push] Poster template broadcast failed', error));
});

const updateTemplate = asyncHandler(async (req, res) => {
  const existing = await PosterTemplate.findById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Template not found' });
  const settings = await getSettings();
  const imageAsset = req.processedMedia?.image;
  const update = { ...req.body };
  if (update.category !== undefined && !settings.posterCategories.includes(update.category)) {
    return res.status(400).json({ success: false, message: 'Selected category is not allowed' });
  }
  const uploaded = imageAsset?.imageUrl || fileUrl(req, req.file);
  if (uploaded) update.imageUrl = uploaded;
  if (imageAsset?.thumbnailUrl) update.thumbnailUrl = imageAsset.thumbnailUrl;
  if (imageAsset?.size) update.size = imageAsset.size;
  if (update.isPremium !== undefined) update.isPremium = update.isPremium === true || update.isPremium === 'true';
  const template = await PosterTemplate.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (uploaded) {
    await deleteRemovedUploadFiles(
      [existing.imageUrl, existing.thumbnailUrl],
      [template.imageUrl, template.thumbnailUrl],
    );
  }
  res.json({ success: true, data: serializePosterTemplate(template) });
});

const deleteTemplate = asyncHandler(async (req, res) => {
  const existing = await PosterTemplate.findById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Template not found' });
  await PosterTemplate.findByIdAndUpdate(req.params.id, {
    active: false,
    imageUrl: '',
    thumbnailUrl: '',
    size: 0,
  }, { new: true });
  await deleteUploadFiles([existing.imageUrl, existing.thumbnailUrl]);
  res.json({ success: true, message: 'Template disabled' });
});

const getSubscriptionStatus = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  const usage = await getPosterUsage(req.user, settings.monthlyTemplateDownloadLimit);
  res.json({
    success: true,
    data: {
      active: req.user.subscriptionStatus === 'active',
      plan: req.user.subscriptionStatus === 'active' ? 'premium' : 'free',
      price: settings.subscriptionPrice,
      monthlyDownloadLimit: settings.monthlyTemplateDownloadLimit,
      downloadsUsed: usage.used,
      downloadsRemaining: usage.remaining,
      categories: settings.posterCategories,
    },
  });
});

const updateSubscriptionSettings = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  if (req.body.price !== undefined) settings.subscriptionPrice = Number(req.body.price);
  if (req.body.monthlyDownloadLimit !== undefined) settings.monthlyTemplateDownloadLimit = Number(req.body.monthlyDownloadLimit);
  if (req.body.categories !== undefined) {
    const categories = normalizeCategories(req.body.categories);
    if (!categories.length) {
      return res.status(400).json({ success: false, message: 'At least one poster category is required' });
    }
    settings.posterCategories = categories;
  }
  await settings.save();
  res.json({ success: true, data: settings.toJSON() });
});

const consumeTemplateDownload = asyncHandler(async (req, res) => {
  const template = await PosterTemplate.findOne({ _id: req.params.id, active: true });
  if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
  if (req.user.subscriptionStatus !== 'active') {
    return res.status(403).json({ success: false, code: 'SUBSCRIPTION_REQUIRED', message: 'Monthly subscription required for poster download and share' });
  }

  const settings = await getSettings();
  const usage = await consumePosterDownload(req.user, settings.monthlyTemplateDownloadLimit);

  res.json({
    success: true,
    data: {
      templateId: template.id,
      downloadsUsed: usage.used,
      downloadsRemaining: usage.remaining,
      monthlyDownloadLimit: usage.limit,
    },
  });
});

module.exports = {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getSubscriptionStatus,
  updateSubscriptionSettings,
  consumeTemplateDownload,
};
