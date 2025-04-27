/**
 * Health Service
 * Provides health check and system metrics functionality
 */

const os = require('os');
const { getDatabaseStats, isDatabaseConnected, getConnectionInfo } = require('../../utils/database');
const { version } = require('../../../package.json');

/**
 * Get system information for health check
 * @returns {Object} System information
 */
const getSystemInfo = () => {
  return {
    os: {
      type: os.type(),
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      uptime: os.uptime(),
      loadavg: os.loadavg(),
      totalmem: os.totalmem(),
      freemem: os.freemem(),
      cpus: os.cpus().length
    },
    process: {
      uptime: process.uptime(),
      version: process.version,
      memoryUsage: process.memoryUsage()
    }
  };
};

/**
 * Get health check data with database metrics
 * @param {boolean} detailed - Whether to include detailed metrics
 * @returns {Promise<Object>} Health check data
 */
const getHealthCheckData = async (detailed = false) => {
  const dbConnected = isDatabaseConnected();
  
  const health = {
    status: dbConnected ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version,
    environment: process.env.NODE_ENV || 'development',
    database: {
      connected: dbConnected
    }
  };
  
  if (detailed) {
    health.system = getSystemInfo();
    
    if (dbConnected) {
      try {
        health.database.stats = await getDatabaseStats();
        health.database.connection = getConnectionInfo();
      } catch (error) {
        health.database.error = 'Error fetching database stats';
      }
    }
  }
  
  return health;
};

/**
 * Get full system diagnostics
 * @returns {Promise<Object>} System diagnostics
 */
const getFullDiagnostics = async () => {
  const health = await getHealthCheckData(true);
  
  // Add additional diagnostics data
  health.services = {
    // Get status of registered services
    rag: await checkServiceStatus('rag'),
    tools: await checkServiceStatus('tools'),
    ai: await checkServiceStatus('ai')
  };
  
  health.modules = {
    // Get status of registered modules
    registered: await getRegisteredModules(),
    active: await getActiveModules()
  };
  
  health.metrics = {
    requests: getRequestMetrics(),
    errors: getErrorMetrics(),
    performance: getPerformanceMetrics()
  };
  
  return health;
};

/**
 * Check status of a service
 * @param {string} serviceName - Name of service
 * @returns {Promise<Object>} Service status
 */
const checkServiceStatus = async (serviceName) => {
  // Placeholder for actual service checking logic
  // This would typically check if the service is responding
  return {
    name: serviceName,
    status: 'ok',
    lastChecked: new Date().toISOString()
  };
};

/**
 * Get registered modules
 * @returns {Promise<Array>} List of registered modules
 */
const getRegisteredModules = async () => {
  // Placeholder for actual module registry check
  // This would typically query the module collection
  return [];
};

/**
 * Get active modules
 * @returns {Promise<Array>} List of active modules
 */
const getActiveModules = async () => {
  // Placeholder for actual active module check
  // This would typically check which modules are running
  return [];
};

/**
 * Get request metrics
 * @returns {Object} Request metrics
 */
const getRequestMetrics = () => {
  // Placeholder for actual request metrics
  // This would typically come from a metrics collection system
  return {
    total: 0,
    success: 0,
    failed: 0,
    avgResponseTime: 0
  };
};

/**
 * Get error metrics
 * @returns {Object} Error metrics
 */
const getErrorMetrics = () => {
  // Placeholder for actual error metrics
  // This would typically come from error logs or monitoring
  return {
    total: 0,
    byType: {}
  };
};

/**
 * Get performance metrics
 * @returns {Object} Performance metrics
 */
const getPerformanceMetrics = () => {
  // Placeholder for actual performance metrics
  // This would typically come from monitoring tools
  return {
    avgCpuUsage: 0,
    avgMemoryUsage: 0,
    avgResponseTime: 0
  };
};

module.exports = {
  getHealthCheckData,
  getFullDiagnostics,
  getSystemInfo
};
