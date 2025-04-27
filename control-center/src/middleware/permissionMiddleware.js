/**
 * Permission middleware
 * Checks if authenticated user has required permissions
 */

/**
 * Check if user has required permissions
 * 
 * @param {String|Array} requiredPermissions - Permission or array of permissions required
 * @returns {Function} - Express middleware
 */
function permissionMiddleware(requiredPermissions) {
  return async (req, res, next) => {
    try {
      // Ensure authentication middleware has run first
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required for this route'
        });
      }

      // Get user permissions from the user object
      const userPermissions = req.user.permissions || [];
      
      // Admin users have all permissions
      if (userPermissions.includes('admin')) {
        return next();
      }
      
      // Convert single permission to array for consistent handling
      const permissions = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];
      
      // Check if user has any of the required permissions
      const hasPermission = permissions.some(permission => 
        userPermissions.includes(permission)
      );
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to access this resource'
        });
      }
      
      // User has required permissions, continue
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed due to server error'
      });
    }
  };
}

/**
 * Check if user has module access
 * 
 * @param {String} moduleId - Module ID to check access for
 * @returns {Function} - Express middleware
 */
function moduleAccessMiddleware(moduleId) {
  return async (req, res, next) => {
    try {
      // Ensure authentication middleware has run first
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required for this route'
        });
      }

      // Admin users have access to all modules
      if (req.user.permissions && req.user.permissions.includes('admin')) {
        return next();
      }
      
      // Check if user has this module enabled
      const userModules = req.user.modules || [];
      const hasAccess = userModules.some(
        module => module.moduleId === moduleId && module.enabled
      );
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: `Access to module "${moduleId}" is required for this resource`
        });
      }
      
      // User has module access, continue
      next();
    } catch (error) {
      console.error('Module access check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Module access check failed due to server error'
      });
    }
  };
}

module.exports = {
  requirePermission: permissionMiddleware,
  requireModuleAccess: moduleAccessMiddleware
};
