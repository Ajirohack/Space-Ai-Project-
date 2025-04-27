const { Pinecone } = require('@pinecone-database/pinecone');
const { OpenAIEmbeddings } = require('langchain/embeddings/openai');
const { Document } = require('langchain/document');

class RAGSystem {
  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT
    });
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY
    });
    this.indexName = process.env.PINECONE_INDEX_NAME;
    this.globalNamespace = 'global';
  }

  async initialize() {
    const indexList = await this.pinecone.listIndexes();
    if (!indexList.includes(this.indexName)) {
      await this.pinecone.createIndex({
        name: this.indexName,
        dimension: 1536,
        metric: 'cosine'
      });
    }
  }

  async indexDocument(document, namespace = this.globalNamespace) {
    const index = this.pinecone.Index(this.indexName);
    const vector = await this.embeddings.embedQuery(document.content);
    await index.upsert({
      vectors: [{
        id: document.id,
        values: vector,
        metadata: {
          title: document.title,
          content: document.content,
          source: document.source,
          timestamp: new Date().toISOString(),
          ...document.metadata
        }
      }],
      namespace
    });
  }

  async query(question, userId) {
    const index = this.pinecone.Index(this.indexName);
    const queryVector = await this.embeddings.embedQuery(question);
    const [userResults, globalResults] = await Promise.all([
      index.query({
        vector: queryVector,
        topK: 5,
        includeMetadata: true,
        namespace: `user_${userId}`
      }),
      index.query({
        vector: queryVector,
        topK: 5,
        includeMetadata: true,
        namespace: this.globalNamespace
      })
    ]);
    const combinedResults = this.combineResults(userResults, globalResults);
    const documents = combinedResults.map(match => new Document({
      pageContent: match.metadata.content,
      metadata: match.metadata
    }));
    const response = await this.generateResponseWithContext(question, documents);
    return {
      answer: response,
      sources: documents.map(doc => ({
        title: doc.metadata.title,
        source: doc.metadata.source
      }))
    };
  }

  combineResults(userResults, globalResults) {
    const combinedMap = new Map();
    userResults.matches.forEach(match => {
      combinedMap.set(match.id, { ...match, priority: 1 });
    });
    globalResults.matches.forEach(match => {
      if (!combinedMap.has(match.id)) {
        combinedMap.set(match.id, { ...match, priority: 2 });
      }
    });
    return Array.from(combinedMap.values())
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return b.score - a.score;
      })
      .slice(0, 5);
  }

  async generateResponseWithContext(question, documents) {
    const context = documents.map(doc => doc.pageContent).join('\n\n');
    const prompt = `Context:\n${context}\n\nQuestion: ${question}\n\nPlease provide a comprehensive answer based on the given context.`;
    return {
      content: `Based on the provided context, here's the answer to your question...`,
      confidence: 0.9
    };
  }
}

module.exports = new RAGSystem();
