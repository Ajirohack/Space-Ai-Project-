/**
 * Tools Packages Module Configuration
 *
 * This file defines the configuration options for the tools-packages module.
 */

// Default configuration for development environments
const development = {
  // Directories to scan for tools
  toolsDirectories: [
    // Default tools directory in the internal-modules
    require('path').join(process.cwd(), '../internal-modules/tools-packages/tools'),
    // Additional directory for development tools
    require('path').join(process.cwd(), '../internal-modules/tools-packages/development-tools'),
  ],
  // Scan interval in milliseconds (for auto-discovery of new tools)
  scanInterval: 60000, // 1 minute
  // Enable hot-reloading of tools
  hotReload: true,
  // Enable verbose logging
  verbose: true,
};

// Production configuration
const production = {
  // Directories to scan for tools
  toolsDirectories: [
    // Only use verified tools in production
    require('path').join(process.cwd(), '../internal-modules/tools-packages/tools'),
  ],
  // Scan interval in milliseconds (less frequent in production)
  scanInterval: 300000, // 5 minutes
  // Disable hot-reloading in production for stability
  hotReload: false,
  // Disable verbose logging in production
  verbose: false,
};

// Testing configuration
const testing = {
  // Use mock tools directory for testing
  toolsDirectories: [
    require('path').join(process.cwd(), '../internal-modules/tools-packages/test/mock-tools'),
  ],
  // Disable auto-scanning during tests
  scanInterval: null,
  // Disable hot-reloading during tests
  hotReload: false,
  // Enable verbose logging for tests
  verbose: true,
};

// Export environment-specific configurations
module.exports = {
  development,
  production,
  testing,
  // Helper to get config for current environment
  current: function () {
    const env = process.env.NODE_ENV || 'development';
    return this[env] || this.development;
  },
};
