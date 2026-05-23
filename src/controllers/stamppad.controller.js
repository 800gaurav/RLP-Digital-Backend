const StampDraft = require('../models/StampDraft');
const asyncHandler = require('../utils/asyncHandler');

const checkAccess = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { allowed: !!req.user.stampPadAccess, stampPadAccess: !!req.user.stampPadAccess } });
});

const getDrafts = asyncHandler(async (req, res) => {
  const drafts = await StampDraft.find({ user: req.userId }).sort({ updatedAt: -1 });
  res.json({ success: true, data: drafts.map((item) => item.toJSON()) });
});

const saveDraft = asyncHandler(async (req, res) => {
  const draft = await StampDraft.create({ ...req.body, user: req.userId });
  res.status(201).json({ success: true, data: draft.toJSON() });
});

const updateDraft = asyncHandler(async (req, res) => {
  const draft = await StampDraft.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    req.body,
    { new: true, runValidators: true },
  );
  if (!draft) return res.status(404).json({ success: false, message: 'Draft not found' });
  res.json({ success: true, data: draft.toJSON() });
});

module.exports = { checkAccess, getDrafts, saveDraft, updateDraft };
