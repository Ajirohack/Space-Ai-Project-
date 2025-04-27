// Resource manager for allocating and tracking resources used by tools
import { EventEmitter } from 'events';
import { ToolRequirements, ToolResource } from './types';

interface ResourceAllocation {
  toolId: string;
  allocated: ToolResource;
  timestamp: number;
  executionId: string;
  containerId?: string;
}

interface SystemResources {
  cpu: {
    total: number;
    used: number;
    available: number;
  };
  memory: {
    total: number; // MB
    used: number;
    available: number;
  };
  storage: {
    total: number; // MB
    used: number;
    available: number;
  };
  network: {
    ingressRate: number; // KB/s
    egressRate: number;
    currentIngress: number;
    currentEgress: number;
  };
}

export class ResourceManager extends EventEmitter {
  private allocations: Map<string, ResourceAllocation> = new Map();
  private systemResources: SystemResources;
  private readonly reservationThreshold: number; // percentage to keep reserved
  private updateInterval?: NodeJS.Timeout;

  constructor(systemResources: Partial<SystemResources>, reservationThreshold: number = 20) {
    super();

    // Set default resources if not provided
    this.systemResources = {
      cpu: {
        total: systemResources.cpu?.total || 4,
        used: 0,
        available: systemResources.cpu?.total || 4,
      },
      memory: {
        total: systemResources.memory?.total || 8192, // 8GB in MB
        used: 0,
        available: systemResources.memory?.total || 8192,
      },
      storage: {
        total: systemResources.storage?.total || 10240, // 10GB in MB
        used: 0,
        available: systemResources.storage?.total || 10240,
      },
      network: {
        ingressRate: systemResources.network?.ingressRate || 10240, // 10MB/s in KB/s
        egressRate: systemResources.network?.egressRate || 10240,
        currentIngress: 0,
        currentEgress: 0,
      },
    };

    this.reservationThreshold = reservationThreshold;
  }

  /**
   * Start resource monitoring and periodic updates
   */
  startMonitoring(intervalMs: number = 5000): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(() => {
      this.updateResourceUsage();
    }, intervalMs);

