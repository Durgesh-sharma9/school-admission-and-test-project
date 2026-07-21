const jwt = require('jsonwebtoken');
const School = require('../models/School');
const SuperAdmin = require('../models/SuperAdmin');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_crm_jwt_token_key_123!');

      // Get school from the token
      req.school = await School.findById(decoded.id).select('-password');
      
      if (!req.school) {
        return res.status(401).json({ success: false, message: 'Not authorized, school not found' });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

const protectSuperAdmin = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_crm_jwt_token_key_123!');

      // Get super admin from the token
      req.superAdmin = await SuperAdmin.findById(decoded.id).select('-password');
      
      if (!req.superAdmin) {
        return res.status(401).json({ success: false, message: 'Not authorized, super admin not found' });
      }

      if (!req.superAdmin.isActive) {
        return res.status(401).json({ success: false, message: 'Super admin account is deactivated' });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

module.exports = { protect, protectSuperAdmin };
