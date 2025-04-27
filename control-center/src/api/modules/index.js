/**
 * Module Registry API Routes
 * Handles all module registration and management endpoints
 */
const express = require('express');
const router = express.Router();
const moduleController = require('../../controllers/moduleController');
const authMiddleware = require('../../middleware/authMiddleware');
const { requirePermission } = require('../../middleware/permissionMiddleware');

/**
 * @route   POST /api/modules
 * @desc    Register a new module or update existing one
 * @access  Private/Admin
 */
router.post('/', authMiddleware, requirePermission('admin'), moduleController.registerModule);

/**
 * @route   GET /api/modules
 * @desc    Get all modules, optionally filtered
 * @access  Private
 */
router.get('/', authMiddleware, moduleController.getAllModules);

/**
 * @route   GET /api/modules/:moduleId
 * @desc    Get a specific module by ID
 * @access  Private
 */
router.get('/:moduleId', authMiddleware, moduleController.getModuleById);

/**
 * @route   PUT /api/modules/:moduleId/status
 * @desc    Update a module's status
 * @access  Private/Admin
 */
router.put(
  '/:moduleId/status',
  authMiddleware,
  requirePermission('admin'),
  moduleController.updateModuleStatus
);

/**
 * @route   PUT /api/modules/:moduleId/active
 * @desc    Activate or deactivate a module
 * @access  Private/Admin
 */
router.put(
  '/:moduleId/active',
  authMiddleware,
  requirePermission('admin'),
  moduleController.setModuleActive
);

/**
 * @route   PUT /api/modules/:moduleId/config
 * @desc    Update a module's configuration
 * @access  Private/Admin
 */
router.put(
  '/:moduleId/config',
  authMiddleware,
  requirePermission('admin'),
  moduleController.updateModuleConfig
);

/**
 * @route   POST /api/modules/discover
 * @desc    Discover modules from filesystem
 * @access  Private/Admin
 */
router.post(
  '/discover',
  authMiddleware,
  requirePermission('admin'),
  moduleController.discoverModules
);

/**
 * @route   POST /api/modules/initialize
 * @desc    Initialize all active modules or a specific module
 * @access  Private/Admin
 */
router.post(
  '/initialize',
  authMiddleware,
  requirePermission('admin'),
  moduleController.initializeModules
);

module.exports = router;
