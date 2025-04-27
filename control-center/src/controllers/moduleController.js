/**
 * Module Controller
 * Handles API requests related to module registration and management
 */
const moduleService = require('../services/moduleService');
const moduleDiscoveryService = require('../services/moduleDiscoveryService');
const moduleInitializationService = require('../services/moduleInitializationService');
const { validateModuleData } = require('../utils/validation');

/**
 * Register a new module or update existing one
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function registerModule(req, res) {
  try {
    const moduleData = req.body;
    const userId = req.user ? req.user._id : null;

    // Validate module data
    const validationErrors = validateModuleData(moduleData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid module data',
        errors: validationErrors,
      });
    }

    // Register the module
    const module = await moduleService.registerModule(moduleData, userId);

    // Check dependencies
    const dependencies = await moduleService.checkModuleDependencies(module);

    res.status(201).json({
      success: true,
      message: 'Module registered successfully',
      data: {
        module,
        dependencies,
      },
    });
  } catch (error) {
    console.error('Module registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register module',
      error: error.message,
    });
  }
}

/**
 * Get all modules
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getAllModules(req, res) {
  try {
    const { status, active, capability, tag } = req.query;

    // Build filters
    const filters = {};
    if (status) filters.status = status;
    if (active === 'true') filters.active = true;
    if (active === 'false') filters.active = false;

    // Get modules
    let modules;

    if (capability) {
      modules = await moduleService.findModulesByCapability(capability);
    } else if (tag) {
      modules = await Module.findByTag(tag);
    } else {
      modules = await moduleService.getAllModules(filters);
    }

    res.json({
      success: true,
      count: modules.length,
      data: modules,
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch modules',
      error: error.message,
    });
  }
}

/**
 * Get module by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getModuleById(req, res) {
  try {
    const { moduleId } = req.params;
    const module = await moduleService.getModuleById(moduleId);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found',
      });
    }

    res.json({
      success: true,
      data: module,
    });
  } catch (error) {
    console.error(`Error fetching module ${req.params.moduleId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch module',
      error: error.message,
    });
  }
}

/**
 * Update module status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function updateModuleStatus(req, res) {
  try {
    const { moduleId } = req.params;
    const { status, statusMessage } = req.body;

    if (!status || !['registered', 'initialized', 'active', 'error', 'disabled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    const module = await moduleService.updateModuleStatus(moduleId, status, statusMessage);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found',
      });
    }

    res.json({
      success: true,
      message: 'Module status updated successfully',
      data: module,
    });
  } catch (error) {
    console.error(`Error updating module status for ${req.params.moduleId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to update module status',
      error: error.message,
    });
  }
}

/**
 * Activate or deactivate a module
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function setModuleActive(req, res) {
  try {
    const { moduleId } = req.params;
    const { active } = req.body;

    if (typeof active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Active must be a boolean value',
      });
    }

    const module = await moduleService.setModuleActive(moduleId, active);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found',
      });
    }

    res.json({
      success: true,
      message: `Module ${active ? 'activated' : 'deactivated'} successfully`,
      data: module,
    });
  } catch (error) {
    console.error(`Error updating module active state for ${req.params.moduleId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to update module active state',
      error: error.message,
    });
  }
}

/**
 * Update module configuration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function updateModuleConfig(req, res) {
  try {
    const { moduleId } = req.params;
    const { config } = req.body;

    if (!config || typeof config !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Configuration must be an object',
      });
    }

    const module = await moduleService.updateModuleConfig(moduleId, config);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found',
      });
    }

    res.json({
      success: true,
      message: 'Module configuration updated successfully',
      data: module,
    });
  } catch (error) {
    console.error(`Error updating module config for ${req.params.moduleId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to update module configuration',
      error: error.message,
    });
  }
}

/**
 * Discover modules from filesystem
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function discoverModules(req, res) {
  try {
    const { paths } = req.body;

    // Use provided paths or defaults
    const modulePaths = paths || moduleDiscoveryService.DEFAULT_MODULE_PATHS;

    const results = await moduleDiscoveryService.discoverModules(modulePaths);

    res.json({
      success: true,
      message: 'Module discovery completed',
      data: results,
    });
  } catch (error) {
    console.error('Module discovery error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to discover modules',
      error: error.message,
    });
  }
}

/**
 * Initialize all active modules or a specific module
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function initializeModules(req, res) {
  try {
    const { moduleId } = req.query;

    let results;

    if (moduleId) {
      // Initialize a specific module
      const module = await moduleService.getModuleById(moduleId);

      if (!module) {
        return res.status(404).json({
          success: false,
          message: 'Module not found',
        });
      }

      results = await moduleInitializationService.initializeModule(module);
    } else {
      // Initialize all active modules
      results = await moduleInitializationService.initializeAllModules();
    }

    res.json({
      success: true,
      message: 'Module initialization completed',
      data: results,
    });
  } catch (error) {
    console.error('Module initialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize modules',
      error: error.message,
    });
  }
}

module.exports = {
  registerModule,
  getAllModules,
  getModuleById,
  updateModuleStatus,
  setModuleActive,
  updateModuleConfig,
  discoverModules,
  initializeModules,
};
