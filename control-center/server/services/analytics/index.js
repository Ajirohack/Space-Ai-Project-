/**
 * Analytics Service
 * Handles tracking usage and performance metrics
 */

const { ModelMetrics, AuditLog } = require('../../models');

/**
 * Track model usage metrics
 * @param {Object} metrics - Model usage metrics
 * @returns {Promise<Object>} - Saved metrics
 */
const trackModelMetrics = async (metrics) => {
  try {
    const {
      modelId,
      responseTime,
      tokenCount,
      confidenceScore,
      errorCount,
      metadata
    } = metrics;

    if (!modelId) {
      throw new Error('Model ID is required');
    }

    const modelMetrics = await ModelMetrics.create({
      modelId,
      timestamp: new Date(),
      responseTime: responseTime || 0,
      tokenCount: tokenCount || 0,
      confidenceScore: confidenceScore || 0,
      errorCount: errorCount || 0,
      metadata: metadata || {}
    });

    return modelMetrics;
  } catch (error) {
    console.error('Error tracking model metrics:', error);
    // Don't throw error to prevent affecting main application flow
    return null;
  }
};

/**
 * Track API usage
 * @param {Object} data - API usage data
 * @returns {Promise<Object>} - Saved audit log
 */
const trackApiUsage = async (data) => {
  try {
    const {
      userId,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress,
      userAgent
    } = data;

    if (!userId || !action) {
      throw new Error('User ID and action are required');
    }

    const auditLog = await AuditLog.create({
      userId,
      action,
      resourceType: resourceType || 'API',
      resourceId: resourceId || null,
      details: details || {},
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      timestamp: new Date()
    });

    return auditLog;
  } catch (error) {
    console.error('Error tracking API usage:', error);
    // Don't throw error to prevent affecting main application flow
    return null;
  }
};

/**
 * Get model performance metrics
 * @param {Object} filters - Query filters
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Model metrics
 */
const getModelMetrics = async (filters = {}, options = {}) => {
  try {
    const { startDate, endDate, modelId } = filters;
    const { limit = 100, sort = '-timestamp' } = options;

    const query = {};

    if (modelId) {
      query.modelId = modelId;
    }

    if (startDate || endDate) {
      query.timestamp = {};

      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }

      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    const metrics = await ModelMetrics.find(query)
      .sort(sort)
      .limit(limit);

    return metrics;
  } catch (error) {
    console.error('Error getting model metrics:', error);
    throw error;
  }
};

/**
 * Get API usage metrics
 * @param {Object} filters - Query filters
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - API usage metrics
 */
const getApiUsageMetrics = async (filters = {}, options = {}) => {
  try {
    const { startDate, endDate, userId, action, resourceType } = filters;
    const { limit = 100, sort = '-createdAt' } = options;

    const query = {};

    if (userId) {
      query.userId = userId;
    }

    if (action) {
      query.action = action;
    }

    if (resourceType) {
      query.resourceType = resourceType;
    }

    if (startDate || endDate) {
      query.createdAt = {};

      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }

      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const auditLogs = await AuditLog.find(query)
      .sort(sort)
      .limit(limit);

    return auditLogs;
  } catch (error) {
    console.error('Error getting API usage metrics:', error);
    throw error;
  }
};

/**
 * Get usage summary
 * @param {Object} filters - Query filters
 * @returns {Promise<Object>} - Usage summary
 */
const getUsageSummary = async (filters = {}) => {
  try {
    const { startDate, endDate } = filters;

    const query = {};

    if (startDate || endDate) {
      query.createdAt = {};

      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }

      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Get total API calls
    const totalApiCalls = await AuditLog.countDocuments(query);

    // Get API calls by action
    const apiCallsByAction = await AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get API calls by resource type
    const apiCallsByResourceType = await AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$resourceType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get API calls by user
    const apiCallsByUser = await AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get model metrics summary
    const modelMetricsQuery = {};

    if (startDate || endDate) {
      modelMetricsQuery.timestamp = {};

      if (startDate) {
        modelMetricsQuery.timestamp.$gte = new Date(startDate);
      }

      if (endDate) {
        modelMetricsQuery.timestamp.$lte = new Date(endDate);
      }
    }

    // Get total model calls
    const totalModelCalls = await ModelMetrics.countDocuments(modelMetricsQuery);

    // Get average response time
    const avgResponseTime = await ModelMetrics.aggregate([
      { $match: modelMetricsQuery },
      { $group: { _id: null, avg: { $avg: '$responseTime' } } }
    ]);

    // Get model calls by model ID
    const modelCallsByModelId = await ModelMetrics.aggregate([
      { $match: modelMetricsQuery },
      { $group: { _id: '$modelId', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return {
      apiUsage: {
        totalApiCalls,
        apiCallsByAction,
        apiCallsByResourceType,
        apiCallsByUser
      },
      modelUsage: {
        totalModelCalls,
        avgResponseTime: avgResponseTime.length > 0 ? avgResponseTime[0].avg : 0,
        modelCallsByModelId
      }
    };
  } catch (error) {
    console.error('Error getting usage summary:', error);
    throw error;
  }
};

module.exports = {
  trackModelMetrics,
  trackApiUsage,
  getModelMetrics,
  getApiUsageMetrics,
  getUsageSummary
};