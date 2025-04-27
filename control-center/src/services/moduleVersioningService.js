/**
 * Module Versioning Service
 * Provides versioning management for modules in the system
 */
const semver = require('semver');
const moduleService = require('./moduleService');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new version of a module
 * @param {String} moduleId - Module ID to create a version for
 * @param {String} version - New version string (semver)
 * @param {Object} moduleData - Module data for the new version
 * @returns {Promise<Object>} - Newly created module version
 */
async function createModuleVersion(moduleId, version, moduleData) {
  // Validate version format
  if (!semver.valid(version)) {
    throw new Error(`Invalid semver version format: ${version}`);
  }

  // Check if this version already exists
  const existingVersions = await moduleService.getAllModuleVersions(moduleId);
  const versionExists = existingVersions.some(m => semver.eq(m.version, version));

  if (versionExists) {
    throw new Error(`Version ${version} already exists for module ${moduleId}`);
  }

  // Create new version with a unique ID
  const versionedModule = {
    ...moduleData,
    moduleId,
    version,
    versionId: uuidv4(),
    createdAt: new Date(),
    isLatestVersion: false,
  };

  // Save the new version
  const savedVersion = await moduleService.saveModuleVersion(versionedModule);

  // Update latest version flag if this is the highest version
  await updateLatestVersionFlag(moduleId);

  return savedVersion;
}

/**
 * Update which version is marked as latest
 * @param {String} moduleId - Module ID to update
 * @returns {Promise<void>}
 */
async function updateLatestVersionFlag(moduleId) {
  const versions = await moduleService.getAllModuleVersions(moduleId);

  if (!versions || versions.length === 0) {
    return;
  }

  // Sort versions in descending order
  versions.sort((a, b) => semver.rcompare(a.version, b.version));

  // Mark the highest version as latest
  const highestVersion = versions[0];

  // Reset all versions to not be latest
  for (const version of versions) {
    if (version.isLatestVersion && version.versionId !== highestVersion.versionId) {
      await moduleService.updateModuleVersion(version.versionId, { isLatestVersion: false });
    }
  }

  // Set highest version as latest
  if (!highestVersion.isLatestVersion) {
    await moduleService.updateModuleVersion(highestVersion.versionId, { isLatestVersion: true });
  }
}

/**
 * Get module version history
 * @param {String} moduleId - Module ID to get history for
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Array of module versions
 */
async function getVersionHistory(moduleId, options = {}) {
  const versions = await moduleService.getAllModuleVersions(moduleId);

  if (!versions || versions.length === 0) {
    return [];
  }

  // Apply sorting
  if (options.sortDescending) {
    versions.sort((a, b) => semver.rcompare(a.version, b.version));
  } else {
    versions.sort((a, b) => semver.compare(a.version, b.version));
  }

  // Apply limit
  if (options.limit && options.limit > 0) {
    return versions.slice(0, options.limit);
  }

  return versions;
}

/**
 * Compare two versions of a module
 * @param {String} moduleId - Module ID
 * @param {String} version1 - First version to compare
 * @param {String} version2 - Second version to compare
 * @returns {Promise<Object>} - Comparison result
 */
async function compareVersions(moduleId, version1, version2) {
  // Get both versions
  const v1Data = await moduleService.getModuleVersion(moduleId, version1);
  const v2Data = await moduleService.getModuleVersion(moduleId, version2);

  if (!v1Data || !v2Data) {
    throw new Error('One or both versions not found');
  }

  // Calculate semver difference
  const semverDiff = semver.diff(version1, version2);

  // Compare dependencies
  const dependencyChanges = compareDependencies(
    v1Data.dependencies || [],
    v2Data.dependencies || []
  );

  // Compare configurations
  const configChanges = compareConfigurations(v1Data.config || {}, v2Data.config || {});

  // Compare other fields (custom comparison logic)
  const fieldChanges = compareFields(v1Data, v2Data, ['name', 'description', 'author', 'status']);

  return {
    semverDiff,
    dependencyChanges,
    configChanges,
    fieldChanges,
  };
}

/**
 * Compare dependencies between two module versions
 * @param {Array} deps1 - Dependencies from first version
 * @param {Array} deps2 - Dependencies from second version
 * @returns {Object} - Dependency comparison result
 */
function compareDependencies(deps1, deps2) {
  const result = {
    added: [],
    removed: [],
    changed: [],
  };

  // Find added and changed dependencies
  for (const dep2 of deps2) {
    const dep1 = deps1.find(d => d.moduleId === dep2.moduleId);

    if (!dep1) {
      result.added.push(dep2);
    } else if (dep1.version !== dep2.version || dep1.optional !== dep2.optional) {
      result.changed.push({
        moduleId: dep2.moduleId,
        from: { version: dep1.version, optional: dep1.optional },
        to: { version: dep2.version, optional: dep2.optional },
      });
    }
  }

  // Find removed dependencies
  for (const dep1 of deps1) {
    const dep2 = deps2.find(d => d.moduleId === dep1.moduleId);
    if (!dep2) {
      result.removed.push(dep1);
    }
  }

  return result;
}

/**
 * Compare configurations between two module versions
 * @param {Object} config1 - Config from first version
 * @param {Object} config2 - Config from second version
 * @returns {Object} - Configuration comparison result
 */
