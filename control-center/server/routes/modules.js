/**
 * Module Routes
 * Defines API endpoints for module management
 */
const express = require('express');
const { validateModuleRequest } = require('../utils/validation');
const { schemas } = require('../utils/validation');
const moduleController = require('../controllers/moduleController');

const router = express.Router();

// Get all modules
router.get('/', moduleController.getAllModules);

// Get module by ID
router.get('/:moduleId', moduleController.getModuleById);

// Update module configuration
router.patch(
  '/:moduleId/config',
  validateModuleRequest(schemas.config),
  moduleController.updateModuleConfig
);

// Set module active state
router.patch(
  '/:moduleId/active',
  validateModuleRequest(
    Joi.object({
      active: Joi.boolean().required(),
    })
  ),
  moduleController.setModuleActive
);

// Discover new modules
router.post('/discover', moduleController.discoverModules);

module.exports = router;
