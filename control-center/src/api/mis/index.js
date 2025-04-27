/**
 * MIS API Routes
 * Handles all Membership Initiation System API routes
 */
const express = require('express');
const router = express.Router();
const misController = require('../../controllers/misController');
const authMiddleware = require('../../middleware/authMiddleware');
const { requirePermission } = require('../../middleware/permissionMiddleware');
const validateApiKey = require('../../middleware/apiKeyMiddleware');

/**
 * @route   POST /api/mis/invitations
 * @desc    Create a new invitation
 * @access  Private/Admin
 */
router.post(
  '/invitations',
  authMiddleware,
  requirePermission('admin'),
  misController.createInvitation
);

/**
 * @route   POST /api/mis/invitations/validate
 * @desc    Validate invitation code
 * @access  Public
 */
router.post('/invitations/validate', misController.validateInvitation);

/**
 * @route   POST /api/mis/invitations/sync
 * @desc    Sync invitation from MIS
 * @access  Private (API Key)
 */
router.post('/invitations/sync', validateApiKey, misController.syncInvitation);

/**
 * @route   POST /api/mis/onboarding
 * @desc    Submit onboarding information
 * @access  Public
 */
router.post('/onboarding', misController.submitOnboarding);

/**
 * @route   POST /api/mis/memberships/validate
 * @desc    Validate membership key
 * @access  Public
 */
router.post('/memberships/validate', misController.validateMembershipKey);

/**
 * @route   POST /api/mis/memberships/approve
 * @desc    Approve or reject membership
 * @access  Private/Admin
 */
router.post(
  '/memberships/approve',
  authMiddleware,
  requirePermission('admin'),
  misController.approveMembership
);

/**
 * @route   POST /api/mis/memberships/approve/notify
 * @desc    Notify about approved membership from MIS
 * @access  Private (API Key)
 */
router.post('/memberships/approve/notify', validateApiKey, misController.notifyMembershipApproved);

/**
 * @route   GET /api/mis/memberships/status/:email
 * @desc    Get membership status for an email
 * @access  Private/Admin
 */
router.get(
  '/memberships/status/:email',
  authMiddleware,
  requirePermission('admin'),
  misController.getMembershipStatus
);

module.exports = router;