function compareConfigurations(config1, config2) {
  const result = {
    added: [],
    removed: [],
    changed: [],
  };

  // Find added and changed configs
  for (const key of Object.keys(config2)) {
    if (!(key in config1)) {
      result.added.push({ key, value: config2[key] });
    } else if (JSON.stringify(config1[key]) !== JSON.stringify(config2[key])) {
      result.changed.push({
        key,
        from: config1[key],
        to: config2[key],
      });
    }
  }

  // Find removed configs
  for (const key of Object.keys(config1)) {
    if (!(key in config2)) {
      result.removed.push({ key, value: config1[key] });
    }
  }

  return result;
}

/**
 * Compare specific fields between module versions
 * @param {Object} v1 - First module version
 * @param {Object} v2 - Second module version
 * @param {Array} fields - Fields to compare
 * @returns {Array} - Array of changed fields
 */
function compareFields(v1, v2, fields) {
  const changes = [];

  for (const field of fields) {
    if (v1[field] !== v2[field]) {
      changes.push({
        field,
        from: v1[field],
        to: v2[field],
      });
    }
  }

  return changes;
}

/**
 * Upgrade a module to a new version
 * @param {String} moduleId - Module ID to upgrade
 * @param {String} targetVersion - Version to upgrade to
 * @returns {Promise<Object>} - Upgraded module
 */
async function upgradeModule(moduleId, targetVersion) {
  // Get current active module
  const currentModule = await moduleService.getModuleById(moduleId);

  if (!currentModule) {
    throw new Error(`Module ${moduleId} not found`);
  }

  // Get target version
  const targetVersionData = await moduleService.getModuleVersion(moduleId, targetVersion);

  if (!targetVersionData) {
    throw new Error(`Target version ${targetVersion} not found for module ${moduleId}`);
  }

  // Update current module with target version data
  const updatedModule = await moduleService.updateModule(moduleId, {
    ...targetVersionData,
    updatedAt: new Date(),
    previousVersion: currentModule.version,
  });

  return {
    moduleId,
    previousVersion: currentModule.version,
    newVersion: targetVersion,
    module: updatedModule,
  };
}

/**
 * Roll back a module to previous version
 * @param {String} moduleId - Module ID to roll back
 * @returns {Promise<Object>} - Result of rollback operation
 */
async function rollbackModule(moduleId) {
  // Get current active module
  const currentModule = await moduleService.getModuleById(moduleId);

  if (!currentModule || !currentModule.previousVersion) {
    throw new Error(`Module ${moduleId} not found or has no previous version`);
  }

  // Get the previous version data
  const previousVersionData = await moduleService.getModuleVersion(
    moduleId,
    currentModule.previousVersion
  );

  if (!previousVersionData) {
    throw new Error(
      `Previous version ${currentModule.previousVersion} not found for module ${moduleId}`
    );
  }

  // Store the current version for potential future restore
  const currentVersion = currentModule.version;

  // Update module with previous version data
  const updatedModule = await moduleService.updateModule(moduleId, {
    ...previousVersionData,
    updatedAt: new Date(),
    previousVersion: previousVersionData.previousVersion || null,
  });

  return {
    moduleId,
    rolledBackFrom: currentVersion,
    rolledBackTo: currentModule.previousVersion,
    module: updatedModule,
  };
}

/**
 * Get the latest version of a module
 * @param {String} moduleId - Module ID to get latest version for
 * @returns {Promise<Object>} - Latest module version
 */
async function getLatestVersion(moduleId) {
  const versions = await moduleService.getAllModuleVersions(moduleId);

  if (!versions || versions.length === 0) {
    return null;
  }

  // Option 1: Find version marked as latest
  const markedLatest = versions.find(v => v.isLatestVersion);
  if (markedLatest) {
    return markedLatest;
  }

  // Option 2: Calculate latest by semver (fallback)
  versions.sort((a, b) => semver.rcompare(a.version, b.version));
  return versions[0];
}

/**
 * Apply version migration rules to handle breaking changes
 * @param {String} moduleId - Module ID to apply migration for
 * @param {String} fromVersion - Source version
 * @param {String} toVersion - Target version
 * @returns {Promise<Object>} - Migration results
 */
async function applyVersionMigration(moduleId, fromVersion, toVersion) {
  // Get module migration rules
  const module = await moduleService.getModuleById(moduleId);

  if (!module || !module.migrationRules) {
    return {
      moduleId,
      fromVersion,
      toVersion,
      migrationsApplied: [],
      status: 'no-migrations-needed',
    };
  }

  const appliedMigrations = [];

  // Find and apply relevant migrations
  for (const rule of module.migrationRules) {
    // Check if this migration rule applies to our version transition
    if (
      semver.gte(toVersion, rule.minVersion) &&
      (semver.lt(fromVersion, rule.minVersion) || rule.forceApply)
    ) {
      // Apply migration logic here (could call plugin-specific functions)
      appliedMigrations.push({
        id: rule.id,
        description: rule.description,
        applied: true,
      });
    }
  }

  return {
    moduleId,
    fromVersion,
    toVersion,
    migrationsApplied: appliedMigrations,
    status: appliedMigrations.length > 0 ? 'migrations-applied' : 'no-migrations-needed',
  };
}

module.exports = {
  createModuleVersion,
  updateLatestVersionFlag,
  getVersionHistory,
  compareVersions,
  upgradeModule,
  rollbackModule,
  getLatestVersion,
  applyVersionMigration,
};
