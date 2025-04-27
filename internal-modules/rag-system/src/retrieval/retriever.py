"""
Superior RAG retriever component.

This module handles semantic retrieval of document chunks based on user queries.
"""

import logging
import asyncio
import time
from typing import Dict, List, Any, Optional, Union, Tuple
from datetime import datetime

from src.utils.config import load_config
from src.storage.vector_store import get_vector_store
from src.storage.relational_store import get_relational_store
from src.storage.graph_store import get_graph_store
from src.storage.cache_store import get_cache_store

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("superior_rag.retrieval.retriever")

class Retriever:
    """Superior RAG retriever for semantic search of document chunks."""
    
    def __init__(self):
        """Initialize the retriever."""
        # Load configuration
        self.config = load_config()
        
        # Retrieval configuration
        self.retrieval_config = self.config.get("retrieval", {})
        
        # Default parameters
        self.default_top_k = self.retrieval_config.get("default_top_k", 5)
        self.default_score_threshold = self.retrieval_config.get("score_threshold", 0.7)
        self.hybrid_search_enabled = self.retrieval_config.get("hybrid_search_enabled", True)
        self.reranking_enabled = self.retrieval_config.get("reranking_enabled", False)
        self.cache_enabled = self.retrieval_config.get("cache_enabled", True)
        self.cache_ttl = self.retrieval_config.get("cache_ttl_seconds", 3600)  # 1 hour
        
        # Get store connections
        self.vector_store = get_vector_store()
        self.relational_store = get_relational_store()
        self.graph_store = get_graph_store()
        
        # Get cache if enabled
        self.cache_store = get_cache_store() if self.cache_enabled else None
        
        logger.info("Retriever initialized")
    
    async def retrieve(
        self,
        query: str,
        top_k: Optional[int] = None,
        filters: Optional[Dict[str, Any]] = None,
        use_hybrid: Optional[bool] = None,
        include_content: bool = True,
        cache_key: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant document chunks for a query.
        
        Args:
            query: The user query
            top_k: Number of results to return
            filters: Metadata filters to apply to the search
            use_hybrid: Whether to use hybrid search (vector + keyword)
            include_content: Whether to include document content in results
            cache_key: Optional cache key for this query
            
        Returns:
            List[Dict[str, Any]]: Retrieval results
        """
        # Use default values if not provided
        top_k = top_k or self.default_top_k
        use_hybrid = self.hybrid_search_enabled if use_hybrid is None else use_hybrid
        
        # Check cache if enabled and cache key provided
        if self.cache_enabled and cache_key:
            cached_results = await self._get_cached_results(cache_key)
            if cached_results:
                logger.info(f"Cache hit for query: {query[:50]}...")
                return cached_results
                
        # Track query start time for metrics
        start_time = time.time()
        
        # Generate query embedding
        embedding = await self._generate_embedding(query)
        
        # Perform vector search
        vector_results = await self._vector_search(
            embedding, top_k, filters
        )
        
        # Perform hybrid search if enabled
        if use_hybrid:
            keyword_results = await self._keyword_search(
                query, top_k, filters
            )
            
            # Merge results from vector and keyword search
            results = self._merge_results(vector_results, keyword_results)
        else:
            results = vector_results
            
        # Apply reranking if enabled
        if self.reranking_enabled and len(results) > 1:
            results = await self._rerank_results(query, results)
            
        # Fetch full content if needed
        if include_content:
            results = await self._fetch_chunk_content(results)
            
        # Post-process results
        processed_results = self._process_results(results)
        
        # Track metrics
        query_time = time.time() - start_time
        retrieval_count = len(processed_results)
        
        # Log metrics
        logger.info(f"Query '{query[:50]}...' retrieved {retrieval_count} results in {query_time:.2f}s")
        
        # Store query and results in cache
        if self.cache_enabled and cache_key:
            await self._cache_results(cache_key, processed_results)
            
        # Log retrieval operation to database 
        await self._log_retrieval(
            query, filters, retrieval_count, query_time, use_hybrid
        )
        
        return processed_results
        
    async def _generate_embedding(
        self,
        text: str
    ) -> List[float]:
        """
        Generate embedding for query text.
        
        Args:
            text: Text to embed
            
        Returns:
            List[float]: Embedding vector
        """
        # In a real implementation, we would use a proper embedding model
        # such as SentenceTransformers, OpenAI embeddings, or a local model
        
        # For demo purposes, we'll use a placeholder similar to the document processor
        # This should be replaced with actual embedding generation
        import hashlib
        import struct
        
        # Generate a deterministic but meaningless embedding based on text hash
        text_hash = hashlib.md5(text.encode('utf-8')).digest()
        
        embedding_size = 1536  # Standard size for many models
        
        # Generate a pseudo-random but deterministic embedding from the hash
        values = []
        for i in range(0, embedding_size * 4, 4):
            idx = i % len(text_hash)
            value = struct.unpack('f', text_hash[idx:idx+4] if idx + 4 <= len(text_hash) 
                                else text_hash[idx:] + text_hash[:idx+4-len(text_hash)])[0]
            values.append(value)
            
        # Normalize
        magnitude = sum(v * v for v in values) ** 0.5
        normalized = [v / magnitude for v in values]
        
        return normalized
        
    async def _vector_search(
        self,
        embedding: List[float],
        top_k: int,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Perform vector search using the query embedding.
        
        Args:
            embedding: Query embedding vector
            top_k: Number of results to return
            filters: Metadata filters to apply
            
        Returns:
            List[Dict[str, Any]]: Vector search results
        """
        # Search in vector database
        results = await self.vector_store.search_vectors(
            collection_name="document_chunks",
            query_vector=embedding,
            limit=top_k,
            filters=filters
        )
        
        return results
        
    async def _keyword_search(
        self,
        query: str,
        top_k: int,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Perform keyword search for the query.
        
        Args:
            query: User query
            top_k: Number of results to return
            filters: Metadata filters to apply
            
        Returns:
            List[Dict[str, Any]]: Keyword search results
        """
        # In a real implementation, we would use a keyword search
        # like full-text search in PostgreSQL or Elasticsearch
        
        # For demo purposes, this is a placeholder
        # that would be replaced with actual keyword search
        return []
        
    def _merge_results(
        self,
        vector_results: List[Dict[str, Any]],
        keyword_results: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Merge and deduplicate results from vector and keyword search.
        
        Args:
            vector_results: Results from vector search
            keyword_results: Results from keyword search
            
        Returns:
            List[Dict[str, Any]]: Merged results
        """
        # Create dictionary to track unique IDs and combine scores
        merged = {}
        
        # Process vector results
        for result in vector_results:
            doc_id = result.get("payload", {}).get("document_id")
            chunk_index = result.get("payload", {}).get("chunk_index")
            
            if not (doc_id and chunk_index is not None):
                continue
                
            key = f"{doc_id}:{chunk_index}"
            
            merged[key] = {
                "id": key,
                "document_id": doc_id,
                "chunk_index": chunk_index,
                "vector_score": result.get("score", 0),
                "keyword_score": 0,
                "combined_score": result.get("score", 0),  # Initially just vector score
                "payload": result.get("payload", {})
            }
            
        # Process keyword results
        for result in keyword_results:
            doc_id = result.get("document_id")
            chunk_index = result.get("chunk_index")
            
            if not (doc_id and chunk_index is not None):
                continue
                
            key = f"{doc_id}:{chunk_index}"
            keyword_score = result.get("score", 0)
            
            if key in merged:
                # Update existing entry
                merged[key]["keyword_score"] = keyword_score
                # Combine scores: 0.7 * vector + 0.3 * keyword
                merged[key]["combined_score"] = 0.7 * merged[key]["vector_score"] + 0.3 * keyword_score
            else:
                # Add new entry
                merged[key] = {
                    "id": key,
                    "document_id": doc_id,
                    "chunk_index": chunk_index,
                    "vector_score": 0,
                    "keyword_score": keyword_score,
                    "combined_score": 0.3 * keyword_score,  # Just keyword contribution
                    "payload": result.get("payload", {})
                }
                
        # Convert back to list and sort by combined score
        results = list(merged.values())
        results.sort(key=lambda x: x["combined_score"], reverse=True)
        
        return results
        
    async def _rerank_results(
        self,
        query: str,
        results: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Rerank retrieved results using a more powerful model.
        
        Args:
            query: User query
            results: Initial retrieval results
            
        Returns:
            List[Dict[str, Any]]: Reranked results
        """
        # In a real implementation, we would use a reranker model
        # such as BERT-based cross-encoder
        
        # For demo purposes, this is a placeholder
        # that would be replaced with actual reranking
        return results
        
    async def _fetch_chunk_content(
        self,
        results: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Fetch full content for chunks from the database.
        
        Args:
            results: Retrieval results with document_id and chunk_index
            
        Returns:
            List[Dict[str, Any]]: Results with full chunk content
        """
        # Extract document and chunk IDs
        ids_to_fetch = []
        for result in results:
            doc_id = result.get("document_id")
            chunk_index = result.get("chunk_index")
            
            if doc_id is not None and chunk_index is not None:
                ids_to_fetch.append((doc_id, chunk_index))
                
        if not ids_to_fetch:
            return results
            
        # Fetch content from PostgreSQL
        contents = await self._batch_fetch_chunks(ids_to_fetch)
        
        # Add content to results
        for result in results:
            doc_id = result.get("document_id")
            chunk_index = result.get("chunk_index")
            
            key = (doc_id, chunk_index)
            if key in contents:
                result["content"] = contents[key].get("content")
                result["metadata"] = contents[key].get("metadata", {})
                
        return results
        
    async def _batch_fetch_chunks(
        self,
        id_pairs: List[Tuple[int, int]]
    ) -> Dict[Tuple[int, int], Dict[str, Any]]:
        """
        Fetch multiple chunk contents at once from the database.
        
        Args:
            id_pairs: List of (document_id, chunk_index) pairs
            
        Returns:
            Dict[Tuple[int, int], Dict[str, Any]]: Map of chunk data
        """
        # For small number of chunks, we can use individual queries
        if len(id_pairs) <= 5:
            results = {}
            for doc_id, chunk_index in id_pairs:
                chunk_data = await self._fetch_single_chunk(doc_id, chunk_index)
                if chunk_data:
                    results[(doc_id, chunk_index)] = chunk_data
            return results
            
        # For larger number of chunks, use a batch query
        # Prepare query
        placeholders = []
        flat_params = []
        
        for i, (doc_id, chunk_index) in enumerate(id_pairs):
            placeholders.append(f"(${i*2+1}, ${i*2+2})")
            flat_params.extend([doc_id, chunk_index])
            
        query = f"""
            SELECT 
                document_id, 
                chunk_index, 
                content, 
                metadata
            FROM 
                document_chunks
            WHERE 
                (document_id, chunk_index) IN ({','.join(placeholders)})
        """
        
        try:
            rows = await self.relational_store.execute_query(query, *flat_params)
            
            # Convert to dictionary
            results = {}
            for row in rows:
                doc_id = row.get("document_id")
                chunk_index = row.get("chunk_index")
                
                results[(doc_id, chunk_index)] = {
                    "content": row.get("content"),
                    "metadata": row.get("metadata", {})
                }
                
            return results
            
        except Exception as e:
            logger.error(f"Error batch fetching chunks: {str(e)}")
            return {}
        
    async def _fetch_single_chunk(
        self,
        document_id: int,
        chunk_index: int
    ) -> Dict[str, Any]:
        """
        Fetch a single chunk from the database.
        
        Args:
            document_id: Document ID
            chunk_index: Chunk index
            
        Returns:
            Dict[str, Any]: Chunk data or empty dict
        """
        query = """
            SELECT 
                content, 
                metadata
            FROM 
                document_chunks
            WHERE 
                document_id = $1 AND 
                chunk_index = $2
        """
        
        try:
            rows = await self.relational_store.execute_query(
                query, document_id, chunk_index
            )
            
            if rows and rows[0]:
                return {
                    "content": rows[0].get("content"),
                    "metadata": rows[0].get("metadata", {})
                }
            else:
                return {}
                
        except Exception as e:
            logger.error(f"Error fetching chunk {document_id}:{chunk_index}: {str(e)}")
            return {}
            
    def _process_results(
        self,
        results: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Process and clean up retrieval results.
        
        Args:
            results: Raw retrieval results
            
        Returns:
            List[Dict[str, Any]]: Processed results
        """
        processed = []
        
        for result in results:
            # Create a clean result object
            processed_result = {
                "id": result.get("id"),
                "document_id": result.get("document_id"),
                "chunk_index": result.get("chunk_index"),
                "score": result.get("combined_score") or result.get("vector_score") or 0,
            }
            
            # Add content if available
            if "content" in result:
                processed_result["content"] = result["content"]
                
            # Add metadata
            metadata = result.get("metadata", {})
            if not metadata and "payload" in result:
                metadata = result.get("payload", {})
                
            # Clean up metadata
            if metadata:
                # Remove redundant fields
                for field in ["document_id", "chunk_index", "id"]:
                    if field in metadata:
                        del metadata[field]
                        
                if metadata:
                    processed_result["metadata"] = metadata
                    
            processed.append(processed_result)
            
        return processed
        
    async def _get_cached_results(
        self,
        cache_key: str
    ) -> List[Dict[str, Any]]:
        """
        Get results from cache if available.
        
        Args:
            cache_key: Cache key for the query
            
        Returns:
            List[Dict[str, Any]]: Cached results or empty list
        """
        if not self.cache_store:
            return []
            
        try:
            # Prefix key to avoid collisions
            prefixed_key = f"retrieval:{cache_key}"
            
            # Get from cache
            cached_data = await self.cache_store.get(prefixed_key)
            
            if cached_data:
                return cached_data
                
        except Exception as e:
            logger.error(f"Error getting results from cache: {str(e)}")
            
        return []
        
    async def _cache_results(
        self,
        cache_key: str,
        results: List[Dict[str, Any]]
    ) -> None:
        """
        Store results in cache.
        
        Args:
            cache_key: Cache key for the query
            results: Results to cache
        """
        if not self.cache_store:
            return
            
        try:
            # Prefix key to avoid collisions
            prefixed_key = f"retrieval:{cache_key}"
            
            # Store in cache with TTL
            await self.cache_store.set(
                prefixed_key, 
                results,
                expiry=self.cache_ttl
            )
            
        except Exception as e:
            logger.error(f"Error caching results: {str(e)}")
            
    async def _log_retrieval(
        self,
        query: str,
        filters: Optional[Dict[str, Any]],
        result_count: int,
        query_time: float,
        hybrid_search: bool
    ) -> None:
        """
        Log retrieval operation to database.
        
        Args:
            query: User query
            filters: Applied filters
            result_count: Number of results returned
            query_time: Query execution time
            hybrid_search: Whether hybrid search was used
        """
        # In a real implementation, we would log to database
        # For demo purposes, we'll just log to console
        logger.debug(
            f"Retrieval log: query='{query[:50]}...', "
            f"filters={filters}, "
            f"results={result_count}, "
            f"time={query_time:.2f}s, "
            f"hybrid={hybrid_search}"
        )

# Singleton instance
_retriever = None

def get_retriever() -> Retriever:
    """Get or create the retriever singleton."""
    global _retriever
    if _retriever is None:
        _retriever = Retriever()
    return _retriever