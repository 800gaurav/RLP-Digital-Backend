const mongoose = require('mongoose');
const baseOptions = require('./baseOptions');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  mobileNumber: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  dob: { type: Date, required: true },
  gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
  voterId: { type: String, required: true, unique: true, uppercase: true, trim: true },
  address: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  district: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  pincode: { type: String, required: true, trim: true },
  profilePhoto: { type: String, default: '' },
  profileThumbnailUrl: { type: String, default: '' },
  profilePhotoSize: { type: Number, default: 0 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  stampPadAccess: { type: Boolean, default: false },
  subscriptionStatus: { type: String, enum: ['inactive', 'active'], default: 'inactive' },
  posterDownloadsUsed: { type: Number, default: 0 },
  posterDownloadsPeriodKey: { type: String, default: '' },
  subscriptionStartDate: Date,
  subscriptionEndDate: Date,
  fcmToken: String,
}, baseOptions);

userSchema.index({ fullName: 'text', email: 'text', mobileNumber: 'text', voterId: 'text', district: 'text', city: 'text' });

module.exports = mongoose.model('User', userSchema);
