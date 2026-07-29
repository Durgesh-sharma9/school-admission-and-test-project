const mongoose = require('mongoose');
const School = require('../models/School');
const SuperAdmin = require('../models/SuperAdmin');
const OTP = require('../models/OTP');
const generateToken = require('../utils/generateToken');
const { generateSchoolQrCode } = require('../services/qrService');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

// @desc    Register a new school & admin
// @route   POST /api/v1/auth/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const { name, email, password, phone, address, institutionType } = req.body;
    const isGoogleVerified = Boolean(req.body.googleVerified || req.body.authProvider === 'google');

    console.log('Signup request received:', { name, email, phone, address, isGoogleVerified, institutionType });

    // Validate request based on authentication provider
    if (isGoogleVerified) {
      if (!name || !email || !phone || !address) {
        console.log('Missing Google signup fields:', { name: !!name, email: !!email, phone: !!phone, address: !!address });
        return res.status(400).json({ success: false, message: 'Institution name, admin email, contact number, and address are required' });
      }
    } else {
      if (!name || !email || !password || !phone || !address) {
        console.log('Missing Email signup fields:', { name: !!name, email: !!email, password: !!password, phone: !!phone, address: !!address });
        return res.status(400).json({ success: false, message: 'All fields are required' });
      }
    }

    // Check if school admin already exists
    const schoolExists = await School.findOne({ email: email.toLowerCase() });
    if (schoolExists) {
      console.log('Email already registered:', email);
      return res.status(400).json({ success: false, message: 'Admin email already registered' });
    }

    // Create the School
    const school = new School({
      name,
      email: email.toLowerCase(),
      password: isGoogleVerified ? null : password,
      authProvider: isGoogleVerified ? 'google' : 'email',
      phone,
      address,
      emailVerified: isGoogleVerified, // Verified if completed via Google identity check
      institutionType: institutionType || 'school',
    });

    if (school.institutionType === 'college') {
      school.qrBranding = {
        showLogo: true,
        showName: true,
        showTagline: true,
        showContact: true,
        showEmail: true,
        showWebsite: true,
        showAddress: true,
        showAcademicSession: false,
        showUniversityName: true,
        showAccreditation: true,
        showFacilities: true,
        footerMessage: 'Thank You For Visiting Our College. We Look Forward To Welcoming You.',
        primaryColor: '#4f46e5',
        secondaryColor: '#f59e0b',
        accentColor: '#6366f1',
        showHighlights: true,
        highlights: [
          'Academic & Research Excellence',
          'Industry Collaborations & Placements',
          'State-of-the-Art Labs & Infrastructure',
          'Holistic Student Development & Clubs'
        ]
      };
    } else {
      school.qrBranding = {
        showLogo: true,
        showName: true,
        showTagline: true,
        showContact: true,
        showEmail: true,
        showWebsite: true,
        showAddress: true,
        showAcademicSession: true,
        showUniversityName: false,
        showAccreditation: false,
        showFacilities: false,
        footerMessage: 'Thank You For Visiting Our School. We Look Forward To Welcoming Your Child.',
        primaryColor: '#4f46e5',
        secondaryColor: '#f59e0b',
        accentColor: '#6366f1',
        showHighlights: true,
        highlights: [
          'Experienced & Caring Faculty',
          'Smart Classrooms & Modern Labs',
          'Holistic Sports & Activity Program',
          'Safe Campus & GPS Transport'
        ]
      };
    }

    console.log('School object created, attempting to save...');

    // Save initially to generate the _id
    await school.save();

    console.log('School saved successfully, ID:', school._id);

    // Now generate permanent QR Code and form link
    let { qrCodeUrl, admissionFormLink } = await generateSchoolQrCode(school._id);

    // Save QR details
    school.qrCodeUrl = qrCodeUrl;
    school.admissionFormLink = admissionFormLink;
    await school.save();

    // If signed up via Google identity check, bypass OTP and issue JWT directly
    if (isGoogleVerified) {
      const token = generateToken(school._id, 'school-admin');
      return res.status(201).json({
        success: true,
        message: 'Account created successfully!',
        token,
        role: school.role || 'school-admin',
        user: {
          id: school._id,
          name: school.name,
          email: school.email,
          role: school.role || 'school-admin',
          institutionType: school.institutionType || 'school',
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
          logo: school.logo,
          thankYouCms: school.thankYouCms,
          settings: school.settings,
          communicationTemplates: school.communicationTemplates,
          institutionType: school.institutionType || 'school',
        },
      });
    }

    // Otherwise, generate OTP for standard email/password registration
    const plainOTP = OTP.generateOTP();
    const hashedOTP = OTP.hashOTP(plainOTP);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const otpRecord = new OTP({
      email,
      otp: hashedOTP,
      purpose: 'EMAIL_VERIFICATION',
      expiresAt,
      verified: false,
      attempts: 0
    });

    await otpRecord.save();

    // Send OTP email
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Welcome to School Admission CRM</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Email Verification</h2>
            <p style="color: #666; line-height: 1.6;">Thank you for signing up with <strong>${name}</strong>. Please use the following One-Time Password (OTP) to verify your email address:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #667eea;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #667eea;">${plainOTP}</span>
            </div>
            
            <p style="color: #666; line-height: 1.6;">This OTP will expire in <strong>10 minutes</strong>.</p>
            <p style="color: #666; line-height: 1.6;">If you didn't request this OTP, please ignore this email.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="color: #999; font-size: 12px; margin: 0;">Need help? Contact us at support@schooladmissioncrm.com</p>
            </div>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `"School Admission CRM" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `Verify Your Email - ${name}`,
        html: htmlContent
      });
    } catch (mailError) {
      console.warn('Nodemailer error (continuing registration):', mailError.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email for OTP verification.',
      email: email,
      requiresVerification: true
    });
  } catch (error) {
    console.error('Signup error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      errors: error.errors
    });
    return res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// @desc    Unified Login for Super Admin & School Admin
// @route   POST /api/v1/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate request
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // 1. First check if SuperAdmin exists with this email
    const superAdmin = await SuperAdmin.findOne({ email }).select('+password');
    if (superAdmin) {
      if (!superAdmin.isActive) {
        return res.status(401).json({ success: false, message: 'Account is deactivated' });
      }

      const isPasswordMatch = await superAdmin.comparePassword(password);
      if (isPasswordMatch) {
        superAdmin.lastLogin = Date.now();
        await superAdmin.save();

        const token = generateToken(superAdmin._id, 'super-admin');
        return res.json({
          success: true,
          token,
          role: 'super-admin',
          user: {
            id: superAdmin._id,
            name: superAdmin.name,
            email: superAdmin.email,
            role: 'super-admin',
          },
          school: null,
        });
      } else {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
    }

    // 2. If not SuperAdmin, check School collection
    const school = await School.findOne({ email });
    if (school && (await school.comparePassword(password))) {
      // Check if email is verified
      if (!school.emailVerified) {
        return res.status(403).json({ 
          success: false, 
          message: 'Email not verified. Please verify your email to login.',
          requiresVerification: true,
          email: email
        });
      }

      const token = generateToken(school._id, 'school-admin');
      return res.json({
        success: true,
        token,
        role: school.role || 'school-admin',
        user: {
          id: school._id,
          name: school.name,
          email: school.email,
          role: school.role || 'school-admin',
          institutionType: school.institutionType || 'school',
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
          logo: school.logo,
          thankYouCms: school.thankYouCms,
          settings: school.settings,
          communicationTemplates: school.communicationTemplates,
          institutionType: school.institutionType || 'school',
        },
      });
    }

    return res.status(401).json({ success: false, message: 'Invalid email or password' });
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
    const { schoolId } = req.params;
    let school = null;

    if (mongoose.Types.ObjectId.isValid(schoolId)) {
      school = await School.findById(schoolId).select('name logo tagline website phone email admissionEmail address city state pincode universityAffiliation collegeType thankYouCms qrBranding institutionType');
    }

    if (!school) {
      school = await School.findOne({
        $or: [
          { code: schoolId },
          { slug: schoolId }
        ]
      }).select('name logo tagline website phone email admissionEmail address city state pincode universityAffiliation collegeType thankYouCms qrBranding institutionType');
    }

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

// @desc    Reset password
// @route   POST /api/v1/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate request
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Find school by email
    const school = await School.findOne({ email });
    if (!school) {
      return res.status(404).json({ success: false, message: 'Email not registered' });
    }

    // Update password
    school.password = password;
    await school.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error during password reset' });
  }
};

// @desc    Google OAuth Login / Signup
// @route   POST /api/v1/auth/google
// @access  Public
const googleLogin = async (req, res) => {
  try {
    const { idToken, credential, access_token } = req.body;
    const tokenToVerify = idToken || credential;

    if (!tokenToVerify && !access_token) {
      return res.status(400).json({ success: false, message: 'Google authentication credential or access_token is required' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    let payload = null;

    if (access_token) {
      // Fetch verified user profile directly from Google UserInfo API
      try {
        const googleRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        payload = googleRes.data;
      } catch (err) {
        console.error('Google UserInfo API fetch failed:', err.response?.data || err.message);
        return res.status(401).json({ success: false, message: 'Invalid or expired Google access token' });
      }
    } else if (tokenToVerify) {
      if (clientId) {
        try {
          const client = new OAuth2Client(clientId);
          const ticket = await client.verifyIdToken({
            idToken: tokenToVerify,
            audience: clientId,
          });
          payload = ticket.getPayload();
        } catch (verifyError) {
          console.warn('Google ID Token verification with GOOGLE_CLIENT_ID failed, trying token decode:', verifyError.message);
          const jwt = require('jsonwebtoken');
          payload = jwt.decode(tokenToVerify);
        }
      } else {
        const jwt = require('jsonwebtoken');
        payload = jwt.decode(tokenToVerify);
      }
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ success: false, message: 'Invalid or unreadable Google profile payload' });
    }

    const { email, name, picture } = payload;
    const normalizedEmail = email.toLowerCase();

    // 1. First check if SuperAdmin exists with this email
    const superAdmin = await SuperAdmin.findOne({ email: normalizedEmail });
    if (superAdmin) {
      if (!superAdmin.isActive) {
        return res.status(401).json({ success: false, message: 'Account is deactivated' });
      }

      superAdmin.lastLogin = Date.now();
      await superAdmin.save();

      const token = generateToken(superAdmin._id, 'super-admin');
      return res.json({
        success: true,
        message: 'Super Admin Google login successful',
        token,
        role: 'super-admin',
        user: {
          id: superAdmin._id,
          name: superAdmin.name,
          email: superAdmin.email,
          role: 'super-admin',
        },
        school: null,
      });
    }

    // 2. Check if School already exists
    let school = await School.findOne({ email: normalizedEmail });

    if (!school) {
      // New Google User: DO NOT create a dummy School record!
      // Return verified Google identity data so frontend can pre-fill Signup form
      return res.json({
        success: true,
        isRegistered: false,
        message: 'Google identity verified. Please complete your school registration.',
        googleData: {
          adminName: name || '',
          email: normalizedEmail,
          googleVerified: true,
        },
      });
    }

    // Existing School User: Log in directly
    if (!school.emailVerified) {
      school.emailVerified = true;
      await school.save();
    }

    // Generate JWT token
    const token = generateToken(school._id, 'school-admin');

    return res.json({
      success: true,
      isRegistered: true,
      message: 'Google login successful',
      token,
      role: school.role || 'school-admin',
      user: {
        id: school._id,
        name: school.name,
        email: school.email,
        role: school.role || 'school-admin',
        institutionType: school.institutionType || 'school',
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
        logo: school.logo,
        thankYouCms: school.thankYouCms,
        settings: school.settings,
        communicationTemplates: school.communicationTemplates,
        institutionType: school.institutionType || 'school',
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during Google authentication: ' + error.message, stack: error.stack });
  }
};

module.exports = {
  signup,
  login,
  getMe,
  getPublicSchoolInfo,
  resetPassword,
  googleLogin,
};


