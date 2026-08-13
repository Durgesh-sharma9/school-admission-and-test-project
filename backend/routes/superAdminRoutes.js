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
  getAllPayments,
} = require('../controllers/schoolManagementController');
const {
  getMasterDepartments,
  createMasterDepartment,
  updateMasterDepartment,
  deleteMasterDepartment,
  
  getMasterCourses,
  createMasterCourse,
  updateMasterCourse,
  deleteMasterCourse,
  
  getMasterSpecializations,
  createMasterSpecialization,
  updateMasterSpecialization,
  deleteMasterSpecialization
} = require('../controllers/academicMasterController');
const {
  getSuperAdminRequests,
  approveRequest,
  rejectRequest
} = require('../controllers/academicRequestController');
const { protect } = require('../middleware/superAdminAuth');

// Auth routes
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Dashboard Analytics route
router.get('/analytics', protect, getDashboardAnalytics);

// School management routes
router.get('/schools', protect, getAllSchools);
router.get('/payments', protect, getAllPayments);
router.get('/schools/:id', protect, getSchool);
router.post('/impersonate/:id', protect, impersonateSchool);
router.put('/schools/:id/activate', protect, activateSchool);
router.put('/schools/:id/suspend', protect, suspendSchool);
router.delete('/schools/:id', protect, deleteSchool);

// Academic Masters
router.get('/academic/departments', protect, getMasterDepartments);
router.post('/academic/departments', protect, createMasterDepartment);
router.put('/academic/departments/:id', protect, updateMasterDepartment);
router.delete('/academic/departments/:id', protect, deleteMasterDepartment);

router.get('/academic/courses', protect, getMasterCourses);
router.post('/academic/courses', protect, createMasterCourse);
router.put('/academic/courses/:id', protect, updateMasterCourse);
router.delete('/academic/courses/:id', protect, deleteMasterCourse);

router.get('/academic/specializations', protect, getMasterSpecializations);
router.post('/academic/specializations', protect, createMasterSpecialization);
router.put('/academic/specializations/:id', protect, updateMasterSpecialization);
router.delete('/academic/specializations/:id', protect, deleteMasterSpecialization);

// Academic requests workflow
router.get('/academic/requests', protect, getSuperAdminRequests);
router.post('/academic/requests/:id/approve', protect, approveRequest);
router.post('/academic/requests/:id/reject', protect, rejectRequest);

const {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
} = require('../controllers/planController');
const {
  getSubscriptionRequests,
  approveSubscriptionRequest,
  rejectSubscriptionRequest
} = require('../controllers/subscriptionController');

// Subscription Plans
router.get('/plans', protect, getAllPlans);
router.get('/plans/:id', protect, getPlanById);
router.post('/plans', protect, createPlan);
router.put('/plans/:id', protect, updatePlan);
router.delete('/plans/:id', protect, deletePlan);

// Subscription Requests
router.get('/subscription/requests', protect, getSubscriptionRequests);
router.post('/subscription/requests/:id/approve', protect, approveSubscriptionRequest);
router.post('/subscription/requests/:id/reject', protect, rejectSubscriptionRequest);

const { getSystemSettings, updateSystemSettings } = require('../controllers/settingsController');

// System Settings routes
router.get('/settings', protect, getSystemSettings);
router.put('/settings', protect, updateSystemSettings);

module.exports = router;
