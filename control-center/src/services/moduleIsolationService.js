/**
 * Module Isolation Service
 * Provides isolation mechanisms for modules to prevent conflicts and security issues
 */
const vm = require('vm');
const path = require('path');
const fs = require('fs').promises;
const { nanoid } = require('nanoid');
const moduleService = require('./moduleService');
const logger = require('../utils/logger');

// Store for module sandboxes
const sandboxes = new Map();

/**
 * Create an isolated sandbox for a module
 * @param {String} moduleId - ID of the module to isolate
 * @param {Object} options - Sandbox configuration options
 * @returns {Promise<Object>} - Created sandbox details
 */
async function createSandbox(moduleId, options = {}) {
  const module = await moduleService.getModuleById(moduleId);

  if (!module) {
    throw new Error(`Module not found: ${moduleId}`);
  }

  // Create a unique sandbox ID
  const sandboxId = options.sandboxId || `sb-${moduleId}-${nanoid(6)}`;

  // Set up context object for the sandbox
  const context = {
    module: {},
    exports: {},
    require: createIsolatedRequire(moduleId, sandboxId, options),
    console: createSandboxedConsole(moduleId, sandboxId),
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    Buffer,
    process: createSandboxedProcess(),
    __moduleId: moduleId,
    __sandboxId: sandboxId,
  };

  // Add permitted globals from options
  if (options.globals) {
    for (const [key, value] of Object.entries(options.globals)) {
      context[key] = value;
    }
  }

  // Create VM context
  const vmContext = vm.createContext(context);

  // Store sandbox in registry
  const sandboxInfo = {
    id: sandboxId,
    moduleId,
    context: vmContext,
    createdAt: new Date(),
    memoryUsage: process.memoryUsage(),
    status: 'created',
  };

  sandboxes.set(sandboxId, sandboxInfo);

  return {
    sandboxId,
    moduleId,
    status: 'created',
  };
}

/**
 * Execute code within a module's sandbox
 * @param {String} sandboxId - Sandbox ID to execute code in
 * @param {String} code - JavaScript code to execute
 * @param {Object} options - Execution options
 * @returns {Promise<any>} - Result of the code execution
 */
async function executeInSandbox(sandboxId, code, options = {}) {
  const sandbox = sandboxes.get(sandboxId);

  if (!sandbox) {
    throw new Error(`Sandbox not found: ${sandboxId}`);
  }

  let result;
  const executionTimeout = options.timeout || 5000; // 5s default timeout

  try {
    // Create a wrapped script that can be terminated
    const script = new vm.Script(code);

    // Execute with timeout
    result = await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Execution timed out after ${executionTimeout}ms`));
      }, executionTimeout);

      try {
        const scriptResult = script.runInContext(sandbox.context, {
          timeout: executionTimeout,
          displayErrors: true,
        });

        clearTimeout(timeoutId);
        resolve(scriptResult);
      } catch (err) {
        clearTimeout(timeoutId);
        reject(err);
      }
    });

    // Update sandbox status and memory usage
    sandbox.lastExecutedAt = new Date();
    sandbox.lastCode = options.logCode ? code : '(code execution)';
    sandbox.memoryUsage = process.memoryUsage();
    sandbox.status = 'active';

    return {
      success: true,
      result,
      sandboxId,
      moduleId: sandbox.moduleId,
    };
  } catch (error) {
    logger.error(`Sandbox execution error: ${error.message}`, {
      sandboxId,
      moduleId: sandbox.moduleId,
      error: error.stack,
    });

    sandbox.lastError = error.message;
    sandbox.status = 'error';

    return {
      success: false,
      error: error.message,
      sandboxId,
      moduleId: sandbox.moduleId,
    };
  }
}

/**
 * Load and execute a module file in a sandbox
 * @param {String} sandboxId - Sandbox ID
 * @param {String} filePath - Path to the file to execute
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} - Execution result
 */
async function loadModuleInSandbox(sandboxId, filePath, options = {}) {
  try {
    const code = await fs.readFile(filePath, 'utf8');
    const result = await executeInSandbox(sandboxId, code, options);
    return result;
  } catch (error) {
    return {
      success: false,
      error: `Failed to load module: ${error.message}`,
      filePath,
      sandboxId,
    };
  }
}

/**
 * Destroy a sandbox and clean up resources
 * @param {String} sandboxId - ID of the sandbox to destroy
 * @returns {Promise<Object>} - Result of the operation
 */
async function destroySandbox(sandboxId) {
  const sandbox = sandboxes.get(sandboxId);

  if (!sandbox) {
    return {
      success: false,
      error: `Sandbox not found: ${sandboxId}`,
    };
  }

  // Clean up any resources associated with this sandbox
  try {
    // Delete the context to allow garbage collection
    sandbox.context = null;

    // Remove from registry
    sandboxes.delete(sandboxId);

    return {
      success: true,
      sandboxId,
      moduleId: sandbox.moduleId,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to destroy sandbox: ${error.message}`,
      sandboxId,
      moduleId: sandbox.moduleId,
    };
  }
}

