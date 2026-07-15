const School = require('../models/School');
const generateToken = require('../utils/generateToken');
const { generateSchoolQrCode } = require('../services/qrService');

// @desc    Register a new school & admin
// @route   POST /api/v1/auth/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Validate request
    if (!name || !email || !password || !phone || !address) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Check if school admin already exists
    const schoolExists = await School.findOne({ email });
    if (schoolExists) {
      return res.status(400).json({ success: false, message: 'Admin email already registered' });
    }

    // Create the School (initially without QR code link since we need the ID first)
    const school = new School({
      name,
      email,
      password,
      phone,
      address,
    });

    // Save initially to generate the _id
    await school.save();

    // Now generate permanent QR Code and form link
    const { qrCodeUrl, admissionFormLink } = await generateSchoolQrCode(school._id);

    // Save QR details
    school.qrCodeUrl = qrCodeUrl;
    school.admissionFormLink = admissionFormLink;
    await school.save();

    return res.status(201).json({
      success: true,
      token: generateToken(school._id),
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
        settings: school.settings,
        communicationTemplates: school.communicationTemplates,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// @desc    Auth school admin & get token
// @route   POST /api/v1/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate request
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Find school admin by email
    const school = await School.findOne({ email });

    if (school && (await school.comparePassword(password))) {
      return res.json({
        success: true,
        token: generateToken(school._id),
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
          logo: school.logo,
          thankYouCms: school.thankYouCms,
          settings: school.settings,
          communicationTemplates: school.communicationTemplates,
        },
      });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// @desc    Get current school profile
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const school = await School.findById(req.school.id).select('-password');
    if (!school) {
      return res.status(404).json({ success: false, message: 'School profile not found' });
    }
    return res.json({
      success: true,
      school,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
};

// @desc    Get public school details (for QR form and Thank You page)
// @route   GET /api/v1/auth/public/school/:schoolId
// @access  Public
const getPublicSchoolInfo = async (req, res) => {
  try {
    const school = await School.findById(req.params.schoolId).select('name logo thankYouCms');
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }
    return res.json({
      success: true,
      school,
    });
  } catch (error) {
    console.error('Get public school error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching school details' });
  }
};

module.exports = {
  signup,
  login,
  getMe,
  getPublicSchoolInfo,
};

