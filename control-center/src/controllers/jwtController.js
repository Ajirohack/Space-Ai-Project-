// Handles JWT-based authentication
const jwtService = require('../services/jwtService');
const User = require('../models/user');

module.exports = {
  // Login: issue JWT (for demo, using email+password)
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: 'User not found' });
      // For demo: assume user.password is hashed with bcrypt
      const bcrypt = require('bcrypt');
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
      const token = jwtService.generateToken({ userId: user._id, email: user.email });
      res.json({ token });
    } catch (err) {
      res.status(500).json({ message: 'Error logging in', error: err.message });
    }
  },

  // Refresh JWT token (for demo, just re-issue if valid)
  async refreshToken(req, res) {
    try {
      const { token } = req.body;
      const payload = jwtService.verifyToken(token);
      if (!payload) return res.status(401).json({ message: 'Invalid token' });
      // Optionally, check if user still exists, etc.
      const newToken = jwtService.generateToken({ userId: payload.userId, email: payload.email });
      res.json({ token: newToken });
    } catch (err) {
      res.status(500).json({ message: 'Error refreshing token', error: err.message });
    }
  },
};
