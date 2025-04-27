/**
 * Membership Service
 * Handles invitation-based registration, membership management, and authentication
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Membership, Invitation, AuditLog } = require('../../models');
const emailService = require('../email');

class MembershipService {
  constructor() {
    this.saltRounds = 10;
    this.invitationExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days
    this.jwtSecret = process.env.JWT_SECRET || 'nexus-control-center-secret';
    this.jwtOptions = {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    };
  }

  /**
   * Create a new invitation
   * @param {string} email - Invitee email
   * @param {Array} permissions - Initial permissions
   * @param {string} createdBy - Creator ID
   * @param {number} expiresIn - Days until expiration
   * @returns {Promise<Object>} Invitation details
   */
  async createInvitation(email, permissions, createdBy, expiresIn = 7) {
    // Generate secure invitation code
    const invitationCode = crypto.randomBytes(32).toString('hex');
    
    // Generate temporary PIN
    const pin = this.generatePin();
    const hashedPin = await bcrypt.hash(pin.toString(), this.saltRounds);

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresIn);

    // Create invitation record
    const invitation = await Invitation.create({
      email,
      invitationCode,
      hashedPin,
      permissions: permissions || ['user'],
      createdBy,
      expiresAt,
      used: false
    });

    // Send invitation email
    await emailService.sendInvitationEmail(email, invitationCode, pin);

    return { 
      invitationId: invitation._id, 
      email,
      invitationCode,
      pin,
      expiresAt
    };
  }

  /**
   * Verify invitation and PIN
   * @param {string} email - User email
   * @param {string} invitationCode - Invitation code
   * @param {string} pin - PIN code
   * @returns {Promise<boolean>} Verification result
   */
  async verifyInvitation(email, invitationCode, pin) {
    // Find invitation
    const invitation = await Invitation.findOne({
      email,
      invitationCode,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!invitation) {
      return false;
    }

    // Verify PIN
    const pinValid = await bcrypt.compare(pin.toString(), invitation.hashedPin);
    return pinValid;
  }

  /**
   * Activate membership with invitation code and PIN
   * @param {string} email - User email
   * @param {string} name - User name
   * @param {string} password - User password
   * @param {string} invitationCode - Invitation code
   * @param {string} pin - PIN code
   * @returns {Promise<Object>} Membership details and token
   */
  async activateMembership(email, name, password, invitationCode, pin) {
    // Validate invitation
    const invitation = await Invitation.findOne({
      email,
      invitationCode,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!invitation) {
      throw new Error('Invalid or expired invitation');
    }

    // Verify PIN
    const pinValid = await bcrypt.compare(pin.toString(), invitation.hashedPin);
    if (!pinValid) {
      throw new Error('Invalid PIN');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, this.saltRounds);
    
    // Generate membership key
    const membershipKey = this.generateMembershipKey();

    // Create membership record
    const membership = await Membership.create({
      email,
      name,
      passwordHash,
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
    const token = this.generateToken(membership);

    return { 
      user: {
        id: membership._id,
        email: membership.email,
        name: membership.name,
        permissions: membership.permissions
      },
      membershipKey, 
      token
    };
  }

  /**
   * Authenticate user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Authentication result
   */
  async authenticate(email, password) {
    // Find user
    const user = await Membership.findOne({ email });
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    if (!user.active) {
      throw new Error('Account is inactive');
    }
    
    // Verify password
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!passwordValid) {
      throw new Error('Invalid credentials');
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate JWT token
    const token = this.generateToken(user);
    
    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        permissions: user.permissions
      },
      token
    };
  }

  /**
   * Validate membership key
   * @param {string} membershipKey - Membership key
   * @returns {Promise<Object|null>} Membership or null
   */
  async validateMembershipKey(membershipKey) {
    const membership = await Membership.findOne({ 
      membershipKey, 
      active: true 
    });

    if (!membership) {
      return null;
    }

    // Update last login
    membership.lastLogin = new Date();
    await membership.save();

    return membership;
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Decoded token
   */
  async verifyToken(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.jwtSecret, (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      });
    });
  }

  /**
   * Generate JWT token for user
   * @param {Object} user - User object
   * @returns {string} JWT token
   */
  generateToken(user) {
    const payload = {
      id: user._id,
      email: user.email,
      permissions: user.permissions
    };
    
    return jwt.sign(payload, this.jwtSecret, this.jwtOptions);
  }

  /**
   * Generate a secure membership key
   * @returns {string} Membership key
   */
  generateMembershipKey() {
    return `nexus_${crypto.randomBytes(32).toString('hex')}`;
  }

  /**
   * Generate a 6-digit PIN
   * @returns {string} 6-digit PIN
   */
  generatePin() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Update user permissions
   * @param {string} userId - User ID
   * @param {Array} permissions - New permissions
   * @returns {Promise<Object>} Updated user
   */
  async updatePermissions(userId, permissions) {
    const user = await Membership.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    user.permissions = permissions;
    await user.save();
    
    return user;
  }

  /**
   * Deactivate user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deactivated user
   */
  async deactivateUser(userId) {
    const user = await Membership.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    user.active = false;
    await user.save();
    
    return user;
  }

  /**
   * Reactivate user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Reactivated user
   */
  async reactivateUser(userId) {
    const user = await Membership.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    user.active = true;
    await user.save();
    
    return user;
  }

  /**
   * Reset password
   * @param {string} email - User email
   * @returns {Promise<string>} Reset token
   */
  async initiatePasswordReset(email) {
    const user = await Membership.findOne({ email });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // 1 hour expiry
    
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();
    
    // Send password reset email
    await emailService.sendPasswordResetEmail(user, resetToken);
    
    return resetToken;
  }

  /**
   * Complete password reset
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  async completePasswordReset(token, newPassword) {
    const user = await Membership.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });
    
    if (!user) {
      throw new Error('Invalid or expired reset token');
    }
    
    const passwordHash = await bcrypt.hash(newPassword, this.saltRounds);
    
    user.passwordHash = passwordHash;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    
    return true;
  }

  /**
   * Change password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await Membership.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const passwordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    
    if (!passwordValid) {
      throw new Error('Current password is incorrect');
    }
    
    const passwordHash = await bcrypt.hash(newPassword, this.saltRounds);
    
    user.passwordHash = passwordHash;
    await user.save();
    
    return true;
  }
}

module.exports = new MembershipService();