# Minimal mock for get_embedding_model for testing
import asyncio

class MockEmbeddingModel:
    async def get_text_embedding(self, text):
        # Return a fixed-size vector of zeros for testing
        return [0.0] * 768

def get_embedding_model():
    return MockEmbeddingModel()
