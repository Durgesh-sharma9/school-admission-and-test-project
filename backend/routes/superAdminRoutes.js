const express = require('express');
const router = express.Router();
const {
  login,
  getMe,
  updateProfile,
} = require('../controllers/superAdminController');
const {
  getAllSchools,
  getSchool,
  getDashboardAnalytics,
  impersonateSchool,
  activateSchool,
  suspendSchool,
  deleteSchool,
} = require('../controllers/schoolManagementController');
const { protect } = require('../middleware/superAdminAuth');

// Auth routes
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Dashboard Analytics route
router.get('/analytics', protect, getDashboardAnalytics);

// School management routes
router.get('/schools', protect, getAllSchools);
router.get('/schools/:id', protect, getSchool);
router.post('/impersonate/:id', protect, impersonateSchool);
router.put('/schools/:id/activate', protect, activateSchool);
router.put('/schools/:id/suspend', protect, suspendSchool);
router.delete('/schools/:id', protect, deleteSchool);

module.exports = router;
