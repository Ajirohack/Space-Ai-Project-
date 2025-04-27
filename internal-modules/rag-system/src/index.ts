import type { RagSystemConfig, DocumentMetadata, DocumentChunk } from './types';
import { VectorStoreService } from './vectorStore';
import { DocumentProcessor } from './documentProcessor';

interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  components: {
    vectorStore: {
      status: 'healthy' | 'unhealthy' | 'degraded';
      details?: string;
      timestamp: string;
    };
    documentProcessor: {
      status: 'healthy' | 'unhealthy' | 'degraded';
      timestamp: string;
    };
  };
  timestamp: string;
}

interface IndexResult {
  documentId: string;
  chunks: number;
  status: 'indexed' | 'failed';
  error?: string;
  timestamp: string;
}

export class RagSystem {
  private vectorStore: VectorStoreService;
  private documentProcessor: DocumentProcessor;
  private config: RagSystemConfig;
  private initialized: boolean = false;

  constructor(config: RagSystemConfig) {
    this.config = config;
    this.vectorStore = new VectorStoreService(config);
    this.documentProcessor = new DocumentProcessor(config);
  }

  async initialize(): Promise<void> {
    try {
      await this.vectorStore.initialize();
      this.initialized = true;
    } catch (error) {
      this.initialized = false;
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to initialize RAG System: ${message}`);
    }
  }

  private checkInitialized() {
    if (!this.initialized) {
      throw new Error('RAG System not initialized. Call initialize() first.');
    }
  }

  async indexDocument(text: string, metadata: Omit<DocumentMetadata, 'createdAt' | 'lastModified'>): Promise<IndexResult> {
    this.checkInitialized();
    
    try {
      // Clean and process the document
      const cleanedText = this.documentProcessor.cleanText(text);
      const processedChunks = await this.documentProcessor.processDocument(cleanedText, metadata);

      // Index each chunk
      for (const chunk of processedChunks) {
        await this.vectorStore.insertDocument(chunk.text, chunk.metadata);
      }

      return {
        documentId: `doc-${Date.now()}`,
        chunks: processedChunks.length,
        status: 'indexed',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        documentId: `doc-${Date.now()}`,
        chunks: 0,
        status: 'failed',
        error: message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async query(queryText: string, limit: number = 5): Promise<DocumentChunk[]> {
    this.checkInitialized();
    return await this.vectorStore.search(queryText, limit);
  }

  async deleteDocument(documentId: string): Promise<void> {
    this.checkInitialized();
    await this.vectorStore.deleteDocument(documentId);
  }

  async health(): Promise<SystemHealth> {
    const vectorStoreHealth = await this.vectorStore.health();
    const now = new Date().toISOString();

    // Determine overall system status
    let systemStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (vectorStoreHealth.status === 'unhealthy' || !this.initialized) {
      systemStatus = 'unhealthy';
    } else if (vectorStoreHealth.status === 'degraded') {
      systemStatus = 'degraded';
    }

    return {
      status: systemStatus,
      components: {
        vectorStore: vectorStoreHealth,
        documentProcessor: {
          status: 'healthy', // Document processor is stateless
          timestamp: now,
        },
      },
      timestamp: now,
    };
  }
}

// Export types and factory function
export * from './types';
export const createRagSystem = (config: RagSystemConfig) => new RagSystem(config);
