/**
 * Dependency Resolver Service
 * Provides advanced dependency resolution for the module system
 */
const semver = require('semver');
const moduleService = require('./moduleService');

/**
 * Resolve dependencies for a module
 * @param {Object} module - Module to resolve dependencies for
 * @param {Array} availableModules - List of available modules (optional)
 * @returns {Promise<Object>} - Resolution result
 */
async function resolveDependencies(module, availableModules = null) {
  // If modules aren't provided, fetch all active modules
  const modules = availableModules || await moduleService.getAllModules({ active: true });
  
  const result = {
    resolved: [],
    missing: [],
    incompatible: [],
    optional: [],
    resolutionTree: {}
  };
  
  if (!module.dependencies || !Array.isArray(module.dependencies) || module.dependencies.length === 0) {
    return result;
  }
  
  // Process each dependency
  for (const dep of module.dependencies) {
    const { moduleId, version, optional } = dep;
    
    // Find matching module
    const matchingModule = modules.find(m => m.moduleId === moduleId);
    
    if (!matchingModule) {
      if (optional) {
        result.optional.push({ moduleId, version, reason: 'not-found' });
      } else {
        result.missing.push({ moduleId, version, reason: 'not-found' });
      }
      continue;
    }
    
    // Check version compatibility
    const isCompatible = semver.satisfies(matchingModule.version, version);
    
    if (!isCompatible) {
      if (optional) {
        result.optional.push({
          moduleId,
          version,
          reason: 'incompatible-version',
          available: matchingModule.version
        });
      } else {
        result.incompatible.push({
          moduleId,
          version,
          reason: 'incompatible-version',
          available: matchingModule.version
        });
      }
      continue;
    }
    
    // If we get here, the dependency is resolved
    result.resolved.push({
      moduleId,
      version,
      resolved: matchingModule.version,
      module: matchingModule
    });
    
    // Build resolution tree (recursive resolution)
    result.resolutionTree[moduleId] = await resolveDependencies(matchingModule, modules);
  }
  
  return result;
}

/**
 * Find highest compatible version of a module
 * @param {String} moduleId - Module ID to look for
 * @param {String} versionConstraint - Version constraint (semver)
 * @returns {Promise<Object|null>} - Most compatible module or null
 */
async function findHighestCompatibleVersion(moduleId, versionConstraint) {
  const modules = await moduleService.getAllModuleVersions(moduleId);
  
  if (!modules || modules.length === 0) {
    return null;
  }
  
  // Filter compatible versions
  const compatibleVersions = modules.filter(m => 
    semver.satisfies(m.version, versionConstraint)
  );
  
  if (compatibleVersions.length === 0) {
    return null;
  }
  
  // Sort by semver (descending)
  compatibleVersions.sort((a, b) => semver.rcompare(a.version, b.version));
  
  // Return highest compatible version
  return compatibleVersions[0];
}

/**
 * Check if there are circular dependencies
 * @param {String} moduleId - Starting module ID
 * @returns {Promise<Object>} - Object with result and path if circular dependency found
 */
async function checkCircularDependencies(moduleId) {
  const visited = new Set();
  const inProgress = new Set();
  const path = [];
  
  async function dfs(currentId) {
    if (inProgress.has(currentId)) {
      // Found cycle
      return {
        hasCycle: true,
        cycle: [...path.slice(path.indexOf(currentId)), currentId]
      };
    }
    
    if (visited.has(currentId)) {
      return { hasCycle: false };
    }
    
    inProgress.add(currentId);
    path.push(currentId);
    
    const module = await moduleService.getModuleById(currentId);
    if (!module || !module.dependencies) {
      inProgress.delete(currentId);
      visited.add(currentId);
      path.pop();
      return { hasCycle: false };
    }
    
    // Check each dependency
    for (const dep of module.dependencies) {
      const result = await dfs(dep.moduleId);
      if (result.hasCycle) {
        return result;
      }
    }
    
    inProgress.delete(currentId);
    visited.add(currentId);
    path.pop();
    return { hasCycle: false };
  }
  
  return dfs(moduleId);
}

/**
 * Generate dependency graph for visualization
 * @param {Array} modules - Array of modules to include
 * @returns {Object} - Dependency graph data for visualization
 */
