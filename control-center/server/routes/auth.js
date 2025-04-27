/**
 * Authentication routes
 * Handles user authentication, registration, and password management
 */

const express = require('express');
const router = express.Router();
const { ApiError } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');
const { 
  validateLogin, 
  validateRegistration,
  validatePasswordReset,
  validatePasswordUpdate,
  formatValidationErrors
} = require('../utils/validators');
const {
  hashPassword,
  verifyPassword,
  generateToken,
  generateJWT,
  hashString
} = require('../utils/helpers');
const { Membership, Invitation } = require('../models');

/**
 * Environment configuration
 */
const JWT_SECRET = process.env.JWT_SECRET || 'nexus-control-center-secret';

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user with invitation code
 * @access  Public
 */
router.post('/register', async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = validateRegistration(req.body);
    
    if (error) {
      const errors = formatValidationErrors(error);
      throw new ApiError('Validation failed', 400, errors);
    }
    
    const { email, password, name, invitationCode, pin } = value;
    
    // Check if invitation exists and is valid
    const invitation = await Invitation.findOne({ 
      invitationCode,
      email,
      used: false,
      expiresAt: { $gt: new Date() }
    });
    
    if (!invitation) {
      throw new ApiError('Invalid or expired invitation code', 400);
    }
    
    // Verify PIN
    const hashedPin = hashString(pin);
    if (hashedPin !== invitation.hashedPin) {
      throw new ApiError('Invalid PIN', 400);
    }
    
    // Check if user already exists
    const existingUser = await Membership.findOne({ email });
    
    if (existingUser) {
      throw new ApiError('User already exists', 409);
    }
    
    // Hash password
    const { hash, salt } = await hashPassword(password);
    
    // Create membership key
    const membershipKey = generateToken(16);
    
    // Create new user
    const user = await Membership.create({
      email,
      name,
      passwordHash: hash,
      passwordSalt: salt,
      membershipKey,
      permissions: invitation.permissions || ['user'],
      invitedBy: invitation.createdBy,
      lastLogin: new Date(),
      active: true
    });
    
    // Mark invitation as used
    invitation.used = true;
    await invitation.save();
    
    // Generate JWT token
    const token = generateJWT(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    // Return user data and token
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          permissions: user.permissions
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
router.post('/login', async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = validateLogin(req.body);
    
    if (error) {
      const errors = formatValidationErrors(error);
      throw new ApiError('Validation failed', 400, errors);
    }
    
    const { email, password } = value;
    
    // Find user
    const user = await Membership.findOne({ email });
    
    if (!user) {
      throw new ApiError('Invalid credentials', 401);
    }
    
    if (!user.active) {
      throw new ApiError('Account is inactive', 403);
    }
    
    // Verify password
    const isPasswordValid = await verifyPassword(
      password,
      user.passwordHash,
      user.passwordSalt
    );
    
    if (!isPasswordValid) {
      throw new ApiError('Invalid credentials', 401);
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate JWT token
    const token = generateJWT(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    // Return user data and token
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          permissions: user.permissions
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = req.user;
    
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          permissions: user.permissions,
          modules: user.modules,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = validatePasswordReset(req.body);
    
    if (error) {
      const errors = formatValidationErrors(error);
      throw new ApiError('Validation failed', 400, errors);
    }
    
    const { email } = value;
    
    // Find user
    const user = await Membership.findOne({ email });
    
    // Don't reveal if user exists or not
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link'
      });
    }
    
    if (!user.active) {
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link'
      });
    }
    
    // Generate reset token
    const resetToken = generateToken(32);
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
    
    // Store reset token
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();
    
    // Send email with reset token
    const emailService = require('../services/email');
    await emailService.sendPasswordResetEmail(user, resetToken);
    
    res.status(200).json({
      success: true,
      message: 'If your email is registered, you will receive a password reset link'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = validatePasswordUpdate(req.body);
    
    if (error) {
      const errors = formatValidationErrors(error);
      throw new ApiError('Validation failed', 400, errors);
    }
    
    const { token, password } = value;
    
    // Find user with valid reset token
    const user = await Membership.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });
    
    if (!user) {
      throw new ApiError('Invalid or expired reset token', 400);
    }
    
    // Hash new password
    const { hash, salt } = await hashPassword(password);
    
    // Update user password
    user.passwordHash = hash;
    user.passwordSalt = salt;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side)
 * @access  Public
 */
router.post('/logout', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
