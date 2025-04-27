/**
 * Metrics Service
 * Provides system and API metrics collection and reporting
 */

const os = require('os');
const { logger } = require('../../middleware/logger');

// In-memory storage for metrics (would use Redis or a time-series DB in production)
const metrics = {
  requests: {
    total: 0,
    byEndpoint: {},
    byMethod: {},
    byStatusCode: {}
  },
  response: {
    times: [], // Array of response times for calculating percentiles
    avgTime: 0,
    maxTime: 0,
    minTime: 0
  },
  system: {
    timestamps: [],
    cpu: [],
    memory: [],
    heap: []
  },
  errors: {
    total: 0,
    byType: {},
    byEndpoint: {}
  },
  database: {
    operations: 0,
    queries: 0,
    updates: 0,
    avgQueryTime: 0
  }
};

// Maximum number of data points to keep in memory for each metric
const MAX_DATA_POINTS = 1000;

/**
 * Record API request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {number} responseTime - Response time in ms
 */
const recordApiRequest = (req, res, responseTime) => {
  try {
    const { method, originalUrl } = req;
    const statusCode = res.statusCode;
    const endpoint = originalUrl.split('?')[0]; // Remove query parameters
    
    // Increment total requests
    metrics.requests.total++;
    
    // Record by endpoint
    metrics.requests.byEndpoint[endpoint] = (metrics.requests.byEndpoint[endpoint] || 0) + 1;
    
    // Record by method
    metrics.requests.byMethod[method] = (metrics.requests.byMethod[method] || 0) + 1;
    
    // Record by status code
    metrics.requests.byStatusCode[statusCode] = (metrics.requests.byStatusCode[statusCode] || 0) + 1;
    
    // Record response time
    metrics.response.times.push(responseTime);
    if (metrics.response.times.length > MAX_DATA_POINTS) {
      metrics.response.times.shift(); // Remove oldest data point
    }
    
    // Update response time statistics
    const sum = metrics.response.times.reduce((a, b) => a + b, 0);
    metrics.response.avgTime = sum / metrics.response.times.length;
    metrics.response.maxTime = Math.max(...metrics.response.times);
    metrics.response.minTime = Math.min(...metrics.response.times);
    
    // Record error if applicable
    if (statusCode >= 400) {
      metrics.errors.total++;
      metrics.errors.byEndpoint[endpoint] = (metrics.errors.byEndpoint[endpoint] || 0) + 1;
      
      // Categorize error
      const errorType = getErrorType(statusCode);
      metrics.errors.byType[errorType] = (metrics.errors.byType[errorType] || 0) + 1;
    }
  } catch (error) {
    logger.error('Error recording API metrics', { error });
  }
};

/**
 * Record system metrics
 */
const recordSystemMetrics = () => {
  try {
    const timestamp = Date.now();
    const cpuUsage = process.cpuUsage();
    const memoryUsage = process.memoryUsage();
    
    metrics.system.timestamps.push(timestamp);
    metrics.system.cpu.push(cpuUsage);
    metrics.system.memory.push({
      total: os.totalmem(),
      free: os.freemem(),
      usage: os.totalmem() - os.freemem()
    });
    metrics.system.heap.push({
      used: memoryUsage.heapUsed,
      total: memoryUsage.heapTotal,
      external: memoryUsage.external,
      rss: memoryUsage.rss
    });
    
    // Limit data points
    if (metrics.system.timestamps.length > MAX_DATA_POINTS) {
      metrics.system.timestamps.shift();
      metrics.system.cpu.shift();
      metrics.system.memory.shift();
      metrics.system.heap.shift();
    }
  } catch (error) {
    logger.error('Error recording system metrics', { error });
  }
};

/**
 * Record database operation
 * @param {string} type - Operation type (query, update, etc.)
 * @param {number} time - Operation time in ms
 */
const recordDatabaseOperation = (type, time) => {
  try {
    metrics.database.operations++;
    
    if (type === 'query') {
      metrics.database.queries++;
      
      // Update average query time
      const totalQueryTime = metrics.database.avgQueryTime * (metrics.database.queries - 1) + time;
      metrics.database.avgQueryTime = totalQueryTime / metrics.database.queries;
    } else if (type === 'update') {
      metrics.database.updates++;
    }
  } catch (error) {
    logger.error('Error recording database metrics', { error });
  }
};

/**
 * Get error type from status code
 * @param {number} statusCode - HTTP status code
 * @returns {string} Error type
 */
const getErrorType = (statusCode) => {
  if (statusCode >= 500) return 'server';
  if (statusCode >= 400) return 'client';
  return 'unknown';
};

/**
 * Get all metrics
 * @returns {Object} All metrics
 */
const getMetrics = () => {
  return {
    requests: {
      total: metrics.requests.total,
      byEndpoint: metrics.requests.byEndpoint,
      byMethod: metrics.requests.byMethod,
      byStatusCode: metrics.requests.byStatusCode
    },
    response: {
      avgTime: metrics.response.avgTime,
      maxTime: metrics.response.maxTime,
      minTime: metrics.response.minTime,
      percentiles: calculatePercentiles(metrics.response.times)
    },
    errors: {
      total: metrics.errors.total,
      byType: metrics.errors.byType,
      byEndpoint: metrics.errors.byEndpoint,
      rate: metrics.requests.total > 0 ? metrics.errors.total / metrics.requests.total : 0
    },
    system: {
      currentLoad: calculateCurrentLoad(),
      memoryUsage: calculateMemoryUsage(),
      uptime: process.uptime()
    },
    database: {
      operations: metrics.database.operations,
      queries: metrics.database.queries,
      updates: metrics.database.updates,
      avgQueryTime: metrics.database.avgQueryTime
    }
  };
};

/**
 * Calculate percentiles from response times
 * @param {Array} times - Array of response times
 * @returns {Object} Percentiles
 */
const calculatePercentiles = (times) => {
  if (!times || times.length === 0) return {};
  
  const sorted = [...times].sort((a, b) => a - b);
  const len = sorted.length;
  
  return {
    p50: sorted[Math.floor(len * 0.5)],
    p90: sorted[Math.floor(len * 0.9)],
    p95: sorted[Math.floor(len * 0.95)],
    p99: sorted[Math.floor(len * 0.99)]
  };
};

/**
 * Calculate current system load
 * @returns {Object} System load metrics
 */
const calculateCurrentLoad = () => {
  return {
    cpuUsage: os.loadavg()[0], // 1 minute load average
    cpuCount: os.cpus().length,
    loadPercent: (os.loadavg()[0] / os.cpus().length) * 100
  };
};

/**
 * Calculate memory usage
 * @returns {Object} Memory usage metrics
 */
const calculateMemoryUsage = () => {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const process = global.process.memoryUsage();
  
  return {
    total,
    free,
    used,
    usedPercent: (used / total) * 100,
    process: {
      rss: process.rss,
      heapTotal: process.heapTotal,
      heapUsed: process.heapUsed,
      external: process.external,
      arrayBuffers: process.arrayBuffers
    }
  };
};

/**
 * Create metrics middleware
 * @returns {Function} Express middleware function
 */
const metricsMiddleware = () => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Record system metrics periodically
    if (metrics.requests.total % 100 === 0) { // Every 100 requests
      recordSystemMetrics();
    }
    
    // Add listener for response finish event
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      recordApiRequest(req, res, responseTime);
    });
    
    next();
  };
};

// Start periodic system metrics collection
setInterval(recordSystemMetrics, 60000); // Every minute

module.exports = {
  getMetrics,
  recordApiRequest,
  recordSystemMetrics,
  recordDatabaseOperation,
  metricsMiddleware
};
