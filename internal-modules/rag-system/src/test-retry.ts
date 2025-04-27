import { RagSystem } from './index';
import { ConfigLoader } from './config';
import * as dotenv from 'dotenv';
import path from 'path';

async function testRetryBehavior() {
  // Load development environment variables
  dotenv.config({ path: path.resolve(__dirname, '../.env.development') });

  try {
    console.log('Starting retry behavior test...');

    // Load configuration
    const config = ConfigLoader.load(process.env);
    console.log('Configuration loaded successfully');

    // Initialize RAG system
    const ragSystem = new RagSystem(config);
    console.log('\nInitializing RAG System...');
    await ragSystem.initialize();
    console.log('RAG System initialized successfully');
    
    // Test document indexing with retries
    const testDoc = {
      text: 'This is a test document for retry behavior.',
      metadata: {
        source: 'test',
        documentType: 'test',
        title: 'Retry Test',
      }
    };

    console.log('\nTesting document indexing...');
    const indexResult = await ragSystem.indexDocument(testDoc.text, testDoc.metadata);
    console.log('Index result:', indexResult);

    // Test search functionality
    console.log('\nTesting search functionality...');
    const searchResults = await ragSystem.query('test document');
    console.log('Search results:', JSON.stringify(searchResults, null, 2));

    // Test health check with detailed component status
    console.log('\nTesting health check...');
    const health = await ragSystem.health();
    console.log('Health check result:', JSON.stringify(health, null, 2));

  } catch (error) {
    if (error instanceof Error) {
      console.error('Error during retry test:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    } else {
      console.error('Unknown error during retry test:', error);
    }
    process.exit(1);
  }
}

// Run the test
testRetryBehavior();