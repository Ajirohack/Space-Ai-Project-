/**
 * Validation Utilities
 * Contains functions for validating data before processing
 */

/**
 * Validate module data for registration/update
 * @param {Object} moduleData - Module data to validate
 * @returns {Array} - Array of validation errors (empty if valid)
 */
function validateModuleData(moduleData) {
  const errors = [];

  // Required fields
  const requiredFields = ['name', 'moduleId', 'version'];
  for (const field of requiredFields) {
    if (!moduleData[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate moduleId format (alphanumeric with hyphens, no spaces)
  if (moduleData.moduleId && !/^[a-zA-Z0-9-]+$/.test(moduleData.moduleId)) {
    errors.push('Module ID must contain only alphanumeric characters and hyphens');
  }

  // Validate version format (semver)
  if (
    moduleData.version &&
    !/^\d+\.\d+\.\d+(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/.test(
      moduleData.version
    )
  ) {
    errors.push('Version must follow semantic versioning format (x.y.z)');
  }

  // Validate dependencies
  if (moduleData.dependencies) {
    if (!Array.isArray(moduleData.dependencies)) {
      errors.push('Dependencies must be an array');
    } else {
      for (let i = 0; i < moduleData.dependencies.length; i++) {
        const dep = moduleData.dependencies[i];
        if (!dep.moduleId) {
          errors.push(`Dependency at index ${i} is missing moduleId`);
        }
        if (!dep.version) {
          errors.push(`Dependency at index ${i} is missing version`);
        }
      }
    }
  }

  // Validate capabilities
  if (moduleData.capabilities && !Array.isArray(moduleData.capabilities)) {
    errors.push('Capabilities must be an array');
  }

  // Validate config schema if present
  if (moduleData.configSchema && typeof moduleData.configSchema !== 'object') {
    errors.push('Config schema must be an object');
  }

  return errors;
}

/**
 * Validate user data for registration/update
 * @param {Object} userData - User data to validate
 * @returns {Array} - Array of validation errors (empty if valid)
 */
function validateUserData(userData) {
  const errors = [];

  // Required fields
  const requiredFields = ['email', 'password'];
  for (const field of requiredFields) {
    if (!userData[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate email format
  if (userData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
    errors.push('Invalid email format');
  }

  // Validate password strength (minimum 8 characters, at least one letter and one number)
  if (userData.password && !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(userData.password)) {
    errors.push('Password must be at least 8 characters and contain both letters and numbers');
  }

  return errors;
}

module.exports = {
  validateModuleData,
  validateUserData,
};
