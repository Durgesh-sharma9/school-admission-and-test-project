const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getAnalyticsOverview } = require('../controllers/analyticsController');

router.get('/overview', protect, getAnalyticsOverview);

module.exports = router;
