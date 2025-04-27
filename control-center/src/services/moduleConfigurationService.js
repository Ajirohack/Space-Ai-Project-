/**
 * Module Configuration Service
 * Provides configuration management for modules in the system
 */
const moduleService = require('./moduleService');
const logger = require('../utils/logger');

// In-memory cache for module configurations
const configCache = new Map();

/**
 * Get configuration for a module
 * @param {String} moduleId - Module ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Module configuration
 */
async function getModuleConfig(moduleId, options = {}) {
  // Try to get from cache if caching is enabled
  if (!options.skipCache && configCache.has(moduleId)) {
    return configCache.get(moduleId);
  }

  // Get module from DB
  const module = await moduleService.getModuleById(moduleId);

  if (!module) {
    throw new Error(`Module not found: ${moduleId}`);
  }

  // Extract config
  const config = module.config || {};

  // Store in cache
  if (!options.skipCache) {
    configCache.set(moduleId, config);
  }

  return config;
}

/**
 * Update configuration for a module
 * @param {String} moduleId - Module ID
 * @param {Object} config - New configuration object
 * @returns {Promise<Object>} - Updated module configuration
 */
async function updateModuleConfig(moduleId, config) {
  // Get existing module
  const module = await moduleService.getModuleById(moduleId);

  if (!module) {
    throw new Error(`Module not found: ${moduleId}`);
  }

  // Validate config if schema exists
  if (module.configSchema) {
    validateConfig(config, module.configSchema);
  }

  // Update config in the database
  const updatedModule = await moduleService.updateModule(moduleId, {
    config,
    updatedAt: new Date(),
  });

  // Update cache
  configCache.set(moduleId, config);

  // Return the updated config
  return updatedModule.config;
}

/**
 * Set specific configuration value
 * @param {String} moduleId - Module ID
 * @param {String} key - Configuration key (supports dot notation)
 * @param {any} value - Configuration value
 * @returns {Promise<Object>} - Updated configuration
 */
async function setConfigValue(moduleId, key, value) {
  // Get current config
  const config = await getModuleConfig(moduleId, { skipCache: true });

  // Set the value using dot notation
  const updatedConfig = setNestedValue(config, key, value);

  // Update the config
  return updateModuleConfig(moduleId, updatedConfig);
}

/**
 * Get specific configuration value
 * @param {String} moduleId - Module ID
 * @param {String} key - Configuration key (supports dot notation)
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {Promise<any>} - Configuration value
 */
async function getConfigValue(moduleId, key, defaultValue = null) {
  // Get current config
  const config = await getModuleConfig(moduleId);

  // Get the value using dot notation
  return getNestedValue(config, key, defaultValue);
}

/**
 * Delete specific configuration value
 * @param {String} moduleId - Module ID
 * @param {String} key - Configuration key (supports dot notation)
 * @returns {Promise<Object>} - Updated configuration
 */
async function deleteConfigValue(moduleId, key) {
  // Get current config
  const config = await getModuleConfig(moduleId, { skipCache: true });

  // Delete the value using dot notation
  const updatedConfig = deleteNestedValue(config, key);

  // Update the config
  return updateModuleConfig(moduleId, updatedConfig);
}

/**
 * Set configuration schema for validation
 * @param {String} moduleId - Module ID
 * @param {Object} schema - JSON Schema object for configuration validation
 * @returns {Promise<Object>} - Updated module
 */
async function setConfigSchema(moduleId, schema) {
  // Get existing module
  const module = await moduleService.getModuleById(moduleId);

  if (!module) {
    throw new Error(`Module not found: ${moduleId}`);
  }

  // Update schema in the database
  const updatedModule = await moduleService.updateModule(moduleId, {
    configSchema: schema,
    updatedAt: new Date(),
  });

  return updatedModule;
}

/**
 * Create default configuration for a module
 * @param {String} moduleId - Module ID
 * @param {Object} defaultConfig - Default configuration object
 * @returns {Promise<Object>} - Updated module configuration
 */
