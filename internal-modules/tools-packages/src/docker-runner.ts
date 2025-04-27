import { spawn } from 'child_process';
import { Tool, ToolExecutionResult } from './types';
import path from 'path';
import { promises as fs } from 'fs';
import crypto from 'crypto';
import { VolumeManager } from './volume-manager';
import { ContainerMonitor } from './container-monitor';

interface DockerConfig {
  image: string;
  memory: string;
  cpus: string;
  timeout: number;
  networkMode?: 'none' | 'host' | 'bridge';
  securityOpts?: string[];
  readonlyRootfs?: boolean;
  ulimits?: {
    nofile?: number;
    nproc?: number;
    core?: number;
  };
  resources?: {
    pidsLimit?: number;
    ioMaxIops?: number;
    ioMaxBandwidth?: number;
  };
  persistentStorage?: {
    enabled: boolean;
    maxSize?: string;
    maxVolumes?: number;
  };
}

export class DockerRunner {
  private readonly baseDir: string;
  private readonly volumeManager: VolumeManager;
  private readonly containerMonitor: ContainerMonitor;
  private readonly defaultConfig: DockerConfig;

  constructor(baseDir: string, config: Partial<DockerConfig> = {}) {
    this.baseDir = baseDir;
    this.defaultConfig = { ...this.defaultConfig, ...config };
    this.volumeManager = new VolumeManager(
      'tool-volume-',
      this.defaultConfig.persistentStorage?.maxVolumes
    );
    this.containerMonitor = new ContainerMonitor();

    // Set up monitoring event handlers
    this.containerMonitor.on('warning', (warning) => {
      console.warn(`Container ${warning.containerId} warning: ${warning.message}`);
    });

    this.containerMonitor.on('error', (error) => {
      console.error(`Container ${error.containerId} error:`, error.error);
    });
  }

  async executeTool(tool: Tool, input: any): Promise<ToolExecutionResult> {
    const containerId = crypto.randomBytes(16).toString('hex');
    const workDir = path.join(this.baseDir, 'work', containerId);
    let volumeName: string | undefined;

    try {
      // Create working directory
      await fs.mkdir(workDir, { recursive: true });

      // Write input file
      await fs.writeFile(
        path.join(workDir, 'input.json'),
        JSON.stringify(input),
        'utf8'
      );

      // Write execution script
      await this.writeExecutionScript(workDir, tool);

      // Create persistent volume if enabled
      if (this.defaultConfig.persistentStorage?.enabled) {
        volumeName = await this.volumeManager.createVolume();
        // Initialize volume with any tool-specific data
        if (tool.persistentFiles) {
          await this.volumeManager.initializeVolume(volumeName, tool.persistentFiles);
        }
      }

      // Start monitoring before running container
      await this.containerMonitor.startMonitoring(containerId);

      // Run in Docker
      await this.runContainer(containerId, workDir, volumeName);

      // Parse and validate output
      return await this.parseOutput(workDir);
    } finally {
      // Stop monitoring
      this.containerMonitor.stopMonitoring(containerId);
      
      // Cleanup
      await fs.rm(workDir, { recursive: true, force: true });
      // Don't remove volume if persistence is enabled
      if (!this.defaultConfig.persistentStorage?.enabled && volumeName) {
        await this.volumeManager.removeVolume(volumeName);
      }
    }
  }

  private async writeExecutionScript(workDir: string, tool: Tool): Promise<void> {
    const script = `
      const tool = ${tool.serialize()};
      const fs = require('fs');
      
      async function run() {
        try {
          const input = JSON.parse(fs.readFileSync('/work/input.json', 'utf8'));
          const result = await tool.execute(input);
          fs.writeFileSync('/work/output.json', JSON.stringify(result));
          process.exit(0);
        } catch (error) {
          fs.writeFileSync('/work/error.json', JSON.stringify({
            error: error.message,
            stack: error.stack
          }));
          process.exit(1);
        }
      }
      
      run();
    `;

    await fs.writeFile(path.join(workDir, 'run.js'), script, 'utf8');
  }

