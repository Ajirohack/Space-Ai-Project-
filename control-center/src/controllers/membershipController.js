// Handles membership key generation and validationconst membershipKeyService = require('../services/membershipKeyService');
module.exports = {
  // Admin: Create a new membership key
  async createMembershipKey(req, res) {
    try {
      // You may want to check admin permissions here
      const { expiresAt } = req.body;
      const createdBy = req.user ? req.user._id : null; // assuming req.user is set by auth middleware
      const membershipKey = await membershipKeyService.generateMembershipKey({ createdBy, expiresAt });
      res.status(201).json({ key: membershipKey.key, expiresAt: membershipKey.expiresAt });
    } catch (err) {
      res.status(500).json({ message: 'Error creating membership key', error: err.message });
    }
  },

  // Public: Validate a membership key
  async validateMembershipKey(req, res) {
    try {
      const { key } = req.body;
      const result = await membershipKeyService.validateMembershipKey(key);
      if (!result.valid) {
        return res.status(400).json({ valid: false, reason: result.reason });
      }
      res.json({ valid: true });
    } catch (err) {
      res.status(500).json({ message: 'Error validating membership key', error: err.message });
    }
  },
};