async function createDefaultConfig(moduleId, defaultConfig) {
  // Get existing module
  const module = await moduleService.getModuleById(moduleId);

  if (!module) {
    throw new Error(`Module not found: ${moduleId}`);
  }

  // Only set defaults if no config exists
  if (!module.config || Object.keys(module.config).length === 0) {
    return updateModuleConfig(moduleId, defaultConfig);
  }

  // If config already exists, return it
  return module.config;
}

/**
 * Reset module configuration to defaults
 * @param {String} moduleId - Module ID
 * @returns {Promise<Object>} - Reset configuration
 */
async function resetConfig(moduleId) {
  // Get existing module
  const module = await moduleService.getModuleById(moduleId);

  if (!module) {
    throw new Error(`Module not found: ${moduleId}`);
  }

  // Check if module has default config
  if (!module.defaultConfig) {
    throw new Error(`Module ${moduleId} has no default configuration defined`);
  }

  // Reset to default config
  return updateModuleConfig(moduleId, JSON.parse(JSON.stringify(module.defaultConfig)));
}

/**
 * Validate configuration against schema
 * @param {Object} config - Configuration to validate
 * @param {Object} schema - JSON Schema for validation
 * @throws {Error} If validation fails
 */
function validateConfig(config, schema) {
  // This is a simple placeholder for validation logic
  // In a real implementation, use a proper JSON Schema validator like Ajv

  // Example validation logic:
  for (const [key, def] of Object.entries(schema.properties || {})) {
    // Check required properties
    if (schema.required && schema.required.includes(key) && !(key in config)) {
      throw new Error(`Missing required configuration property: ${key}`);
    }

    if (key in config) {
      const value = config[key];

      // Check type
      if (def.type === 'string' && typeof value !== 'string') {
        throw new Error(`Invalid type for ${key}: expected string`);
      }

      if (def.type === 'number' && typeof value !== 'number') {
        throw new Error(`Invalid type for ${key}: expected number`);
      }

      if (def.type === 'boolean' && typeof value !== 'boolean') {
        throw new Error(`Invalid type for ${key}: expected boolean`);
      }

      if (def.type === 'array' && !Array.isArray(value)) {
        throw new Error(`Invalid type for ${key}: expected array`);
      }

      if (
        def.type === 'object' &&
        (typeof value !== 'object' || Array.isArray(value) || value === null)
      ) {
        throw new Error(`Invalid type for ${key}: expected object`);
      }

      // Check pattern
      if (def.pattern && typeof value === 'string' && !new RegExp(def.pattern).test(value)) {
        throw new Error(`Value for ${key} does not match required pattern: ${def.pattern}`);
      }

      // Check enum
      if (def.enum && !def.enum.includes(value)) {
        throw new Error(`Invalid value for ${key}: must be one of ${def.enum.join(', ')}`);
      }
    }
  }

  logger.debug(`Configuration validation passed for schema`);
}

/**
 * Set a nested value using dot notation
 * @param {Object} obj - Object to modify
 * @param {String} path - Path with dot notation
 * @param {any} value - Value to set
 * @returns {Object} - Modified object
 */
function setNestedValue(obj, path, value) {
  // Create a copy of the object to avoid direct mutation
  const result = JSON.parse(JSON.stringify(obj));

  const keys = path.split('.');
  let current = result;

  // Traverse the path except for the last key
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];

    // Create missing objects in the path
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }

    current = current[key];
  }

  // Set the value at the final key
  current[keys[keys.length - 1]] = value;

  return result;
}

/**
 * Get a nested value using dot notation
 * @param {Object} obj - Object to get value from
 * @param {String} path - Path with dot notation
 * @param {any} defaultValue - Default value if path doesn't exist
 * @returns {any} - Value at path or default
 */
