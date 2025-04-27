// Container monitor for tracking and managing Docker container health and status
import { EventEmitter } from 'events';
import { spawn } from 'child_process';

interface ContainerStats {
  cpuPercentage: number;
  memoryUsage: number;
  memoryLimit: number;
  networkRx: number;
  networkTx: number;
  pids: number;
}

interface ContainerWarning {
  containerId: string;
  message: string;
  timestamp: number;
  metric?: string;
  value?: number;
  threshold?: number;
}

interface ContainerError {
  containerId: string;
  error: Error;
  timestamp: number;
  fatal: boolean;
}

interface MonitoredContainer {
  id: string;
  startTime: number;
  isRunning: boolean;
  healthStatus: 'unknown' | 'healthy' | 'unhealthy';
  lastChecked: number;
  stats: ContainerStats | null;
  warnings: ContainerWarning[];
  errors: ContainerError[];
  monitorInterval?: NodeJS.Timeout;
}

export class ContainerMonitor extends EventEmitter {
  private containers: Map<string, MonitoredContainer>;
  private readonly checkIntervalMs = 1000;
  private readonly healthyThreshold = 3;
  private readonly unhealthyThreshold = 3;

  // Thresholds for generating warnings
  private readonly thresholds = {
    cpuPercentage: 90, // 90% CPU usage
    memoryPercentage: 90, // 90% of allocated memory
    pids: 80, // 80% of PID limit
  };

  constructor() {
    super();
    this.containers = new Map();
  }

  /**
   * Begin monitoring a container
   */
  async startMonitoring(containerId: string): Promise<void> {
    if (this.containers.has(containerId)) {
      return;
    }

    const container: MonitoredContainer = {
      id: containerId,
      startTime: Date.now(),
      isRunning: true,
      healthStatus: 'unknown',
      lastChecked: 0,
      stats: null,
      warnings: [],
      errors: [],
    };

    this.containers.set(containerId, container);

    // Start the monitoring interval
    container.monitorInterval = setInterval(
      () => this.checkContainer(containerId),
      this.checkIntervalMs
    );

    // Initial check to verify container exists
    try {
      await this.checkContainerExists(containerId);
    } catch (error) {
      this.handleError(containerId, error as Error, true);
      this.stopMonitoring(containerId);
    }
  }

  /**
   * Stop monitoring a container
   */
  stopMonitoring(containerId: string): void {
    const container = this.containers.get(containerId);
    if (!container) {
      return;
    }

    if (container.monitorInterval) {
      clearInterval(container.monitorInterval);
    }

    container.isRunning = false;
    // Keep the container data for historical purposes
  }

  /**
   * Get the current health status of a container
   */
  async getHealthCheck(containerId: string): Promise<boolean> {
    const container = this.containers.get(containerId);
    if (!container) {
      return false;
    }

    try {
      const result = await this.executeDockerCommand([
        'inspect',
        '--format',
        '{{.State.Health.Status}}',
        containerId,
      ]);

      const status = result.trim();

      // Update the container's health status
      if (status === 'healthy') {
        container.healthStatus = 'healthy';
      } else if (status === 'unhealthy') {
        container.healthStatus = 'unhealthy';
      }

      container.lastChecked = Date.now();

      return container.healthStatus === 'healthy';
    } catch (error) {
      this.handleError(containerId, error as Error);
      return false;
    }
  }

  /**
   * Get statistics about a container's resource usage
   */
  async getContainerStats(containerId: string): Promise<ContainerStats | null> {
    const container = this.containers.get(containerId);
    if (!container || !container.isRunning) {
      return null;
    }

    try {
      const result = await this.executeDockerCommand([
        'stats',
        '--no-stream',
        '--format',
        '{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.PIDs}}',
        containerId,
      ]);

      const [cpuStr, memStr, netStr, pidsStr] = result.trim().split('\t');

      // Parse CPU percentage (remove % sign and convert to number)
      const cpuPercentage = parseFloat(cpuStr.replace('%', ''));

      // Parse memory usage (format: 1.5MiB / 2GiB)
      const memParts = memStr.split(' / ');
      const memoryUsage = this.parseMemoryValue(memParts[0]);
      const memoryLimit = this.parseMemoryValue(memParts[1]);

      // Parse network IO (format: 648B / 648B)
      const netParts = netStr.split(' / ');
      const networkRx = this.parseDataValue(netParts[0]);
      const networkTx = this.parseDataValue(netParts[1]);

      // Parse PIDs
      const pids = parseInt(pidsStr, 10);

      const stats: ContainerStats = {
        cpuPercentage,
        memoryUsage,
        memoryLimit,
        networkRx,
        networkTx,
        pids,
      };

      container.stats = stats;

      // Check for threshold violations
      this.checkResourceThresholds(containerId, stats);

      return stats;
    } catch (error) {
      // Don't treat stats collection failures as critical errors
      console.warn(`Failed to collect stats for container ${containerId}: ${error}`);
      return null;
    }
  }

  /**
   * Check if a container exists
   */
  private async checkContainerExists(containerId: string): Promise<boolean> {
    try {
      await this.executeDockerCommand(['container', 'inspect', containerId]);
      return true;
    } catch (error) {
      throw new Error(`Container ${containerId} does not exist`);
    }
  }

