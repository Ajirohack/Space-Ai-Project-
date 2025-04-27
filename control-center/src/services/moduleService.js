/**
 * Module Service
 * Handles module registration, discovery, initialization and lifecycle management
 */
const Module = require('../models/module');
const path = require('path');
const fs = require('fs').promises;

/**
 * Register a new module or update existing one
 * @param {Object} moduleData - Module data to register
 * @param {String} userId - ID of user registering the module
 * @returns {Promise<Object>} - Registered module
 */
async function registerModule(moduleData, userId) {
  try {
    // Check if module already exists
    const existingModule = await Module.findOne({ moduleId: moduleData.moduleId });

    if (existingModule) {
      // Update existing module
      Object.assign(existingModule, {
        ...moduleData,
        updatedAt: new Date(),
      });

      await existingModule.save();
      return existingModule;
    } else {
      // Create new module
      const newModule = new Module({
        ...moduleData,
        createdBy: userId,
        registeredAt: new Date(),
        status: 'registered',
      });

      await newModule.save();
      return newModule;
    }
  } catch (error) {
    console.error('Error registering module:', error);
    throw error;
  }
}

/**
 * Get module by ID
 * @param {String} moduleId - Module ID
 * @returns {Promise<Object>} - Module document
 */
async function getModuleById(moduleId) {
  return Module.findOne({ moduleId });
}

/**
 * Get all modules
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} - Array of modules
 */
async function getAllModules(filters = {}) {
  return Module.find(filters);
}

/**
 * Update module status
 * @param {String} moduleId - Module ID
 * @param {String} status - New status
 * @param {String} statusMessage - Optional status message
 * @returns {Promise<Object>} - Updated module
 */
async function updateModuleStatus(moduleId, status, statusMessage = null) {
  const updateData = { status };
  if (statusMessage) updateData.statusMessage = statusMessage;

  return Module.findOneAndUpdate({ moduleId }, updateData, { new: true });
}

/**
 * Activate or deactivate a module
 * @param {String} moduleId - Module ID
 * @param {Boolean} active - Active state
 * @returns {Promise<Object>} - Updated module
 */
async function setModuleActive(moduleId, active) {
  return Module.findOneAndUpdate({ moduleId }, { active }, { new: true });
}

/**
 * Find modules with a specific capability
 * @param {String} capability - Capability to search for
 * @returns {Promise<Array>} - Modules with the capability
 */
async function findModulesByCapability(capability) {
  return Module.findByCapability(capability);
}

/**
 * Check if all required dependencies are available
 * @param {Object} module - Module to check dependencies for
 * @returns {Promise<Object>} - Result with missing and satisfied dependencies
 */
async function checkModuleDependencies(module) {
  const allModules = await getAllModules({ active: true });
  const missing = [];
  const satisfied = [];

  for (const dep of module.dependencies || []) {
    if (dep.optional) continue;

    const depModule = allModules.find(m => m.moduleId === dep.moduleId);

    if (!depModule) {
      missing.push(dep);
    } else if (!depModule.satisfiesVersion(dep.version)) {
      missing.push(dep);
    } else {
      satisfied.push({
        moduleId: dep.moduleId,
        version: depModule.version,
      });
    }
  }

  return { missing, satisfied };
}

/**
 * Get all module dependencies recursively
 * @param {String} moduleId - Starting module ID
 * @returns {Promise<Array>} - Array of all dependencies
 */
async function getAllModuleDependencies(moduleId) {
  const module = await getModuleById(moduleId);
  if (!module) return [];

  const dependencies = [...module.dependencies];
  const processedModules = new Set([moduleId]);

  for (const dep of module.dependencies) {
    if (!processedModules.has(dep.moduleId)) {
      processedModules.add(dep.moduleId);
      const nestedDeps = await getAllModuleDependencies(dep.moduleId);
      dependencies.push(...nestedDeps);
    }
  }

  return dependencies;
}

/**
 * Update module configuration
 * @param {String} moduleId - Module ID
 * @param {Object} config - New configuration
 * @returns {Promise<Object>} - Updated module
 */
async function updateModuleConfig(moduleId, config) {
  return Module.findOneAndUpdate({ moduleId }, { config }, { new: true });
}

module.exports = {
  registerModule,
  getModuleById,
  getAllModules,
  updateModuleStatus,
  setModuleActive,
  findModulesByCapability,
  checkModuleDependencies,
  getAllModuleDependencies,
  updateModuleConfig,
};