/**
 * Create a custom require function for the sandboxed environment
 * @param {String} moduleId - ID of the module
 * @param {String} sandboxId - ID of the sandbox
 * @param {Object} options - Configuration options
 * @returns {Function} - Sandboxed require function
 */
function createIsolatedRequire(moduleId, sandboxId, options = {}) {
  const allowedModules = options.allowedModules || [
    'lodash',
    'uuid',
    'nanoid',
    'dayjs',
    'axios',
    'async',
    'events',
    'validator',
  ];

  // Default paths where modules can be loaded from
  const modulePaths = options.modulePaths || [
    // Internal module paths
    path.join(process.cwd(), 'modules', moduleId, 'lib'),
    path.join(process.cwd(), 'shared', 'lib'),
    // Node modules
    path.join(process.cwd(), 'node_modules'),
  ];

  return function isolatedRequire(moduleName) {
    // Security check - only allow specific modules
    if (
      !allowedModules.includes(moduleName) &&
      !moduleName.startsWith('./') &&
      !moduleName.startsWith('../')
    ) {
      throw new Error(`Module '${moduleName}' is not allowed in the sandbox`);
    }

    try {
      // Handle relative paths
      if (moduleName.startsWith('./') || moduleName.startsWith('../')) {
        // Determine base path for relative requires
        const basePath = options.basePath || path.join(process.cwd(), 'modules', moduleId);
        const fullPath = path.resolve(basePath, moduleName);

        // Security check to prevent path traversal
        if (!fullPath.startsWith(basePath)) {
          throw new Error(`Access denied: Cannot require modules outside the module directory`);
        }

        // Load the module code
        const moduleCode = require('fs').readFileSync(fullPath, 'utf8');

        // Create a new module context
        const moduleContext = vm.createContext({
          module: { exports: {} },
          exports: {},
          require: isolatedRequire,
          __dirname: path.dirname(fullPath),
          __filename: fullPath,
        });

        // Execute in the context
        const script = new vm.Script(moduleCode);
        script.runInContext(moduleContext);

        return moduleContext.module.exports;
      }

      // For allowed npm modules, use real require
      return require(moduleName);
    } catch (error) {
      logger.error(`Failed to require '${moduleName}' in sandbox ${sandboxId}`, {
        moduleId,
        sandboxId,
        error: error.message,
      });
      throw new Error(`Cannot require module '${moduleName}': ${error.message}`);
    }
  };
}

/**
 * Create a sandboxed console object that logs with module context
 * @param {String} moduleId - Module ID for context
 * @param {String} sandboxId - Sandbox ID for context
 * @returns {Object} - Sandboxed console object
 */
function createSandboxedConsole(moduleId, sandboxId) {
  return {
    log: (...args) => {
      logger.info(`[${moduleId}:${sandboxId}] ${args.map(arg => String(arg)).join(' ')}`);
    },
    error: (...args) => {
      logger.error(`[${moduleId}:${sandboxId}] ${args.map(arg => String(arg)).join(' ')}`);
    },
    warn: (...args) => {
      logger.warn(`[${moduleId}:${sandboxId}] ${args.map(arg => String(arg)).join(' ')}`);
    },
    info: (...args) => {
      logger.info(`[${moduleId}:${sandboxId}] ${args.map(arg => String(arg)).join(' ')}`);
    },
    debug: (...args) => {
      logger.debug(`[${moduleId}:${sandboxId}] ${args.map(arg => String(arg)).join(' ')}`);
    },
  };
}

