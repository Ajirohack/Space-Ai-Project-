// Service for invitation code system
const { User, Invitation } = require('../models');
const crypto = require('crypto');
// Generate a secure random invitation codeasync function generateInvitationCode() {
  return crypto.randomBytes(8).toString('hex');
}

// Create and store a new invitation code
async function createInvitationCode({ email, createdBy, expiresInHours = 24, role }) {
  const code = await generateInvitationCode();
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
  const invitation = await Invitation.create({
    invitationCode: code,
    email,
    createdBy,
    expiresAt,
    used: false,
    role
  });
  return invitation.invitationCode;
}

// Validate an invitation code for a given email
async function validateInvitationCode({ email, invitationCode }) {
  const invitation = await Invitation.findOne({
    invitationCode,
    email,
    used: false,
    expiresAt: { $gt: new Date() }
  });
  return !!invitation;
}

// Mark invitation code as used (after registration)
async function markInvitationCodeUsed({ email, invitationCode }) {
  await Invitation.findOneAndUpdate(
    { invitationCode, email },
    { used: true, usedAt: new Date() }
  );
}

module.exports = {
  generateInvitationCode,
  createInvitationCode,
  validateInvitationCode,
  markInvitationCodeUsed
};
