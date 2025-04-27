/**
 * Invitation Service
 * Handles invitation creation, verification, and related functionality
 */

const { User, Invitation, AuditLog } = require('../../models');
const { sendInvitationEmail } = require('../email');
const { logger } = require('../../middleware/logger');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../../utils/errors');

class InvitationService {
  /**
   * Create a new invitation
   * @param {Object} data - Invitation data
   * @param {string} data.email - Recipient email
   * @param {Array<string>} [data.permissions] - Permissions to grant (defaults to ['user'])
   * @param {Object} [data.metadata] - Additional metadata
   * @param {string} creatorId - ID of user creating the invitation
   * @returns {Promise<Object>} - The created invitation and PIN
   */
  async createInvitation(data, creatorId) {
    // Validate creator exists and has permission
    const creator = await User.findById(creatorId);
    if (!creator) {
      throw new NotFoundError('Creator not found');
    }
    
    // Only admins can create invitations with admin permissions
    if (data.permissions?.includes('admin') && !creator.permissions.includes('admin')) {
      throw new ForbiddenError('You do not have permission to create admin invitations');
    }
    
    try {
      // Check if user already exists with this email
      const existingUser = await User.findByEmail(data.email);
      if (existingUser) {
        throw new BadRequestError('User with this email already exists');
      }
      
      // Create invitation with PIN
      const { invitation, pin } = await Invitation.createWithPin({
        email: data.email,
        permissions: data.permissions || ['user'],
        createdBy: creatorId,
        metadata: data.metadata || {}
      });
      
      // Log the action
      await AuditLog.create({
        userId: creatorId,
        action: 'invitation_created',
        resourceType: 'Invitation',
        resourceId: invitation._id,
        details: {
          email: invitation.email,
          permissions: invitation.permissions
        }
      });
      
      // Send invitation email
      try {
        await sendInvitationEmail({
          email: invitation.email,
          invitationCode: invitation.invitationCode,
          pin,
          expiresAt: invitation.expiresAt
        });
      } catch (error) {
        logger.error('Failed to send invitation email', {
          error: error.message,
          invitationId: invitation._id
        });
        // We don't want to fail the whole process if just the email fails
      }
      
      return {
        invitation: {
          _id: invitation._id,
          email: invitation.email,
          invitationCode: invitation.invitationCode,
          expiresAt: invitation.expiresAt,
          permissions: invitation.permissions
        },
        pin // Return PIN for display to admin
      };
    } catch (error) {
      logger.error('Error creating invitation', {
        error: error.message,
        email: data.email
      });
      throw error;
    }
  }
  
  /**
   * Verify an invitation using code and PIN
   * @param {string} code - Invitation code
   * @param {string} pin - Invitation PIN
   * @returns {Promise<Object>} - Verified invitation
   */
  async verifyInvitation(code, pin) {
    try {
      // Verify invitation with PIN
      const invitation = await Invitation.verifyInvitation(code, pin);
      
      if (!invitation) {
        throw new BadRequestError('Invalid invitation code or PIN');
      }
      
      return invitation;
    } catch (error) {
      logger.error('Error verifying invitation', {
        error: error.message,
        code
      });
      throw error;
    }
  }
  
  /**
   * List invitations created by a user
   * @param {string} userId - Creator user ID
   * @param {Object} options - Query options
   * @param {boolean} [options.onlyActive=false] - Only return active invitations
   * @returns {Promise<Array>} - Array of invitations
   */
  async listInvitations(userId, options = {}) {
    try {
      let query = { createdBy: userId };
      
      // Filter by active status if requested
      if (options.onlyActive) {
        query.used = false;
        query.expiresAt = { $gt: new Date() };
      }
      
      const invitations = await Invitation.find(query)
        .sort({ createdAt: -1 })
        .select('-hashedPin'); // Don't return the hashed PIN
      
      return invitations;
    } catch (error) {
      logger.error('Error listing invitations', {
        error: error.message,
        userId
      });
      throw error;
    }
  }
  