/**
 * Create a limited process object for the sandbox
 * @returns {Object} - Sandboxed process object
 */
function createSandboxedProcess() {
  return {
    env: { NODE_ENV: process.env.NODE_ENV },
    platform: process.platform,
    arch: process.arch,
    version: process.version,
    versions: process.versions,
    hrtime: process.hrtime,
    nextTick: process.nextTick,
  };
}

/**
 * Get information about all active sandboxes
 * @param {String} moduleId - Optional filter by module ID
 * @returns {Array<Object>} - Array of sandbox info objects
 */
function getAllSandboxes(moduleId = null) {
  const result = [];

  for (const [id, sandbox] of sandboxes.entries()) {
    if (!moduleId || sandbox.moduleId === moduleId) {
      result.push({
        id: sandbox.id,
        moduleId: sandbox.moduleId,
        createdAt: sandbox.createdAt,
        lastExecutedAt: sandbox.lastExecutedAt,
        status: sandbox.status,
        memoryUsage: sandbox.memoryUsage,
      });
    }
  }

  return result;
}

/**
 * Apply resource limits to a sandbox
 * @param {String} sandboxId - ID of the sandbox to limit
 * @param {Object} limits - Resource limits to apply
 * @returns {Object} - Updated sandbox info
 */
function setSandboxLimits(sandboxId, limits) {
  const sandbox = sandboxes.get(sandboxId);

  if (!sandbox) {
    throw new Error(`Sandbox not found: ${sandboxId}`);
  }

  // Apply limits (implementation would depend on the VM library capabilities)
  sandbox.limits = {
    ...(sandbox.limits || {}),
    ...limits,
  };

  return {
    sandboxId,
    moduleId: sandbox.moduleId,
    limits: sandbox.limits,
  };
}

/**
 * Create a communication channel between sandboxes
 * @param {String} sourceSandboxId - Source sandbox ID
 * @param {String} targetSandboxId - Target sandbox ID
 * @param {Object} options - Channel configuration
 * @returns {Object} - Communication channel info
 */
function createCommunicationChannel(sourceSandboxId, targetSandboxId, options = {}) {
  const sourceSandbox = sandboxes.get(sourceSandboxId);
  const targetSandbox = sandboxes.get(targetSandboxId);

  if (!sourceSandbox || !targetSandbox) {
    throw new Error('One or both sandboxes not found');
  }

  // Generate channel ID
  const channelId = `channel-${nanoid(6)}`;

  // Create message queue for this channel
  const messageQueue = [];

  // Add send/receive functions to both sandboxes
  sourceSandbox.context.sendMessage = message => {
    messageQueue.push({
      from: sourceSandboxId,
      to: targetSandboxId,
      message,
      timestamp: Date.now(),
    });

    // If target has a message handler, notify it
    if (typeof targetSandbox.context.onMessageReceived === 'function') {
      targetSandbox.context.onMessageReceived(sourceSandboxId, message);
    }
  };

  targetSandbox.context.sendMessage = message => {
    messageQueue.push({
      from: targetSandboxId,
      to: sourceSandboxId,
      message,
      timestamp: Date.now(),
    });

    // If source has a message handler, notify it
    if (typeof sourceSandbox.context.onMessageReceived === 'function') {
      sourceSandbox.context.onMessageReceived(targetSandboxId, message);
    }
  };

  // Add receive function to both contexts
  sourceSandbox.context.receiveMessages = () => {
    return messageQueue.filter(msg => msg.to === sourceSandboxId);
  };

  targetSandbox.context.receiveMessages = () => {
    return messageQueue.filter(msg => msg.to === targetSandboxId);
  };

  return {
    channelId,
    sourceSandboxId,
    targetSandboxId,
    status: 'established',
  };
}

module.exports = {
  createSandbox,
  executeInSandbox,
  loadModuleInSandbox,
  destroySandbox,
  getAllSandboxes,
  setSandboxLimits,
  createCommunicationChannel,
};
