/**
 * Invitation Model
 * Defines the invitation schema and methods for the invitation-based registration system
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Invitation Schema
const invitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  invitationCode: {
    type: String,
    required: true,
    unique: true
  },
  hashedPin: {
    type: String,
    required: true
  },
  permissions: [{
    type: String,
    enum: ['admin', 'user', 'module_access', 'premium_models']
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  used: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, { timestamps: true });

/**
 * Pre-save hook to ensure invitationCode is set
 */
invitationSchema.pre('save', function(next) {
  // If invitation code is not set, generate one
  if (!this.invitationCode) {
    this.invitationCode = generateInvitationCode();
  }
  next();
});

/**
 * Generate a secure invitation code
 * @returns {string} - A random invitation code
 */
function generateInvitationCode() {
  // Generate a 12-character random string (6 bytes in hex)
  return crypto.randomBytes(6).toString('hex').toUpperCase();
}

/**
 * Generate a 6-digit PIN
 * @returns {string} - A 6-digit PIN
 */
function generatePin() {
  // Generate a random 6-digit number
  const pin = Math.floor(100000 + Math.random() * 900000).toString();
  return pin;
}

/**
 * Hash a PIN
 * @param {string} pin - The PIN to hash
 * @returns {Promise<string>} - The hashed PIN
 */
async function hashPin(pin) {
  const saltRounds = 10;
  return bcrypt.hash(pin, saltRounds);
}

/**
 * Verify a PIN against a hashed PIN
 * @param {string} pin - The PIN to verify
 * @param {string} hashedPin - The hashed PIN to verify against
 * @returns {Promise<boolean>} - True if PIN is valid
 */
async function verifyPin(pin, hashedPin) {
  return bcrypt.compare(pin, hashedPin);
}

/**
 * Check if an invitation is expired
 * @returns {boolean} - True if expired
 */
invitationSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

/**
 * Check if an invitation is valid (not used and not expired)
 * @returns {boolean} - True if valid
 */
invitationSchema.methods.isValid = function() {
  return !this.used && !this.isExpired();
};

/**
 * Mark an invitation as used
 * @param {string} userId - The ID of the user who used the invitation
 * @returns {Promise<void>}
 */
invitationSchema.methods.markAsUsed = async function(userId) {
  this.used = true;
  this.usedAt = new Date();
  this.usedBy = userId;
  await this.save();
};

/**
 * Create an invitation with a random PIN
 * @param {Object} invitationData - Invitation data
 * @param {string} invitationData.email - Email address for the invitation
 * @param {Array<string>} invitationData.permissions - Permissions to grant
 * @param {string} invitationData.createdBy - User ID of the creator
 * @param {Object} [invitationData.metadata] - Additional metadata
 * @param {number} [expirationDays=7] - Number of days until expiration
 * @returns {Promise<Object>} - The created invitation and plaintext PIN
 */
invitationSchema.statics.createWithPin = async function(invitationData, expirationDays = 7) {
  // Generate PIN
  const pin = generatePin();
  const hashedPin = await hashPin(pin);
  
  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expirationDays);
  
  // Generate invitation code
  const invitationCode = generateInvitationCode();
  
  // Create invitation
  const invitation = await this.create({
    email: invitationData.email,
    invitationCode,
    hashedPin,
    permissions: invitationData.permissions || ['user'],
    createdBy: invitationData.createdBy,
    metadata: invitationData.metadata || {},
    expiresAt
  });
  
  // Return invitation and plaintext PIN
  return {
    invitation,
    pin
  };
};

/**
 * Find an invitation by code
 * @param {string} code - The invitation code
 * @returns {Promise<Object>} - The invitation document
 */
invitationSchema.statics.findByCode = function(code) {
  return this.findOne({ 
    invitationCode: code.toUpperCase(),
    used: false,
    expiresAt: { $gt: new Date() }
  });
};

/**
 * Verify invitation with PIN
 * @param {string} code - Invitation code
 * @param {string} pin - PIN to verify
 * @returns {Promise<Object>} - The verified invitation or null
 */
invitationSchema.statics.verifyInvitation = async function(code, pin) {
  // Find valid invitation by code
  const invitation = await this.findByCode(code);
  
  if (!invitation) {
    return null;
  }
  
  // Verify PIN
  const isValid = await verifyPin(pin, invitation.hashedPin);
  
  if (!isValid) {
    return null;
  }
  
  return invitation;
};

/**
 * Find active invitations for an email
 * @param {string} email - Email to search for
 * @returns {Promise<Array>} - Array of active invitations
 */
invitationSchema.statics.findActiveForEmail = function(email) {
  return this.find({ 
    email: email.toLowerCase(),
    used: false,
    expiresAt: { $gt: new Date() }
  });
};

/**
 * Find all invitations created by a specific user
 * @param {string} userId - User ID who created the invitations
 * @returns {Promise<Array>} - Array of invitations
 */
invitationSchema.statics.findByCreator = function(userId) {
  return this.find({ createdBy: userId }).sort({ createdAt: -1 });
};

/**
 * Count active invitations by creator
 * @param {string} userId - User ID who created the invitations
 * @returns {Promise<number>} - Count of active invitations
 */
invitationSchema.statics.countActiveByCreator = function(userId) {
  return this.countDocuments({ 
    createdBy: userId,
    used: false,
    expiresAt: { $gt: new Date() }
  });
};

// Create and export the Invitation model
const Invitation = mongoose.model('Invitation', invitationSchema);

module.exports = Invitation;