  /**
   * Revoke (delete) an invitation
   * @param {string} invitationId - Invitation ID
   * @param {string} userId - User ID performing the revocation
   * @returns {Promise<boolean>} - Success status
   */
  async revokeInvitation(invitationId, userId) {
    try {
      // Get the invitation
      const invitation = await Invitation.findById(invitationId);
      
      if (!invitation) {
        throw new NotFoundError('Invitation not found');
      }
      
      // Check permissions (creator or admin)
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      
      const isCreator = invitation.createdBy.toString() === userId;
      const isAdmin = user.permissions.includes('admin');
      
      if (!isCreator && !isAdmin) {
        throw new ForbiddenError('You do not have permission to revoke this invitation');
      }
      
      // Don't allow revoking already used invitations
      if (invitation.used) {
        throw new BadRequestError('Cannot revoke an already used invitation');
      }
      
      // Delete the invitation
      await invitation.deleteOne();
      
      // Log the action
      await AuditLog.create({
        userId,
        action: 'invitation_revoked',
        resourceType: 'Invitation',
        resourceId: invitationId,
        details: {
          email: invitation.email
        }
      });
      
      return true;
    } catch (error) {
      logger.error('Error revoking invitation', {
        error: error.message,
        invitationId,
        userId
      });
      throw error;
    }
  }
  
  /**
   * Accept an invitation and create a user account
   * @param {Object} data - Registration data
   * @param {string} data.invitationCode - Invitation code
   * @param {string} data.pin - PIN for verification
   * @param {string} data.name - User's full name
   * @param {string} data.password - User's password
   * @returns {Promise<Object>} - Created user object
   */
  async acceptInvitation(data) {
    try {
      // Verify invitation
      const invitation = await this.verifyInvitation(data.invitationCode, data.pin);
      
      if (!invitation) {
        throw new BadRequestError('Invalid invitation');
      }
      
      // Check for existing user with this email
      const existingUser = await User.findByEmail(invitation.email);
      if (existingUser) {
        throw new BadRequestError('A user with this email already exists');
      }
      
      // Generate password hash
      const bcrypt = require('bcrypt');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(data.password, salt);
      
      // Generate membership key
      const membershipKey = User.generateMembershipKey();
      
      // Create the user
      const user = await User.create({
        email: invitation.email,
        name: data.name,
        passwordHash,
        passwordSalt: salt,
        membershipKey,
        permissions: invitation.permissions,
        invitedBy: invitation.createdBy,
        active: true
      });
      
      // Mark the invitation as used
      await invitation.markAsUsed(user._id);
      
      // Log the action
      await AuditLog.create({
        userId: user._id,
        action: 'invitation_accepted',
        resourceType: 'User',
        resourceId: user._id,
        details: {
          invitationId: invitation._id
        }
      });
      
      return {
        _id: user._id,
        email: user.email,
        name: user.name,
        membershipKey: user.membershipKey,
        permissions: user.permissions
      };
    } catch (error) {
      logger.error('Error accepting invitation', {
        error: error.message,
        invitationCode: data.invitationCode
      });
      throw error;
    }
  }
  
  /**
   * Get invitation statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Statistics about user's invitations
   */
  async getInvitationStats(userId) {
    try {
      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      
      // Get counts
      const [totalCount, activeCount, usedCount] = await Promise.all([
        Invitation.countDocuments({ createdBy: userId }),
        Invitation.countDocuments({ 
          createdBy: userId,
          used: false,
          expiresAt: { $gt: new Date() }
        }),
        Invitation.countDocuments({ 
          createdBy: userId,
          used: true
        })
      ]);
      
      return {
        total: totalCount,
        active: activeCount,
        used: usedCount,
        expired: totalCount - activeCount - usedCount
      };
    } catch (error) {
      logger.error('Error getting invitation stats', {
        error: error.message,
        userId
      });
      throw error;
    }
  }
}

module.exports = new InvitationService();