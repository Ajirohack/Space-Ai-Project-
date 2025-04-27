import { Tool, ToolDefinition } from './types';
import { validateToolDefinition } from './validation';
import { EventEmitter } from 'events';

export class ToolRegistry extends EventEmitter {
  private tools: Map<string, Tool> = new Map();
  private categories: Map<string, Set<string>> = new Map();
  private capabilities: Map<string, Set<string>> = new Map();

  constructor() {
    super();
  }

  /**
   * Register a new tool in the registry
   */
  async registerTool(tool: Tool): Promise<void> {
    const { id } = tool.definition;
    
    // Validate tool definition
    const validationResult = validateToolDefinition(tool.definition);
    if (!validationResult.valid) {
      throw new Error(`Invalid tool definition: ${validationResult.errors.join(', ')}`);
    }

    // Check for duplicate IDs
    if (this.tools.has(id)) {
      throw new Error(`Tool with ID ${id} is already registered`);
    }

    // Add to main registry
    this.tools.set(id, tool);

    // Index by category
    const category = tool.definition.category || 'uncategorized';
    if (!this.categories.has(category)) {
      this.categories.set(category, new Set());
    }
    this.categories.get(category)?.add(id);

    // Index by capabilities
    if (tool.definition.capabilities) {
      for (const capability of tool.definition.capabilities) {
        if (!this.capabilities.has(capability)) {
          this.capabilities.set(capability, new Set());
        }
        this.capabilities.get(capability)?.add(id);
      }
    }

    this.emit('toolRegistered', id);
  }

  /**
   * Deregister a tool from the registry
   */
  async deregisterTool(id: string): Promise<void> {
    const tool = this.tools.get(id);
    if (!tool) {
      throw new Error(`Tool with ID ${id} not found`);
    }

    // Clean up indexes
    const category = tool.definition.category || 'uncategorized';
    this.categories.get(category)?.delete(id);
    
    if (tool.definition.capabilities) {
      for (const capability of tool.definition.capabilities) {
        this.capabilities.get(capability)?.delete(id);
      }
    }

    // Run tool cleanup if available
    if (tool.cleanup) {
      await tool.cleanup();
    }

    // Remove from main registry
    this.tools.delete(id);
    
    this.emit('toolDeregistered', id);
  }

  /**
   * Get a tool by ID
   */
  getTool(id: string): Tool | undefined {
    return this.tools.get(id);
  }

  /**
   * Get all tools in a category
   */
  getToolsByCategory(category: string): Tool[] {
    const toolIds = this.categories.get(category) || new Set();
    return Array.from(toolIds).map(id => this.tools.get(id)).filter((t): t is Tool => !!t);
  }

  /**
   * Get all tools with a specific capability
   */
  getToolsByCapability(capability: string): Tool[] {
    const toolIds = this.capabilities.get(capability) || new Set();
    return Array.from(toolIds).map(id => this.tools.get(id)).filter((t): t is Tool => !!t);
  }

  /**
   * Get all registered tools
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get all available categories
   */
  getCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  /**
   * Get all available capabilities
   */
  getCapabilities(): string[] {
    return Array.from(this.capabilities.keys());
  }
}