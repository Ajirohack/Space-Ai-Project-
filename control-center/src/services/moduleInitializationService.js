/**
 * Module Initialization Service
 * Handles loading, dependency resolution, and initialization of modules
 */
const path = require('path');
const fs = require('fs').promises;
const moduleService = require('./moduleService');
const Module = require('../models/module');

/**
 * Initialize all active modules in the correct order
 * @returns {Promise<Array>} - Array of initialized modules
 */
async function initializeAllModules() {
  try {
    // Get all active modules
    const modules = await Module.find({ active: true });

    // Build dependency graph
    const graph = buildDependencyGraph(modules);

    // Sort modules based on dependencies
    const sortedModules = topologicalSort(graph);

    // Initialize each module in order
    const results = [];
    for (const moduleId of sortedModules) {
      const module = modules.find(m => m.moduleId === moduleId);
      if (module) {
        const result = await initializeModule(module);
        results.push(result);
      }
    }

    return results;
  } catch (error) {
    console.error('Failed to initialize modules:', error);
    throw error;
  }
}

/**
 * Initialize a single module
 * @param {Object} module - Module document
 * @returns {Promise<Object>} - Initialization result
 */
async function initializeModule(module) {
  try {
    // Update module status to 'initializing'
    await moduleService.updateModuleStatus(module.moduleId, 'initialized', 'Initializing...');

    // Check if module has entry point defined
    if (!module.entryPoint || !module.installPath) {
      return {
        moduleId: module.moduleId,
        success: false,
        error: 'Missing entry point or install path',
      };
    }

    // Check if module entry point exists
    const entryPath = path.join(module.installPath, module.entryPoint);
    try {
      await fs.access(entryPath);
    } catch (err) {
      await moduleService.updateModuleStatus(
        module.moduleId,
        'error',
        `Entry point not found: ${entryPath}`
      );
      return {
        moduleId: module.moduleId,
        success: false,
        error: `Entry point not found: ${entryPath}`,
      };
    }

    // Check module dependencies
    const depCheck = await moduleService.checkModuleDependencies(module);
    if (depCheck.missing.length > 0) {
      const missingDeps = depCheck.missing.map(d => `${d.moduleId}@${d.version}`).join(', ');
      await moduleService.updateModuleStatus(
        module.moduleId,
        'error',
        `Missing dependencies: ${missingDeps}`
      );
      return {
        moduleId: module.moduleId,
        success: false,
        error: `Missing dependencies: ${missingDeps}`,
      };
    }

    // Dynamically load module
    try {
      // In production, you would actually load the module here
      // const moduleExports = require(entryPath);
      // await moduleExports.initialize(module.config);

      // For now, we simulate successful initialization
      await moduleService.updateModuleStatus(
        module.moduleId,
        'active',
        'Module initialized successfully'
      );
      return {
        moduleId: module.moduleId,
        success: true,
      };
    } catch (error) {
      await moduleService.updateModuleStatus(
        module.moduleId,
        'error',
        `Initialization error: ${error.message}`
      );
      return {
        moduleId: module.moduleId,
        success: false,
        error: error.message,
      };
    }
  } catch (error) {
    console.error(`Failed to initialize module ${module.moduleId}:`, error);
    await moduleService.updateModuleStatus(
      module.moduleId,
      'error',
      `System error during initialization: ${error.message}`
    );
    return {
      moduleId: module.moduleId,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Build a dependency graph from modules
 * @param {Array} modules - Array of module documents
 * @returns {Object} - Dependency graph
 */
function buildDependencyGraph(modules) {
  const graph = {};

  // Initialize graph with all modules
  modules.forEach(module => {
    graph[module.moduleId] = [];
  });

  // Add dependencies
  modules.forEach(module => {
    if (module.dependencies && Array.isArray(module.dependencies)) {
      module.dependencies.forEach(dep => {
        if (!dep.optional && graph[dep.moduleId]) {
          graph[module.moduleId].push(dep.moduleId);
        }
      });
    }
  });

  return graph;
}

/**
 * Sort modules topologically based on dependencies
 * @param {Object} graph - Dependency graph
 * @returns {Array} - Topologically sorted modules
 */
function topologicalSort(graph) {
  const visited = new Set();
  const temp = new Set();
  const result = [];

  function visit(node) {
    if (temp.has(node)) {
      throw new Error(`Dependency cycle detected involving module: ${node}`);
    }
    if (visited.has(node)) return;

    temp.add(node);
    (graph[node] || []).forEach(dependency => visit(dependency));
    temp.delete(node);
    visited.add(node);
    result.push(node);
  }

  Object.keys(graph).forEach(node => {
    if (!visited.has(node)) {
      visit(node);
    }
  });

  return result;
}

module.exports = {
  initializeAllModules,
  initializeModule,
};
