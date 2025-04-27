/**
 * User routes
 * Handles user profile management and preferences
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { ApiError } = require('../middleware/errorHandler');
const { 
  validatePagination,
  formatValidationErrors,
  isValidObjectId
} = require('../utils/validators');
const { getPagination, hashPassword, verifyPassword } = require('../utils/helpers');
const { Membership, AuditLog } = require('../models');

/**
 * @route   GET /api/users
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 */
router.get('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    // Validate pagination parameters
    const { value } = validatePagination(req.query);
    const { page, limit, sort } = value;
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get total count
    const total = await Membership.countDocuments();
    
    // Get users with pagination
    const users = await Membership.find()
      .sort(sort || '-createdAt')
      .skip(skip)
      .limit(limit)
      .select('email name permissions lastLogin active createdAt');
    
    // Generate pagination info
    const pagination = getPagination(total, page, limit);
    
    res.status(200).json({
      success: true,
      data: {
        users,
        pagination
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID (admin or self)
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!isValidObjectId(id)) {
      throw new ApiError('Invalid user ID', 400);
    }
    
    // Check if user is requesting their own profile or is an admin
    const isSelf = req.user._id.toString() === id;
    const isAdmin = req.user.permissions.includes('admin');
    
    if (!isSelf && !isAdmin) {
      throw new ApiError('Unauthorized', 403);
    }
    
    // Find user by ID
    const user = await Membership.findById(id)
      .select('-passwordHash -passwordSalt -resetToken -resetTokenExpiry');
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile (admin or self)
 * @access  Private
 */
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, preferences } = req.body;
    
    // Validate ObjectId
    if (!isValidObjectId(id)) {
      throw new ApiError('Invalid user ID', 400);
    }
    
    // Check if user is updating their own profile or is an admin
    const isSelf = req.user._id.toString() === id;
    const isAdmin = req.user.permissions.includes('admin');
    
    if (!isSelf && !isAdmin) {
      throw new ApiError('Unauthorized', 403);
    }
    
    // Find user by ID
    const user = await Membership.findById(id);
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // Update user fields
    if (name) user.name = name;
    
    // Only admin can update email
    if (email && isAdmin && email !== user.email) {
      // Check if email is already in use
      const existingUser = await Membership.findOne({ email });
      if (existingUser && existingUser._id.toString() !== id) {
        throw new ApiError('Email is already in use', 409);
      }
      user.email = email;
    }
    
    // Update preferences
    if (preferences) {
      user.preferences = {
        ...user.preferences || {},
        ...preferences
      };
    }
    
    // Save updated user
    const updatedUser = await user.save();
    
    // Log the action
    await AuditLog.create({
      userId: req.user._id,
      action: 'update_user',
      resourceType: 'User',
      resourceId: user._id,
      details: { changes: req.body },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(200).json({
      success: true,
      message: 'User profile updated successfully',
      data: {
        user: {
          id: updatedUser._id,
          email: updatedUser.email,
          name: updatedUser.name,
          permissions: updatedUser.permissions,
          preferences: updatedUser.preferences,
          lastLogin: updatedUser.lastLogin,
          createdAt: updatedUser.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/users/:id/password
 * @desc    Update user password (self only)
 * @access  Private
 */
router.put('/:id/password', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    // Validate ObjectId
    if (!isValidObjectId(id)) {
      throw new ApiError('Invalid user ID', 400);
    }
    
    // Only allow users to change their own password
    if (req.user._id.toString() !== id) {
      throw new ApiError('Unauthorized', 403);
    }
    
    // Validate request body
    if (!currentPassword || !newPassword) {
      throw new ApiError('Current password and new password are required', 400);
    }
    
    if (newPassword.length < 8) {
      throw new ApiError('New password must be at least 8 characters long', 400);
    }
    
    // Find user by ID
    const user = await Membership.findById(id);
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // Verify current password
    const isPasswordValid = await verifyPassword(
      currentPassword,
      user.passwordHash,
      user.passwordSalt
    );
    
    if (!isPasswordValid) {
      throw new ApiError('Current password is incorrect', 401);
    }
    
    // Hash new password
    const { hash, salt } = await hashPassword(newPassword);
    
    // Update user password
    user.passwordHash = hash;
    user.passwordSalt = salt;
    await user.save();
    
    // Log the action
    await AuditLog.create({
      userId: user._id,
      action: 'update_password',
      resourceType: 'User',
      resourceId: user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/users/:id/status
 * @desc    Update user status (admin only)
 * @access  Private/Admin
 */
router.put('/:id/status', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { active } = req.body;
    
    // Validate ObjectId
    if (!isValidObjectId(id)) {
      throw new ApiError('Invalid user ID', 400);
    }
    
    // Validate request body
    if (active === undefined) {
      throw new ApiError('Active status is required', 400);
    }
    
    // Find user by ID
    const user = await Membership.findById(id);
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // Prevent deactivating self
    if (req.user._id.toString() === id && active === false) {
      throw new ApiError('Cannot deactivate your own account', 400);
    }
    
    // Update user status
    user.active = active;
    await user.save();
    
    // Log the action
    await AuditLog.create({
      userId: req.user._id,
      action: active ? 'activate_user' : 'deactivate_user',
      resourceType: 'User',
      resourceId: user._id,
      details: { active },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(200).json({
      success: true,
      message: `User ${active ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: user._id,
        active: user.active
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/users/:id/permissions
 * @desc    Update user permissions (admin only)
 * @access  Private/Admin
 */
router.put('/:id/permissions', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    
    // Validate ObjectId
    if (!isValidObjectId(id)) {
      throw new ApiError('Invalid user ID', 400);
    }
    
    // Validate request body
    if (!permissions || !Array.isArray(permissions)) {
      throw new ApiError('Permissions must be an array', 400);
    }
    
    // Find user by ID
    const user = await Membership.findById(id);
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // Prevent removing admin from self
    if (
      req.user._id.toString() === id && 
      req.user.permissions.includes('admin') && 
      !permissions.includes('admin')
    ) {
      throw new ApiError('Cannot remove admin permission from yourself', 400);
    }
    
    // Update user permissions
    user.permissions = permissions;
    await user.save();
    
    // Log the action
    await AuditLog.create({
      userId: req.user._id,
      action: 'update_permissions',
      resourceType: 'User',
      resourceId: user._id,
      details: { permissions },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(200).json({
      success: true,
      message: 'User permissions updated successfully',
      data: {
        id: user._id,
        permissions: user.permissions
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/users/:id/preferences
 * @desc    Get user preferences (self or admin)
 * @access  Private
 */
router.get('/:id/preferences', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!isValidObjectId(id)) {
      throw new ApiError('Invalid user ID', 400);
    }
    
    // Check if user is requesting their own preferences or is an admin
    const isSelf = req.user._id.toString() === id;
    const isAdmin = req.user.permissions.includes('admin');
    
    if (!isSelf && !isAdmin) {
      throw new ApiError('Unauthorized', 403);
    }
    
    // Find user by ID
    const user = await Membership.findById(id).select('preferences');
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    res.status(200).json({
      success: true,
      data: {
        preferences: user.preferences || {}
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/users/:id/preferences
 * @desc    Update user preferences (self only)
 * @access  Private
 */
router.put('/:id/preferences', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { preferences } = req.body;
    
    // Validate ObjectId
    if (!isValidObjectId(id)) {
      throw new ApiError('Invalid user ID', 400);
    }
    
    // Only allow users to update their own preferences
    if (req.user._id.toString() !== id) {
      throw new ApiError('Unauthorized', 403);
    }
    
    // Validate request body
    if (!preferences || typeof preferences !== 'object') {
      throw new ApiError('Preferences must be an object', 400);
    }
    
    // Find user by ID
    const user = await Membership.findById(id);
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // Update user preferences
    user.preferences = {
      ...user.preferences || {},
      ...preferences
    };
    
    await user.save();
    
    // Log the action
    await AuditLog.create({
      userId: user._id,
      action: 'update_preferences',
      resourceType: 'User',
      resourceId: user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(200).json({
      success: true,
      message: 'User preferences updated successfully',
      data: {
        preferences: user.preferences
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;