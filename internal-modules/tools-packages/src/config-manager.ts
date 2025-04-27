// Configuration manager for tool system settings and tool-specific configurations
import { promises as fs } from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

interface ConfigOptions {
  configDir: string;
  defaultConfig?: Record<string, any>;
  autoSave?: boolean;
}

export class ConfigManager extends EventEmitter {
  private readonly configPath: string;
  private readonly toolConfigsPath: string;
  private config: Record<string, any>;
  private toolConfigs: Map<string, Record<string, any>> = new Map();
  private readonly autoSave: boolean;

  constructor(options: ConfigOptions) {
    super();
    this.configPath = path.join(options.configDir, 'config.json');
    this.toolConfigsPath = path.join(options.configDir, 'tool-configs');
    this.config = options.defaultConfig || {};
    this.autoSave = options.autoSave ?? true;
  }

  /**
   * Initialize the configuration manager
   */
  async initialize(): Promise<void> {
    try {
      // Ensure directories exist
      await fs.mkdir(path.dirname(this.configPath), { recursive: true });
      await fs.mkdir(this.toolConfigsPath, { recursive: true });

      // Load main configuration
      await this.loadConfig();

      // Load tool configurations
      await this.loadToolConfigs();
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get a configuration value
   */
  get<T>(key: string, defaultValue?: T): T {
    const parts = key.split('.');
    let current: any = this.config;

    for (let i = 0; i < parts.length; i++) {
      if (current === undefined || current === null) {
        return defaultValue as T;
      }
      current = current[parts[i]];
    }

    return current === undefined ? (defaultValue as T) : (current as T);
  }

  /**
   * Set a configuration value
   */
  async set<T>(key: string, value: T): Promise<void> {
    const parts = key.split('.');
    let current: any = this.config;

    for (let i = 0; i < parts.length - 1; i++) {
      if (
        current[parts[i]] === undefined ||
        current[parts[i]] === null ||
        typeof current[parts[i]] !== 'object'
      ) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }

    const lastKey = parts[parts.length - 1];
    const oldValue = current[lastKey];
    current[lastKey] = value;

    // Emit change event
    this.emit('configChanged', { key, oldValue, newValue: value });

    // Auto-save if enabled
    if (this.autoSave) {
      await this.saveConfig();
    }
  }

  /**
   * Get tool-specific configuration
   */
  getToolConfig<T>(toolId: string, key?: string, defaultValue?: T): T | Record<string, any> {
    const toolConfig = this.toolConfigs.get(toolId) || {};

    if (!key) {
      return toolConfig as Record<string, any>;
    }

    const parts = key.split('.');
    let current: any = toolConfig;

    for (let i = 0; i < parts.length; i++) {
      if (current === undefined || current === null) {
        return defaultValue as T;
      }
      current = current[parts[i]];
    }

    return current === undefined ? (defaultValue as T) : (current as T);
  }

  /**
   * Set tool-specific configuration
   */
  async setToolConfig<T>(
    toolId: string,
    keyOrConfig: string | Record<string, any>,
    value?: T
  ): Promise<void> {
    let toolConfig = this.toolConfigs.get(toolId) || {};
    let changes: Record<string, { oldValue: any; newValue: any }> = {};

    if (typeof keyOrConfig === 'string' && value !== undefined) {
      // Set single key
      const key = keyOrConfig;
      const parts = key.split('.');
      let current: any = toolConfig;

      for (let i = 0; i < parts.length - 1; i++) {
        if (
          current[parts[i]] === undefined ||
          current[parts[i]] === null ||
          typeof current[parts[i]] !== 'object'
        ) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }

      const lastKey = parts[parts.length - 1];
      const oldValue = current[lastKey];
      current[lastKey] = value;

      changes[key] = { oldValue, newValue: value };
    } else if (typeof keyOrConfig === 'object') {
      // Update with object
      for (const [key, val] of Object.entries(keyOrConfig)) {
        const oldValue = this.getNestedValue(toolConfig, key);
        this.setNestedValue(toolConfig, key, val);
        changes[key] = { oldValue, newValue: val };
      }
    }

    this.toolConfigs.set(toolId, toolConfig);

    // Emit change events
    for (const [key, change] of Object.entries(changes)) {
      this.emit('toolConfigChanged', {
        toolId,
        key,
        oldValue: change.oldValue,
        newValue: change.newValue,
      });
    }

    // Auto-save if enabled
    if (this.autoSave) {
      await this.saveToolConfig(toolId);
    }
  }

  /**
   * Delete a tool configuration
   */
  async deleteToolConfig(toolId: string): Promise<void> {
    if (this.toolConfigs.has(toolId)) {
      this.toolConfigs.delete(toolId);
      this.emit('toolConfigDeleted', { toolId });

      try {
        const configPath = path.join(this.toolConfigsPath, `${toolId}.json`);
        await fs.unlink(configPath);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }
    }
  }

  /**
   * Save all configurations
   */
  async saveAll(): Promise<void> {
    await this.saveConfig();

    const toolIds = Array.from(this.toolConfigs.keys());
    await Promise.all(toolIds.map(id => this.saveToolConfig(id)));
  }

  /**
   * Load all configurations
   */
  async reloadAll(): Promise<void> {
    await this.loadConfig();
    await this.loadToolConfigs();
  }

  private async loadConfig(): Promise<void> {
    try {
      const data = await fs.readFile(this.configPath, 'utf8');
      this.config = JSON.parse(data);
      this.emit('configLoaded', this.config);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // Config file doesn't exist yet, use defaults
        await this.saveConfig();
      } else {
        throw error;
      }
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2), 'utf8');
      this.emit('configSaved', this.config);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  private async loadToolConfigs(): Promise<void> {
    try {
      const files = await fs.readdir(this.toolConfigsPath);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const toolId = file.slice(0, -5); // Remove .json extension
          const filePath = path.join(this.toolConfigsPath, file);

          try {
            const data = await fs.readFile(filePath, 'utf8');
            const config = JSON.parse(data);
            this.toolConfigs.set(toolId, config);
            this.emit('toolConfigLoaded', { toolId, config });
          } catch (error) {
            this.emit('error', { toolId, error });
          }
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.emit('error', error);
        throw error;
      }
    }
  }

  private async saveToolConfig(toolId: string): Promise<void> {
    const config = this.toolConfigs.get(toolId);
    if (!config) return;

    try {
      const filePath = path.join(this.toolConfigsPath, `${toolId}.json`);
      await fs.writeFile(filePath, JSON.stringify(config, null, 2), 'utf8');
      this.emit('toolConfigSaved', { toolId, config });
    } catch (error) {
      this.emit('error', { toolId, error });
      throw error;
    }
  }

  private getNestedValue(obj: Record<string, any>, path: string): any {
    const parts = path.split('.');
    let current: any = obj;

    for (let i = 0; i < parts.length; i++) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[parts[i]];
    }

    return current;
  }

  private setNestedValue(obj: Record<string, any>, path: string, value: any): void {
    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      if (
        current[parts[i]] === undefined ||
        current[parts[i]] === null ||
        typeof current[parts[i]] !== 'object'
      ) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }

    current[parts[parts.length - 1]] = value;
  }
}
