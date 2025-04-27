const { QdrantClient } = require('@qdrant/js-client-rest');

class VectorStore {
  constructor() {
    this.client = null;
    this.collectionName = 'knowledge_base';
  }

  async initialize(config = {}) {
    this.client = new QdrantClient({
      url: config.url || process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: config.apiKey || process.env.QDRANT_API_KEY,
    });

    // Ensure collection exists
    await this.createCollectionIfNotExists();
    return this;
  }

  async createCollectionIfNotExists() {
    const collections = await this.client.getCollections();
    if (!collections.collections.find(c => c.name === this.collectionName)) {
      await this.client.createCollection(this.collectionName, {
        vectors: {
          size: 1536, // Size for text-embedding-ada-002
          distance: 'Cosine',
        },
      });
    }
  }

  async store(vectors) {
    const points = vectors.map((vec, i) => ({
      id: Date.now() + i, // Simple unique ID generation
      vector: vec.vector,
      payload: {
        text: vec.text,
        ...vec.metadata,
      },
    }));

    await this.client.upsert(this.collectionName, {
      points,
    });

    return points.map(p => p.id);
  }

  async search(queryVector, limit = 5) {
    const results = await this.client.search(this.collectionName, {
      vector: queryVector,
      limit,
      with_payload: true,
      with_vectors: false,
    });

    return results.map(hit => ({
      score: hit.score,
      text: hit.payload.text,
      metadata: { ...hit.payload, text: undefined },
    }));
  }

  async getDocumentCount() {
    const stats = await this.client.getCollection(this.collectionName);
    return stats.points_count;
  }

  async getVectorCount() {
    return this.getDocumentCount(); // In this case, they're the same
  }

  async getLastUpdated() {
    const result = await this.client.scroll(this.collectionName, {
      limit: 1,
      with_payload: true,
      with_vectors: false,
      order_by: { key: 'id', direction: 'desc' },
    });

    if (result.points.length === 0) {
      return null;
    }

    return new Date(parseInt(result.points[0].id));
  }
}

module.exports = new VectorStore();