  private async runContainer(
    containerId: string, 
    workDir: string,
    volumeName?: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const dockerArgs = [
        'run',
        '--rm',
        '--name', containerId,
        '--memory', this.defaultConfig.memory!,
        '--cpus', this.defaultConfig.cpus!,
        // Security options
        '--security-opt', 'no-new-privileges',
        '--cap-drop', 'ALL',
        '--read-only',
        // Network configuration
        '--network', this.defaultConfig.networkMode || 'none',
        // Resource limits
        '--pids-limit', String(this.defaultConfig.resources?.pidsLimit || 100),
        '--ulimit', `nofile=${this.defaultConfig.ulimits?.nofile || 1024}:${this.defaultConfig.ulimits?.nofile || 1024}`,
        '--ulimit', `nproc=${this.defaultConfig.ulimits?.nproc || 100}:${this.defaultConfig.ulimits?.nproc || 100}`,
        '--device-read-bps', '/dev/sda:10mb',
        '--device-write-bps', '/dev/sda:10mb',
        // Health check
        '--health-cmd', 'node -e "process.exit(0)"',
        '--health-interval', '2s',
        '--health-retries', '3',
        '--health-timeout', '1s',
        // Mount points
        '-v', `${workDir}:/work:ro`,
        '--tmpfs', '/tmp:rw,noexec,nosuid,size=100m'
      ];

      // Add persistent volume if specified
      if (volumeName) {
        dockerArgs.push(
          '-v', `${volumeName}:/data:rw`,
          '--tmpfs', '/data/tmp:rw,noexec,nosuid,size=100m'
        );
      }

      // Add any additional security opts
      if (this.defaultConfig.securityOpts) {
        dockerArgs.push(...this.defaultConfig.securityOpts);
      }

      // Image and command
      dockerArgs.push(
        this.defaultConfig.image,
        'node', '--no-warnings', '--no-deprecation', '/work/run.js'
      );

      const docker = spawn('docker', dockerArgs);

      let stdoutData = '';
      let stderrData = '';

      docker.stdout.on('data', (data) => {
        const chunk = data.toString();
        if (stdoutData.length + chunk.length <= 1024 * 1024) { // Limit output to 1MB
          stdoutData += chunk;
        }
      });

      docker.stderr.on('data', (data) => {
        const chunk = data.toString();
        if (stderrData.length + chunk.length <= 1024 * 1024) { // Limit output to 1MB
          stderrData += chunk;
        }
      });

      const timeout = setTimeout(() => {
        docker.kill();
        reject(new Error(`Tool execution timed out after ${this.defaultConfig.timeout}ms`));
      }, this.defaultConfig.timeout);

      docker.on('close', async (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          // Check container health before resolving
          const isHealthy = await this.containerMonitor.getHealthCheck(containerId);
          if (isHealthy) {
            resolve();
          } else {
            reject(new Error('Container health check failed'));
          }
        } else {
          reject(new Error(`Docker execution failed with code ${code}: ${stderrData}`));
        }
      });

      docker.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Failed to start Docker container: ${error.message}`));
      });
    });
  }

  private async parseOutput(workDir: string): Promise<ToolExecutionResult> {
    try {
      // Check for error first
      try {
        const errorData = await fs.readFile(path.join(workDir, 'error.json'), 'utf8');
        const error = JSON.parse(errorData);
        throw new Error(error.error || 'Tool execution failed');
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw e;
        }
      }

      // Read output
      const outputData = await fs.readFile(path.join(workDir, 'output.json'), 'utf8');
      return JSON.parse(outputData);
    } catch (error) {
      throw new Error(`Failed to parse tool output: ${error.message}`);
    }
  }

  async cleanup(): Promise<void> {
    if (this.defaultConfig.persistentStorage?.enabled) {
      await this.volumeManager.cleanupOldVolumes();
    }
  }
}