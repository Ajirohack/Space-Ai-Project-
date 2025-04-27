/**
 * MIS (Membership Initiation System) Routes
 * Handles all MIS-related endpoints including invitations and membership management
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { validateInvitation, verifyMembershipKey } = require('../middleware/auth');
const { authenticateJWT } = require('../middleware/auth');

// Validate invitation code
router.post(
  '/invitations/validate',
  body('invitationCode').isString().trim().isLength({ min: 6, max: 12 }),
  validateInvitation,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }
    // At this point invitation is already validated by middleware
    res.json({
      success: true,
      invitation: req.invitation,
    });
  }
);

// Create new invitation (admin only)
router.post(
  '/invitations/create',
  authenticateJWT,
  body('email').isEmail(),
  body('role').isString().isIn(['user', 'admin']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    try {
      const response = await fetch(`${process.env.MIS_API_URL}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.MIS_API_KEY}`,
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();
      res.status(response.ok ? 201 : 400).json(data);
    } catch (err) {
      console.error('Create invitation error:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to create invitation',
      });
    }
  }
);

// Validate membership key
router.post(
  '/memberships/validate',
  body('membershipKey').isString().trim().isLength({ min: 32, max: 64 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    try {
      const response = await fetch(`${process.env.MIS_API_URL}/memberships/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.MIS_API_KEY}`,
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();
      res.status(response.ok ? 200 : 403).json(data);
    } catch (err) {
      console.error('Validate membership error:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to validate membership key',
      });
    }
  }
);

// Get membership status
router.get('/memberships/:membershipKey', verifyMembershipKey, async (req, res) => {
  try {
    const response = await fetch(
      `${process.env.MIS_API_URL}/memberships/${req.params.membershipKey}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MIS_API_KEY}`,
        },
      }
    );

    const data = await response.json();
    res.status(response.ok ? 200 : 404).json(data);
  } catch (err) {
    console.error('Get membership error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get membership status',
    });
  }
});

module.exports = router;
