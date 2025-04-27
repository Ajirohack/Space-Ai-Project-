/**
 * Environment Configuration
 * Loads and validates environment variables
 */
require('dotenv').config();

// Required environment variables
const REQUIRED_ENV_VARS = ['PORT', 'NODE_ENV', 'MONGODB_URI', 'JWT_SECRET'];

// Check for required environment variables
for (const envVar of REQUIRED_ENV_VARS) {
  if (!process.env[envVar]) {
    console.warn(`⚠️  Missing required environment variable: ${envVar}`);
  }
}

module.exports = {
  // Server configuration
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/control-center',

  // Authentication
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_change_in_production',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '1d',

  // CORS configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:3000'],

  // Module paths
  MODULE_PATHS: process.env.MODULE_PATHS
    ? process.env.MODULE_PATHS.split(',')
    : ['./modules', '../internal-modules', '../external-modules'],

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // AI Council configuration
  AI_COUNCIL_CONFIG: process.env.AI_COUNCIL_CONFIG || './config/ai-council.json',

  // MIS integration settings
  MIS_API_URL: process.env.MIS_API_URL || 'http://localhost:3000',
  MIS_ADMIN_USERNAME: process.env.MIS_ADMIN_USERNAME || 'admin',
  MIS_ADMIN_PASSWORD: process.env.MIS_ADMIN_PASSWORD,
  MIS_OPERATOR_TOKEN: process.env.MIS_OPERATOR_TOKEN,
  MIS_INTEGRATION: process.env.MIS_INTEGRATION === 'false' ? false : true,

  // API Security
  API_KEY_HEADER: process.env.API_KEY_HEADER || 'X-API-Key',
  API_KEY: process.env.API_KEY || 'dev_api_key_change_in_production',

  // Redis cache (optional)
  REDIS_URL: process.env.REDIS_URL,

  // Email configuration
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@example.com',
};
