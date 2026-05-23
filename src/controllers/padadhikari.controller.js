const Padadhikari = require('../models/Padadhikari');
const asyncHandler = require('../utils/asyncHandler');
const { fileUrl } = require('../middleware/upload.middleware');

const listPadadhikari = asyncHandler(async (req, res) => {
  const { q, rank, district, block, state } = req.query;
  const filter = {};
  if (rank) filter.rank = rank;
  if (district) filter.district = new RegExp(district, 'i');
  if (block) filter.block = new RegExp(block, 'i');
  if (state) filter.state = new RegExp(state, 'i');
  if (q) {
    filter.$or = [
      { fullName: new RegExp(q, 'i') },
      { designation: new RegExp(q, 'i') },
      { district: new RegExp(q, 'i') },
      { block: new RegExp(q, 'i') },
    ];
  }
  const officials = await Padadhikari.find(filter).sort({ rank: 1, fullName: 1 });
  res.json({ success: true, data: officials.map((item) => item.toJSON()) });
});

const getPadadhikari = asyncHandler(async (req, res) => {
  const official = await Padadhikari.findById(req.params.id);
  if (!official) return res.status(404).json({ success: false, message: 'Official not found' });
  res.json({ success: true, data: official.toJSON() });
});

const createPadadhikari = asyncHandler(async (req, res) => {
  if (!req.body.fullName?.trim()) {
    return res.status(400).json({ success: false, message: 'Padadhikari name is required' });
  }
  if (!req.body.designation?.trim()) {
    return res.status(400).json({ success: false, message: 'Padadhikari designation is required' });
  }
  const official = await Padadhikari.create({ ...req.body, photoUrl: fileUrl(req, req.file) || req.body.photoUrl });
  res.status(201).json({ success: true, data: official.toJSON() });
});

const updatePadadhikari = asyncHandler(async (req, res) => {
  const update = { ...req.body };
  const uploaded = fileUrl(req, req.file);
  if (uploaded) update.photoUrl = uploaded;
  const official = await Padadhikari.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!official) return res.status(404).json({ success: false, message: 'Official not found' });
  res.json({ success: true, data: official.toJSON() });
});

const deletePadadhikari = asyncHandler(async (req, res) => {
  const official = await Padadhikari.findByIdAndDelete(req.params.id);
  if (!official) return res.status(404).json({ success: false, message: 'Official not found' });
  res.json({ success: true, message: 'Official deleted' });
});

module.exports = { listPadadhikari, getPadadhikari, createPadadhikari, updatePadadhikari, deletePadadhikari };
