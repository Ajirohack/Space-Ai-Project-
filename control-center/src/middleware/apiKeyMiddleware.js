/**
 * API Key Middleware
 * Validates API key for service-to-service communication
 */
const config = require('../config/env');

/**
 * Middleware to validate API key in request header
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function validateApiKey(req, res, next) {
  const apiKeyHeader = config.API_KEY_HEADER || 'X-API-Key';
  const providedApiKey = req.headers[apiKeyHeader.toLowerCase()];
  const validApiKey = config.API_KEY;

  if (!providedApiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key is required',
    });
  }

  if (providedApiKey !== validApiKey) {
    console.warn(`Invalid API key attempt: ${req.method} ${req.path}`);
    return res.status(403).json({
      success: false,
      message: 'Invalid API key',
    });
  }

  // API key is valid, proceed
  next();
}

module.exports = validateApiKey;
