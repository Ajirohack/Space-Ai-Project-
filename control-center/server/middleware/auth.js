/**
 * Authentication middleware
 * Verifies JWT tokens and attaches user information to request
 */

const { verifyJWT } = require('../utils/helpers');
const { Membership } = require('../models');

/**
 * Environment configuration
 */
const JWT_SECRET = process.env.JWT_SECRET || 'nexus-control-center-secret';

/**
 * Authentication middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication token required' 
      });
    }
    
    // Verify token
    const decoded = await verifyJWT(token, JWT_SECRET);
    
    // Get user from database
    const user = await Membership.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    if (!user.active) {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is inactive' 
      });
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid authentication token' 
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {...string} roles - Required roles
 * @returns {Function} - Express middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    const hasRole = req.user.permissions.some(permission => roles.includes(permission));
    
    if (!hasRole) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }
    
    next();
  };
};

/**
 * Module access middleware
 * @param {string} moduleId - Required module ID
 * @returns {Function} - Express middleware
 */
const requireModuleAccess = (moduleId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    // Check if user has admin permission
    if (req.user.permissions.includes('admin')) {
      return next();
    }
    
    // Check if user has module access
    const hasModuleAccess = req.user.modules.some(
      module => module.moduleId === moduleId && module.enabled
    );
    
    if (!hasModuleAccess) {
      return res.status(403).json({ 
        success: false, 
        message: 'Module access required' 
      });
    }
    
    next();
  };
};

/**
 * Membership key validation middleware
 * Validates API access via membership key
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateMembershipKey = async (req, res, next) => {
  try {
    // Skip validation for auth routes
    if (req.originalUrl.startsWith('/api/auth')) {
      return next();
    }
    
    // Skip validation for health check
    if (req.originalUrl === '/health') {
      return next();
    }
    
    // Get membership key from header
    const membershipKey = req.headers['x-membership-key'];
    
    if (!membershipKey) {
      return res.status(401).json({
        success: false,
        message: 'Membership key required'
      });
    }
    
    // Find membership by key
    const membership = await Membership.findOne({ membershipKey, active: true });
    
    if (!membership) {
      return res.status(401).json({
        success: false,
        message: 'Invalid membership key'
      });
    }
    
    // Attach membership to request for potential use in routes
    req.membership = membership;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error validating membership key'
    });
  }
};

module.exports = {
  authenticate,
  authorize,
  requireModuleAccess,
  validateMembershipKey
};
