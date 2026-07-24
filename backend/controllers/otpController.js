const OTP = require('../models/OTP');
const School = require('../models/School');
const generateToken = require('../utils/generateToken');
const nodemailer = require('nodemailer');

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Generate and send OTP
exports.sendOTP = async (req, res) => {
  try {
    const { email, purpose } = req.body;

    // Validate email
    if (!email || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Email and purpose are required'
      });
    }

    // Validate purpose
    if (!['EMAIL_VERIFICATION', 'PASSWORD_RESET'].includes(purpose)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purpose'
      });
    }

    // Check if email exists for EMAIL_VERIFICATION
    if (purpose === 'EMAIL_VERIFICATION') {
      const school = await School.findOne({ email });
      if (!school) {
        return res.status(404).json({
          success: false,
          message: 'Email not registered'
        });
      }
    }

    // Check if email exists for PASSWORD_RESET
    if (purpose === 'PASSWORD_RESET') {
      const school = await School.findOne({ email });
      if (!school) {
        return res.status(404).json({
          success: false,
          message: 'Email not registered'
        });
      }
      if (school.authProvider === 'google' || !school.password) {
        return res.status(400).json({
          success: false,
          isGoogleUser: true,
          message: 'This account uses Google Sign-In. Please continue using Google Login.'
        });
      }
    }

    // Check rate limiting - prevent OTP spam (relaxed in development)
    const isDevelopment = process.env.NODE_ENV === 'development';
    const rateLimitSeconds = isDevelopment ? 5 : 60; // 5 seconds in dev, 60 seconds in production
    
    const recentOTP = await OTP.findOne({
      email,
      purpose,
      createdAt: { $gte: new Date(Date.now() - rateLimitSeconds * 1000) }
    });

    if (recentOTP) {
      return res.status(429).json({
        success: false,
        message: `Please wait ${rateLimitSeconds} seconds before requesting another OTP`
      });
    }

    // Invalidate any existing unverified OTPs for this email and purpose
    await OTP.updateMany(
      { email, purpose, verified: false },
      { verified: true }
    );

    // Generate new OTP
    const plainOTP = OTP.generateOTP();
    const hashedOTP = OTP.hashOTP(plainOTP);

    // Calculate expiry (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save OTP to database
    const otpRecord = new OTP({
      email,
      otp: hashedOTP,
      purpose,
      expiresAt,
      verified: false,
      attempts: 0
    });

    await otpRecord.save();

    // Send email
    const school = await School.findOne({ email });
    const schoolName = school ? school.name : 'School';

    let subject, htmlContent;

    if (purpose === 'EMAIL_VERIFICATION') {
      subject = `Verify Your Email - ${schoolName}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Welcome to School Admission CRM</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Email Verification</h2>
            <p style="color: #666; line-height: 1.6;">Thank you for signing up with <strong>${schoolName}</strong>. Please use the following One-Time Password (OTP) to verify your email address:</p>
            
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
    } else if (purpose === 'PASSWORD_RESET') {
      subject = `Reset Your Password - ${schoolName}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">School Admission CRM</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Password Reset</h2>
            <p style="color: #666; line-height: 1.6;">We received a request to reset your password for <strong>${schoolName}</strong>. Please use the following One-Time Password (OTP) to proceed:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #667eea;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #667eea;">${plainOTP}</span>
            </div>
            
            <p style="color: #666; line-height: 1.6;">This OTP will expire in <strong>10 minutes</strong>.</p>
            <p style="color: #666; line-height: 1.6;">If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="color: #999; font-size: 12px; margin: 0;">Need help? Contact us at support@schooladmissioncrm.com</p>
            </div>
          </div>
        </div>
      `;
    }

    await transporter.sendMail({
      from: `"School Admission CRM" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      html: htmlContent
    });

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully'
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp, purpose } = req.body;

    // Validate input
    if (!email || !otp || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and purpose are required'
      });
    }

    // Find valid OTP
    const otpRecord = await OTP.findOne({
      email,
      purpose,
      verified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please request a new OTP.'
      });
    }

    // Verify OTP
    const verificationResult = otpRecord.verifyOTP(otp);
    await otpRecord.save();

    if (!verificationResult.valid) {
      return res.status(400).json({
        success: false,
        message: verificationResult.message
      });
    }

    // If email verification, mark school email as verified
    let schoolData = null;
    let token = null;

    if (purpose === 'EMAIL_VERIFICATION') {
      const school = await School.findOneAndUpdate(
        { email },
        { emailVerified: true },
        { new: true }
      );

      if (school) {
        token = generateToken(school._id, 'school-admin');
        schoolData = {
          id: school._id,
          name: school.name,
          email: school.email,
          phone: school.phone,
          address: school.address,
          role: school.role || 'school-admin',
          qrCodeUrl: school.qrCodeUrl,
          admissionFormLink: school.admissionFormLink,
          subscription: school.subscription,
          logo: school.logo,
          thankYouCms: school.thankYouCms,
          settings: school.settings,
          communicationTemplates: school.communicationTemplates,
          institutionType: school.institutionType || 'school',
        };
      }
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      token,
      role: schoolData?.role || 'school-admin',
      user: schoolData ? { 
        id: schoolData.id, 
        name: schoolData.name, 
        email: schoolData.email, 
        role: schoolData.role,
        institutionType: schoolData.institutionType 
      } : null,
      school: schoolData
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
};

// Resend OTP
exports.resendOTP = async (req, res) => {
  try {
    const { email, purpose } = req.body;

    // Validate input
    if (!email || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Email and purpose are required'
      });
    }

    // Check rate limiting (relaxed in development)
    const isDevelopment = process.env.NODE_ENV === 'development';
    const rateLimitSeconds = isDevelopment ? 5 : 60; // 5 seconds in dev, 60 seconds in production
    
    const recentOTP = await OTP.findOne({
      email,
      purpose,
      createdAt: { $gte: new Date(Date.now() - rateLimitSeconds * 1000) }
    });

    if (recentOTP) {
      return res.status(429).json({
        success: false,
        message: `Please wait ${rateLimitSeconds} seconds before requesting another OTP`
      });
    }

    // Invalidate existing OTPs
    await OTP.updateMany(
      { email, purpose, verified: false },
      { verified: true }
    );

    // Generate and send new OTP
    req.body = { email, purpose }; // Reuse sendOTP logic
    return exports.sendOTP(req, res);

  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP'
    });
  }
};
