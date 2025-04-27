/**
 * Tool Discovery API Router
 *
 * This module provides RESTful endpoints for discovering, searching,
 * and retrieving tools registered in the system.
 */
import express, { Request, Response } from 'express';
import { DiscoveryService } from './discovery-service';
import { ToolFilter } from './types';

export function createDiscoveryRouter(discoveryService: DiscoveryService) {
  const router = express.Router();

  /**
   * @api {get} /tools List all available tools
   * @apiName ListTools
   * @apiGroup Tools
   * @apiDescription Get a list of all registered tools with optional pagination
   *
   * @apiQuery {Number} [page=1] Page number for pagination
   * @apiQuery {Number} [pageSize=20] Number of items per page
   *
   * @apiSuccess {Object[]} tools Array of tool definitions
   * @apiSuccess {Number} total Total number of tools available
   * @apiSuccess {Number} [page] Current page number (if pagination is used)
   * @apiSuccess {Number} [pageSize] Current page size (if pagination is used)
   * @apiSuccess {Number} [pages] Total number of pages (if pagination is used)
   */
  router.get('/', (req: Request, res: Response) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined;

      const paging = page && pageSize ? { page, pageSize } : undefined;
      const result = discoveryService.listTools(paging);

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to list tools',
      });
    }
  });

  /**
   * @api {get} /tools/:toolId Get tool details
   * @apiName GetTool
   * @apiGroup Tools
   * @apiDescription Get detailed information about a specific tool
   *
   * @apiParam {String} toolId Tool identifier
   *
   * @apiSuccess {Object} tool Tool definition object
   * @apiError {Object} error Error information if tool not found
   */
  router.get('/:toolId', (req: Request, res: Response) => {
    try {
      const toolId = req.params.toolId;
      const tool = discoveryService.getTool(toolId);

      if (!tool) {
        return res.status(404).json({
          success: false,
          error: `Tool ${toolId} not found`,
        });
      }

      res.json({
        success: true,
        tool,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get tool details',
      });
    }
  });

  /**
   * @api {get} /tools/search Search for tools
   * @apiName SearchTools
   * @apiGroup Tools
   * @apiDescription Search for tools based on various filter criteria
   *
   * @apiQuery {String} [query] Text search query
   * @apiQuery {String|String[]} [tags] Tag or tags to filter by
   * @apiQuery {String} [author] Author to filter by
   * @apiQuery {String|String[]} [capabilities] Capabilities to filter by
   * @apiQuery {String[]} [dependencies] Dependencies to filter by
   * @apiQuery {Number} [page=1] Page number for pagination
   * @apiQuery {Number} [pageSize=20] Number of items per page
   *
   * @apiSuccess {Object[]} tools Array of matching tool definitions
   * @apiSuccess {Number} total Total number of matching tools
   * @apiSuccess {Number} [page] Current page number (if pagination is used)
   * @apiSuccess {Number} [pageSize] Current page size (if pagination is used)
   * @apiSuccess {Number} [pages] Total number of pages (if pagination is used)
   */
  router.get('/search', (req: Request, res: Response) => {
    try {
      const filter: ToolFilter = {};

      if (req.query.query) {
        filter.query = req.query.query as string;
      }

      if (req.query.tags) {
        filter.tags = req.query.tags as string | string[];
      }

      if (req.query.author) {
        filter.author = req.query.author as string;
      }

      if (req.query.capabilities) {
        filter.capabilities = req.query.capabilities as string | string[];
      }

      if (req.query.dependencies) {
        filter.dependencies = Array.isArray(req.query.dependencies)
          ? (req.query.dependencies as string[])
          : [req.query.dependencies as string];
      }

      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined;

      const paging = page && pageSize ? { page, pageSize } : undefined;
      const result = discoveryService.searchTools(filter, paging);

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to search tools',
      });
    }
  });

  /**
   * @api {get} /tools/:toolId/recommendations Get tool recommendations
   * @apiName GetToolRecommendations
   * @apiGroup Tools
   * @apiDescription Get tool recommendations based on a specified tool
   *
   * @apiParam {String} toolId Tool identifier to base recommendations on
   * @apiQuery {Number} [limit=5] Maximum number of recommendations to return
   *
   * @apiSuccess {Object[]} recommendations Array of recommended tool definitions
   * @apiError {Object} error Error information if tool not found
   */
  router.get('/:toolId/recommendations', (req: Request, res: Response) => {
    try {
      const toolId = req.params.toolId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

      const recommendations = discoveryService.getRecommendations(toolId, limit);

      if (recommendations.length === 0 && !discoveryService.getTool(toolId)) {
        return res.status(404).json({
          success: false,
          error: `Tool ${toolId} not found`,
        });
      }

      res.json({
        success: true,
        recommendations,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get tool recommendations',
      });
    }
  });

  /**
   * @api {get} /tools/capabilities/all Get all available capabilities
   * @apiName GetAllCapabilities
   * @apiGroup Tools
   * @apiDescription Get a list of all capabilities supported by registered tools
   *
   * @apiSuccess {String[]} capabilities Array of capability identifiers
   */
  router.get('/capabilities/all', (req: Request, res: Response) => {
    try {
      // Get a list of all capabilities by extracting from the capabilitiesIndex keys
      const capabilities = Array.from(discoveryService.getCapabilities());

      res.json({
        success: true,
        capabilities,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get capabilities',
      });
    }
  });

  /**
   * @api {get} /tools/capabilities/:capability Check for capability
   * @apiName CheckCapability
   * @apiGroup Tools
   * @apiDescription Check if any tools support a specific capability
   *
   * @apiParam {String} capability The capability to check for
   *
   * @apiSuccess {Boolean} available Whether the capability is available
   */
  router.get('/capabilities/:capability', (req: Request, res: Response) => {
    try {
      const capability = req.params.capability;
      const available = discoveryService.hasToolsWithCapability(capability);

      res.json({
        success: true,
        capability,
        available,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to check capability',
      });
    }
  });

  /**
   * @api {get} /tools/tags/all Get all available tags
   * @apiName GetAllTags
   * @apiGroup Tools
   * @apiDescription Get a list of all tags used by registered tools
   *
   * @apiSuccess {String[]} tags Array of tag identifiers
   */
  router.get('/tags/all', (req: Request, res: Response) => {
    try {
      const tags = Array.from(discoveryService.getTags());

      res.json({
        success: true,
        tags,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get tags',
      });
    }
  });

  /**
   * @api {get} /tools/tags/:tag Check for tag
   * @apiName CheckTag
   * @apiGroup Tools
   * @apiDescription Check if any tools have a specific tag
   *
   * @apiParam {String} tag The tag to check for
   *
   * @apiSuccess {Boolean} available Whether any tools have this tag
   * @apiSuccess {Number} count Number of tools with this tag
   */
  router.get('/tags/:tag', (req: Request, res: Response) => {
    try {
      const tag = req.params.tag;
      const toolsWithTag = discoveryService.getToolsByTag(tag);

      res.json({
        success: true,
        tag,
        available: toolsWithTag.length > 0,
        count: toolsWithTag.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to check tag',
      });
    }
  });

  /**
   * @api {get} /tools/metadata Get all metadata
   * @apiName GetToolsMetadata
   * @apiGroup Tools
   * @apiDescription Get comprehensive metadata about registered tools including all tags, capabilities, and authors
   *
   * @apiSuccess {Object} metadata Metadata object containing tags, capabilities, and authors
   */
  router.get('/metadata', (req: Request, res: Response) => {
    try {
      const tags = Array.from(discoveryService.getTags());
      const capabilities = Array.from(discoveryService.getCapabilities());
      const authors = Array.from(discoveryService.getAuthors());

      res.json({
        success: true,
        metadata: {
          tags,
          capabilities,
          authors,
          totalTools: discoveryService.getToolsCount(),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get tools metadata',
      });
    }
  });

  return router;
}