  /**
   * Check container health and stats
   */
  private async checkContainer(containerId: string): Promise<void> {
    const container = this.containers.get(containerId);
    if (!container || !container.isRunning) {
      return;
    }

    try {
      // Check if container is still running
      const isRunning = await this.isContainerRunning(containerId);
      if (!isRunning) {
        container.isRunning = false;
        this.emit('warning', {
          containerId,
          message: 'Container is not running',
          timestamp: Date.now(),
        });
        this.stopMonitoring(containerId);
        return;
      }

      // Check health status
      await this.getHealthCheck(containerId);

      // Get container stats
      await this.getContainerStats(containerId);
    } catch (error) {
      this.handleError(containerId, error as Error);
    }
  }

  /**
   * Check if a container is still running
   */
  private async isContainerRunning(containerId: string): Promise<boolean> {
    try {
      const result = await this.executeDockerCommand([
        'inspect',
        '--format',
        '{{.State.Status}}',
        containerId,
      ]);
      return result.trim() === 'running';
    } catch (error) {
      return false;
    }
  }

  /**
   * Execute a Docker command and return the output
   */
  private executeDockerCommand(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const docker = spawn('docker', args);

      let stdout = '';
      let stderr = '';

      docker.stdout.on('data', data => {
        stdout += data.toString();
      });

      docker.stderr.on('data', data => {
        stderr += data.toString();
      });

      docker.on('close', code => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Docker command failed with code ${code}: ${stderr}`));
        }
      });

      docker.on('error', error => {
        reject(new Error(`Failed to execute Docker command: ${error.message}`));
      });
    });
  }

  /**
   * Handle errors that occur during container monitoring
   */
  private handleError(containerId: string, error: Error, fatal: boolean = false): void {
    const container = this.containers.get(containerId);
    if (!container) {
      return;
    }

    const containerError: ContainerError = {
      containerId,
      error,
      timestamp: Date.now(),
      fatal,
    };

    container.errors.push(containerError);

    // Emit the error event
    this.emit('error', containerError);
  }

  /**
   * Check if resource usage exceeds thresholds
   */
  private checkResourceThresholds(containerId: string, stats: ContainerStats): void {
    const container = this.containers.get(containerId);
    if (!container) {
      return;
    }

    // Check CPU usage
    if (stats.cpuPercentage > this.thresholds.cpuPercentage) {
      const warning: ContainerWarning = {
        containerId,
        message: `High CPU usage: ${stats.cpuPercentage.toFixed(1)}%`,
        timestamp: Date.now(),
        metric: 'cpu',
        value: stats.cpuPercentage,
        threshold: this.thresholds.cpuPercentage,
      };

      container.warnings.push(warning);
      this.emit('warning', warning);
    }

    // Check memory usage
    if (stats.memoryLimit > 0) {
      const memoryPercentage = (stats.memoryUsage / stats.memoryLimit) * 100;
      if (memoryPercentage > this.thresholds.memoryPercentage) {
        const warning: ContainerWarning = {
          containerId,
          message: `High memory usage: ${memoryPercentage.toFixed(1)}%`,
          timestamp: Date.now(),
          metric: 'memory',
          value: memoryPercentage,
          threshold: this.thresholds.memoryPercentage,
        };

        container.warnings.push(warning);
        this.emit('warning', warning);
      }
    }

    // Check PIDs
    if (stats.pids > this.thresholds.pids) {
      const warning: ContainerWarning = {
        containerId,
        message: `High number of processes: ${stats.pids}`,
        timestamp: Date.now(),
        metric: 'pids',
        value: stats.pids,
        threshold: this.thresholds.pids,
      };

      container.warnings.push(warning);
      this.emit('warning', warning);
    }
  }

  /**
   * Parse memory values from Docker stats (e.g., "1.5MiB", "2GiB")
   */
  private parseMemoryValue(memStr: string): number {
    const value = parseFloat(memStr);
    const unit = memStr.replace(/[0-9.]/g, '').toLowerCase();

    switch (unit) {
      case 'b':
        return value;
      case 'kib':
        return value * 1024;
      case 'mib':
        return value * 1024 * 1024;
      case 'gib':
        return value * 1024 * 1024 * 1024;
      default:
        return value;
    }
  }

  /**
   * Parse data transfer values from Docker stats
   */
  private parseDataValue(dataStr: string): number {
    const value = parseFloat(dataStr);
    const unit = dataStr.replace(/[0-9.]/g, '').toLowerCase();

    switch (unit) {
      case 'b':
        return value;
      case 'kb':
        return value * 1000;
      case 'mb':
        return value * 1000 * 1000;
      case 'gb':
        return value * 1000 * 1000 * 1000;
      default:
        return value;
    }
  }

  /**
   * Get a summary of container monitoring status
   */
  getContainerSummary(containerId: string): {
    exists: boolean;
    running: boolean;
    health: string;
    uptimeMs?: number;
    stats?: ContainerStats | null;
    warnings: number;
    errors: number;
  } | null {
    const container = this.containers.get(containerId);
    if (!container) {
      return null;
    }

    return {
      exists: true,
      running: container.isRunning,
      health: container.healthStatus,
      uptimeMs: container.isRunning ? Date.now() - container.startTime : undefined,
      stats: container.stats,
      warnings: container.warnings.length,
      errors: container.errors.length,
    };
  }
}
