// Tool model for Tools/Packages system
const mongoose = require('mongoose');

const toolSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  version: { type: String, required: true },
  entryPoint: { type: String },
  resources: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Tool', toolSchema);
