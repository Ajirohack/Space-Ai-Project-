"""
Vector database interface for Qdrant.

This module provides functions to interact with the Qdrant vector database for
storing and retrieving document embeddings with semantic search capabilities.
"""

# Minimal mock for get_vector_store for testing
class MockVectorStore:
    async def store_documents(self, chunk_data):
        return True
    async def delete_by_filter(self, filter_dict):
        return True
    async def search_vectors(self, collection_name, query_vector, limit, filters=None):
        # Return dummy search results
        return [
            {"document_id": "doc1", "chunk_index": 0, "score": 0.5, "content": "Mocked vector search result."}
        ]

def get_vector_store():
    return MockVectorStore()
