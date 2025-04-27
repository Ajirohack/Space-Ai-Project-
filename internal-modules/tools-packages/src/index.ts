import { Tool, ToolExecutionResult } from './types';
import { DockerRunner } from './docker-runner';
import { ContainerMonitor } from './container-monitor';
import { VolumeManager } from './volume-manager';
import { ErrorHandler, ErrorSeverity } from './error-handler';
import { EventEmitter } from 'events';
import path from 'path';
import { promises as fs } from 'fs';
import { DiscoveryService } from './discovery-service';
import { createDiscoveryRouter } from './discovery-api';
import { AICouncilToolsAdapter } from './ai-council-adapter';

// Re-export key types and components for external use
export * from './types';
export { DiscoveryService } from './discovery-service';
export { createDiscoveryRouter } from './discovery-api';

interface ToolSystemConfig {
  baseDir: string;
  docker: {
    image: string;
    memory: string;
    cpus: string;
    timeout: number;
    persistentStorage?: {
      enabled: boolean;
      maxSize?: string;
      maxVolumes?: number;
    };
  };
  maxConcurrentExecutions?: number;
}

interface ToolMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  dependencies?: { [key: string]: string };
}

export class ToolSystem extends EventEmitter {
  private readonly config: ToolSystemConfig;
  private readonly dockerRunner: DockerRunner;
  private readonly registeredTools: Map<string, { tool: Tool; metadata: ToolMetadata }>;
  private readonly executionQueue: Array<{
    tool: Tool;
    input: any;
    resolve: (result: ToolExecutionResult) => void;
    reject: (error: Error) => void;
  }>;
  private readonly errorHandler: ErrorHandler;
  private runningExecutions: number;

  constructor(config: ToolSystemConfig) {
    super();
    this.config = config;
    this.dockerRunner = new DockerRunner(config.baseDir, config.docker);
    this.registeredTools = new Map();
    this.executionQueue = [];
    this.runningExecutions = 0;
    this.errorHandler = new ErrorHandler();

    // Set up error handler events
    this.errorHandler.on('critical-error', error => {
      console.error('Critical error occurred:', error);
      // Could implement automatic recovery or notification here
    });

    // Process the execution queue when events are emitted
    this.on('execution:completed', () => {
      this.runningExecutions--;
      this.processQueue();
    });

    // Set up periodic cleanup
    setInterval(() => {
      this.cleanup().catch(error => {
        this.handleError(error, {
          code: 'CLEANUP_ERROR',
          severity: ErrorSeverity.MEDIUM,
        });
      });
    }, 1800000); // Run cleanup every 30 minutes
  }

  private handleError(
    error: Error,
    context: {
      code: string;
      severity: ErrorSeverity;
      toolId?: string;
      containerId?: string;
      details?: any;
    }
  ): void {
    this.errorHandler.handleError(error, context);
  }

  async registerTool(tool: Tool, metadata: ToolMetadata): Promise<void> {
    try {
      // Validate tool interface
      if (typeof tool.execute !== 'function') {
        throw new Error('Tool must implement execute() method');
      }

      // Validate metadata
      if (!metadata.id || !metadata.name || !metadata.version) {
        throw new Error('Invalid tool metadata');
      }

      // Check dependencies if specified
      if (metadata.dependencies) {
        for (const [depId, version] of Object.entries(metadata.dependencies)) {
          const dep = this.registeredTools.get(depId);
          if (!dep) {
            throw new Error(`Dependency ${depId} not found`);
          }
          // Here you could add version compatibility checking
        }
      }

      // Store tool and metadata
      this.registeredTools.set(metadata.id, { tool, metadata });
      this.emit('tool:registered', metadata);
    } catch (error) {
      this.handleError(error as Error, {
        code: 'TOOL_REGISTRATION_ERROR',
        severity: ErrorSeverity.HIGH,
        toolId: metadata.id,
        details: metadata,
      });
      throw error;
    }
  }

