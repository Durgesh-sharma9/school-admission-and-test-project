const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Import controllers
const { getDashboardAnalytics } = require('../controllers/collegeDashboardController');
const { getDepartments, createDepartment, updateDepartment, deleteDepartment } = require('../controllers/collegeDepartmentController');
const { getCourses, createCourse, updateCourse, deleteCourse } = require('../controllers/collegeCourseController');
const { getFaculty, createFaculty, updateFaculty, deleteFaculty } = require('../controllers/collegeFacultyController');
const {
  getApplications,
  getApplicationById,
  submitApplication,
  updateApplicationStage,
  verifyDocument,
  verifyFee,
  addApplicationNote,
  getPublicDepartments,
  getPublicCourses,
  getPublicSpecializations
} = require('../controllers/collegeApplicationController');
const {
  getCollegeAcademicConfig,
  saveCollegeAcademicConfig,
  getAcademicMastersForCollege
} = require('../controllers/academicMasterController');
const {
  submitRequest,
  getCollegeRequests
} = require('../controllers/academicRequestController');

// Public routes for public form and metadata
router.post('/applications/submit', submitApplication);
router.get('/public/departments/:collegeId', getPublicDepartments);
router.get('/public/courses/:collegeId', getPublicCourses);
router.get('/public/specializations/:collegeId', getPublicSpecializations);

// Protected routes (require valid JWT token from college admin)
router.use(protect);

// Academic Configurations
router.get('/academic/config', getCollegeAcademicConfig);
router.post('/academic/config', saveCollegeAcademicConfig);
router.get('/academic/all-masters', getAcademicMastersForCollege);
router.post('/academic/requests', submitRequest);
router.get('/academic/requests', getCollegeRequests);

// Dashboard
router.get('/dashboard/analytics', getDashboardAnalytics);

// Departments CRUD
router.get('/departments', getDepartments);
router.post('/departments', createDepartment);
router.put('/departments/:id', updateDepartment);
router.delete('/departments/:id', deleteDepartment);

// Courses CRUD
router.get('/courses', getCourses);
router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

// Faculty CRUD
router.get('/faculty', getFaculty);
router.post('/faculty', createFaculty);
router.put('/faculty/:id', updateFaculty);
router.delete('/faculty/:id', deleteFaculty);

// Applications desk & Counselling operations
router.get('/applications', getApplications);
router.get('/applications/:id', getApplicationById);
router.put('/applications/:id/stage', updateApplicationStage);
router.put('/applications/:id/document/:docId', verifyDocument);
router.put('/applications/:id/fee', verifyFee);
router.post('/applications/:id/note', addApplicationNote);

module.exports = router;
