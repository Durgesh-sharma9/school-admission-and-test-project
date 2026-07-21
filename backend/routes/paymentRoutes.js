const express = require('express');
const router = express.Router();
const {
  createPaymentSession,
  handleWebhook,
  getPaymentMethods,
  createRefund,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Protected routes
router.post('/create-session', protect, createPaymentSession);
router.get('/methods', protect, getPaymentMethods);
router.post('/refund', protect, createRefund);

// Public webhook endpoint (no auth required)
router.post('/webhook/:gateway', handleWebhook);

module.exports = router;