  async executeTool(toolId: string, input: any): Promise<ToolExecutionResult> {
    const toolEntry = this.registeredTools.get(toolId);
    if (!toolEntry) {
      const error = new Error(`Tool ${toolId} not found`);
      this.handleError(error, {
        code: 'TOOL_NOT_FOUND',
        severity: ErrorSeverity.MEDIUM,
        toolId,
      });
      throw error;
    }

    // Check for recent critical errors before executing
    if (this.errorHandler.hasRecentCriticalErrors()) {
      const error = new Error('System has recent critical errors, execution prevented');
      this.handleError(error, {
        code: 'SYSTEM_UNSTABLE',
        severity: ErrorSeverity.HIGH,
        toolId,
      });
      throw error;
    }

    return new Promise((resolve, reject) => {
      this.executionQueue.push({
        tool: toolEntry.tool,
        input,
        resolve: result => {
          resolve(result);
        },
        reject: error => {
          this.handleError(error, {
            code: 'TOOL_EXECUTION_ERROR',
            severity: ErrorSeverity.HIGH,
            toolId,
            details: { input },
          });
          reject(error);
        },
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (
      this.executionQueue.length === 0 ||
      this.runningExecutions >= (this.config.maxConcurrentExecutions || 5)
    ) {
      return;
    }

    const execution = this.executionQueue.shift();
    if (!execution) return;

    this.runningExecutions++;

    try {
      const result = await this.dockerRunner.executeTool(execution.tool, execution.input);
      execution.resolve(result);
    } catch (error) {
      execution.reject(error as Error);
    } finally {
      this.emit('execution:completed');
    }
  }

  async listTools(): Promise<ToolMetadata[]> {
    return Array.from(this.registeredTools.values()).map(entry => entry.metadata);
  }

  async getTool(toolId: string): Promise<ToolMetadata | undefined> {
    return this.registeredTools.get(toolId)?.metadata;
  }

  async unregisterTool(toolId: string): Promise<boolean> {
    try {
      const result = this.registeredTools.delete(toolId);
      if (result) {
        this.emit('tool:unregistered', toolId);
      }
      return result;
    } catch (error) {
      this.handleError(error as Error, {
        code: 'TOOL_UNREGISTRATION_ERROR',
        severity: ErrorSeverity.MEDIUM,
        toolId,
      });
      throw error;
    }
  }

  getErrorStats(): {
    total: number;
    bySeverity: { [key in ErrorSeverity]: number };
    recentCritical: boolean;
  } {
    const errors = this.errorHandler.getErrors();
    const stats = {
      total: errors.length,
      bySeverity: {
        [ErrorSeverity.LOW]: 0,
        [ErrorSeverity.MEDIUM]: 0,
        [ErrorSeverity.HIGH]: 0,
        [ErrorSeverity.CRITICAL]: 0,
      },
      recentCritical: this.errorHandler.hasRecentCriticalErrors(),
    };

    errors.forEach(error => {
      stats.bySeverity[error.severity]++;
    });

    return stats;
  }

  private async cleanup(): Promise<void> {
    try {
      await this.dockerRunner.cleanup();
      this.emit('cleanup:completed');
    } catch (error) {
      this.handleError(error as Error, {
        code: 'CLEANUP_ERROR',
        severity: ErrorSeverity.MEDIUM,
      });
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    try {
      // Wait for running executions to complete
      while (this.runningExecutions > 0 || this.executionQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Perform final cleanup
      await this.cleanup();
    } catch (error) {
      this.handleError(error as Error, {
        code: 'SHUTDOWN_ERROR',
        severity: ErrorSeverity.CRITICAL,
      });
      throw error;
    }
  }
}

// Create and export factory function for initializing the entire tools system
export function createToolsSystem(config: ToolSystemConfig): {
  toolSystem: ToolSystem;
  discoveryService: DiscoveryService;
  aiCouncilAdapter: AICouncilToolsAdapter;
} {
  const toolSystem = new ToolSystem(config);
  const discoveryService = new DiscoveryService();
  const aiCouncilAdapter = new AICouncilToolsAdapter(toolSystem, discoveryService);

  // Set up event forwarding from tool system to discovery service
  toolSystem.on('tool:registered', metadata => {
    discoveryService.registerTool(metadata);
  });

  toolSystem.on('tool:unregistered', toolId => {
    discoveryService.unregisterTool(toolId);
  });

  return {
    toolSystem,
    discoveryService,
    aiCouncilAdapter,
  };
}
