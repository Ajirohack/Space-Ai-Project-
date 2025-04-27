import { ToolSystem } from './index';
import { Tool, ToolExecutionResult } from './types';
import { DiscoveryService } from './discovery-service';

/**
 * Interface expected by AI Council's ToolsAdapter
 */
export interface AICouncilToolsSystem {
  registerTool(toolDefinition: any): Promise<string>;
  executeTool(toolId: string, params: any): Promise<any>;
  listAvailableTools(): Promise<any[]>;
  getToolMetadata(toolId: string): Promise<any>;
  searchTools(query: string): Promise<any[]>;
  getToolRecommendations(toolId: string, limit?: number): Promise<any[]>;
  checkCapabilityAvailability(capability: string): Promise<boolean>;
}

/**
 * Adapter that bridges the ToolSystem implementation with the interface
 * expected by AI Council's ToolsAdapter
 */
export class AICouncilToolsAdapter implements AICouncilToolsSystem {
  private toolSystem: ToolSystem;
  private discoveryService: DiscoveryService;

  constructor(toolSystem: ToolSystem, discoveryService: DiscoveryService) {
    this.toolSystem = toolSystem;
    this.discoveryService = discoveryService;
  }

  /**
   * Registers a tool using the format expected by AI Council and converts it
   * to the format expected by ToolSystem
   */
  async registerTool(toolDefinition: any): Promise<string> {
    // Convert AI Council tool definition to ToolSystem format
    const { id, name, version, description, author, implementation } = toolDefinition;

    // Create a Tool object that matches the expected interface
    const tool: Tool = {
      execute: implementation.execute || implementation,
      cleanup: implementation.cleanup,
    };

    // Create metadata object
    const metadata = {
      id,
      name,
      version,
      description,
      author,
      dependencies: toolDefinition.dependencies || {},
    };

    // Register with the ToolSystem
    await this.toolSystem.registerTool(tool, metadata);

    // Also register with the discovery service for better discoverability
    this.discoveryService.registerTool(toolDefinition);

    // Return the tool ID as expected by AI Council
    return id;
  }

  /**
   * Executes a tool and converts the result format
   */
  async executeTool(toolId: string, params: any): Promise<any> {
    const result: ToolExecutionResult = await this.toolSystem.executeTool(toolId, params);

    // Convert ToolExecutionResult to the format expected by AI Council
    return {
      success: result.success,
      data: result.data,
      error: result.error,
    };
  }

  /**
   * Returns a list of all available tools
   */
  async listAvailableTools(): Promise<any[]> {
    // Use discovery service for enhanced listing capabilities
    const result = this.discoveryService.listTools();

    return result.tools.map(tool => ({
      id: tool.id,
      name: tool.name,
      version: tool.version,
      description: tool.description,
      author: tool.author,
      tags: tool.tags || [],
      capabilities: tool.requirements?.capabilities || [],
    }));
  }

  /**
   * Gets metadata for a specific tool
   */
  async getToolMetadata(toolId: string): Promise<any> {
    // First check the discovery service
    const toolInfo = this.discoveryService.getTool(toolId);

    if (toolInfo) {
      return {
        id: toolInfo.id,
        name: toolInfo.name,
        version: toolInfo.version,
        description: toolInfo.description,
        author: toolInfo.author,
        tags: toolInfo.tags || [],
        capabilities: toolInfo.requirements?.capabilities || [],
        dependencies: toolInfo.dependencies || {},
      };
    }

    // Fallback to the tool system if not found in discovery service
    const tool = await this.toolSystem.getTool(toolId);

    if (!tool) {
      throw new Error(`Tool ${toolId} not found`);
    }

    // Convert to the format expected by AI Council
    return {
      id: tool.id,
      name: tool.name,
      version: tool.version,
      description: tool.description,
      author: tool.author,
      dependencies: tool.dependencies || {},
    };
  }

  /**
   * Search for tools matching a query
   */
  async searchTools(query: string): Promise<any[]> {
    const result = this.discoveryService.searchTools({ query });

    return result.tools.map(tool => ({
      id: tool.id,
      name: tool.name,
      version: tool.version,
      description: tool.description,
      author: tool.author,
      tags: tool.tags || [],
      capabilities: tool.requirements?.capabilities || [],
    }));
  }

  /**
   * Get recommended tools based on a specific tool
   */
  async getToolRecommendations(toolId: string, limit: number = 5): Promise<any[]> {
    const recommendations = this.discoveryService.getRecommendations(toolId, limit);

    return recommendations.map(tool => ({
      id: tool.id,
      name: tool.name,
      version: tool.version,
      description: tool.description,
      author: tool.author,
      tags: tool.tags || [],
      capabilities: tool.requirements?.capabilities || [],
    }));
  }

  /**
   * Check if any tools support a specific capability
   */
  async checkCapabilityAvailability(capability: string): Promise<boolean> {
    return this.discoveryService.hasToolsWithCapability(capability);
  }
}
