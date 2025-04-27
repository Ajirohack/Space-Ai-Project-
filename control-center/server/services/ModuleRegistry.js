/**
 * Module Registry Service
 * Manages module registration, configuration, and lifecycle
 */
const path = require('path');
const fs = require('fs').promises;
const BaseService = require('./BaseService');
const { validateModuleManifest } = require('../utils/validation');
const { withTransaction } = require('../utils/database');
const Module = require('../models/Module');

class ModuleRegistry extends BaseService {
  constructor() {
    super('ModuleRegistry');
    this.modules = new Map();
    this.modulesDir = path.join(process.cwd(), 'modules');
  }

  async _init() {
    await this._ensureModuleDirectory();
    await this._loadModules();
  }

  async _cleanup() {
    for (const [id, module] of this.modules.entries()) {
      if (module.active) {
        await this.deactivateModule(id);
      }
    }
    this.modules.clear();
  }

  async _ensureModuleDirectory() {
    try {
      await fs.mkdir(this.modulesDir, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to create modules directory:', error);
      throw error;
    }
  }

  async _loadModules() {
    try {
      const modules = await Module.find({});
      for (const module of modules) {
        this.modules.set(module.id, module);
        if (module.active) {
          await this.activateModule(module.id);
        }
      }
    } catch (error) {
      this.logger.error('Failed to load modules:', error);
      throw error;
    }
  }

  async registerModule(manifest) {
    const validation = validateModuleManifest(manifest);
    if (!validation.valid) {
      throw new Error(`Invalid module manifest: ${JSON.stringify(validation.errors)}`);
    }

    return await withTransaction(async session => {
      const existingModule = await Module.findOne({ id: manifest.id }).session(session);

      if (existingModule) {
        throw new Error(`Module ${manifest.id} already exists`);
      }

      const module = await Module.create(
        [
          {
            ...manifest,
            active: false,
            config: manifest.settings || {},
          },
        ],
        { session }
      );

      this.modules.set(manifest.id, module[0]);
      this.emit('moduleRegistered', module[0]);

      return module[0];
    });
  }

  async getModule(id) {
    const module = this.modules.get(id);
    if (!module) {
      throw new Error(`Module ${id} not found`);
    }
    return module;
  }

  async getAllModules() {
    return Array.from(this.modules.values());
  }

  async updateModuleConfig(id, config) {
    return await withTransaction(async session => {
      const module = await Module.findOneAndUpdate(
        { id },
        { $set: { config } },
        { new: true, session }
      );

      if (!module) {
        throw new Error(`Module ${id} not found`);
      }

      this.modules.set(id, module);
      this.emit('moduleConfigUpdated', module);

      return module;
    });
  }

  async activateModule(id) {
    return await withTransaction(async session => {
      const module = await Module.findOneAndUpdate(
        { id },
        { $set: { active: true } },
        { new: true, session }
      );

      if (!module) {
        throw new Error(`Module ${id} not found`);
      }

      this.modules.set(id, module);
      this.emit('moduleActivated', module);

      return module;
    });
  }

  async deactivateModule(id) {
    return await withTransaction(async session => {
      const module = await Module.findOneAndUpdate(
        { id },
        { $set: { active: false } },
        { new: true, session }
      );

      if (!module) {
        throw new Error(`Module ${id} not found`);
      }

      this.modules.set(id, module);
      this.emit('moduleDeactivated', module);

      return module;
    });
  }

  async discoverModules() {
    try {
      const files = await fs.readdir(this.modulesDir);
      const manifests = [];

      for (const file of files) {
        if (path.extname(file) === '.json') {
          const manifestPath = path.join(this.modulesDir, file);
          const content = await fs.readFile(manifestPath, 'utf8');
          manifests.push(JSON.parse(content));
        }
      }

      const registeredModules = [];
      for (const manifest of manifests) {
        try {
          const module = await this.registerModule(manifest);
          registeredModules.push(module);
        } catch (error) {
          this.logger.warn(`Failed to register module ${manifest.id}:`, error);
        }
      }

      return registeredModules;
    } catch (error) {
      this.logger.error('Module discovery failed:', error);
      throw error;
    }
  }

  async healthCheck() {
    const baseHealth = await super.healthCheck();
    return {
      ...baseHealth,
      moduleCount: this.modules.size,
      activeModules: Array.from(this.modules.values()).filter(m => m.active).length,
    };
  }
}

module.exports = new ModuleRegistry();
