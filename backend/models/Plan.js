const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  // General Information
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  planType: {
    type: String,
    enum: ['basic', 'standard', 'premium', 'enterprise'],
    default: 'standard',
  },
  badge: {
    type: String,
    enum: ['basic', 'popular', 'premium', 'enterprise', 'none'],
    default: 'none',
  },
  icon: {
    type: String,
    default: 'package',
  },
  colorTheme: {
    type: String,
    default: '#4f46e5',
  },
  
  // Billing
  monthlyPrice: {
    type: Number,
    required: [true, 'Monthly price is required'],
    default: 0,
  },
  yearlyPrice: {
    type: Number,
    required: [true, 'Yearly price is required'],
    default: 0,
  },
  lifetimePrice: {
    type: Number,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0, // Percentage discount for yearly plans
  },
  gst: {
    type: Number,
    default: 18, // GST percentage
  },
  trialDays: {
    type: Number,
    default: 7,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  
  // Capacity Limits
  capacity: {
    maxStudents: {
      type: Number,
      default: 100,
    },
    maxTeachers: {
      type: Number,
      default: 10,
    },
    maxAdmins: {
      type: Number,
      default: 2,
    },
    maxStorage: {
      type: Number, // in GB
      default: 5,
    },
    apiRateLimit: {
      type: Number, // requests per minute
      default: 100,
    },
  },
  
  // Notification Limits
  notifications: {
    whatsappLimit: {
      type: Number,
      default: 1000, // per month
    },
    emailLimit: {
      type: Number,
      default: 5000, // per month
    },
    smsLimit: {
      type: Number,
      default: 500, // per month
    },
    aiCredits: {
      type: Number,
      default: 100, // per month
    },
  },
  
  // Feature Flags
  features: {
    admission: {
      enabled: { type: Boolean, default: true },
      dailyTest: { type: Boolean, default: false },
    },
    parentPortal: {
      enabled: { type: Boolean, default: false },
      notebookAnalysis: { type: Boolean, default: false },
      resultManagement: { type: Boolean, default: false },
    },
    attendance: {
      enabled: { type: Boolean, default: true },
      biometric: { type: Boolean, default: false },
    },
    assessment: {
      enabled: { type: Boolean, default: true },
      aiGrading: { type: Boolean, default: false },
      questionBank: { type: Boolean, default: false },
    },
    reports: {
      enabled: { type: Boolean, default: true },
      unlimitedReports: { type: Boolean, default: false },
      customReports: { type: Boolean, default: false },
    },
    communication: {
      whatsapp: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
      email: { type: Boolean, default: true },
    },
    branding: {
      customDomain: { type: Boolean, default: false },
      whiteLabel: { type: Boolean, default: false },
      customEmail: { type: Boolean, default: false },
    },
    ai: {
      assistant: { type: Boolean, default: false },
      insights: { type: Boolean, default: false },
      predictions: { type: Boolean, default: false },
    },
    integrations: {
      apiAccess: { type: Boolean, default: false },
      webhooks: { type: Boolean, default: false },
      zapier: { type: Boolean, default: false },
    },
    qr: {
      enabled: { type: Boolean, default: true },
      customBranding: { type: Boolean, default: false },
      analytics: { type: Boolean, default: false },
    },
    website: {
      cms: { type: Boolean, default: false },
      landingPage: { type: Boolean, default: false },
      blog: { type: Boolean, default: false },
    },
  },
  
  // Support & Analytics
  support: {
    prioritySupport: { type: Boolean, default: false },
    dedicatedManager: { type: Boolean, default: false },
    liveChat: { type: Boolean, default: false },
    sla: { type: String, default: 'standard' }, // standard, premium, enterprise
  },
  analytics: {
    advancedAnalytics: { type: Boolean, default: false },
    customDashboards: { type: Boolean, default: false },
    exportData: { type: Boolean, default: true },
  },
  
  // Display & Marketing
  featuresList: [{
    type: String,
    trim: true,
  }],
  highlightFeatures: [{
    type: String,
    trim: true,
  }],
  
  // Status & Visibility
  status: {
    type: String,
    enum: ['active', 'draft', 'hidden', 'archived'],
    default: 'active',
  },
  isPopular: {
    type: Boolean,
    default: false,
  },
  isEnterpriseOnly: {
    type: Boolean,
    default: false,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
  
  // Legacy compatibility
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
planSchema.index({ status: 1, sortOrder: 1 });
planSchema.index({ planType: 1 });

module.exports = mongoose.model('Plan', planSchema);
