// Mongoose model for invitation codes
const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  invitationCode: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  hashedPin: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
  usedAt: { type: Date },
  role: { type: String }, // Optional: pre-assign role

  // MIS Integration fields
  status: {
    type: String,
    enum: ['pending', 'onboarded', 'approved', 'rejected'],
    default: 'pending',
  },
  statusUpdatedAt: { type: Date },
  statusUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  syncedFromMis: { type: Boolean, default: false },
  onboardingData: {
    voiceConsent: { type: Boolean },
    responses: { type: String }, // JSON string of responses
    submittedAt: { type: Date },
  },
  permissions: [{ type: String }],
  metadata: { type: mongoose.Schema.Types.Mixed }, // Flexible field for additional data
});

/**
 * Find an invitation by code
 * @param {string} code - The invitation code
 * @returns {Promise<Object>} - The invitation document
 */
invitationSchema.statics.findByCode = function (code) {
  return this.findOne({
    invitationCode: code.toUpperCase(),
    used: false,
    expiresAt: { $gt: new Date() },
  });
};

/**
 * Mark invitation as used
 * @param {string} userId - The user ID who used the invitation
 * @returns {Promise<Object>} - The updated invitation
 */
invitationSchema.methods.markAsUsed = function (userId) {
  this.used = true;
  this.usedAt = new Date();
  this.usedBy = userId;
  this.status = 'approved'; // When directly used, mark as approved
  this.statusUpdatedAt = new Date();
  return this.save();
};

/**
 * Update invitation status
 * @param {string} status - New status
 * @param {string} updatedBy - User ID who updated the status
 * @returns {Promise<Object>} - The updated invitation
 */
invitationSchema.methods.updateStatus = function (status, updatedBy) {
  this.status = status;
  this.statusUpdatedAt = new Date();
  if (updatedBy) {
    this.statusUpdatedBy = updatedBy;
  }
  return this.save();
};

module.exports = mongoose.model('Invitation', invitationSchema);
