// Service for PIN-based authentication
const User = require('../models/user');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Generate a random PIN (e.g., 6 digits)
function generatePin() {
  return ('' + Math.floor(100000 + Math.random() * 900000));
}

// Set a PIN for a user (hashed)
async function setPin(userId, pin) {
  const pinHash = await bcrypt.hash(pin, 10);
  await User.findByIdAndUpdate(userId, { pin: pinHash });
}

// Verify a user's PIN
async function verifyPin(userId, pin) {
  const user = await User.findById(userId);
  if (!user || !user.pin) return false;
  return bcrypt.compare(pin, user.pin);
}

// Request a PIN (for login/verification)
async function requestPin(userId) {
  const pin = generatePin();
  await setPin(userId, pin);
  // In production, send the PIN via email/SMS here
  return pin;
}

module.exports = {
  setPin,
  verifyPin,
  requestPin,
  generatePin,
};
