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
 * @route   GET /api/mis/stats
 * @desc    Get MIS statistics
 * @access  Private/Admin
 */
router.get('/stats', authMiddleware, requirePermission('admin'), misController.getStats);

/**
 * @route   POST /api/mis/sync
 * @desc    Trigger full sync between Control Center and MIS
 * @access  Private/Admin
 */
router.post('/sync', authMiddleware, requirePermission('admin'), misController.triggerSync);

// === Invitations ===

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
 * @route   POST /api/mis/invitations/bulk
 * @desc    Create multiple invitations
 * @access  Private/Admin
 */
router.post(
  '/invitations/bulk',
  authMiddleware,
  requirePermission('admin'),
  misController.createBulkInvitations
);

/**
 * @route   GET /api/mis/invitations
 * @desc    Get all invitations
 * @access  Private/Admin
 */
router.get(
  '/invitations',
  authMiddleware,
  requirePermission('admin'),
  misController.getInvitations
);

/**
 * @route   POST /api/mis/invitations/validate
 * @desc    Validate invitation code
 * @access  Public
 */
router.post('/invitations/validate', misController.validateInvitation);

/**
 * @route   POST /api/mis/invitations/:invitationCode/resend
 * @desc    Resend invitation email
 * @access  Private/Admin
 */
router.post(
  '/invitations/:invitationCode/resend',
  authMiddleware,
  requirePermission('admin'),
  misController.resendInvitation
);

/**
 * @route   POST /api/mis/invitations/sync
 * @desc    Sync invitation from MIS
 * @access  Private (API Key)
 */
router.post('/invitations/sync', validateApiKey, misController.syncInvitation);

// === Onboarding ===

/**
 * @route   POST /api/mis/onboarding
 * @desc    Submit onboarding information
 * @access  Public
 */
router.post('/onboarding', misController.submitOnboarding);

/**
 * @route   GET /api/mis/onboarding
 * @desc    Get all onboarding submissions
 * @access  Private/Admin
 */
router.get(
  '/onboarding',
  authMiddleware,
  requirePermission('admin'),
  misController.getOnboardingSubmissions
);

/**
 * @route   GET /api/mis/onboarding/:invitationCode
 * @desc    Get onboarding details for an invitation
 * @access  Private/Admin
 */
router.get(
  '/onboarding/:invitationCode',
  authMiddleware,
  requirePermission('admin'),
  misController.getOnboardingDetail
);

// === Memberships ===

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
 * @route   GET /api/mis/memberships
 * @desc    Get all memberships
 * @access  Private/Admin
 */
router.get(
  '/memberships',
  authMiddleware,
  requirePermission('admin'),
  misController.getMemberships
);

/**
 * @route   GET /api/mis/memberships/export
 * @desc    Export memberships as CSV
 * @access  Private/Admin
 */
router.get(
  '/memberships/export',
  authMiddleware,
  requirePermission('admin'),
  misController.exportMemberships
);

/**
 * @route   GET /api/mis/memberships/:membershipKey
 * @desc    Get membership details
 * @access  Private/Admin
 */
router.get(
  '/memberships/:membershipKey',
  authMiddleware,
  requirePermission('admin'),
  misController.getMembershipDetail
);

/**
 * @route   PUT /api/mis/memberships/:membershipKey/permissions
 * @desc    Update membership permissions
 * @access  Private/Admin
 */
router.put(
  '/memberships/:membershipKey/permissions',
  authMiddleware,
  requirePermission('admin'),
  misController.updateMembershipPermissions
);

/**
 * @route   POST /api/mis/memberships/revoke
 * @desc    Revoke a membership
 * @access  Private/Admin
 */
router.post(
  '/memberships/revoke',
  authMiddleware,
  requirePermission('admin'),
  misController.revokeMembership
);

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
