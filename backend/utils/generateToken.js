const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

const generateToken = (id, role = 'school-admin') => {
  return jwt.sign({ id, role }, JWT_SECRET, {
    expiresIn: '7d',
  });
};

module.exports = generateToken;
