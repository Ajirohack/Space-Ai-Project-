/**
 * Health Check Routes
 * Provides endpoints for system health monitoring and diagnostics
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getHealthCheckData, getFullDiagnostics } = require('../services/health');
const { logger } = require('../middleware/logger');

/**
 * @route   GET /api/health
 * @desc    Basic health check endpoint
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const health = await getHealthCheckData(false);
    res.status(health.status === 'ok' ? 200 : 503).json(health);
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   GET /api/health/detailed
 * @desc    Detailed health check with system info
 * @access  Private (Admin)
 */
router.get('/detailed', authenticate, async (req, res, next) => {
  try {
    // Check if user has admin permission
    if (!req.user.permissions.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access detailed health information'
      });
    }
    
    const health = await getHealthCheckData(true);
    res.status(health.status === 'ok' ? 200 : 503).json(health);
  } catch (error) {
    logger.error('Detailed health check failed', { error });
    next(error);
  }
});

/**
 * @route   GET /api/health/diagnostics
 * @desc    Full system diagnostics
 * @access  Private (Admin)
 */
router.get('/diagnostics', authenticate, async (req, res, next) => {
  try {
    // Check if user has admin permission
    if (!req.user.permissions.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access system diagnostics'
      });
    }
    
    const diagnostics = await getFullDiagnostics();
    res.status(diagnostics.status === 'ok' ? 200 : 503).json(diagnostics);
  } catch (error) {
    logger.error('System diagnostics failed', { error });
    next(error);
  }
});

module.exports = router;
