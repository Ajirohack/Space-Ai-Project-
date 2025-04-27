// Handles invitation code creation and validationconst invitationService = require('../services/invitationService');
module.exports = {
  // Admin creates an invitation code for a user
  async createInvitationCode(req, res) {
    try {
      // Only allow admins (assume middleware or check req.user.role)
      // For now, just proceed
      const { email, expiresInHours, role } = req.body;
      if (!email) return res.status(400).json({ message: 'Email is required' });
      const code = await invitationService.createInvitationCode({
        email,
        createdBy: req.user ? req.user._id : null, // If using auth
        expiresInHours,
        role
      });
      res.status(201).json({ invitationCode: code });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Validate invitation code (for registration)
  async validateInvitationCode(req, res) {
    try {
      const { email, invitationCode } = req.body;
      if (!email || !invitationCode) {
        return res.status(400).json({ message: 'Email and invitationCode are required' });
      }
      const valid = await invitationService.validateInvitationCode({ email, invitationCode });
      if (!valid) {
        return res.status(400).json({ message: 'Invalid or expired invitation code' });
      }
      res.status(200).json({ valid: true });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};