    // Initial update
    this.updateResourceUsage();
  }

  /**
   * Stop resource monitoring
   */
  stopMonitoring(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
  }

  /**
   * Allocate resources for a tool execution
   */
  allocateResources(
    toolId: string,
    requirements: ToolRequirements,
    executionId: string
  ): ResourceAllocation {
    const resources = requirements.resources;

    // Convert string-based resources to numbers
    const cpuUnits = this.parseCpuString(resources.cpu);
    const memoryMb = this.parseMemoryString(resources.memory);
    const storageMb = resources.storage ? this.parseMemoryString(resources.storage) : 0;

    // Check if we have enough resources
    if (!this.checkResourceAvailability(cpuUnits, memoryMb, storageMb)) {
      throw new Error('Insufficient resources available to execute this tool');
    }

    // Allocate the resources
    const allocation: ResourceAllocation = {
      toolId,
      allocated: {
        cpu: resources.cpu,
        memory: resources.memory,
        storage: resources.storage,
        network: resources.network,
      },
      timestamp: Date.now(),
      executionId,
    };

    this.allocations.set(executionId, allocation);

    // Update used resources
    this.systemResources.cpu.used += cpuUnits;
    this.systemResources.cpu.available =
      this.systemResources.cpu.total - this.systemResources.cpu.used;

    this.systemResources.memory.used += memoryMb;
    this.systemResources.memory.available =
      this.systemResources.memory.total - this.systemResources.memory.used;

    this.systemResources.storage.used += storageMb;
    this.systemResources.storage.available =
      this.systemResources.storage.total - this.systemResources.storage.used;

    // Emit allocation event
    this.emit('resourceAllocated', {
      executionId,
      toolId,
      resources: allocation.allocated,
    });

    return allocation;
  }

  /**
   * Release resources allocated for a tool execution
   */
  releaseResources(executionId: string): void {
    const allocation = this.allocations.get(executionId);
    if (!allocation) {
      // Nothing to release
      return;
    }

    // Convert string-based resources to numbers
    const cpuUnits = this.parseCpuString(allocation.allocated.cpu);
    const memoryMb = this.parseMemoryString(allocation.allocated.memory);
    const storageMb = allocation.allocated.storage
      ? this.parseMemoryString(allocation.allocated.storage)
      : 0;

    // Release the resources
    this.systemResources.cpu.used = Math.max(0, this.systemResources.cpu.used - cpuUnits);
    this.systemResources.cpu.available =
      this.systemResources.cpu.total - this.systemResources.cpu.used;

    this.systemResources.memory.used = Math.max(0, this.systemResources.memory.used - memoryMb);
    this.systemResources.memory.available =
      this.systemResources.memory.total - this.systemResources.memory.used;

    this.systemResources.storage.used = Math.max(0, this.systemResources.storage.used - storageMb);
    this.systemResources.storage.available =
      this.systemResources.storage.total - this.systemResources.storage.used;

    // Remove from allocations
    this.allocations.delete(executionId);

    // Emit release event
    this.emit('resourceReleased', {
      executionId,
      toolId: allocation.toolId,
      resources: allocation.allocated,
    });
  }

  /**
   * Set container ID for an allocation
   */
  setContainerId(executionId: string, containerId: string): void {
    const allocation = this.allocations.get(executionId);
    if (allocation) {
      allocation.containerId = containerId;
    }
  }

  /**
   * Get current system resource usage
   */
  getSystemResources(): SystemResources {
    return { ...this.systemResources };
  }

  /**
   * Get all current allocations
   */
  getAllocations(): ResourceAllocation[] {
    return Array.from(this.allocations.values());
  }

  /**
   * Parse CPU string (e.g., "0.5" or "2") to numeric value
   */
  private parseCpuString(cpu: string): number {
    return parseFloat(cpu);
  }

  /**
   * Parse memory string (e.g., "512M", "1G") to MB
   */
  private parseMemoryString(memory: string): number {
    const match = memory.match(/^(\d+)([KMGkmg])?$/);
    if (!match) {
      throw new Error(`Invalid memory format: ${memory}`);
    }

    const value = parseInt(match[1], 10);
    const unit = (match[2] || '').toUpperCase();

    switch (unit) {
      case 'K':
        return value / 1024; // KB to MB
      case 'M':
        return value;
      case 'G':
        return value * 1024; // GB to MB
      default:
        return value / (1024 * 1024); // Bytes to MB
    }
  }

  /**
   * Check if the requested resources are available
   */
  private checkResourceAvailability(
    cpuUnits: number,
    memoryMb: number,
    storageMb: number
  ): boolean {
    // Calculate reserved resources based on threshold
    const reservedCpu = (this.systemResources.cpu.total * this.reservationThreshold) / 100;
    const reservedMemory = (this.systemResources.memory.total * this.reservationThreshold) / 100;
    const reservedStorage = (this.systemResources.storage.total * this.reservationThreshold) / 100;

    // Check if we have enough resources after accounting for reserved resources
    const availableCpu = this.systemResources.cpu.available - reservedCpu;
    const availableMemory = this.systemResources.memory.available - reservedMemory;
    const availableStorage = this.systemResources.storage.available - reservedStorage;

    return cpuUnits <= availableCpu && memoryMb <= availableMemory && storageMb <= availableStorage;
  }

  /**
   * Update resource usage from the system
   */
  private updateResourceUsage(): void {
    // In a real implementation, this would query the host system or container runtime
    // for actual resource usage statistics

    // For now, we'll just emit an update event with the current state
    this.emit('resourcesUpdated', this.getSystemResources());
  }

  /**
   * Update system resource limits
   */
  updateSystemResources(resources: Partial<SystemResources>): void {
    if (resources.cpu?.total !== undefined) {
      this.systemResources.cpu.total = resources.cpu.total;
      this.systemResources.cpu.available =
        this.systemResources.cpu.total - this.systemResources.cpu.used;
    }

    if (resources.memory?.total !== undefined) {
      this.systemResources.memory.total = resources.memory.total;
      this.systemResources.memory.available =
        this.systemResources.memory.total - this.systemResources.memory.used;
    }

    if (resources.storage?.total !== undefined) {
      this.systemResources.storage.total = resources.storage.total;
      this.systemResources.storage.available =
        this.systemResources.storage.total - this.systemResources.storage.used;
    }

    if (resources.network?.ingressRate !== undefined) {
      this.systemResources.network.ingressRate = resources.network.ingressRate;
    }

    if (resources.network?.egressRate !== undefined) {
      this.systemResources.network.egressRate = resources.network.egressRate;
    }

    this.emit('resourceLimitsUpdated', this.getSystemResources());
  }
}
