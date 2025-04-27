/**
 * Logging configuration for the-space
 * 
 * This module provides a consistent logging interface using Winston
 * with different configurations based on the environment.
 */

const winston = require('winston');
const path = require('path');
const { loadEnv } = require('../env');

// Ensure environment variables are loaded
loadEnv();

// Define log levels and colors
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to Winston
winston.addColors(colors);

// Determine the log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const logLevel = process.env.LOG_LEVEL || 'info';
  
  // Override with LOG_LEVEL if set, otherwise use defaults
  return logLevel;
};

// Define the format for console and file logs
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.json()
);

// Define log file paths
const logDir = path.join(process.cwd(), 'logs');

// Create the logger with transports based on environment
function createLogger(moduleName = 'app') {
  const transports = [
    // Console logger
    new winston.transports.Console({
      format: consoleFormat,
      level: level(),
    })
  ];
  
  // Add file logging in production and staging
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
    transports.push(
      // Error logs
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        format: fileFormat,
      }),
      // All logs
      new winston.transports.File({ 
        filename: path.join(logDir, 'combined.log'),
        format: fileFormat, 
      })
    );
  }

  // Create the logger instance
  return winston.createLogger({
    level: level(),
    levels,
    format: winston.format.combine(
      winston.format.label({ label: moduleName }),
      winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] })
    ),
    transports,
    // Don't exit on error
    exitOnError: false,
  });
}

// Default logger
const logger = createLogger();

// Helper function to create a logger for a specific module
function getLogger(moduleName) {
  return createLogger(moduleName);
}

module.exports = {
  logger,
  getLogger,
};
