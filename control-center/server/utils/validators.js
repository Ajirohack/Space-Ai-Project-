/**
 * Validation utilities for the Nexus Control Center
 * Contains validation functions used throughout the application
 */

const Joi = require('joi');
const { isValidEmail } = require('./helpers');

/**
 * Validate user registration data
 * @param {Object} data - User registration data
 * @returns {Object} - Validation result
 */
const validateRegistration = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(8).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'any.required': 'Password is required'
    }),
    name: Joi.string().required().messages({
      'any.required': 'Name is required'
    }),
    invitationCode: Joi.string().required().messages({
      'any.required': 'Invitation code is required'
    }),
    pin: Joi.string().length(6).pattern(/^[0-9]+$/).required().messages({
      'string.length': 'PIN must be 6 digits',
      'string.pattern.base': 'PIN must contain only numbers',
      'any.required': 'PIN is required'
    })
  });

  return schema.validate(data, { abortEarly: false });
};

/**
 * Validate login data
 * @param {Object} data - Login data
 * @returns {Object} - Validation result
 */
const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  });

  return schema.validate(data, { abortEarly: false });
};

/**
 * Validate invitation data
 * @param {Object} data - Invitation data
 * @returns {Object} - Validation result
 */
const validateInvitation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    permissions: Joi.array().items(Joi.string()).default([]),
    expiresIn: Joi.number().default(7).messages({
      'number.base': 'Expiration days must be a number'
    })
  });

  return schema.validate(data, { abortEarly: false });
};

/**
 * Validate module configuration
 * @param {Object} data - Module configuration data
 * @returns {Object} - Validation result
 */
const validateModuleConfig = (data) => {
  const schema = Joi.object({
    moduleId: Joi.string().required().messages({
      'any.required': 'Module ID is required'
    }),
    enabled: Joi.boolean().default(true),
    config: Joi.object().default({})
  });

  return schema.validate(data, { abortEarly: false });
};

/**
 * Validate password reset request
 * @param {Object} data - Password reset data
 * @returns {Object} - Validation result
 */
const validatePasswordReset = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
  });

  return schema.validate(data, { abortEarly: false });
};

/**
 * Validate password update
 * @param {Object} data - Password update data
 * @returns {Object} - Validation result
 */
const validatePasswordUpdate = (data) => {
  const schema = Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Reset token is required'
    }),
    password: Joi.string().min(8).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'any.required': 'Password is required'
    }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required'
    })
  });

  return schema.validate(data, { abortEarly: false });
};

/**
 * Validate pagination parameters
 * @param {Object} params - Pagination parameters
 * @returns {Object} - Validated parameters
 */
const validatePagination = (params) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      'number.base': 'Page must be a number',
      'number.min': 'Page must be at least 1'
    }),
    limit: Joi.number().integer().min(1).max(100).default(10).messages({
      'number.base': 'Limit must be a number',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),
    sort: Joi.string().default('-createdAt'),
    fields: Joi.string()
  });

  return schema.validate(params, { abortEarly: false });
};

/**
 * Validate ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean} - True if valid ObjectId
 */
const isValidObjectId = (id) => {
  if (!id) return false;
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  return objectIdPattern.test(id);
};

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid URL
 */
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Validate date string
 * @param {string} dateString - Date string to validate
 * @returns {boolean} - True if valid date
 */
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

/**
 * Format validation errors
 * @param {Object} error - Joi validation error
 * @returns {Object} - Formatted errors
 */
const formatValidationErrors = (error) => {
  if (!error || !error.details) return {};
  
  return error.details.reduce((acc, curr) => {
    const key = curr.path[0];
    acc[key] = curr.message;
    return acc;
  }, {});
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateInvitation,
  validateModuleConfig,
  validatePasswordReset,
  validatePasswordUpdate,
  validatePagination,
  isValidObjectId,
  isValidUrl,
  isValidDate,
  formatValidationErrors
};
