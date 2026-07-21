const express = require('express');
const router = express.Router();
const {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  archivePlan,
  duplicatePlan,
  getPublicPlans,
  reorderPlans,
} = require('../controllers/planController');
const { protectSuperAdmin } = require('../middleware/auth');

// Super Admin only routes
router.get('/', protectSuperAdmin, getAllPlans);
router.get('/:id', protectSuperAdmin, getPlanById);
router.post('/', protectSuperAdmin, createPlan);
router.put('/:id', protectSuperAdmin, updatePlan);
router.delete('/:id', protectSuperAdmin, deletePlan);
router.patch('/:id/archive', protectSuperAdmin, archivePlan);
router.post('/:id/duplicate', protectSuperAdmin, duplicatePlan);
router.patch('/reorder', protectSuperAdmin, reorderPlans);

// Public route for school admins to view available plans (must be before /:id route)
router.get('/public', getPublicPlans);

module.exports = router;
