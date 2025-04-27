/**
 * Tools Packages Module for Control Center
 *
 * This module integrates the tools-packages system with the Control Center,
 * providing API endpoints for tool discovery, metadata, and management.
 */

const path = require('path');
const {
  DiscoveryService,
  createDiscoveryRouter,
} = require('../../../internal-modules/tools-packages');
const moduleConfig = require('./config');

// Create a singleton instance of the discovery service
let discoveryService = null;
let scanInterval = null;

/**
 * Initialize the tools packages module
 * @param {Object} app - Express application instance
 * @param {Object} config - Module configuration
 * @returns {Promise<Object>} - Module interface
 */
async function initialize(app, config = {}) {
  console.log('🔧 Initializing Tools Packages module...');

  try {
    // Merge default config with provided config
    const moduleSettings = {
      ...moduleConfig.current(),
      ...config,
    };

    if (moduleSettings.verbose) {
      console.log('📋 Tools Module Configuration:', JSON.stringify(moduleSettings, null, 2));
    }

    // Initialize discovery service if not already created
    if (!discoveryService) {
      discoveryService = new DiscoveryService();
      console.log('✅ Tool Discovery Service initialized');
    }

    // Register API routes for tool discovery
    const toolsRouter = createDiscoveryRouter(discoveryService);
    app.use('/api/tools/discovery', toolsRouter);
    console.log('✅ Tool Discovery API routes registered');

    // Scan for and register tools from configured directories
    if (moduleSettings.toolsDirectories && Array.isArray(moduleSettings.toolsDirectories)) {
      for (const dir of moduleSettings.toolsDirectories) {
        await scanAndRegisterTools(dir, moduleSettings.verbose);
      }
    }

    // Set up periodic scanning if configured
    if (moduleSettings.scanInterval) {
      // Clear any existing interval
      if (scanInterval) {
        clearInterval(scanInterval);
      }

      // Set up new scan interval
      scanInterval = setInterval(() => {
        if (moduleSettings.verbose) {
          console.log('🔄 Running scheduled tool scan...');
        }

        moduleSettings.toolsDirectories.forEach(dir => {
          scanAndRegisterTools(dir, moduleSettings.verbose);
        });
      }, moduleSettings.scanInterval);

      console.log(`✅ Scheduled tool scanning every ${moduleSettings.scanInterval / 1000} seconds`);
    }

    // Return the module's public interface
    return {
      name: 'tools-packages',
      version: '1.0.0',
      discoveryService,
      registerTool: toolDefinition => discoveryService.registerTool(toolDefinition),
      unregisterTool: toolId => discoveryService.unregisterTool(toolId),
      scanDirectory: dir => scanAndRegisterTools(dir, moduleSettings.verbose),
      getAPI: () => ({
        listTools: paging => discoveryService.listTools(paging),
        getTool: id => discoveryService.getTool(id),
        searchTools: (filter, paging) => discoveryService.searchTools(filter, paging),
        getMetadata: () => ({
          tags: Array.from(discoveryService.getTags()),
          capabilities: Array.from(discoveryService.getCapabilities()),
          authors: Array.from(discoveryService.getAuthors()),
          totalTools: discoveryService.getToolsCount(),
        }),
      }),
    };
  } catch (error) {
    console.error('❌ Failed to initialize Tools Packages module:', error);
    throw error;
  }
}

/**
 * Scan a directory for tool packages and register them
 * @param {String} directory - Directory path to scan
 * @param {Boolean} verbose - Enable verbose logging
 */
async function scanAndRegisterTools(directory, verbose = false) {
  try {
    const fs = require('fs').promises;
    const path = require('path');

    if (verbose) {
      console.log(`🔍 Scanning for tools in ${directory}...`);
    }

    try {
      // Check if directory exists
      await fs.access(directory);
    } catch (error) {
      console.log(`⚠️ Tools directory does not exist: ${directory}`);
      return;
    }

    // Get all subdirectories in the tools directory
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const toolDirs = entries.filter(entry => entry.isDirectory());

    let registeredCount = 0;

    for (const dir of toolDirs) {
      const toolDir = path.join(directory, dir.name);
      const manifestPath = path.join(toolDir, 'tool.json');

      try {
        // Check if tool manifest exists
        await fs.access(manifestPath);

        // Read and parse tool manifest
        const manifestContent = await fs.readFile(manifestPath, 'utf-8');
        const toolDefinition = JSON.parse(manifestContent);

        // Add the tool's source directory to the definition if not already set
        if (!toolDefinition.sourcePath) {
          toolDefinition.sourcePath = toolDir;
        }

        // Check if tool already exists
        const existingTool = discoveryService.getTool(toolDefinition.id);

        if (existingTool) {
          // Check if the existing tool is different (based on version or last modified)
          if (existingTool.version !== toolDefinition.version) {
            if (verbose) {
              console.log(
                `🔄 Updating tool: ${toolDefinition.name} (${toolDefinition.id}) from v${existingTool.version} to v${toolDefinition.version}`
              );
            }
            // Replace the existing tool
            discoveryService.unregisterTool(toolDefinition.id);
            discoveryService.registerTool(toolDefinition);
            registeredCount++;
          }
        } else {
          // Register the new tool
          discoveryService.registerTool(toolDefinition);
          if (verbose) {
            console.log(`✅ Registered tool: ${toolDefinition.name} (${toolDefinition.id})`);
          }
          registeredCount++;
        }
      } catch (error) {
        console.error(`❌ Error registering tool in ${toolDir}:`, error.message);
      }
    }

    if (verbose || registeredCount > 0) {
      console.log(`📦 Registered ${registeredCount} tools from ${directory}`);
    }
  } catch (error) {
    console.error(`❌ Error scanning tools directory ${directory}:`, error);
  }
}

/**
 * Cleanup resources when module is unloaded
 */
function cleanup() {
  if (scanInterval) {
    clearInterval(scanInterval);
    scanInterval = null;
  }

  console.log('🧹 Tools Packages module resources cleaned up');
}

// Export module interface
module.exports = {
  name: 'tools-packages',
  description: 'Tools packages management and discovery for the Control Center',
  initialize,
  cleanup,
};
