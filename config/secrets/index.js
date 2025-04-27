/**
 * Secrets management utility for the-space
 * 
 * This module provides a unified interface for accessing secrets and sensitive configuration.
 * In development, it uses environment variables loaded from .env files.
 * In production, it can be extended to use a secrets manager service.
 */

// Load the environment variables
require('../env').loadEnv();

/**
 * Get a secret from the appropriate source based on environment
 * @param {string} key - The secret key to retrieve
 * @param {string} defaultValue - Default value if not found
 * @returns {string} The secret value
 */
function getSecret(key, defaultValue = undefined) {
  // For production, this could be extended to use AWS Secrets Manager, 
  // HashiCorp Vault, or other services
  if (process.env.NODE_ENV === 'production' && process.env.USE_SECRETS_MANAGER === 'true') {
    // Placeholder for production secrets manager integration
    // This would be implemented when setting up cloud infrastructure
    console.warn(`Using environment variable for ${key} - in production, consider using a secrets manager`);
  }
  
  // Fall back to environment variables
  return process.env[key] || defaultValue;
}

/**
 * Get database credentials as an object
 * @returns {object} Database configuration object
 */
function getDatabaseConfig() {
  return {
    host: getSecret('DB_HOST'),
    port: parseInt(getSecret('DB_PORT', '5432'), 10),
    user: getSecret('DB_USER'),
    password: getSecret('DB_PASSWORD'),
    database: getSecret('DB_NAME'),
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false
  };
}

/**
 * Get Redis configuration as an object
 * @returns {object} Redis configuration object
 */
function getRedisConfig() {
  return {
    host: getSecret('REDIS_HOST'),
    port: parseInt(getSecret('REDIS_PORT', '6379'), 10),
    password: getSecret('REDIS_PASSWORD', ''),
    tls: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : undefined
  };
}

/**
 * Get JWT configuration
 * @returns {object} JWT configuration
 */
function getJwtConfig() {
  return {
    secret: getSecret('JWT_SECRET'),
    expiresIn: parseInt(getSecret('JWT_EXPIRATION', '86400'), 10)
  };
}

module.exports = {
  getSecret,
  getDatabaseConfig,
  getRedisConfig,
  getJwtConfig
};
