import { RagSystem } from './index';
import { ConfigLoader } from './config';
import * as dotenv from 'dotenv';
import path from 'path';

async function testSetup() {
  // Load development environment variables
  dotenv.config({ path: path.resolve(__dirname, '../.env.development') });

  try {
    // Load configuration
    const config = ConfigLoader.load(process.env);
    console.log('Configuration loaded successfully:', {
      indexName: config.pinecone.indexName,
      modelName: config.openai.modelName,
      chunkSize: config.documentProcessing.chunkSize,
    });

    // Initialize RAG system
    const ragSystem = new RagSystem(config);
    await ragSystem.initialize();
    console.log('RAG System initialized successfully');

    // Test health check
    const health = await ragSystem.health();
    console.log('Health check result:', health);

  } catch (error) {
    if (error instanceof Error) {
      console.error('Error during setup test:', error.message);
    } else {
      console.error('Unknown error during setup test:', error);
    }
  }
}

// Run the test
testSetup();