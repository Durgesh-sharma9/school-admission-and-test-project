const express = require('express');
const router = express.Router();
const {
  getEnquiries,
  getDashboardStats,
  createEnquiryManual,
  createEnquiryPublic,
  updateEnquiry,
  updateEnquiryStatus,
  convertToAdmission,
  deleteEnquiry,
} = require('../controllers/enquiryController');
const { protect } = require('../middleware/auth');

// Private Routes
router.get('/', protect, getEnquiries);
router.get('/stats', protect, getDashboardStats);
router.post('/', protect, createEnquiryManual);
router.put('/:id', protect, updateEnquiry);
router.patch('/:id/status', protect, updateEnquiryStatus);
router.post('/:id/convert', protect, convertToAdmission);
router.delete('/:id', protect, deleteEnquiry);

// Public Routes (used for QR code & Reception Link)
router.post('/public/:schoolId', createEnquiryPublic);

module.exports = router;
