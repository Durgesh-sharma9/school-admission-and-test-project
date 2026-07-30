const mongoose = require('mongoose');

const subscriptionRequestSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
  },
  organizationType: {
    type: String,
    enum: ['school', 'college'],
    required: true,
  },
  planCode: {
    type: String,
    required: true,
  },
  requestedBy: {
    type: String,
    required: true, // admin email or user name
  },
  price: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  remarks: {
    type: String,
    default: '',
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  approvedAt: {
    type: Date,
  },
  approvedBy: {
    type: String,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SubscriptionRequest', subscriptionRequestSchema);
