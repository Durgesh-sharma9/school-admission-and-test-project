const express = require('express');
const router = express.Router();
const {
  sendOTP,
  verifyOTP,
  resendOTP
} = require('../controllers/otpController');

// Send OTP
router.post('/send-otp', sendOTP);

// Verify OTP
router.post('/verify-otp', verifyOTP);

// Resend OTP
router.post('/resend-otp', resendOTP);

module.exports = router;
