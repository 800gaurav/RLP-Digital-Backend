const PosterTemplate = require('../models/PosterTemplate');
const asyncHandler = require('../utils/asyncHandler');
const { fileUrl } = require('../middleware/upload.middleware');
const { getSettings } = require('../utils/settings');

const getTemplates = asyncHandler(async (req, res) => {
  const filter = { active: true };
  if (req.query.category) filter.category = req.query.category;
  const templates = await PosterTemplate.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: templates.map((item) => item.toJSON()) });
});

const createTemplate = asyncHandler(async (req, res) => {
  const imageUrl = fileUrl(req, req.file) || req.body.imageUrl;
  if (!imageUrl) return res.status(400).json({ success: false, message: 'Template image is required' });
  const template = await PosterTemplate.create({
    name: req.body.name,
    category: req.body.category,
    imageUrl,
    isPremium: req.body.isPremium === true || req.body.isPremium === 'true',
    metadata: req.body.metadata || {},
  });
  res.status(201).json({ success: true, data: template.toJSON() });
});

const updateTemplate = asyncHandler(async (req, res) => {
  const update = { ...req.body };
  const uploaded = fileUrl(req, req.file);
  if (uploaded) update.imageUrl = uploaded;
  if (update.isPremium !== undefined) update.isPremium = update.isPremium === true || update.isPremium === 'true';
  const template = await PosterTemplate.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
  res.json({ success: true, data: template.toJSON() });
});

const deleteTemplate = asyncHandler(async (req, res) => {
  const template = await PosterTemplate.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
  res.json({ success: true, message: 'Template disabled' });
});

const getSubscriptionStatus = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  res.json({
    success: true,
    data: {
      active: req.user.subscriptionStatus === 'active',
      plan: req.user.subscriptionStatus === 'active' ? 'premium' : 'free',
      price: settings.subscriptionPrice,
    },
  });
});

const updateSubscriptionPrice = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  settings.subscriptionPrice = Number(req.body.price);
  await settings.save();
  res.json({ success: true, data: settings.toJSON() });
});

module.exports = { getTemplates, createTemplate, updateTemplate, deleteTemplate, getSubscriptionStatus, updateSubscriptionPrice };
