/**
 * Error Handler Middleware
 * Provides centralized error handling for the application
 */
const logger = require('../utils/logger');

class AppError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    Error.captureStackTrace(this, this.constructor);
  }
}

const handleJWTError = () => new AppError(401, 'Invalid token. Please log in again.');

const handleJWTExpiredError = () =>
  new AppError(401, 'Your token has expired. Please log in again.');

const handleValidationError = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  return new AppError(400, `Invalid input data: ${errors.join('. ')}`);
};

const handleDuplicateKeyError = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  return new AppError(400, `Duplicate field value: ${value}. Please use another value.`);
};

const sendErrorDev = (err, res) => {
  logger.error('Error:', {
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });

  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    error: err,
    message: err.message,
    details: err.details,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      details: err.details,
    });
  }
  // Programming or other unknown error: don't leak error details
  else {
    logger.error('Error:', err);

    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Something went wrong',
    });
  }
};

exports.errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (error.name === 'ValidationError') error = handleValidationError(error);
    if (error.code === 11000) error = handleDuplicateKeyError(error);

    sendErrorProd(error, res);
  }
};

exports.AppError = AppError;
