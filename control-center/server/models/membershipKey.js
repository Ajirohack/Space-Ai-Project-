/**
 * Membership Key Model
 * Represents a validated membership key in the system
 */
const mongoose = require('mongoose');

const membershipKeySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    invitation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invitation',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    active: {
      type: Boolean,
      default: true,
    },
    permissions: [
      {
        type: String,
        default: ['user'],
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    expiresAt: {
      type: Date,
    },
    revokedAt: {
      type: Date,
    },
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedAt: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Find by key
 */
membershipKeySchema.statics.findByKey = function (key) {
  return this.findOne({ key, active: true });
};

/**
 * Validate membership key
 */
membershipKeySchema.statics.validateKey = function (key) {
  return this.findOne({
    key,
    active: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } },
    ],
  });
};

/**
 * Revoke membership key
 */
membershipKeySchema.methods.revoke = function (revokedBy, reason) {
  this.active = false;
  this.revokedAt = new Date();

  if (revokedBy) {
    this.revokedBy = revokedBy;
  }

  if (reason) {
    this.metadata = {
      ...this.metadata,
      revocationReason: reason,
    };
  }

  return this.save();
};

/**
 * Associate with user
 */
membershipKeySchema.methods.associateWithUser = function (userId) {
  this.userId = userId;
  return this.save();
};

module.exports = mongoose.model('MembershipKey', membershipKeySchema);
