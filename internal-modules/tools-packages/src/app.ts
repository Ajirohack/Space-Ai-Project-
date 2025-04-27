import express, { Request, Response } from 'express';
import cors from 'cors';
import { ToolRegistry } from './registry';
import { ToolDefinition, ToolExecutionResult, Tool } from './types';
import { DiscoveryService } from './discovery-service';
import { createDiscoveryRouter } from './discovery-api';

// Simple Metadata-based Tool implementation
class MetadataTool implements Tool {
  constructor(public definition: ToolDefinition) {}

  async execute(input: any): Promise<ToolExecutionResult> {
    // Placeholder execution: returns input as data
    return { success: true, data: input };
  }

  serialize(): string {
    return JSON.stringify(this.definition);
  }
}

const app = express();
const registry = new ToolRegistry();
const discoveryService = new DiscoveryService();

app.use(express.json());
app.use(cors());

// Register discovery API router
app.use('/api/tools/discovery', createDiscoveryRouter(discoveryService));

// Tool registration endpoint
app.post('/api/tools/register', async (req: Request, res: Response) => {
  try {
    const def = req.body as ToolDefinition;
    // Basic validation
    if (!def.id || !def.name || !def.version) {
      throw new Error('Tool definition must include id, name, and version');
    }

    const tool: Tool = new MetadataTool(def);
    await registry.registerTool(tool);

    // Also register with the discovery service
    discoveryService.registerTool(def);

    res.json({ success: true, message: 'Tool registered successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get all registered tools
app.get('/api/tools', (req: Request, res: Response) => {
  const metadataList = registry.getAllTools().map(tool => {
    // @ts-ignore
    return tool.definition;
  });
  res.json({ success: true, tools: metadataList });
});

// Export the discovery service for external use
export { discoveryService, createDiscoveryRouter };

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Tools-Packages service running on port ${port}`);
  console.log(`Tool Discovery API available at http://localhost:${port}/api/tools/discovery`);
});
