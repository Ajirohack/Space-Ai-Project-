const { EventEmitter } = require('events');
const vectorStore = require('./vectorStore');
const documentProcessor = require('./documentProcessor');

class RAGSystem extends EventEmitter {
  constructor() {
    super();
    this.metadata = {
      id: 'rag-system',
      name: 'RAG System',
      version: '1.0.0',
      description: 'Retrieval-Augmented Generation system for knowledge management',
    };
  }

  async initialize(config = {}) {
    await vectorStore.initialize(config.vectorDb);
    await documentProcessor.initialize(config.processor);
    return this;
  }

  async addDocument(document) {
    const chunks = await documentProcessor.chunk(document);
    const vectors = await documentProcessor.embed(chunks);
    await vectorStore.store(vectors);
    this.emit('documentAdded', { id: document.id });
    return { success: true };
  }

  async query(question, options = {}) {
    const queryEmbedding = await documentProcessor.embed(question);
    const relevantDocs = await vectorStore.search(queryEmbedding, options.limit || 5);
    return {
      documents: relevantDocs,
      metadata: {
        timestamp: new Date(),
        query: question,
      },
    };
  }

  async getStats() {
    return {
      documentCount: await vectorStore.getDocumentCount(),
      vectorCount: await vectorStore.getVectorCount(),
      lastUpdated: await vectorStore.getLastUpdated(),
    };
  }
}

module.exports = new RAGSystem();
