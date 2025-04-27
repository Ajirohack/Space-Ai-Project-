// Service for membership key generation and validation
const { MembershipKey } = require('../models');
const crypto = require('crypto');

async function generateMembershipKey({ createdBy, expiresAt }) {
  const key = crypto.randomBytes(16).toString('hex');
  const membershipKey = new MembershipKey({
    key,
    createdBy,
    expiresAt,
  });
  await membershipKey.save();
  return membershipKey;
}

async function validateMembershipKey(key) {
  const membershipKey = await MembershipKey.findOne({ key });
  if (!membershipKey) return { valid: false, reason: 'Key not found' };
  if (membershipKey.used) return { valid: false, reason: 'Key already used' };
  if (membershipKey.expiresAt && membershipKey.expiresAt < new Date()) return { valid: false, reason: 'Key expired' };
  return { valid: true, membershipKey };
}

async function markMembershipKeyUsed(key, usedBy) {
  return MembershipKey.findOneAndUpdate(
    { key },
    { used: true, usedBy },
    { new: true }
  );
}

module.exports = {
  generateMembershipKey,
  validateMembershipKey,
  markMembershipKeyUsed,
};
