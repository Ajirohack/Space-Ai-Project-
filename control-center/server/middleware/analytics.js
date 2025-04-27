/**
 * Analytics middleware
 * Automatically tracks API usage
 */

const { trackApiUsage } = require('../services/analytics');

/**
 * Track API usage middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const trackApiMiddleware = (req, res, next) => {
  // Skip tracking for certain endpoints
  if (
    req.originalUrl === '/health' ||
    req.originalUrl.startsWith('/api/analytics') ||
    req.method === 'OPTIONS'
  ) {
    return next();
  }

  // Store original end function
  const originalEnd = res.end;

  // Override end function to track API usage after response is sent
  res.end = function(...args) {
    // Call original end function
    originalEnd.apply(res, args);

    // Track API usage asynchronously
    const userId = req.user?._id;
    if (userId) {
      const action = `${req.method.toLowerCase()}_${req.route?.path || req.path}`;
      const resourceType = req.originalUrl.split('/')[2] || 'api';
      const resourceId = req.params?.id;

      trackApiUsage({
        userId,
        action,
        resourceType,
        resourceId,
        details: {
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }).catch(err => {
        console.error('Error tracking API usage:', err);
      });
    }
  };

  next();
};

module.exports = {
  trackApiMiddleware
};