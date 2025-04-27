// Utility to generate a random string
const crypto = require('crypto');

function generateRandomString(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

module.exports = generateRandomString;
