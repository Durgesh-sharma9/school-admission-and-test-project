const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true,
  },
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
  trialDays: {
    type: Number,
    default: 7,
  },
  description: {
    type: String,
    trim: true,
  },
  features: [{
    type: String,
    trim: true,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Plan', planSchema);
