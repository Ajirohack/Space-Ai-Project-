/**
 * Logger Utility
 * Provides consistent logging across the application
 */
const winston = require('winston');
const { format } = winston;

// Custom format for timestamps
const timestamp = format(info => {
  info.timestamp = new Date().toISOString();
  return info;
});

// Create custom format
const customFormat = format.combine(
  timestamp(),
  format.errors({ stack: true }),
  format.metadata(),
  format.colorize(),
  format.printf(({ level, message, timestamp, metadata, stack }) => {
    let log = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present
    if (Object.keys(metadata).length > 0 && metadata.constructor === Object) {
      log += `\nMetadata: ${JSON.stringify(metadata, null, 2)}`;
    }

    // Add stack trace for errors
    if (stack) {
      log += `\nStack: ${stack}`;
    }

    return log;
  })
);

// Configure log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Create logger instance
const logger = winston.createLogger({
  levels,
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports: [
    // Write all logs to console
    new winston.transports.Console(),

    // Write all errors to error.log
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Write all logs to combined.log
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Create a stream object for Morgan integration
const stream = {
  write: message => {
    logger.http(message.trim());
  },
};

// Extend logger object to properly log 'Error' types
const origLog = logger.log;
logger.log = (level, msg, ...args) => {
  if (msg instanceof Error) {
    const { message, stack } = msg;
    return origLog.call(logger, level, message, {
      stack,
      ...args[0],
    });
  }
  return origLog.call(logger, level, msg, ...args);
};

// Add request logging method
logger.logRequest = (req, extra = {}) => {
  const data = {
    method: req.method,
    url: req.url,
    params: req.params,
    query: req.query,
    body: req.body,
    ip: req.ip,
    ...extra,
  };

  logger.info('Incoming request', data);
};

// Add response logging method
logger.logResponse = (req, res, responseTime, extra = {}) => {
  const data = {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    ...extra,
  };

  logger.info('Outgoing response', data);
};

module.exports = logger;
module.exports.stream = stream;
