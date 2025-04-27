// AI Model registry for AI Council
const mongoose = require('mongoose');

const aiModelSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  provider: { type: String, required: true },
  version: { type: String },
  config: { type: Object },
  registeredAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AIModel', aiModelSchema);
