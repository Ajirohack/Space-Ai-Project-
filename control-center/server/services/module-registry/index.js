const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

class ModuleRegistry extends EventEmitter {
  constructor() {
    super();
    this.modules = new Map();
    this.instances = new Map();
    this.userModuleAssignments = new Map();
  }

  async registerModule(modulePath) {
    try {
      const moduleExports = require(modulePath);
      if (!this.validateModuleInterface(moduleExports)) {
        throw new Error(`Invalid module interface: ${modulePath}`);
      }
      const moduleId = moduleExports.metadata.id;
      this.modules.set(moduleId, {
        path: modulePath,
        metadata: moduleExports.metadata,
        status: 'registered',
        exports: moduleExports
      });
      this.emit('moduleRegistered', moduleId);
      return moduleId;
    } catch (error) {
      console.error(`Failed to register module: ${modulePath}`, error);
      throw error;
    }
  }

  validateModuleInterface(moduleExports) {
    return (
      moduleExports.metadata &&
      moduleExports.metadata.id &&
      moduleExports.metadata.version &&
      typeof moduleExports.initialize === 'function' &&
      typeof moduleExports.execute === 'function'
    );
  }

  async initializeModule(moduleId, config = {}) {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module not found: ${moduleId}`);
    }
    try {
      const instance = await module.exports.initialize(config);
      this.instances.set(moduleId, instance);
      module.status = 'initialized';
      this.emit('moduleInitialized', moduleId);
      return instance;
    } catch (error) {
      module.status = 'failed';
      module.error = error.message;
      throw error;
    }
  }

  async executeModule(moduleId, context) {
    const instance = this.instances.get(moduleId);
    if (!instance) {
      throw new Error(`Module not initialized: ${moduleId}`);
    }
    try {
      const result = await instance.execute(context);
      this.emit('moduleExecuted', {
        moduleId,
        userId: context.user.id,
        executionTime: Date.now()
      });
      return result;
    } catch (error) {
      console.error(`Module execution failed: ${moduleId}`, error);
      throw error;
    }
  }

  assignModuleToUser(userId, moduleId) {
    if (!this.userModuleAssignments.has(userId)) {
      this.userModuleAssignments.set(userId, new Set());
    }
    this.userModuleAssignments.get(userId).add(moduleId);
    this.emit('moduleAssigned', { userId, moduleId });
  }

  getUserModules(userId) {
    return Array.from(this.userModuleAssignments.get(userId) || []);
  }
}

const CharacterArchivistModule = {
  metadata: {
    id: 'character-archivist',
    version: '1.0.0',
    name: 'Character Archivist',
    description: 'Manages character personas and maintains consistent behavior'
  },
  async initialize(config) {
    const instance = {
      config,
      knowledgeBases: {},
      characterTraits: {},
      systemPrompt: await fs.readFile(config.systemPromptPath, 'utf8')
    };
    if (config.knowledgeBasePaths) {
      for (const [characterName, path] of Object.entries(config.knowledgeBasePaths)) {
        instance.knowledgeBases[characterName] = await fs.readFile(path, 'utf8');
      }
    }
    return instance;
  },
  async execute(context) {
    const { message, user, characterName } = context;
    const characterContext = this.buildCharacterContext(characterName);
    const relevantKnowledge = await this.retrieveCharacterKnowledge(message, characterName);
    const response = await this.generateCharacterResponse(
      message,
      characterContext,
      relevantKnowledge
    );
    return {
      response: response.content,
      metadata: {
        characterName,
        sourcesUsed: relevantKnowledge.sources,
        confidence: response.confidence
      }
    };
  }
};

module.exports = {
  ModuleRegistry: new ModuleRegistry(),
  CharacterArchivistModule
};
