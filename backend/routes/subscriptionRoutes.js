const express = require('express');
const router = express.Router();
const {
  getCurrentSubscription,
  changePlan,
  getSubscriptionRequests,
  approveSubscriptionRequest,
  rejectSubscriptionRequest,
  createRazorpayOrder,
  verifyRazorpayPayment,
  confirmDowngradeChoice
} = require('../controllers/subscriptionController');
const { protect, protectSuperAdmin } = require('../middleware/auth');

// --- School / College Admin endpoints ---
router.get('/current', protect, getCurrentSubscription);
router.post('/request', protect, changePlan);
router.post('/create-razorpay-order', protect, createRazorpayOrder);
router.post('/verify-razorpay-payment', protect, verifyRazorpayPayment);
router.post('/confirm-downgrade-choice', protect, confirmDowngradeChoice);


// --- Super Admin endpoints ---
router.get('/requests', protectSuperAdmin, getSubscriptionRequests);
router.post('/requests/:id/approve', protectSuperAdmin, approveSubscriptionRequest);
router.post('/requests/:id/reject', protectSuperAdmin, rejectSubscriptionRequest);

module.exports = router;
