import { RagSystem } from '../index';
import { DocumentProcessor } from '../documentProcessor';
import { ConfigLoader } from '../config';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

describe('RAG System', () => {
  let ragSystem: RagSystem;

  beforeAll(async () => {
    const config = ConfigLoader.load(process.env);
    ragSystem = new RagSystem(config);
    await ragSystem.initialize();
  });

  describe('Document Processing', () => {
    const sampleDocument = {
      text: 'This is a sample document. It contains multiple sentences. This will be used for testing.',
      metadata: {
        source: 'test',
        documentType: 'plaintext',
      },
    };

    test('should successfully index a document', async () => {
      const result = await ragSystem.indexDocument(sampleDocument.text, sampleDocument.metadata);
      expect(result.status).toBe('indexed');
      expect(result.chunks).toBeGreaterThan(0);
    });

    test('should retrieve relevant documents', async () => {
      const query = 'sample document';
      const results = await ragSystem.query(query);
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].text).toContain('sample');
    });
  });

  describe('Health Check', () => {
    test('should return healthy status', async () => {
      const health = await ragSystem.health();
      expect(health.status).toBe('healthy');
      expect(health.components.vectorStore).toBeDefined();
    });
  });
});