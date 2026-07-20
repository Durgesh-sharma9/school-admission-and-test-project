const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_crm_jwt_token_key_123!';

// Protect routes - verify Super Admin token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Check if user is super admin
      if (decoded.role !== 'super-admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Super Admin only.',
        });
      }

      req.superAdmin = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token',
    });
  }
};

module.exports = { protect };
