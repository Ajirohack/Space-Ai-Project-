const express = require('express');
const router = express.Router();

const invitationController = require('../../controllers/invitationController');
const membershipController = require('../../controllers/membershipController');
const pinAuthController = require('../../controllers/pinAuthController');
const jwtController = require('../../controllers/jwtController');
const userController = require('../../controllers/userController');
const authMiddleware = require('../../middleware/authMiddleware');
const permissionMiddleware = require('../../middleware/permissionMiddleware');

// Invitation code endpoints
router.post('/invite', invitationController.createInvitationCode);
router.post('/invite/validate', invitationController.validateInvitationCode);

// Membership key endpoints
// Admin: create membership key (should be protected in production)
router.post('/membership-key', membershipController.createMembershipKey);
// Public: validate membership key
router.post('/membership-key/validate', membershipController.validateMembershipKey);

// PIN-based authentication endpoints
// Request a PIN (user provides email)
router.post('/pin/request', pinAuthController.requestPin);
// Verify a PIN (user provides email and pin)
router.post('/pin/verify', pinAuthController.verifyPin);

// JWT authentication endpoints
router.post('/login', jwtController.login);
router.post('/token/refresh', jwtController.refreshToken);

// User management endpoints (protected)
router.get('/me', authMiddleware, userController.getMe);
router.post('/logout', authMiddleware, userController.logout);

module.exports = router;
