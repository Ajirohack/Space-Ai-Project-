const express = require('express');
const router = express.Router();
const { User } = require('../../models');
const authMiddleware = require('../../middleware/authMiddleware');
const { requirePermission } = require('../../middleware/permissionMiddleware');

/**
 * @route   GET /api/users
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 */
router.get('/', authMiddleware, requirePermission('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const total = await User.countDocuments();
    const users = await User.find()
      .select('-passwordHash -resetToken -resetTokenExpiry')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: users.length,
      total,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
      data: users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID (admin or self)
 * @access  Private
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user is requesting own profile or is admin
    if (userId !== req.user._id.toString() && !req.user.permissions.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to access this user profile',
      });
    }

    const user = await User.findById(userId).select('-passwordHash -resetToken -resetTokenExpiry');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile (admin or self)
 * @access  Private
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user is updating own profile or is admin
    if (userId !== req.user._id.toString() && !req.user.permissions.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this user',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Fields that can be updated by user
    const { name, preferences } = req.body;

    // Update allowed fields
    if (name) user.name = name;
    if (preferences) {
      user.preferences = {
        ...user.preferences,
        ...preferences,
      };
    }

    // Additional fields only admin can update
    if (req.user.permissions.includes('admin')) {
      const { email, active, permissions } = req.body;

      if (email) {
        // Check if email is unique
        const existingUser = await User.findOne({
          email,
          _id: { $ne: userId },
        });

        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Email already in use',
          });
        }

        user.email = email;
      }

      if (typeof active === 'boolean') {
        user.active = active;
      }

      if (permissions && Array.isArray(permissions)) {
        user.permissions = permissions;
      }
    }

    await user.save();

    const updatedUser = await User.findById(userId).select(
      '-passwordHash -resetToken -resetTokenExpiry'
    );

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete or deactivate a user (admin only)
 * @access  Private/Admin
 */
router.delete('/:id', authMiddleware, requirePermission('admin'), async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent self-deletion
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Soft delete (deactivate) or hard delete based on query param
    const { permanently } = req.query;

    if (permanently === 'true') {
      await User.deleteOne({ _id: userId });
      res.json({
        success: true,
        message: 'User permanently deleted',
      });
    } else {
      user.active = false;
      await user.save();
      res.json({
        success: true,
        message: 'User deactivated successfully',
      });
    }
  } catch (error) {
    console.error('Error deleting/deactivating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete/deactivate user',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/users/:id/password
 * @desc    Update user password (self only)
 * @access  Private
 */
router.put('/:id/password', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;

    // Only allow changing own password (not even admin can change others' passwords)
    if (userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to change this password',
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify current password
    const bcrypt = require('bcrypt');
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.passwordHash = passwordHash;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update password',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/users/:id/permissions
 * @desc    Update user permissions (admin only)
 * @access  Private/Admin
 */
router.put('/:id/permissions', authMiddleware, requirePermission('admin'), async (req, res) => {
  try {
    const userId = req.params.id;
    const { permissions } = req.body;

    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: 'Permissions must be provided as an array',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent removing admin from self
    if (
      userId === req.user._id.toString() &&
      req.user.permissions.includes('admin') &&
      !permissions.includes('admin')
    ) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove admin permission from yourself',
      });
    }

    user.permissions = permissions;
    await user.save();

    res.json({
      success: true,
      message: 'User permissions updated successfully',
      data: { permissions: user.permissions },
    });
  } catch (error) {
    console.error('Error updating permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update permissions',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authMiddleware, (req, res) => {
  try {
    // User is already attached to request by auth middleware
    const user = req.user;

    // Remove sensitive data
    const userObj = user.toObject();
    delete userObj.passwordHash;
    delete userObj.resetToken;
    delete userObj.resetTokenExpiry;

    res.json({
      success: true,
      data: userObj,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/users/:id/modules
 * @desc    Update user module access (admin only)
 * @access  Private/Admin
 */
router.put('/:id/modules', authMiddleware, requirePermission('admin'), async (req, res) => {
  try {
    const userId = req.params.id;
    const { modules } = req.body;

    if (!modules || !Array.isArray(modules)) {
      return res.status(400).json({
        success: false,
        message: 'Modules must be provided as an array',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.modules = modules;
    await user.save();

    res.json({
      success: true,
      message: 'User module access updated successfully',
      data: { modules: user.modules },
    });
  } catch (error) {
    console.error('Error updating module access:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update module access',
      error: error.message,
    });
  }
});

module.exports = router;
