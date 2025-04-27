import { Tool, ToolDefinition } from './types';
import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import path from 'path';

interface PackageMetadata {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  toolDefinitions: ToolDefinition[];
  entryPoint: string;
}

interface InstalledPackage extends PackageMetadata {
  path: string;
  tools: Tool[];
}

export class PackageManager extends EventEmitter {
  private packages: Map<string, InstalledPackage> = new Map();
  private readonly packagesDir: string;

  constructor(baseDir: string) {
    super();
    this.packagesDir = path.join(baseDir, 'packages');
  }

  /**
   * Initialize the package manager
   */
  async initialize(): Promise<void> {
    // Ensure packages directory exists
    await fs.mkdir(this.packagesDir, { recursive: true });
    
    // Load installed packages
    await this.loadInstalledPackages();
  }

  /**
   * Install a package from a directory
   */
  async installPackage(packagePath: string): Promise<void> {
    // Read and validate package metadata
    const metadata = await this.readPackageMetadata(packagePath);
    
    // Check dependencies
    await this.checkDependencies(metadata.dependencies || {});

    // Copy package to packages directory
    const targetDir = path.join(this.packagesDir, metadata.name);
    await fs.mkdir(targetDir, { recursive: true });
    await this.copyDirectory(packagePath, targetDir);

    // Load tools from package
    const entryPoint = path.join(targetDir, metadata.entryPoint);
    const toolModule = require(entryPoint);
    const tools = await this.loadToolsFromModule(toolModule, metadata.toolDefinitions);

    // Register package
    this.packages.set(metadata.name, {
      ...metadata,
      path: targetDir,
      tools
    });

    this.emit('packageInstalled', metadata.name);
  }

  /**
   * Uninstall a package
   */
  async uninstallPackage(packageName: string): Promise<void> {
    const pkg = this.packages.get(packageName);
    if (!pkg) {
      throw new Error(`Package ${packageName} is not installed`);
    }

    // Remove package directory
    await fs.rm(pkg.path, { recursive: true, force: true });
    
    // Remove from registry
    this.packages.delete(packageName);

    this.emit('packageUninstalled', packageName);
  }

  /**
   * Get an installed package
   */
  getPackage(packageName: string): InstalledPackage | undefined {
    return this.packages.get(packageName);
  }

  /**
   * List all installed packages
   */
  listPackages(): InstalledPackage[] {
    return Array.from(this.packages.values());
  }

  private async readPackageMetadata(packagePath: string): Promise<PackageMetadata> {
    const metadataPath = path.join(packagePath, 'package.json');
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));

    // Validate required fields
    if (!metadata.name || !metadata.version || !metadata.toolDefinitions || !metadata.entryPoint) {
      throw new Error('Invalid package metadata: missing required fields');
    }

    return metadata;
  }

  private async checkDependencies(dependencies: Record<string, string>): Promise<void> {
    const missing = Object.entries(dependencies)
      .filter(([name]) => !this.packages.has(name));

    if (missing.length > 0) {
      throw new Error(`Missing dependencies: ${missing.map(([name, version]) => `${name}@${version}`).join(', ')}`);
    }
  }

  private async copyDirectory(src: string, dest: string): Promise<void> {
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await fs.mkdir(destPath, { recursive: true });
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  private async loadInstalledPackages(): Promise<void> {
    try {
      const entries = await fs.readdir(this.packagesDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const packagePath = path.join(this.packagesDir, entry.name);
          await this.loadPackage(packagePath);
        }
      }
    } catch (error) {
      // Directory might not exist yet
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  private async loadPackage(packagePath: string): Promise<void> {
    const metadata = await this.readPackageMetadata(packagePath);
    const entryPoint = path.join(packagePath, metadata.entryPoint);
    const toolModule = require(entryPoint);
    const tools = await this.loadToolsFromModule(toolModule, metadata.toolDefinitions);

    this.packages.set(metadata.name, {
      ...metadata,
      path: packagePath,
      tools
    });
  }

  private async loadToolsFromModule(
    module: any,
    definitions: ToolDefinition[]
  ): Promise<Tool[]> {
    return definitions.map(def => {
      const ToolClass = module[def.id];
      if (!ToolClass) {
        throw new Error(`Tool class ${def.id} not found in module`);
      }
      return new ToolClass();
    });
  }
}