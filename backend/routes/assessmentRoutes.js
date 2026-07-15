const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
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
router.get('/assignments/:id', getAssignmentById);
router.put('/assignments/:id/save-progress', saveProgress);
router.post('/assignments/:id/submit', submitAssessment);

// ==========================================
// PRIVATE ADMIN CONFIG ROUTES (JWT PROTECTED)
// ==========================================
router.get('/', protect, getAssessments);
router.post('/', protect, createAssessment);
router.get('/assignments/stats', protect, getAssessmentStats);
router.get('/assignments/enquiry/:enquiryId', protect, getAssignmentsByEnquiry);
router.post('/assign', protect, assignAssessment);
router.put('/assignments/:id/grade', protect, gradeDescriptiveAssessment);

// Template Specific Operations
router.get('/:id', protect, getAssessmentById);
router.put('/:id', protect, updateAssessment);
router.post('/:id/duplicate', protect, duplicateAssessment);
router.delete('/:id', protect, deleteAssessment);

module.exports = router;
