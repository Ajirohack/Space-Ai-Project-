/**
 * Module Controller
 * Handles module management API endpoints
 */
const moduleRegistry = require('../services/ModuleRegistry');
const { validateModuleConfig } = require('../utils/validation');

/**
 * Get all modules
 */
exports.getAllModules = async (req, res, next) => {
  try {
    const modules = moduleRegistry.getAllModules();
    res.json({
      success: true,
      data: modules.map(m => ({
        id: m.id,
        name: m.name,
        version: m.version,
        description: m.description,
        status: m.status,
        active: m.active,
        error: m.error,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get module by ID
 */
exports.getModuleById = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const module = moduleRegistry.getModule(moduleId);

    if (!module) {
      return res.status(404).json({
        success: false,
        error: `Module ${moduleId} not found`,
      });
    }

    res.json({
      success: true,
      data: {
        id: module.id,
        name: module.name,
        version: module.version,
        description: module.description,
        status: module.status,
        active: module.active,
        config: module.config,
        dependencies: module.dependencies,
        error: module.error,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update module configuration
 */
exports.updateModuleConfig = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const { config } = req.body;

    // Validate config
    const validationResult = validateModuleConfig(config);
    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid configuration',
        details: validationResult.errors,
      });
    }

    const updatedModule = await moduleRegistry.updateModuleConfig(moduleId, config);

    res.json({
      success: true,
      data: {
        id: updatedModule.id,
        name: updatedModule.name,
        status: updatedModule.status,
        config: updatedModule.config,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Set module active state
 */
exports.setModuleActive = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const { active } = req.body;

    const module = moduleRegistry.getModule(moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        error: `Module ${moduleId} not found`,
      });
    }

    if (active && module.status !== 'active') {
      await moduleRegistry.initializeModule(moduleId);
    } else if (!active && module.status === 'active') {
      await moduleRegistry.reloadModule(moduleId);
    }

    module.active = active;

    res.json({
      success: true,
      data: {
        id: module.id,
        name: module.name,
        status: module.status,
        active: module.active,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Discover new modules
 */
exports.discoverModules = async (req, res, next) => {
  try {
    const modules = await moduleRegistry.discoverModules();

    res.json({
      success: true,
      data: modules.map(m => ({
        id: m.id,
        name: m.name,
        version: m.version,
        description: m.description,
        status: m.status,
      })),
    });
  } catch (error) {
    next(error);
  }
};
