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
  deleteMasterSpecialization,
  
  getMasterSessions,
  createMasterSession,
  updateMasterSession,
  deleteMasterSession
} = require('../controllers/academicMasterController');
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

router.get('/academic/sessions', protect, getMasterSessions);
router.post('/academic/sessions', protect, createMasterSession);
router.put('/academic/sessions/:id', protect, updateMasterSession);
router.delete('/academic/sessions/:id', protect, deleteMasterSession);

module.exports = router;
