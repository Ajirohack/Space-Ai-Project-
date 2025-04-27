// RAG Document model for RAG System
const mongoose = require('mongoose');

const ragDocumentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  embedding: [{ type: Number }],
  source: { type: String },
  indexedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RAGDocument', ragDocumentSchema);
