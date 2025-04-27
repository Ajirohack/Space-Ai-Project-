/**
 * Seed script for populating the database with initial modules
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Module } = require('../models');

// Initial modules data
const initialModules = [
  {
    moduleId: 'text-analysis',
    name: 'Text Analysis',
    description: 'Analyzes text content for sentiment, entities, and key phrases',
    version: '1.0.0',
    capabilities: ['sentiment', 'entity-recognition', 'summarization'],
    configSchema: {
      apiKey: { type: 'string', required: true },
      language: { type: 'string', default: 'en' },
      maxLength: { type: 'number', default: 5000 }
    },
    active: true
  },
  {
    moduleId: 'image-recognition',
    name: 'Image Recognition',
    description: 'Identifies objects, scenes, and text in images',
    version: '1.2.1',
    capabilities: ['object-detection', 'scene-recognition', 'ocr'],
    configSchema: {
      apiKey: { type: 'string', required: true },
      minConfidence: { type: 'number', default: 0.7 },
      enhanceResults: { type: 'boolean', default: true }
    },
    active: true
  },
  {
    moduleId: 'document-processor',
    name: 'Document Processor',
    description: 'Extracts and processes information from documents',
    version: '0.9.5',
    capabilities: ['text-extraction', 'form-recognition', 'table-extraction'],
    configSchema: {
      apiKey: { type: 'string', required: true },
      outputFormat: { type: 'string', enum: ['json', 'xml', 'text'], default: 'json' }
    },
    active: true
  },
  {
    moduleId: 'rag-engine',
    name: 'RAG Engine',
    description: 'Retrieval-Augmented Generation for enhanced content processing',
    version: '1.1.0',
    capabilities: ['retrieval', 'generation', 'knowledge-base'],
    configSchema: {
      apiKey: { type: 'string', required: true },
      embeddingModel: { type: 'string', default: 'text-embedding-ada-002' },
      retrievalDepth: { type: 'number', default: 5 },
      maxTokens: { type: 'number', default: 1000 }
    },
    active: true
  },
  {
    moduleId: 'content-moderation',
    name: 'Content Moderation',
    description: 'Detects and filters inappropriate content',
    version: '1.0.2',
    capabilities: ['text-moderation', 'image-moderation', 'classification'],
    configSchema: {
      apiKey: { type: 'string', required: true },
      strictness: { type: 'number', min: 0, max: 1, default: 0.5 },
      categories: { type: 'array', default: ['violence', 'hate', 'sexual'] }
    },
    active: true
  }
];

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexus-control-center';
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Seed modules
 */
const seedModules = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Clear existing modules
    await Module.deleteMany({});
    console.log('Cleared existing modules');
    
    // Insert new modules
    const modules = await Module.insertMany(initialModules);
    console.log(`Seeded ${modules.length} modules`);
    
    // Disconnect from database
    await mongoose.disconnect();
    console.log('Database connection closed');
    
    console.log('Seeding completed successfully');
  } catch (error) {
    console.error(`Error seeding modules: ${error.message}`);
    process.exit(1);
  }
};

// Run the seed function
seedModules();