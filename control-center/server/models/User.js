/**
 * User Model
 * Defines the user schema and methods for authentication and user management
 * This is the core model for the authentication system in the Control Center
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// User Schema
const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  passwordSalt: {
    type: String,
    required: true
  },
  membershipKey: { 
    type: String, 
    required: true, 
    unique: true 
  },
  permissions: [{
    type: String,
    enum: ['admin', 'user', 'module_access', 'premium_models']
  }],
  modules: [{
    moduleId: String,
    enabled: Boolean,
    config: mongoose.Schema.Types.Mixed
  }],
  preferences: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  pinEnabled: {
    type: Boolean,
    default: false
  },
  pinHash: {
    type: String
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String
  },
  resetToken: String,
  resetTokenExpiry: Date,
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockedUntil: Date,
  active: {
    type: Boolean,
    default: true
  },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

/**
 * Method to validate password
 * @param {string} password - The password to validate
 * @returns {Promise<boolean>} - Returns true if password is valid
 */
userSchema.methods.validatePassword = async function(password) {
  const hash = await bcrypt.hash(password, this.passwordSalt);
  return hash === this.passwordHash;
};

/**
 * Method to validate PIN
 * @param {string} pin - The PIN to validate
 * @returns {Promise<boolean>} - Returns true if PIN is valid
 */
userSchema.methods.validatePin = async function(pin) {
  if (!this.pinEnabled || !this.pinHash) {
    return false;
  }
  
  return await bcrypt.compare(pin, this.pinHash);
};

/**
 * Method to set PIN
 * @param {string} pin - The PIN to set
 * @returns {Promise<void>}
 */
userSchema.methods.setPin = async function(pin) {
  // Hash the PIN
  const salt = await bcrypt.genSalt(10);
  this.pinHash = await bcrypt.hash(pin, salt);
  this.pinEnabled = true;
  
  await this.save();
};

/**
 * Method to disable PIN authentication
 * @returns {Promise<void>}
 */
userSchema.methods.disablePin = async function() {
  this.pinEnabled = false;
  this.pinHash = null;
  
  await this.save();
};

/**
 * Method to generate JWT token
 * @returns {string} - JWT token
 */
userSchema.methods.generateAuthToken = function() {
  const token = jwt.sign(
    { 
      id: this._id,
      email: this.email,
      permissions: this.permissions
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: '1d' }
  );
  
  return token;
};

/**
 * Method to generate membership key
 * @returns {string} - Generated membership key
 */
userSchema.statics.generateMembershipKey = function() {
  return crypto.randomBytes(16).toString('hex');
};

/**
 * Method to find user by email
 * @param {string} email - Email to search for
 * @returns {Promise<User>} - User document
 */
userSchema.statics.findByEmail = async function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

/**
 * Method to find user by membership key
 * @param {string} key - Membership key to search for
 * @returns {Promise<User>} - User document
 */
userSchema.statics.findByMembershipKey = async function(key) {
  return this.findOne({ membershipKey: key });
};

/**
 * Method to record login attempt
 * @returns {Promise<void>}
 */
userSchema.methods.recordLoginAttempt = async function() {
  this.loginAttempts += 1;
  
  // Lock account after 5 failed attempts for 30 minutes
  if (this.loginAttempts >= 5) {
    const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
    this.lockedUntil = new Date(Date.now() + thirtyMinutes);
  }
  
  await this.save();
};

/**
 * Method to reset login attempts
 * @returns {Promise<void>}
 */
userSchema.methods.resetLoginAttempts = async function() {
  this.loginAttempts = 0;
  this.lockedUntil = undefined;
  this.lastLogin = new Date();
  
  await this.save();
};

/**
 * Method to check if account is locked
 * @returns {boolean} - Returns true if account is locked
 */
userSchema.methods.isAccountLocked = function() {
  return this.lockedUntil && this.lockedUntil > new Date();
};

const User = mongoose.model('User', userSchema);

module.exports = User;