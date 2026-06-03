const mongoose = require('mongoose');
const baseOptions = require('./baseOptions');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  mobileNumber: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  dob: { type: Date, required: true },
  gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
  category: { type: String, required: true, enum: ['General', 'OBC', 'SC', 'ST', 'Other'], trim: true },
  voterId: { type: String, required: true, unique: true, uppercase: true, trim: true },
  address: { type: String, default: '', trim: true },
  state: { type: String, required: true, trim: true },
  district: { type: String, required: true, trim: true },
  city: { type: String, default: '', trim: true },
  vidhansabha: { type: String, default: '', trim: true },
  pincode: { type: String, default: '', trim: true },
  profilePhoto: { type: String, default: '' },
  profileThumbnailUrl: { type: String, default: '' },
  profilePhotoSize: { type: Number, default: 0 },
  voterIdPhoto: { type: String, default: '' },
  voterIdThumbnailUrl: { type: String, default: '' },
  voterIdPhotoSize: { type: Number, default: 0 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  accountStatus: { type: String, enum: ['active', 'suspended'], default: 'active', index: true },
  stampPadAccess: { type: Boolean, default: false },
  subscriptionStatus: { type: String, enum: ['inactive', 'active'], default: 'inactive' },
  paymentStatus: { type: String, enum: ['approved', 'under_review', 'rejected'], default: 'approved', index: true },
  paymentUtr: { type: String, default: '', trim: true },
  paymentAmount: { type: Number, default: 0 },
  paymentReviewedAt: Date,
  paymentReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  posterDownloadsUsed: { type: Number, default: 0 },
  posterDownloadsPeriodKey: { type: String, default: '' },
  subscriptionStartDate: Date,
  subscriptionEndDate: Date,
  fcmToken: String,
  pushToken: { type: String, trim: true, index: true },
}, baseOptions);

userSchema.index({ fullName: 'text', email: 'text', mobileNumber: 'text', voterId: 'text', district: 'text', city: 'text', vidhansabha: 'text' });
userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: 'string' } },
  },
);

module.exports = mongoose.model('User', userSchema);
