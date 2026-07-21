const mongoose = require('mongoose');
const crypto = require('crypto');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    enum: ['EMAIL_VERIFICATION', 'PASSWORD_RESET'],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient lookups
otpSchema.index({ email: 1, purpose: 1, verified: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to generate a 6-digit OTP
otpSchema.statics.generateOTP = function() {
  return crypto.randomInt(100000, 999999).toString();
};

// Method to hash OTP for storage
otpSchema.statics.hashOTP = function(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

// Method to verify OTP
otpSchema.methods.verifyOTP = function(inputOTP) {
  const hashedInput = this.constructor.hashOTP(inputOTP);
  const isValid = hashedInput === this.otp;
  
  // Increment attempts
  this.attempts += 1;
  
  // Check if max attempts reached
  if (this.attempts >= 5) {
    this.verified = true; // Mark as verified to prevent further attempts
    return { valid: false, message: 'Maximum attempts exceeded. Please request a new OTP.' };
  }
  
  // Check if expired
  if (new Date() > this.expiresAt) {
    return { valid: false, message: 'OTP has expired. Please request a new OTP.' };
  }
  
  if (isValid) {
    this.verified = true;
    return { valid: true, message: 'OTP verified successfully.' };
  }
  
  return { valid: false, message: 'Invalid OTP. Please try again.' };
};

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