async function generateDependencyGraph(modules) {
  const nodes = [];
  const edges = [];
  
  modules.forEach(module => {
    // Add node
    nodes.push({
      id: module.moduleId,
      label: `${module.name} (${module.version})`,
      status: module.status
    });
    
    // Add edges for dependencies
    if (module.dependencies && Array.isArray(module.dependencies)) {
      module.dependencies.forEach(dep => {
        edges.push({
          from: module.moduleId,
          to: dep.moduleId,
          label: dep.version,
          dashes: dep.optional
        });
      });
    }
  });
  
  return { nodes, edges };
}

/**
 * Check if all module dependencies are compatible with available modules
 * @param {Array} modules - List of modules to analyze
 * @returns {Promise<Object>} - Dependency analysis result
 */
async function analyzeModuleDependencies(modules) {
  const results = {
    compatible: [],
    incompatible: [],
    cycles: []
  };
  
  // Check each module for dependency compatibility
  for (const module of modules) {
    const resolution = await resolveDependencies(module, modules);
    
    if (resolution.missing.length > 0 || resolution.incompatible.length > 0) {
      results.incompatible.push({
        moduleId: module.moduleId,
        name: module.name,
        version: module.version,
        issues: [...resolution.missing, ...resolution.incompatible]
      });
    } else {
      results.compatible.push({
        moduleId: module.moduleId,
        name: module.name,
        version: module.version
      });
    }
    
    // Check for circular dependencies
    const circularCheck = await checkCircularDependencies(module.moduleId);
    if (circularCheck.hasCycle) {
      results.cycles.push({
        moduleId: module.moduleId,
        name: module.name,
        cycle: circularCheck.cycle
      });
    }
  }
  
  return results;
}

/**
 * Try to find alternative versions of modules to satisfy dependency requirements
 * @param {Object} module - Module with dependency issues
 * @returns {Promise<Object>} - Suggested alternatives
 */
async function suggestCompatibleVersions(module) {
  const result = {
    moduleId: module.moduleId,
    name: module.name,
    version: module.version,
    suggestions: []
  };
  
  if (!module.dependencies || !Array.isArray(module.dependencies)) {
    return result;
  }
  
  for (const dep of module.dependencies) {
    // Try to find alternative versions
    const allVersions = await moduleService.getAllModuleVersions(dep.moduleId);
    
    if (!allVersions || allVersions.length === 0) {
      result.suggestions.push({
        moduleId: dep.moduleId,
        status: 'not-found',
        message: 'No versions of this module available'
      });
      continue;
    }
    
    // Find compatible versions
    const compatibleVersions = allVersions
      .filter(m => semver.satisfies(m.version, dep.version))
      .map(m => m.version);
    
    if (compatibleVersions.length > 0) {
      result.suggestions.push({
        moduleId: dep.moduleId,
        status: 'alternatives-found',
        compatibleVersions,
        recommended: compatibleVersions.sort(semver.rcompare)[0]
      });
    } else {
      // Suggest nearest version
      const nearestVersion = findNearestVersion(allVersions, dep.version);
      result.suggestions.push({
        moduleId: dep.moduleId,
        status: 'no-compatible-version',
        availableVersions: allVersions.map(m => m.version).sort(semver.rcompare),
        suggested: nearestVersion
      });
    }
  }
  
  return result;
}

/**
 * Find the nearest version to the target version
 * @param {Array} modules - Array of modules with version info
 * @param {String} targetVersion - Target version constraint
 * @returns {String} - Nearest version
 */
function findNearestVersion(modules, targetVersion) {
  // Extract target version without constraints
  const cleanTarget = semver.coerce(targetVersion);
  if (!cleanTarget) return modules[0].version;
  
  // Calculate version "distance"
  const versionsWithDistance = modules.map(m => {
    const ver = semver.parse(m.version);
    if (!ver) return { version: m.version, distance: Infinity };
    
    const distance = 
      Math.abs(ver.major - cleanTarget.major) * 100 +
      Math.abs(ver.minor - cleanTarget.minor) * 10 +
      Math.abs(ver.patch - cleanTarget.patch);
    
    return { version: m.version, distance };
  });
  
  // Sort by distance
  versionsWithDistance.sort((a, b) => a.distance - b.distance);
  
  return versionsWithDistance[0].version;
}

module.exports = {
  resolveDependencies,
  findHighestCompatibleVersion,
  checkCircularDependencies,
  generateDependencyGraph,
  analyzeModuleDependencies,
  suggestCompatibleVersions
};
