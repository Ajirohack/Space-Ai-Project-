/**
 * Analytics routes
 * Handles analytics data retrieval and reporting
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { ApiError } = require('../middleware/errorHandler');
const { 
  validatePagination,
  formatValidationErrors
} = require('../utils/validators');
const { 
  getModelMetrics,
  getApiUsageMetrics,
  getUsageSummary,
  trackModelMetrics
} = require('../services/analytics');

/**
 * @route   GET /api/analytics/summary
 * @desc    Get usage summary
 * @access  Private/Admin
 */
router.get('/summary', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filters = {};
    
    if (startDate) {
      filters.startDate = startDate;
    }
    
    if (endDate) {
      filters.endDate = endDate;
    }
    
    const summary = await getUsageSummary(filters);
    
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/analytics/model-metrics
 * @desc    Get model performance metrics
 * @access  Private/Admin
 */
router.get('/model-metrics', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { startDate, endDate, modelId } = req.query;
    
    // Validate pagination parameters
    const { value } = validatePagination(req.query);
    const { limit, sort } = value;
    
    const filters = {};
    
    if (startDate) {
      filters.startDate = startDate;
    }
    
    if (endDate) {
      filters.endDate = endDate;
    }
    
    if (modelId) {
      filters.modelId = modelId;
    }
    
    const metrics = await getModelMetrics(filters, { limit, sort });
    
    res.status(200).json({
      success: true,
      data: {
        metrics
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/analytics/api-usage
 * @desc    Get API usage metrics
 * @access  Private/Admin
 */
router.get('/api-usage', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { startDate, endDate, userId, action, resourceType } = req.query;
    
    // Validate pagination parameters
    const { value } = validatePagination(req.query);
    const { limit, sort } = value;
    
    const filters = {};
    
    if (startDate) {
      filters.startDate = startDate;
    }
    
    if (endDate) {
      filters.endDate = endDate;
    }
    
    if (userId) {
      filters.userId = userId;
    }
    
    if (action) {
      filters.action = action;
    }
    
    if (resourceType) {
      filters.resourceType = resourceType;
    }
    
    const metrics = await getApiUsageMetrics(filters, { limit, sort });
    
    res.status(200).json({
      success: true,
      data: {
        metrics
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/analytics/track-model
 * @desc    Track model usage metrics
 * @access  Private
 */
router.post('/track-model', authenticate, async (req, res, next) => {
  try {
    const { modelId, responseTime, tokenCount, confidenceScore, errorCount, metadata } = req.body;
    
    if (!modelId) {
      throw new ApiError('Model ID is required', 400);
    }
    
    const metrics = await trackModelMetrics({
      modelId,
      responseTime,
      tokenCount,
      confidenceScore,
      errorCount,
      metadata
    });
    
    res.status(201).json({
      success: true,
      message: 'Model metrics tracked successfully',
      data: {
        metrics
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;