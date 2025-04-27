// Service for JWT token generation and validation
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'changeme';

function generateToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '1h' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (e) {
    return null;
  }
}

module.exports = {
  generateToken,
  verifyToken
};
