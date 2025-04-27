/**
 * Dependency Resolution Service
 * Handles module dependency resolution, version compatibility checking,
 * and dependency graph generation
 */
const semver = require('semver');
const moduleService = require('./moduleService');

/**
 * Check if all dependencies for a module are satisfied
 * @param {Object} module - The module to check dependencies for
 * @param {Array} availableModules - Optional array of available modules (to avoid DB query)
 * @returns {Promise<Object>} - Result with satisfied, missing, and incompatible dependencies
 */
async function checkDependencies(module, availableModules = null) {
  // Get all available modules if not provided
  const modules = availableModules || (await moduleService.getAllModules({ active: true }));

  const result = {
    satisfied: [],
    missing: [],
    incompatible: [],
    optional: [],
  };

  // If no dependencies, return early
  if (
    !module.dependencies ||
    !Array.isArray(module.dependencies) ||
    module.dependencies.length === 0
  ) {
    return result;
  }

  // Check each dependency
  for (const dep of module.dependencies) {
    const depModule = modules.find(m => m.moduleId === dep.moduleId);

    // Handle missing modules
    if (!depModule) {
      if (dep.optional) {
        result.optional.push({
          ...dep,
          reason: 'Module not found',
        });
      } else {
        result.missing.push({
          ...dep,
          reason: 'Module not found',
        });
      }
      continue;
    }

    // Check version compatibility using semver
    const isCompatible = semver.satisfies(depModule.version, dep.version);

    if (!isCompatible) {
      if (dep.optional) {
        result.optional.push({
          ...dep,
          reason: `Incompatible version: required ${dep.version}, found ${depModule.version}`,
          foundVersion: depModule.version,
        });
      } else {
        result.incompatible.push({
          ...dep,
          reason: `Incompatible version: required ${dep.version}, found ${depModule.version}`,
          foundVersion: depModule.version,
        });
      }
      continue;
    }

    // Dependency is satisfied
    result.satisfied.push({
      moduleId: dep.moduleId,
      version: depModule.version,
      requiredVersion: dep.version,
      optional: dep.optional,
    });
  }

  return result;
}

/**
 * Build complete dependency tree for a module
 * @param {String} moduleId - Module ID to build dependency tree for
 * @returns {Promise<Object>} - Dependency tree
 */
async function buildDependencyTree(moduleId) {
  const module = await moduleService.getModuleById(moduleId);
  if (!module) {
    throw new Error(`Module not found: ${moduleId}`);
  }

  return await buildDependencyTreeRecursive(module);
}

/**
 * Recursively build dependency tree for a module
 * @param {Object} module - Module to build dependency tree for
 * @param {Set} visited - Set of already visited module IDs (to prevent infinite recursion)
 * @returns {Promise<Object>} - Dependency tree
 */
async function buildDependencyTreeRecursive(module, visited = new Set()) {
  // Prevent circular dependencies
  if (visited.has(module.moduleId)) {
    return {
      moduleId: module.moduleId,
      version: module.version,
      circular: true,
      dependencies: [],
    };
  }

  // Mark this module as visited
  visited.add(module.moduleId);

  // Build the tree node for this module
  const node = {
    moduleId: module.moduleId,
    name: module.name,
    version: module.version,
    dependencies: [],
  };

  // If no dependencies, return early
  if (
    !module.dependencies ||
    !Array.isArray(module.dependencies) ||
    module.dependencies.length === 0
  ) {
    return node;
  }

  // Process each dependency
  for (const dep of module.dependencies) {
    const depModule = await moduleService.getModuleById(dep.moduleId);

    // Add dependency info whether the module exists or not
    const depNode = {
      moduleId: dep.moduleId,
      requiredVersion: dep.version,
      optional: dep.optional,
      found: !!depModule,
    };

    // Recursively get sub-dependencies if module exists
    if (depModule) {
      depNode.name = depModule.name;
      depNode.version = depModule.version;
      depNode.compatible = semver.satisfies(depModule.version, dep.version);

      // Only process sub-dependencies if compatible and not circular
      if (depNode.compatible && !visited.has(dep.moduleId)) {
        const subTree = await buildDependencyTreeRecursive(depModule, new Set(visited));
        depNode.dependencies = subTree.dependencies;
      }
    }

    node.dependencies.push(depNode);
  }

  return node;
}

/**
 * Find all modules with unresolved dependencies
 * @returns {Promise<Array>} - Modules with unresolved dependencies
 */
async function findModulesWithUnresolvedDependencies() {
  const modules = await moduleService.getAllModules({ active: true });
  const result = [];

  for (const module of modules) {
    const depCheck = await checkDependencies(module, modules);

    if (depCheck.missing.length > 0 || depCheck.incompatible.length > 0) {
      result.push({
        moduleId: module.moduleId,
        name: module.name,
        version: module.version,
        missing: depCheck.missing,
        incompatible: depCheck.incompatible,
      });
    }
  }

  return result;
}

/**
 * Check for circular dependencies in the module registry
 * @returns {Promise<Array>} - Array of circular dependency chains
 */
async function detectCircularDependencies() {
  const modules = await moduleService.getAllModules({ active: true });
  const graph = {};

  // Build directed graph
  for (const module of modules) {
    graph[module.moduleId] = {
      moduleId: module.moduleId,
      name: module.name,
      edges: [],
    };

    // Add edges for non-optional dependencies
    if (module.dependencies && Array.isArray(module.dependencies)) {
      module.dependencies.forEach(dep => {
        if (!dep.optional) {
          graph[module.moduleId].edges.push(dep.moduleId);
        }
      });
    }
  }

  // Find cycles using DFS
  const cycles = [];
  const visited = new Set();
  const recursionStack = new Set();

  function detectCyclesDFS(nodeId, path = []) {
    // Skip if not in graph
    if (!graph[nodeId]) return;

    // Already fully explored this node
    if (visited.has(nodeId)) return;

    // Found a cycle
    if (recursionStack.has(nodeId)) {
      const cycle = [...path.slice(path.indexOf(nodeId)), nodeId];
      cycles.push(cycle);
      return;
    }

    // Mark node as being explored
    recursionStack.add(nodeId);
    path.push(nodeId);

    // Visit neighbors
    graph[nodeId].edges.forEach(neighbor => {
      detectCyclesDFS(neighbor, [...path]);
    });

    // Done exploring this node
    recursionStack.delete(nodeId);
    visited.add(nodeId);
  }

  // Check each node
  for (const nodeId of Object.keys(graph)) {
    if (!visited.has(nodeId)) {
      detectCyclesDFS(nodeId);
    }
  }

  // Convert cycle IDs to module info
  return cycles.map(cycle => {
    return cycle.map(id => ({
      moduleId: id,
      name: graph[id] ? graph[id].name : id,
    }));
  });
}

module.exports = {
  checkDependencies,
  buildDependencyTree,
  findModulesWithUnresolvedDependencies,
  detectCircularDependencies,
};
