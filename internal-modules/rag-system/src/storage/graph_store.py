"""
Graph database interface for Neo4j.

This module provides functions to interact with Neo4j for storing
and querying relationships between documents, entities, and concepts.
"""

# Minimal mock for get_graph_store for testing
class MockGraphStore:
    async def create_document_node(self, document_id, properties):
        return True
    async def create_chunk_node(self, chunk_id, document_id, chunk_index, properties):
        return True
    async def create_entity_node(self, entity_text, entity_type):
        return True
    async def create_chunk_entity_relation(self, chunk_id, entity_text, entity_type):
        return True
    async def analyze_entity_relationships(self, document_id):
        return True
    async def delete_document(self, document_id):
        return True

def get_graph_store():
    return MockGraphStore()