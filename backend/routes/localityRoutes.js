const express = require('express');
const router = express.Router();
const {
  getLocalities,
  getActiveLocalities,
  createLocality,
  updateLocality,
  updateLocalityStatus,
  approveLocality,
  deleteLocality,
  getLocalityAnalytics,
} = require('../controllers/localityController');
const { protect } = require('../middleware/auth');

// Public/Private Active Localities endpoint for dropdown suggestions
router.get('/active', getActiveLocalities);

// Protected Admin Routes
router.get('/', protect, getLocalities);
router.get('/analytics', protect, getLocalityAnalytics);
router.post('/', protect, createLocality);
router.put('/:id', protect, updateLocality);
router.patch('/:id/status', protect, updateLocalityStatus);
router.patch('/:id/approve', protect, approveLocality);
router.delete('/:id', protect, deleteLocality);

module.exports = router;
