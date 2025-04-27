const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: String,
    version: {
      type: String,
      required: true,
    },
    author: String,
    dependencies: [
      {
        type: String,
      },
    ],
    active: {
      type: Boolean,
      default: false,
    },
    config: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    capabilities: [
      {
        type: String,
      },
    ],
    entryPoint: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
moduleSchema.index({ name: 1 });
moduleSchema.index({ active: 1 });

// Instance methods
moduleSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

// Static methods
moduleSchema.statics.findByCapability = function (capability) {
  return this.find({
    capabilities: capability,
    active: true,
  });
};

moduleSchema.statics.findActive = function () {
  return this.find({ active: true });
};

const Module = mongoose.model('Module', moduleSchema);

module.exports = Module;
