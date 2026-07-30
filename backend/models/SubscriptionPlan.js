const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  organizationType: {
    type: String,
    enum: ['school', 'college'],
    required: true,
  },
  planCode: {
    type: String,
    required: true,
    unique: true, // school-basic, school-premium, college-premium
  },
  planName: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  billingCycle: {
    type: String,
    enum: ['yearly'],
    default: 'yearly',
  },
  assessmentEnabled: {
    type: Boolean,
    default: false,
  },
  features: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
