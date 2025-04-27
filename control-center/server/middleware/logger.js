/**
 * Logger middleware
 * Provides request logging and performance monitoring
 */

const winston = require('winston');
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize, json } = format;

/**
 * Environment configuration
 */
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

/**
 * Custom format for development logs
 */
const devLogFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let metaStr = '';
  
  if (Object.keys(metadata).length > 0) {
    metaStr = JSON.stringify(metadata, null, 2);
  }
  
  return `${timestamp} [${level}]: ${message} ${metaStr}`;
});

/**
 * Create Winston logger instance
 */
const logger = createLogger({
  level: LOG_LEVEL,
  format: combine(
    timestamp(),
    NODE_ENV === 'development' ? combine(colorize(), devLogFormat) : json()
  ),
  defaultMeta: { service: 'nexus-control-center' },
  transports: [
    // Console transport
    new transports.Console(),
    
    // File transports
    new transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  exceptionHandlers: [
    new transports.File({ filename: 'logs/exceptions.log' })
  ],
  rejectionHandlers: [
    new transports.File({ filename: 'logs/rejections.log' })
  ]
});

/**
 * Request logger middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requestLogger = (req, res, next) => {
  // Add request ID if not present
  req.id = req.id || req.headers['x-request-id'] || require('crypto').randomBytes(16).toString('hex');
  
  // Start time for request
  req.startTime = Date.now();
  
  // Log request
  logger.info(`Request received`, {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  
  // Log response
  res.on('finish', () => {
    const responseTime = Date.now() - req.startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[logLevel](`Request completed`, {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`
    });
  });
  
  next();
};

/**
 * Stream for Morgan HTTP logger
 */
const stream = {
  write: (message) => logger.http(message.trim())
};

module.exports = {
  logger,
  requestLogger,
  stream
};
