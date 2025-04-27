"""
Relational database interface for PostgreSQL with pgvector extension.

This module provides functions to interact with PostgreSQL for structured data storage
including user information, document metadata, and query history.
"""

# Minimal mock for get_relational_store for testing
class MockRelationalStore:
    async def store_document_metadata(self, document_id, metadata):
        return True
    async def store_chunk_metadata(self, document_id, chunk_id, chunk_index, metadata, text, embedding):
        return True
    async def delete_document_metadata(self, document_id):
        return True
    async def get_document_metadata(self, document_id):
        return {}

def get_relational_store():
    return MockRelationalStore()