function getNestedValue(obj, path, defaultValue = null) {
  const keys = path.split('.');
  let current = obj;

  // Traverse the path
  for (const key of keys) {
    // Return default if current is not an object or doesn't have the key
    if (typeof current !== 'object' || current === null || !(key in current)) {
      return defaultValue;
    }

    current = current[key];
  }

  return current;
}

/**
 * Delete a nested value using dot notation
 * @param {Object} obj - Object to modify
 * @param {String} path - Path with dot notation
 * @returns {Object} - Modified object
 */
function deleteNestedValue(obj, path) {
  // Create a copy of the object to avoid direct mutation
  const result = JSON.parse(JSON.stringify(obj));

  const keys = path.split('.');
  let current = result;

  // Traverse the path except for the last key
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];

    // If the path doesn't exist, nothing to delete
    if (!current[key] || typeof current[key] !== 'object') {
      return result;
    }

    current = current[key];
  }

  // Delete the property at the final key
  delete current[keys[keys.length - 1]];

  return result;
}

/**
 * Bulk update multiple configuration values
 * @param {String} moduleId - Module ID
 * @param {Object} configUpdates - Configuration updates as key-value pairs
 * @returns {Promise<Object>} - Updated configuration
 */
async function bulkUpdateConfig(moduleId, configUpdates) {
  // Get current config
  const currentConfig = await getModuleConfig(moduleId, { skipCache: true });

  // Apply all updates
  const updatedConfig = { ...currentConfig };

  for (const [key, value] of Object.entries(configUpdates)) {
    // If the key contains dots, use setNestedValue
    if (key.includes('.')) {
      setNestedValue(updatedConfig, key, value);
    } else {
      // Direct property set
      updatedConfig[key] = value;
    }
  }

  // Update the complete config
  return updateModuleConfig(moduleId, updatedConfig);
}

/**
 * Clear the configuration cache
 * @param {String} moduleId - Optional module ID to clear specific cache
 */
function clearConfigCache(moduleId = null) {
  if (moduleId) {
    configCache.delete(moduleId);
    logger.debug(`Cleared configuration cache for module: ${moduleId}`);
  } else {
    configCache.clear();
    logger.debug('Cleared all module configuration caches');
  }
}

/**
 * Export configuration to a serializable format
 * @param {String} moduleId - Module ID
 * @returns {Promise<Object>} - Exportable configuration
 */
async function exportConfig(moduleId) {
  const config = await getModuleConfig(moduleId, { skipCache: true });
  const module = await moduleService.getModuleById(moduleId);

  return {
    moduleId,
    moduleName: module.name,
    version: module.version,
    exportedAt: new Date().toISOString(),
    config,
  };
}

/**
 * Import configuration from an exported format
 * @param {String} moduleId - Target module ID
 * @param {Object} importData - Imported configuration data
 * @param {Object} options - Import options
 * @returns {Promise<Object>} - Updated configuration
 */
async function importConfig(moduleId, importData, options = {}) {
  // Validate import data
  if (!importData.config) {
    throw new Error('Invalid import data: missing config');
  }

  // Get target module
  const module = await moduleService.getModuleById(moduleId);

  if (!module) {
    throw new Error(`Target module not found: ${moduleId}`);
  }

  // Check version compatibility if not forced
  if (importData.version && !options.force) {
    if (importData.moduleId && importData.moduleId !== moduleId) {
      logger.warn(`Importing config from different module: ${importData.moduleId} -> ${moduleId}`);
    }

    // This could be enhanced with semver compatibility checking
    if (importData.version !== module.version) {
      logger.warn(
        `Version mismatch during config import: ${importData.version} vs ${module.version}`
      );
    }
  }

  // Apply the imported config
  return updateModuleConfig(moduleId, importData.config);
}

module.exports = {
  getModuleConfig,
  updateModuleConfig,
  setConfigValue,
  getConfigValue,
  deleteConfigValue,
  setConfigSchema,
  createDefaultConfig,
  resetConfig,
  bulkUpdateConfig,
  clearConfigCache,
  exportConfig,
  importConfig,
};
