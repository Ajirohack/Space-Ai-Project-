/**
 * Utility helper functions for the Nexus Control Center
 * Contains common utilities used throughout the application
 */

const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');

/**
 * Generate a secure random token
 * @param {number} length - Length of the token
 * @returns {string} - Random token
 */
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash a string using SHA-256
 * @param {string} data - Data to hash
 * @param {string} salt - Optional salt
 * @returns {string} - Hashed string
 */
const hashString = (data, salt = '') => {
  return crypto
    .createHash('sha256')
    .update(data + salt)
    .digest('hex');
};

/**
 * Generate a secure password hash with salt
 * @param {string} password - Password to hash
 * @returns {Object} - Object containing hash and salt
 */
const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
      if (err) return reject(err);
      resolve({
        hash: derivedKey.toString('hex'),
        salt
      });
    });
  });
};

/**
 * Verify a password against a stored hash
 * @param {string} password - Password to verify
 * @param {string} storedHash - Stored hash
 * @param {string} salt - Salt used for hashing
 * @returns {Promise<boolean>} - True if password matches
 */
const verifyPassword = async (password, storedHash, salt) => {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
      if (err) return reject(err);
      resolve(derivedKey.toString('hex') === storedHash);
    });
  });
};

/**
 * Generate a JWT token
 * @param {Object} payload - Token payload
 * @param {string} secret - Secret key
 * @param {Object} options - JWT options
 * @returns {string} - JWT token
 */
const generateJWT = (payload, secret, options = {}) => {
  const defaultOptions = {
    expiresIn: '1d'
  };
  return jwt.sign(payload, secret, { ...defaultOptions, ...options });
};

/**
 * Verify a JWT token
 * @param {string} token - Token to verify
 * @param {string} secret - Secret key
 * @returns {Promise<Object>} - Decoded token payload
 */
const verifyJWT = async (token, secret) => {
  try {
    const verifyAsync = promisify(jwt.verify);
    return await verifyAsync(token, secret);
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

/**
 * Sanitize an object by removing specified fields
 * @param {Object} obj - Object to sanitize
 * @param {Array<string>} fieldsToRemove - Fields to remove
 * @returns {Object} - Sanitized object
 */
const sanitizeObject = (obj, fieldsToRemove = []) => {
  const sanitized = { ...obj };
  fieldsToRemove.forEach(field => {
    delete sanitized[field];
  });
  return sanitized;
};

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} - Cloned object
 */
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Format a date to ISO string without milliseconds
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
const formatDate = (date = new Date()) => {
  return date.toISOString().split('.')[0] + 'Z';
};

/**
 * Generate a pagination object
 * @param {number} total - Total number of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} - Pagination object
 */
const getPagination = (total, page = 1, limit = 10) => {
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.min(Math.max(1, page), totalPages || 1);
  
  return {
    total,
    totalPages,
    currentPage,
    limit,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
};

/**
 * Validate an email address format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if email is valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate a random PIN code
 * @param {number} digits - Number of digits
 * @returns {string} - PIN code
 */
const generatePIN = (digits = 6) => {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
};

/**
 * Create a slug from a string
 * @param {string} text - Text to convert to slug
 * @returns {string} - Slug
 */
const createSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/&/g, '-and-')   // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word characters
    .replace(/\-\-+/g, '-');  // Replace multiple - with single -
};

/**
 * Parse a query string to filter parameters
 * @param {Object} query - Query object
 * @returns {Object} - Parsed filters
 */
const parseQueryFilters = (query) => {
  const filters = {};
  const reservedParams = ['page', 'limit', 'sort', 'fields'];
  
  Object.keys(query).forEach(key => {
    if (!reservedParams.includes(key)) {
      filters[key] = query[key];
    }
  });
  
  return filters;
};

/**
 * Delay execution for specified milliseconds
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} - Promise that resolves after delay
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} - Promise that resolves with function result
 */
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 300) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const delayTime = baseDelay * Math.pow(2, attempt);
      await delay(delayTime);
    }
  }
  
  throw lastError;
};

module.exports = {
  generateToken,
  hashString,
  hashPassword,
  verifyPassword,
  generateJWT,
  verifyJWT,
  sanitizeObject,
  deepClone,
  formatDate,
  getPagination,
  isValidEmail,
  generatePIN,
  createSlug,
  parseQueryFilters,
  delay,
  retryWithBackoff
};
