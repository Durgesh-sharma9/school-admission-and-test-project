const express = require('express');
const router = express.Router();
const { signup, login, getMe, getPublicSchoolInfo, resetPassword, googleLogin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.get('/public/school/:schoolId', getPublicSchoolInfo);

module.exports = router;
