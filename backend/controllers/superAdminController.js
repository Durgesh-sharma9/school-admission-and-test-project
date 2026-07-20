const SuperAdmin = require('../models/SuperAdmin');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_crm_jwt_token_key_123!';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id, role: 'super-admin' }, JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Login Super Admin
// @route   POST /api/v1/super-admin/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const superAdmin = await SuperAdmin.findOne({ email }).select('+password');

    if (!superAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (!superAdmin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    const isPasswordMatch = await superAdmin.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Update last login
    superAdmin.lastLogin = Date.now();
    await superAdmin.save();

    const token = generateToken(superAdmin._id);

    res.status(200).json({
      success: true,
      token,
      data: {
        id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get current Super Admin
// @route   GET /api/v1/super-admin/me
// @access  Private (Super Admin)
const getMe = async (req, res) => {
  try {
    const superAdmin = await SuperAdmin.findById(req.superAdmin.id);

    res.status(200).json({
      success: true,
      data: {
        id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
        lastLogin: superAdmin.lastLogin,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update Super Admin profile
// @route   PUT /api/v1/super-admin/profile
// @access  Private (Super Admin)
const updateProfile = async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;

    const superAdmin = await SuperAdmin.findById(req.superAdmin.id).select('+password');

    if (name) superAdmin.name = name;
    if (email) superAdmin.email = email;

    // Update password if provided
    if (currentPassword && newPassword) {
      const isPasswordMatch = await superAdmin.comparePassword(currentPassword);
      if (!isPasswordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }
      superAdmin.password = newPassword;
    }

    await superAdmin.save();

    res.status(200).json({
      success: true,
      data: {
        id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  login,
  getMe,
  updateProfile,
};
