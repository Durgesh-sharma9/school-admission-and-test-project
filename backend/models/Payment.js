const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true,
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
  },
  currency: {
    type: String,
    default: 'INR',
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'upi', 'bank_transfer', 'cheque'],
    default: 'card',
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true,
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly',
  },
  paidAt: {
    type: Date,
  },
  nextBillingDate: {
    type: Date,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Payment', paymentSchema);
