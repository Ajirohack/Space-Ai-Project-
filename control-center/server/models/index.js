/**
 * Models Index
 * Export all models from a single file for easier imports
 */

const User = require('./user');
const Module = require('./module');
const Invitation = require('./invitation');
const MembershipKey = require('./membershipKey');
const Token = require('./token');

module.exports = {
  User,
  Module,
  Invitation,
  MembershipKey,
  Token,
};
