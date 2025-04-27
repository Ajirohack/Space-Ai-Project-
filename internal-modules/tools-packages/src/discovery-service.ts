// Discovery service for searching and finding available tools
import { EventEmitter } from 'events';
import { ToolDefinition } from './types';

interface ToolFilter {
  tags?: string | string[];
  author?: string;
  capabilities?: string | string[];
  query?: string;
  dependencies?: string[];
}

interface SearchResult {
  tools: ToolDefinition[];
  total: number;
  page?: number;
  pageSize?: number;
  pages?: number;
}

export class DiscoveryService extends EventEmitter {
  private toolsRegistry: Map<string, ToolDefinition> = new Map();
  private tagsIndex: Map<string, Set<string>> = new Map();
  private authorsIndex: Map<string, Set<string>> = new Map();
  private capabilitiesIndex: Map<string, Set<string>> = new Map();

  constructor() {
    super();
  }

  /**
   * Register a tool with the discovery service
   */
  registerTool(toolDefinition: ToolDefinition): void {
    // Register the tool
    this.toolsRegistry.set(toolDefinition.id, toolDefinition);

    // Update indexes
    this.indexTool(toolDefinition);

    // Emit registration event
    this.emit('tool:registered', toolDefinition);
  }

  /**
   * Unregister a tool from the discovery service
   */
  unregisterTool(toolId: string): boolean {
    const tool = this.toolsRegistry.get(toolId);

    if (!tool) {
      return false;
    }

    // Remove from registry
    this.toolsRegistry.delete(toolId);

    // Remove from indexes
    this.removeFromIndexes(tool);

    // Emit unregistration event
    this.emit('tool:unregistered', toolId);

    return true;
  }

  /**
   * Get details about a specific tool
   */
  getTool(toolId: string): ToolDefinition | undefined {
    return this.toolsRegistry.get(toolId);
  }

  /**
   * List all registered tools
   */
  listTools(paging?: { page: number; pageSize: number }): SearchResult {
    const tools = Array.from(this.toolsRegistry.values());

    if (!paging) {
      return {
        tools,
        total: tools.length,
      };
    }

    const { page, pageSize } = paging;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pagedTools = tools.slice(start, end);

    return {
      tools: pagedTools,
      total: tools.length,
      page,
      pageSize,
      pages: Math.ceil(tools.length / pageSize),
    };
  }

  /**
   * Search for tools based on filter criteria
   */
  searchTools(filter: ToolFilter, paging?: { page: number; pageSize: number }): SearchResult {
    let matchingTools: ToolDefinition[] = Array.from(this.toolsRegistry.values());

    // Filter by tags
    if (filter.tags) {
      const tagList = Array.isArray(filter.tags) ? filter.tags : [filter.tags];
      const toolIds = this.getToolIdsByTags(tagList);
      matchingTools = matchingTools.filter(tool => toolIds.has(tool.id));
    }

    // Filter by author
    if (filter.author) {
      const toolIds = this.authorsIndex.get(filter.author.toLowerCase()) || new Set<string>();
      matchingTools = matchingTools.filter(tool => toolIds.has(tool.id));
    }

    // Filter by capabilities
    if (filter.capabilities) {
      const capList = Array.isArray(filter.capabilities)
        ? filter.capabilities
        : [filter.capabilities];
      const toolIds = this.getToolIdsByCapabilities(capList);
      matchingTools = matchingTools.filter(tool => toolIds.has(tool.id));
    }

    // Filter by dependencies
    if (filter.dependencies) {
      matchingTools = matchingTools.filter(tool => {
        // If tool has no dependencies, it can't match
        if (!tool.dependencies) {
          return false;
        }

        // Check if tool depends on all required dependencies
        return filter.dependencies!.every(depId => tool.dependencies![depId] !== undefined);
      });
    }

    // Filter by text search query
    if (filter.query) {
      const query = filter.query.toLowerCase();
      matchingTools = matchingTools.filter(tool => {
        // Search in name, description, and tags
        return (
          tool.name.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query) ||
          (tool.tags && tool.tags.some(tag => tag.toLowerCase().includes(query)))
        );
      });
    }

    // Apply pagination if requested
    if (paging) {
      const { page, pageSize } = paging;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;

      return {
        tools: matchingTools.slice(start, end),
        total: matchingTools.length,
        page,
        pageSize,
        pages: Math.ceil(matchingTools.length / pageSize),
      };
    }

