const mongoose = require('mongoose');

const membershipKeySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  used: { type: Boolean, default: false },
  usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expiresAt: { type: Date },
});

module.exports = mongoose.model('MembershipKey', membershipKeySchema);
