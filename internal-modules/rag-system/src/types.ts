/**
 * RAG System Configuration Types
 */
export interface RagSystemConfig {
  pinecone: {
    apiKey: string;
    indexName: string;
  };
  openai: {
    apiKey: string;
    modelName: string;
    maxTokens: number;
  };
  documentProcessing: {
    chunkSize: number;
    chunkOverlap: number;
  };
}

/**
 * Document metadata types for the RAG System
 */
export interface DocumentMetadata {
  source: string;
  title?: string;
  author?: string;
  createdAt: Date;
  lastModified: Date;
  documentType: string;
}

export interface DocumentChunk {
  text: string;
  embedding: number[];
  metadata: DocumentMetadata;
}