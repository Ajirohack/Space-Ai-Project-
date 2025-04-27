// Module model for module registry
const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  // Basic module identification
  name: { type: String, required: true, unique: true },
  moduleId: { type: String, required: true, unique: true, index: true },
  version: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        // Simple semver validation
        return /^\d+\.\d+\.\d+(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/.test(
          v
        );
      },
      message: props => `${props.value} is not a valid semantic version!`,
    },
  },
  description: { type: String },

  // Dependencies and capabilities
  dependencies: [
    {
      moduleId: { type: String, required: true },
      version: { type: String, required: true },
      optional: { type: Boolean, default: false },
    },
  ],
  capabilities: [{ type: String }],

  // Configuration
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  configSchema: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  defaultConfig: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  // Module status
  status: {
    type: String,
    enum: ['registered', 'initialized', 'active', 'error', 'disabled'],
    default: 'registered',
  },
  statusMessage: { type: String },
  active: { type: Boolean, default: true },

  // Module metadata
  author: { type: String },
  license: { type: String },
  homepage: { type: String },
  repository: { type: String },
  tags: [{ type: String }],
  icon: { type: String },

  // Module execution
  entryPoint: { type: String, default: 'index.js' },
  installPath: { type: String },

  // API endpoints
  endpoints: [
    {
      path: { type: String, required: true },
      method: { type: String, required: true },
      description: { type: String },
    },
  ],

  // Security and permissions
  permissions: [
    {
      name: { type: String, required: true },
      description: { type: String },
    },
  ],

  // Tracking
  registeredAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Additional metadata
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
});

// Indexes for efficient querying
moduleSchema.index({ name: 'text', description: 'text' });
moduleSchema.index({ capabilities: 1 });
moduleSchema.index({ tags: 1 });
moduleSchema.index({ status: 1 });

/**
 * Check if module satisfies a version requirement
 * @param {string} versionRequirement - Semver compatible version requirement
 * @returns {boolean} - Whether this module satisfies the requirement
 */
moduleSchema.methods.satisfiesVersion = function (versionRequirement) {
  // Simple version comparison, in production use semver
  const thisVersion = this.version.split('.').map(Number);
  const reqVersion = versionRequirement
    .replace(/[^0-9.]/g, '')
    .split('.')
    .map(Number);

  for (let i = 0; i < 3; i++) {
    if (thisVersion[i] > reqVersion[i]) return true;
    if (thisVersion[i] < reqVersion[i]) return false;
  }

  return true;
};

/**
 * Check if module has a specific capability
 * @param {string} capability - Capability to check
 * @returns {boolean} - Whether module has the capability
 */
moduleSchema.methods.hasCapability = function (capability) {
  return this.capabilities.includes(capability);
};

/**
 * Find modules with specific capability
 * @param {string} capability - Capability to search for
 * @returns {Promise<Array>} - Promise resolving to array of modules
 */
moduleSchema.statics.findByCapability = function (capability) {
  return this.find({ capabilities: capability, active: true });
};

/**
 * Find modules by tag
 * @param {string} tag - Tag to search for
 * @returns {Promise<Array>} - Promise resolving to array of modules
 */
moduleSchema.statics.findByTag = function (tag) {
  return this.find({ tags: tag, active: true });
};

// Pre-save hook to update updatedAt timestamp
moduleSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Module', moduleSchema);
