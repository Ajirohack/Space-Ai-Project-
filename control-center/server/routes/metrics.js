/**
 * Metrics Routes
 * Provides endpoints for system and API metrics
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getMetrics } = require('../services/metrics');
const { logger } = require('../middleware/logger');

/**
 * @route   GET /api/metrics
 * @desc    Get system and API metrics
 * @access  Private (Admin)
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    // Check if user has admin permission
    if (!req.user.permissions.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access metrics'
      });
    }
    
    const metrics = getMetrics();
    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error retrieving metrics', { error });
    next(error);
  }
});

/**
 * @route   GET /api/metrics/requests
 * @desc    Get request metrics only
 * @access  Private (Admin)
 */
router.get('/requests', authenticate, async (req, res, next) => {
  try {
    // Check if user has admin permission
    if (!req.user.permissions.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access metrics'
      });
    }
    
    const metrics = getMetrics();
    res.status(200).json({
      success: true,
      data: {
        requests: metrics.requests,
        response: metrics.response
      }
    });
  } catch (error) {
    logger.error('Error retrieving request metrics', { error });
    next(error);
  }
});

/**
 * @route   GET /api/metrics/system
 * @desc    Get system metrics only
 * @access  Private (Admin)
 */
router.get('/system', authenticate, async (req, res, next) => {
  try {
    // Check if user has admin permission
    if (!req.user.permissions.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access metrics'
      });
    }
    
    const metrics = getMetrics();
    res.status(200).json({
      success: true,
      data: {
        system: metrics.system
      }
    });
  } catch (error) {
    logger.error('Error retrieving system metrics', { error });
    next(error);
  }
});

/**
 * @route   GET /api/metrics/errors
 * @desc    Get error metrics only
 * @access  Private (Admin)
 */
router.get('/errors', authenticate, async (req, res, next) => {
  try {
    // Check if user has admin permission
    if (!req.user.permissions.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access metrics'
      });
    }
    
    const metrics = getMetrics();
    res.status(200).json({
      success: true,
      data: {
        errors: metrics.errors
      }
    });
  } catch (error) {
    logger.error('Error retrieving error metrics', { error });
    next(error);
  }
});

/**
 * @route   GET /api/metrics/database
 * @desc    Get database metrics only
 * @access  Private (Admin)
 */
router.get('/database', authenticate, async (req, res, next) => {
  try {
    // Check if user has admin permission
    if (!req.user.permissions.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access metrics'
      });
    }
    
    const metrics = getMetrics();
    res.status(200).json({
      success: true,
      data: {
        database: metrics.database
      }
    });
  } catch (error) {
    logger.error('Error retrieving database metrics', { error });
    next(error);
  }
});

module.exports = router;
