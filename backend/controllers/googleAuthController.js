const { OAuth2Client } = require('google-auth-library');
const School = require('../models/School');
const generateToken = require('../utils/generateToken');
const { generateSchoolQrCode } = require('../services/qrService');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Google OAuth Login/Signup
// @route   POST /api/v1/auth/google
// @access  Public
const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Google ID token is required' });
    }

    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // Check if user already exists
    let school = await School.findOne({ email });

    if (school) {
      // User exists - login
      if (!school.emailVerified) {
        // Mark email as verified since Google email is verified
        school.emailVerified = true;
        await school.save();
      }

      const token = generateToken(school._id, 'school-admin');
      return res.json({
        success: true,
        token,
        role: 'school-admin',
        user: {
          id: school._id,
          name: school.name,
          email: school.email,
          role: 'school-admin',
          picture: picture || null,
        },
        school: {
          id: school._id,
          name: school.name,
          email: school.email,
          phone: school.phone,
          address: school.address,
          role: school.role,
          qrCodeUrl: school.qrCodeUrl,
          admissionFormLink: school.admissionFormLink,
          subscription: school.subscription,
          logo: school.logo || picture,
          thankYouCms: school.thankYouCms,
          settings: school.settings,
          communicationTemplates: school.communicationTemplates,
        },
        isNewUser: false,
      });
    } else {
      // User doesn't exist - create new account
      // Generate a random password for Google users
      const randomPassword = Math.random().toString(36).slice(-8) + 'A1@';

      const newSchool = new School({
        name: name || 'Google User',
        email,
        password: randomPassword,
        phone: '0000000000', // Placeholder - user will update
        address: 'Not provided', // Placeholder - user will update
        emailVerified: true, // Google email is verified
        logo: picture || '',
      });

      await newSchool.save();

      // Generate QR code and form link
      const { qrCodeUrl, admissionFormLink } = await generateSchoolQrCode(newSchool._id);
      newSchool.qrCodeUrl = qrCodeUrl;
      newSchool.admissionFormLink = admissionFormLink;
      await newSchool.save();

      const token = generateToken(newSchool._id, 'school-admin');
      return res.status(201).json({
        success: true,
        token,
        role: 'school-admin',
        user: {
          id: newSchool._id,
          name: newSchool.name,
          email: newSchool.email,
          role: 'school-admin',
          picture: picture || null,
        },
        school: {
          id: newSchool._id,
          name: newSchool.name,
          email: newSchool.email,
          phone: newSchool.phone,
          address: newSchool.address,
          role: newSchool.role,
          qrCodeUrl: newSchool.qrCodeUrl,
          admissionFormLink: newSchool.admissionFormLink,
          subscription: newSchool.subscription,
          logo: newSchool.logo,
          thankYouCms: newSchool.thankYouCms,
          settings: newSchool.settings,
          communicationTemplates: newSchool.communicationTemplates,
        },
        isNewUser: true,
        message: 'Account created successfully. Please complete your profile.',
      });
    }
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(500).json({ success: false, message: 'Google authentication failed' });
  }
};

module.exports = {
  googleAuth,
};
