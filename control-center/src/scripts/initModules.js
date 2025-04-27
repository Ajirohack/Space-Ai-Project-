/**
 * Module Initialization Script
 * Automatically discovers and initializes modules when the Control Center starts
 */
const moduleDiscoveryService = require('../services/moduleDiscoveryService');
const moduleInitializationService = require('../services/moduleInitializationService');
const moduleService = require('../services/moduleService');

/**
 * Main initialization function
 * @returns {Promise<void>}
 */
async function initializeModulesOnStartup() {
  try {
    console.log('🔍 Starting module discovery...');

    // Discover modules from filesystem
    const discoveryResults = await moduleDiscoveryService.discoverModules();

    console.log(
      `✅ Module discovery completed. Found ${discoveryResults.discovered.length} modules.`
    );
    console.log(`   - ${discoveryResults.registered.length} modules registered successfully.`);

    if (discoveryResults.errors.length > 0) {
      console.log(`   - ${discoveryResults.errors.length} modules had registration errors.`);
      console.log('   Registration errors:', discoveryResults.errors);
    }

    // Get all active modules
    const activeModules = await moduleService.getAllModules({ active: true });
    console.log(`🚀 Initializing ${activeModules.length} active modules...`);

    // Initialize modules
    const initResults = await moduleInitializationService.initializeAllModules();

    const successful = initResults.filter(r => r.success).length;
    const failed = initResults.filter(r => !r.success).length;

    console.log('✅ Module initialization completed.');
    console.log(`   - ${successful} modules initialized successfully.`);

    if (failed > 0) {
      console.log(`   - ${failed} modules failed to initialize.`);
      const failedModules = initResults.filter(r => !r.success);
      failedModules.forEach(module => {
        console.log(`     - ${module.moduleId}: ${module.error}`);
      });
    }

    return {
      discovery: discoveryResults,
      initialization: initResults,
    };
  } catch (error) {
    console.error('❌ Error during module initialization:', error);
    throw error;
  }
}

// Allow direct execution
if (require.main === module) {
  initializeModulesOnStartup()
    .then(() => {
      console.log('Module initialization script completed successfully.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Module initialization script failed:', error);
      process.exit(1);
    });
}

module.exports = initializeModulesOnStartup;
