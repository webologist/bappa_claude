const mongoose = require('mongoose');
const { Schema } = mongoose;

const THEME_KEYS = ['saffron', 'royal', 'emerald', 'rose', 'sunflower'];

const tenantSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true, maxlength: 40 },
  logoUrl: { type: String, default: '' },
  theme: { type: String, enum: THEME_KEYS, default: 'saffron' },
  adminEmail: { type: String, required: true, lowercase: true, trim: true },
  adminToken: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const lyricsSchema = new Schema({
  marathi: { type: String, default: '', maxlength: 5000 },
  gujarati: { type: String, default: '', maxlength: 5000 },
  english: { type: String, default: '', maxlength: 5000 }
}, { _id: false });

const audioContentSchema = new Schema({
  tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  audioUrl: { type: String, default: '' },
  thumbnailUrl: { type: String, default: '' },
  lyrics: { type: lyricsSchema, default: () => ({}) },
  isFeatured: { type: Boolean, default: false }
}, { timestamps: true });

const eventSchema = new Schema({
  tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, default: '', maxlength: 500 },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true }
}, { timestamps: true });

const advertisementSchema = new Schema({
  tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  imageUrl: { type: String, required: true },
  targetLink: { type: String, default: '', maxlength: 300 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const donationSchema = new Schema({
  tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  donorName: { type: String, required: true, trim: true, maxlength: 100 },
  donorPhone: { type: String, required: true, trim: true, maxlength: 20 },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['PENDING', 'RECEIVED', 'REJECTED'], default: 'PENDING' }
}, { timestamps: true });

const galleryPhotoSchema = new Schema({
  tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  uploaderName: { type: String, required: true, trim: true, maxlength: 100 },
  uploaderPhone: { type: String, required: true, trim: true, maxlength: 20 },
  caption: { type: String, default: '', maxlength: 200 },
  watermarkedImageUrl: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  likeCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 }
}, { timestamps: true });

const endUserSchema = new Schema({
  tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  phone: { type: String, required: true, trim: true, maxlength: 20 },
  firstName: { type: String, required: true, trim: true, maxlength: 50 },
  lastName: { type: String, required: true, trim: true, maxlength: 50 },
  address: { type: String, default: '', trim: true, maxlength: 200 },
  sex: { type: String, enum: ['male', 'female', 'other', ''], default: '' },
  age: { type: Number, min: 1, max: 120 },
  reference: { type: String, default: '', trim: true, maxlength: 100 }
}, { timestamps: true });
endUserSchema.index({ tenant: 1, phone: 1 }, { unique: true });

const otpCodeSchema = new Schema({
  tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  phone: { type: String, required: true, trim: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  verified: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 }
}, { timestamps: true });
otpCodeSchema.index({ tenant: 1, phone: 1 }, { unique: true });

module.exports = {
  Tenant: mongoose.model('Tenant', tenantSchema),
  AudioContent: mongoose.model('AudioContent', audioContentSchema),
  Event: mongoose.model('Event', eventSchema),
  Advertisement: mongoose.model('Advertisement', advertisementSchema),
  Donation: mongoose.model('Donation', donationSchema),
  GalleryPhoto: mongoose.model('GalleryPhoto', galleryPhotoSchema),
  EndUser: mongoose.model('EndUser', endUserSchema),
  OtpCode: mongoose.model('OtpCode', otpCodeSchema),
  THEME_KEYS
};
