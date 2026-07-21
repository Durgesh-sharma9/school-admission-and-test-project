const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'School name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Admin email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    required: false,
    default: null,
  },
  authProvider: {
    type: String,
    enum: ['email', 'google'],
    default: 'email',
  },
  phone: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true,
  },
  address: {
    type: String,
    required: [true, 'School address is required'],
    trim: true,
  },
  tagline: {
    type: String,
    default: '',
    trim: true,
  },
  academicSession: {
    type: String,
    default: '2026-2027',
    trim: true,
  },
  website: {
    type: String,
    default: '',
    trim: true,
  },
  logo: {
    type: String,
    default: '',
  },
  qrBranding: {
    showLogo: { type: Boolean, default: true },
    showName: { type: Boolean, default: true },
    showTagline: { type: Boolean, default: true },
    showContact: { type: Boolean, default: true },
    showEmail: { type: Boolean, default: true },
    showWebsite: { type: Boolean, default: true },
    showAddress: { type: Boolean, default: true },
    showAcademicSession: { type: Boolean, default: true },
    footerMessage: { 
      type: String, 
      default: 'Thank You For Visiting Our School. We Look Forward To Welcoming Your Child.' 
    },
    primaryColor: { type: String, default: '#4f46e5' },
    secondaryColor: { type: String, default: '#f59e0b' },
    showHighlights: { type: Boolean, default: true },
    highlights: {
      type: [String],
      default: [
        'Experienced & Caring Faculty',
        'Smart Classrooms & Modern Labs',
        'Holistic Sports & Activity Program',
        'Safe Campus & GPS Transport'
      ]
    },
  },
  role: {
    type: String,
    enum: ['super-admin', 'school-admin'],
    default: 'school-admin',
  },
  
  // Trial/Subscription state (ready for future modules)
  subscription: {
    plan: {
      type: String,
      default: 'free-trial',
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'suspended'],
      default: 'active',
    },
    trialStart: {
      type: Date,
      default: Date.now,
    },
    trialEnd: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
    },
  },

  // QR settings
  qrCodeUrl: {
    type: String,
    default: '',
  },
  admissionFormLink: {
    type: String,
    default: '',
  },

  // Thank You Page CMS Configuration (max 4 social links, PDF/Image brochure, PDF/Image fee structure, image banner)
  thankYouCms: {
    // Keep backward compatibility fields
    socialLink1: { type: String, default: '' },
    socialLink2: { type: String, default: '' },
    pdfUrl: { type: String, default: '' },
    imageUrl: { type: String, default: '' },

    // Upgraded fields
    socialLinks: [
      {
        platform: { type: String, required: true },
        url: { type: String, required: true }
      }
    ],
    admissionBrochure: {
      url: { type: String, default: '' },
      type: { type: String, default: '' }, // 'pdf' or 'image'
      mimeType: { type: String, default: '' },
      filename: { type: String, default: '' }
    },
    feeStructure: {
      url: { type: String, default: '' },
      type: { type: String, default: '' }, // 'pdf' or 'image'
      mimeType: { type: String, default: '' },
      filename: { type: String, default: '' }
    },
    banner: { type: String, default: '' }
  },
  settings: {
    minorTypingValidation: { type: Boolean, default: false }
  },
  communicationTemplates: [{
    name: { type: String, required: true },
    type: { type: String, enum: ['whatsapp', 'email'], required: true },
    subject: { type: String, default: '' },
    body: { type: String, required: true }
  }],
}, {
  timestamps: true,
});

// Hash password before saving
schoolSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
schoolSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('School', schoolSchema);
