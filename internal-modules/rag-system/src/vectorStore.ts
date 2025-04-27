import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RetryStrategy } from './utils/retryStrategy';
import type { RagSystemConfig, DocumentMetadata, DocumentChunk } from './types';

interface PineconeMatch {
  id: string;
  score: number;
  values: number[];
  metadata: {
    text: string;
    createdAt: string;
    lastModified: string;
    [key: string]: any;
  };
}

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  details?: string;
  timestamp: string;
}

export class VectorStoreService {
  private pinecone: Pinecone;
  private embeddings: OpenAIEmbeddings;
  private index: any;
  private config: RagSystemConfig;
  private retryStrategy: RetryStrategy;

  constructor(config: RagSystemConfig) {
    this.config = config;
    this.pinecone = new Pinecone({
      apiKey: config.pinecone.apiKey
    });
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: config.openai.apiKey,
    });
    this.retryStrategy = new RetryStrategy();
  }

  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('timeout') ||
           message.includes('rate limit') ||
           message.includes('too many requests') ||
           message.includes('temporary failure');
  }

  async initialize(): Promise<this> {
    try {
      await this.retryStrategy.execute(async () => {
        this.index = await this.pinecone.Index(this.config.pinecone.indexName);
        await this.index.describeIndexStats();
      }, this.isRetryableError);
      return this;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to initialize Pinecone index: ${message}`);
    }
  }

  async insertDocument(text: string, metadata: DocumentMetadata): Promise<void> {
    try {
      await this.retryStrategy.execute(async () => {
        const embedding = await this.embeddings.embedQuery(text);
        
        await this.index.upsert([{
          id: `doc-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          values: embedding,
          metadata: {
            ...metadata,
            text,
            createdAt: metadata.createdAt.toISOString(),
            lastModified: metadata.lastModified.toISOString(),
          },
        }]);
      }, this.isRetryableError);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to insert document: ${message}`);
    }
  }

  async search(query: string, limit: number = 5): Promise<DocumentChunk[]> {
    try {
      return await this.retryStrategy.execute(async () => {
        const queryEmbedding = await this.embeddings.embedQuery(query);
        
        const results = await this.index.query({
          vector: queryEmbedding,
          topK: limit,
          includeMetadata: true,
        });

        return results.matches.map((match: PineconeMatch) => ({
          text: match.metadata.text,
          embedding: match.values,
          metadata: {
            ...match.metadata,
            createdAt: new Date(match.metadata.createdAt),
            lastModified: new Date(match.metadata.lastModified),
          },
        }));
      }, this.isRetryableError);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Search operation failed: ${message}`);
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      await this.retryStrategy.execute(async () => {
        await this.index.deleteOne(documentId);
      }, this.isRetryableError);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete document ${documentId}: ${message}`);
    }
  }

  async health(): Promise<HealthStatus> {
    try {
      return await this.retryStrategy.execute(async () => {
        const stats = await this.index.describeIndexStats();
        const vectorCount = stats.totalVectorCount;
        
        return {
          status: 'healthy',
          details: `Index contains ${vectorCount} vectors`,
          timestamp: new Date().toISOString(),
        };
      }, this.isRetryableError);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        status: 'unhealthy',
        details: `Vector store health check failed: ${message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }
}