const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_crm_jwt_token_key_123!';

const generateToken = (id, role = 'school-admin') => {
  return jwt.sign({ id, role }, JWT_SECRET, {
    expiresIn: '7d',
  });
};

module.exports = generateToken;
