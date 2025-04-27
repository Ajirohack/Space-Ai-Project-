/**
 * Module Discovery Service
 * Handles finding and registering modules from the filesystem
 */
const fs = require('fs').promises;
const path = require('path');
const moduleService = require('./moduleService');

// Default locations to scan for modules
const DEFAULT_MODULE_PATHS = [
  path.join(process.cwd(), '../internal-modules'),
  path.join(process.cwd(), '../external-modules'),
  path.join(process.cwd(), 'modules'),
];

/**
 * Discover all modules in the configured module paths
 * @param {Array} modulePaths - Optional paths to scan for modules
 * @returns {Promise<Object>} - Discovery results
 */
async function discoverModules(modulePaths = DEFAULT_MODULE_PATHS) {
  const results = {
    discovered: [],
    registered: [],
    errors: [],
  };

  try {
    // Scan each module path
    for (const basePath of modulePaths) {
      try {
        const modules = await scanDirectoryForModules(basePath);
        results.discovered.push(...modules);

        // Register/update discovered modules
        for (const moduleInfo of modules) {
          try {
            const registeredModule = await moduleService.registerModule(moduleInfo, null);
            results.registered.push(registeredModule);
          } catch (error) {
            results.errors.push({
              moduleId: moduleInfo.moduleId,
              error: error.message,
            });
          }
        }
      } catch (error) {
        console.error(`Error scanning directory ${basePath}:`, error);
      }
    }

    return results;
  } catch (error) {
    console.error('Module discovery error:', error);
    throw error;
  }
}

/**
 * Scan a directory for modules
 * @param {String} directoryPath - Path to scan
 * @returns {Promise<Array>} - Array of discovered module info
 */
async function scanDirectoryForModules(directoryPath) {
  try {
    const dirEntries = await fs.readdir(directoryPath, { withFileTypes: true });
    const modules = [];

    // Look for module directories
    for (const entry of dirEntries) {
      if (!entry.isDirectory()) continue;

      const moduleDir = path.join(directoryPath, entry.name);
      const moduleManifestPath = path.join(moduleDir, 'module.json');

      try {
        // Check if module.json exists
        await fs.access(moduleManifestPath);

        // Read and parse module manifest
        const manifestContent = await fs.readFile(moduleManifestPath, 'utf-8');
        const moduleInfo = JSON.parse(manifestContent);

        // Add installPath to the module info
        moduleInfo.installPath = moduleDir;

        modules.push(moduleInfo);
      } catch (error) {
        // Skip directories without a valid module.json
        console.log(`Skipping ${moduleDir}: ${error.message}`);
      }
    }

    return modules;
  } catch (error) {
    console.error(`Error scanning ${directoryPath} for modules:`, error);
    throw error;
  }
}

/**
 * Scan a specific path for a module
 * @param {String} modulePath - Path to module
 * @returns {Promise<Object|null>} - Module info or null if not found
 */
async function scanSingleModule(modulePath) {
  try {
    const moduleManifestPath = path.join(modulePath, 'module.json');

    try {
      // Check if module.json exists
      await fs.access(moduleManifestPath);

      // Read and parse module manifest
      const manifestContent = await fs.readFile(moduleManifestPath, 'utf-8');
      const moduleInfo = JSON.parse(manifestContent);

      // Add installPath to the module info
      moduleInfo.installPath = modulePath;

      return moduleInfo;
    } catch (error) {
      console.log(`Invalid module at ${modulePath}: ${error.message}`);
      return null;
    }
  } catch (error) {
    console.error(`Error scanning ${modulePath}:`, error);
    return null;
  }
}

module.exports = {
  discoverModules,
  scanDirectoryForModules,
  scanSingleModule,
  DEFAULT_MODULE_PATHS,
};
