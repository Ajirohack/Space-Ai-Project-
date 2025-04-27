const Joi = require('joi');

const moduleManifestSchema = Joi.object({
  id: Joi.string()
    .required()
    .pattern(/^[a-z0-9-]+$/)
    .message('id must contain only lowercase letters, numbers, and hyphens'),

  name: Joi.string().required().min(3).max(50),

  description: Joi.string().optional().max(500),

  version: Joi.string()
    .required()
    .pattern(/^\d+\.\d+\.\d+$/)
    .message('version must follow semantic versioning (x.y.z)'),

  author: Joi.string().optional(),

  dependencies: Joi.array().items(Joi.string()).default([]),

  capabilities: Joi.array().items(Joi.string()).default([]),

  entryPoint: Joi.string().required(),

  settings: Joi.object().default({}),
});

function validateModuleManifest(manifest) {
  const result = moduleManifestSchema.validate(manifest, {
    abortEarly: false,
    allowUnknown: false,
  });

  return {
    valid: !result.error,
    errors: result.error ? result.error.details.map(d => d.message) : [],
    value: result.value,
  };
}

module.exports = {
  validateModuleManifest,
};
