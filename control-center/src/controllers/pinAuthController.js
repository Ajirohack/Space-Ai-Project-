// Handles PIN-based authenticationconst pinAuthService = require('../services/pinAuthService');
const User = require('../models/user');
module.exports = {
  // Request a PIN (e.g., for login or verification)
  async requestPin(req, res) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: 'User not found' });
      const pin = await pinAuthService.requestPin(user._id);
      // In production, send the PIN via email/SMS. Here, return for demo/testing.
      res.json({ message: 'PIN generated', pin });
    } catch (err) {
      res.status(500).json({ message: 'Error generating PIN', error: err.message });
    }
  },

  // Verify a PIN
  async verifyPin(req, res) {
    try {
      const { email, pin } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: 'User not found' });
      const valid = await pinAuthService.verifyPin(user._id, pin);
      if (!valid) return res.status(401).json({ message: 'Invalid PIN' });
      // Optionally, issue a JWT or session here
      res.json({ message: 'PIN verified', userId: user._id });
    } catch (err) {
      res.status(500).json({ message: 'Error verifying PIN', error: err.message });
    }
  },
};
