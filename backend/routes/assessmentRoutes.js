const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkSubscription, checkAssessmentAccess } = require('../middleware/subscriptionMiddleware');
const {
  getAssessments,
  createAssessment,
  getAssessmentById,
  updateAssessment,
  duplicateAssessment,
  deleteAssessment,
  assignAssessment,
  getAssignmentsByEnquiry,
  getAssignmentById,
  saveProgress,
  submitAssessment,
  gradeDescriptiveAssessment,
  getAssessmentStats,
} = require('../controllers/assessmentController');

// ==========================================
// PUBLIC EXAM LOUNGE ROUTES (NO AUTH REQ)
// ==========================================
router.get('/assignments/stats', protect, checkSubscription, getAssessmentStats);
router.get('/assignments/:id', getAssignmentById);
router.put('/assignments/:id/save-progress', saveProgress);
router.post('/assignments/:id/submit', submitAssessment);

// ==========================================
// PRIVATE ADMIN CONFIG ROUTES (JWT PROTECTED)
// ==========================================
router.get('/', protect, checkSubscription, checkAssessmentAccess, getAssessments);
router.post('/', protect, checkSubscription, checkAssessmentAccess, createAssessment);
router.get('/assignments/enquiry/:enquiryId', protect, checkSubscription, checkAssessmentAccess, getAssignmentsByEnquiry);
router.post('/assign', protect, checkSubscription, checkAssessmentAccess, assignAssessment);
router.put('/assignments/:id/grade', protect, checkSubscription, checkAssessmentAccess, gradeDescriptiveAssessment);

// Template Specific Operations
router.get('/:id', protect, checkSubscription, checkAssessmentAccess, getAssessmentById);
router.put('/:id', protect, checkSubscription, checkAssessmentAccess, updateAssessment);
router.post('/:id/duplicate', protect, checkSubscription, checkAssessmentAccess, duplicateAssessment);
router.delete('/:id', protect, checkSubscription, checkAssessmentAccess, deleteAssessment);

module.exports = router;
