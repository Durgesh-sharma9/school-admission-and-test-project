const express = require('express');
const router = express.Router();
const {
  getCurrentSubscription,
  changePlan,
  renewSubscription,
  cancelSubscription,
  getSubscriptionHistory,
  getAvailablePlans,
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

// All subscription routes require authentication
router.use(protect);

router.get('/current', getCurrentSubscription);
router.post('/change-plan', changePlan);
router.post('/renew', renewSubscription);
router.post('/cancel', cancelSubscription);
router.get('/history', getSubscriptionHistory);
router.get('/plans', getAvailablePlans);

module.exports = router;
