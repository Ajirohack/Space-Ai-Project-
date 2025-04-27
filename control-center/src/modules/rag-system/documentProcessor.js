const { OpenAIEmbeddings } = require('langchain/embeddings/openai');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');

class DocumentProcessor {
  constructor() {
    this.embeddings = null;
    this.splitter = null;
  }

  async initialize(config = {}) {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: config.openaiApiKey || process.env.OPENAI_API_KEY,
      batchSize: config.batchSize || 512,
      modelName: config.modelName || 'text-embedding-ada-002',
    });

    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: config.chunkSize || 1000,
      chunkOverlap: config.chunkOverlap || 200,
    });

    return this;
  }

  async chunk(document) {
    if (!document.text) {
      throw new Error('Document must contain text field');
    }

    const chunks = await this.splitter.createDocuments(
      [document.text],
      [
        {
          id: document.id,
          metadata: document.metadata || {},
        },
      ]
    );

    return chunks;
  }

  async embed(textOrChunks) {
    if (!this.embeddings) {
      throw new Error('DocumentProcessor not initialized');
    }

    if (typeof textOrChunks === 'string') {
      return await this.embeddings.embedQuery(textOrChunks);
    }

    const texts = textOrChunks.map(chunk => chunk.pageContent);
    const vectors = await this.embeddings.embedDocuments(texts);

    return vectors.map((vector, i) => ({
      vector,
      text: texts[i],
      metadata: textOrChunks[i].metadata,
    }));
  }
}

module.exports = new DocumentProcessor();