    return {
      tools: matchingTools,
      total: matchingTools.length,
    };
  }

  /**
   * Get tool recommendations based on current tool usage
   */
  getRecommendations(toolId: string, limit: number = 5): ToolDefinition[] {
    const tool = this.toolsRegistry.get(toolId);

    if (!tool) {
      return [];
    }

    // Get tools with similar tags
    let recommendations: Array<{
      tool: ToolDefinition;
      score: number;
    }> = [];

    // Score all tools based on similarity
    for (const candidate of this.toolsRegistry.values()) {
      // Skip the tool itself
      if (candidate.id === toolId) {
        continue;
      }

      let score = 0;

      // Score by tags
      if (tool.tags && candidate.tags) {
        for (const tag of tool.tags) {
          if (candidate.tags.includes(tag)) {
            score += 10;
          }
        }
      }

      // Score by same author
      if (tool.author === candidate.author) {
        score += 5;
      }

      // Score by capabilities
      if (tool.requirements.capabilities && candidate.requirements.capabilities) {
        for (const cap of tool.requirements.capabilities) {
          if (candidate.requirements.capabilities.includes(cap)) {
            score += 3;
          }
        }
      }

      // Add to recommendations if it has any score
      if (score > 0) {
        recommendations.push({ tool: candidate, score });
      }
    }

    // Sort by score (highest first) and take the top 'limit'
    recommendations.sort((a, b) => b.score - a.score);

    return recommendations.slice(0, limit).map(r => r.tool);
  }

  /**
   * Check if tools with specific requirements are available
   */
  hasToolsWithCapability(capability: string): boolean {
    return this.capabilitiesIndex.has(capability.toLowerCase());
  }

  /**
   * Get all available capabilities in the system
   * @returns Set of all capabilities supported by registered tools
   */
  getCapabilities(): Set<string> {
    return new Set(this.capabilitiesIndex.keys());
  }

  /**
   * Get all available tags in the system
   * @returns Set of all tags used by registered tools
   */
  getTags(): Set<string> {
    return new Set(this.tagsIndex.keys());
  }

  /**
   * Get all authors in the system
   * @returns Set of all authors of registered tools
   */
  getAuthors(): Set<string> {
    return new Set(this.authorsIndex.keys());
  }

  /**
   * Get all tools with a specific tag
   * @param tag The tag to search for
   * @returns Array of tools that have the specified tag
   */
  getToolsByTag(tag: string): ToolDefinition[] {
    const normalizedTag = tag.toLowerCase();
    const toolIds = this.tagsIndex.get(normalizedTag) || new Set<string>();

    return Array.from(toolIds)
      .map(id => this.toolsRegistry.get(id)!)
      .filter(tool => !!tool);
  }

  /**
   * Get the total count of registered tools
   * @returns The number of tools registered in the system
   */
  getToolsCount(): number {
    return this.toolsRegistry.size;
  }

  /**
   * Build search indexes for a tool
   */
  private indexTool(tool: ToolDefinition): void {
    // Index tags
    if (tool.tags) {
      for (const tag of tool.tags) {
        const normalizedTag = tag.toLowerCase();
        if (!this.tagsIndex.has(normalizedTag)) {
          this.tagsIndex.set(normalizedTag, new Set<string>());
        }
        this.tagsIndex.get(normalizedTag)!.add(tool.id);
      }
    }

    // Index author
    const authorKey = tool.author.toLowerCase();
    if (!this.authorsIndex.has(authorKey)) {
      this.authorsIndex.set(authorKey, new Set<string>());
    }
    this.authorsIndex.get(authorKey)!.add(tool.id);

    // Index capabilities
    if (tool.requirements.capabilities) {
      for (const capability of tool.requirements.capabilities) {
        const normalizedCapability = capability.toLowerCase();
        if (!this.capabilitiesIndex.has(normalizedCapability)) {
          this.capabilitiesIndex.set(normalizedCapability, new Set<string>());
        }
        this.capabilitiesIndex.get(normalizedCapability)!.add(tool.id);
      }
    }
  }

  /**
   * Remove a tool from all search indexes
   */
  private removeFromIndexes(tool: ToolDefinition): void {
    // Remove from tags index
    if (tool.tags) {
      for (const tag of tool.tags) {
        const normalizedTag = tag.toLowerCase();
        const toolIds = this.tagsIndex.get(normalizedTag);

        if (toolIds) {
          toolIds.delete(tool.id);

          // Clean up empty sets
          if (toolIds.size === 0) {
            this.tagsIndex.delete(normalizedTag);
          }
        }
      }
    }

    // Remove from authors index
    const authorKey = tool.author.toLowerCase();
    const authorToolIds = this.authorsIndex.get(authorKey);

    if (authorToolIds) {
      authorToolIds.delete(tool.id);

      // Clean up empty sets
      if (authorToolIds.size === 0) {
        this.authorsIndex.delete(authorKey);
      }
    }

    // Remove from capabilities index
    if (tool.requirements.capabilities) {
      for (const capability of tool.requirements.capabilities) {
        const normalizedCapability = capability.toLowerCase();
        const toolIds = this.capabilitiesIndex.get(normalizedCapability);

        if (toolIds) {
          toolIds.delete(tool.id);

          // Clean up empty sets
          if (toolIds.size === 0) {
            this.capabilitiesIndex.delete(normalizedCapability);
          }
        }
      }
    }
  }

  /**
   * Find tool IDs by tags (match any)
   */
  private getToolIdsByTags(tags: string[]): Set<string> {
    if (tags.length === 0) {
      return new Set<string>(this.toolsRegistry.keys());
    }

    const result = new Set<string>();

    for (const tag of tags) {
      const normalizedTag = tag.toLowerCase();
      const toolIds = this.tagsIndex.get(normalizedTag);

      if (toolIds) {
        for (const id of toolIds) {
          result.add(id);
        }
      }
    }

    return result;
  }

  /**
   * Find tool IDs by capabilities (match any)
   */
  private getToolIdsByCapabilities(capabilities: string[]): Set<string> {
    if (capabilities.length === 0) {
      return new Set<string>(this.toolsRegistry.keys());
    }

    const result = new Set<string>();

    for (const capability of capabilities) {
      const normalizedCapability = capability.toLowerCase();
      const toolIds = this.capabilitiesIndex.get(normalizedCapability);

      if (toolIds) {
        for (const id of toolIds) {
          result.add(id);
        }
      }
    }

    return result;
  }
}
