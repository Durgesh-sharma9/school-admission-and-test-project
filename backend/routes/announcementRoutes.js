const express = require('express');
const router = express.Router();
const {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementAnalytics,
  getSchoolAnnouncements,
  markAsRead,
  acknowledgeAnnouncement,
} = require('../controllers/announcementController');

const { protect: protectSuperAdmin } = require('../middleware/superAdminAuth');
const { protect: protectSchool } = require('../middleware/auth');

// ==========================================
// SUPER ADMIN ANNOUNCEMENT ROUTES
// ==========================================
router.post('/super-admin/announcements', protectSuperAdmin, createAnnouncement);
router.get('/super-admin/announcements', protectSuperAdmin, getAllAnnouncements);
router.get('/super-admin/announcements-analytics', protectSuperAdmin, getAnnouncementAnalytics);
router.get('/super-admin/announcements/:id', protectSuperAdmin, getAnnouncementById);
router.put('/super-admin/announcements/:id', protectSuperAdmin, updateAnnouncement);
router.delete('/super-admin/announcements/:id', protectSuperAdmin, deleteAnnouncement);

// ==========================================
// SCHOOL ADMIN ANNOUNCEMENT ROUTES
// ==========================================
router.get('/school/announcements', protectSchool, getSchoolAnnouncements);
router.post('/school/announcements/:id/read', protectSchool, markAsRead);
router.post('/school/announcements/:id/acknowledge', protectSchool, acknowledgeAnnouncement);

module.exports = router;
