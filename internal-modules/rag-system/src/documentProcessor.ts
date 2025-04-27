import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import type { RagSystemConfig, DocumentMetadata } from './types';

export class DocumentProcessor {
  private textSplitter: RecursiveCharacterTextSplitter;
  private config: RagSystemConfig;

  constructor(config: RagSystemConfig) {
    this.config = config;
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: config.documentProcessing.chunkSize,
      chunkOverlap: config.documentProcessing.chunkOverlap,
    });
  }

  /**
   * Process a document into chunks suitable for embedding
   */
  async processDocument(
    text: string,
    metadata: Omit<DocumentMetadata, 'createdAt' | 'lastModified'>
  ) {
    // Split text into chunks
    const chunks = await this.textSplitter.createDocuments([text]);
    
    const now = new Date();
    const baseMetadata = {
      ...metadata,
      createdAt: now,
      lastModified: now,
    };

    // Return processed chunks with metadata
    return chunks.map((chunk, index) => ({
      text: chunk.pageContent,
      metadata: {
        ...baseMetadata,
        chunkIndex: index,
        totalChunks: chunks.length,
      },
    }));
  }

  /**
   * Extract relevant metadata from common file types
   */
  extractMetadata(fileName: string, fileType: string): Partial<DocumentMetadata> {
    return {
      source: fileName,
      documentType: fileType,
      // Additional metadata extraction can be added here based on file type
    };
  }

  /**
   * Clean and normalize text content
   */
  cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')        // Normalize whitespace
      .replace(/[^\S\r\n]+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }
}