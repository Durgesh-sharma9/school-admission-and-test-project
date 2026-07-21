const express = require('express');
const router = express.Router();
const { googleAuth } = require('../controllers/googleAuthController');

// Google OAuth
router.post('/google', googleAuth);

module.exports = router;
