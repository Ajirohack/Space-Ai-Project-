/**
 * Invitation Routes
 * API endpoints for invitation management
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const invitationService = require('../services/invitation');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

/**
 * @route POST /api/invitations
 * @desc Create a new invitation
 * @access Private (authenticated users)
 */
router.post(
  '/',
  authenticate,
  [
    body('email')
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    body('permissions')
      .optional()
      .isArray()
      .withMessage('Permissions must be an array'),
    body('permissions.*')
      .optional()
      .isIn(['admin', 'user', 'module_access', 'premium_models'])
      .withMessage('Invalid permission value'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object')
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, permissions, metadata } = req.body;
      const result = await invitationService.createInvitation(
        { email, permissions, metadata },
        req.user.id
      );

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/invitations
 * @desc Get invitations created by the user
 * @access Private (authenticated users)
 */
router.get(
  '/',
  authenticate,
  [
    query('active')
      .optional()
      .isBoolean()
      .withMessage('Active must be a boolean')
      .toBoolean()
  ],
  validate,
  async (req, res, next) => {
    try {
      const onlyActive = req.query.active === true;
      const invitations = await invitationService.listInvitations(req.user.id, { onlyActive });

      res.json({
        success: true,
        count: invitations.length,
        data: invitations
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/invitations/stats
 * @desc Get invitation statistics for current user
 * @access Private (authenticated users)
 */
router.get(
  '/stats',
  authenticate,
  async (req, res, next) => {
    try {
      const stats = await invitationService.getInvitationStats(req.user.id);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/invitations/verify
 * @desc Verify an invitation code and PIN
 * @access Public
 */
router.post(
  '/verify',
  [
    body('code')
      .notEmpty()
      .withMessage('Invitation code is required')
      .trim()
      .isLength({ min: 6, max: 12 })
      .withMessage('Invalid code format'),
    body('pin')
      .notEmpty()
      .withMessage('PIN is required')
      .trim()
      .isLength({ min: 6, max: 6 })
      .withMessage('PIN must be 6 digits')
      .isNumeric()
      .withMessage('PIN must contain only numbers')
  ],
  validate,
  async (req, res, next) => {
    try {
      const { code, pin } = req.body;
      const invitation = await invitationService.verifyInvitation(code, pin);

      // Don't return the hashed PIN
      const { hashedPin, ...invitationData } = invitation.toObject();

      res.json({
        success: true,
        data: invitationData
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/invitations/accept
 * @desc Accept an invitation and create a user account
 * @access Public
 */
router.post(
  '/accept',
  [
    body('invitationCode')
      .notEmpty()
      .withMessage('Invitation code is required')
      .trim()
      .isLength({ min: 6, max: 12 })
      .withMessage('Invalid code format'),
    body('pin')
      .notEmpty()
      .withMessage('PIN is required')
      .trim()
      .isLength({ min: 6, max: 6 })
      .withMessage('PIN must be 6 digits')
      .isNumeric()
      .withMessage('PIN must contain only numbers'),
    body('name')
      .notEmpty()
      .withMessage('Name is required')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).*$/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
  ],
  validate,
  async (req, res, next) => {
    try {
      const { invitationCode, pin, name, password } = req.body;
      const user = await invitationService.acceptInvitation({
        invitationCode,
        pin,
        name,
        password
      });

      res.status(201).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/invitations/:id
 * @desc Revoke (delete) an invitation
 * @access Private (authenticated users)
 */
router.delete(
  '/:id',
  authenticate,
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid invitation ID')
  ],
  validate,
  async (req, res, next) => {
    try {
      const success = await invitationService.revokeInvitation(req.params.id, req.user.id);

      res.json({
        success,
        message: 'Invitation revoked successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;