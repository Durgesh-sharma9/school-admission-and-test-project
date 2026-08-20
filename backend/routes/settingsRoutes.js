const express = require('express');
const router = express.Router();
const {
  updateSettings,
  updateThankYouCms,
  uploadMedia,
  changePassword,
  updateSpellingSetting,
  addTemplate,
  deleteTemplate,
  regenerateQrCode,
} = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All settings routes are protected
router.put('/', protect, updateSettings);
router.post('/regenerate-qr', protect, regenerateQrCode);
router.put('/thankyou-cms', protect, updateThankYouCms);
router.post('/upload', protect, upload.single('file'), uploadMedia);
router.put('/password', protect, changePassword);
router.put('/spelling', protect, updateSpellingSetting);
router.post('/templates', protect, addTemplate);
router.delete('/templates/:templateId', protect, deleteTemplate);

module.exports = router;
