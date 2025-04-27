"""
Memory manager for the Superior RAG system.

This module handles the hierarchical memory system, including working memory,
short-term memory, and long-term memory.
"""

import os
import logging
import asyncio
import time
import json
import uuid
from typing import Dict, List, Any, Optional, Union, Tuple
from datetime import datetime, timedelta

from src.utils.config import load_config
from src.storage.vector_store import get_vector_store
from src.storage.relational_store import get_relational_store
from src.storage.graph_store import get_graph_store
from src.storage.cache_store import get_cache_store

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("superior_rag.memory.memory_manager")

class MemoryManager:
    """Manages the hierarchical memory system for the RAG system."""
    
    def __init__(self):
        """Initialize the memory manager."""
        # Load configuration
        self.config = load_config()
        
        # Memory configuration
        self.memory_config = self.config.get("memory", {})
        
        # Working memory settings
        self.working_memory_ttl = self.memory_config.get("working_memory", {}).get("ttl_seconds", 3600)
        self.working_memory_max_items = self.memory_config.get("working_memory", {}).get("max_items", 50)
        
        # Short-term memory settings
        self.short_term_memory_ttl = self.memory_config.get("short_term_memory", {}).get("ttl_seconds", 86400)
        self.short_term_memory_max_items = self.memory_config.get("short_term_memory", {}).get("max_items", 200)
        
        # Long-term memory settings
        self.long_term_memory_threshold = self.memory_config.get("long_term_memory", {}).get("importance_threshold", 0.7)
        self.long_term_memory_max_items = self.memory_config.get("long_term_memory", {}).get("max_items", 1000)
        
        # Get database connections
        self.relational_store = get_relational_store()
        self.vector_store = get_vector_store()
        self.cache_store = get_cache_store()
        
        logger.info("Memory manager initialized")
        
    async def add_to_memory(
        self, 
        content: str,
        memory_type: str = "working",
        user_id: Optional[int] = None,
        conversation_id: Optional[str] = None,
        importance: float = 0.5,
        metadata: Optional[Dict[str, Any]] = None,
        embedding: Optional[List[float]] = None
    ) -> Dict[str, Any]:
        """
        Add an item to memory.
        
        Args:
            content: The memory content
            memory_type: Type of memory ("working", "short_term", "long_term")
            user_id: Optional user ID
            conversation_id: Optional conversation ID
            importance: Importance score (0-1)
            metadata: Additional metadata
            embedding: Pre-computed embedding
            
        Returns:
            Dict[str, Any]: The created memory item
        """
        if metadata is None:
            metadata = {}
            
        if not content.strip():
            logger.warning("Cannot add empty content to memory")
            return None
            
        # Validate memory type
        if memory_type not in ["working", "short_term", "long_term"]:
            logger.warning(f"Invalid memory type: {memory_type}, defaulting to 'working'")
            memory_type = "working"
            
        # Generate embedding if not provided
        if not embedding:
            vector_store = get_vector_store()
            # In a real implementation, we would use a proper embedding model here
            # For demo, we'll use a placeholder
            embedding = [0.0] * 1536
            
        # Set expiration time based on memory type
        expires_at = None
        if memory_type == "working":
            expires_at = datetime.utcnow() + timedelta(seconds=self.working_memory_ttl)
        elif memory_type == "short_term":
            expires_at = datetime.utcnow() + timedelta(seconds=self.short_term_memory_ttl)
            
        # Format expires_at for database
        expires_at_str = expires_at.isoformat() if expires_at else None
            
        # Create memory item in database
        query = """
            INSERT INTO memory_items 
            (user_id, conversation_id, content, embedding, memory_type, importance, metadata, expires_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, created_at
        """
        
        # Convert conversation_id to UUID if it's a string
        conv_id = None
        if conversation_id:
            try:
                conv_id = uuid.UUID(conversation_id)
            except ValueError:
                logger.warning(f"Invalid conversation_id: {conversation_id}")
                
        try:
            result = await self.relational_store.execute_query(
                query, 
                user_id, 
                conv_id, 
                content, 
                embedding, 
                memory_type, 
                importance, 
                json.dumps(metadata) if metadata else "{}", 
                expires_at_str
            )
            
            if not result or not result[0]:
                logger.error("Failed to insert memory item")
                return None
                
            memory_id = result[0]["id"]
            created_at = result[0]["created_at"]
            
            # For working memory, also cache in Redis for quicker access
            if memory_type == "working":
                cache_key = f"memory:{memory_type}:{user_id}:{conversation_id}:{memory_id}"
                memory_item = {
                    "id": memory_id,
                    "content": content,
                    "user_id": user_id,
                    "conversation_id": conversation_id,
                    "importance": importance,
                    "metadata": metadata,
                    "created_at": created_at.isoformat() if created_at else None,
                    "expires_at": expires_at_str
                }
                
                await self.cache_store.set(
                    cache_key,
                    json.dumps(memory_item),
                    self.working_memory_ttl
                )
            
            # Prune memory if needed
            await self._prune_memory(memory_type, user_id)
            
            return {
                "id": memory_id,
                "content": content,
                "memory_type": memory_type,
                "importance": importance,
                "created_at": created_at.isoformat() if created_at else None
            }
            
        except Exception as e:
            logger.error(f"Error adding to memory: {str(e)}")
            return None
            
    async def get_memory(
        self,
        query: str = None,
        memory_type: str = None,
        user_id: int = None,
        conversation_id: str = None,
        limit: int = 10,
        min_importance: float = 0.0,
        recency_weight: float = 0.5,
        include_content: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Retrieve memory items based on query and filters.
        
        Args:
            query: Optional query string
            memory_type: Filter by memory type
            user_id: Filter by user ID
            conversation_id: Filter by conversation ID
            limit: Maximum number of items to return
            min_importance: Minimum importance score
            recency_weight: Weight for recency in ranking (0-1)
            include_content: Whether to include full content
            
        Returns:
            List[Dict[str, Any]]: Retrieved memory items
        """
        if query and len(query.strip()) > 0:
            # Semantic search if query is provided
            return await self._semantic_memory_search(
                query=query,
                memory_type=memory_type,
                user_id=user_id,
                conversation_id=conversation_id,
                limit=limit,
                min_importance=min_importance,
                recency_weight=recency_weight,
                include_content=include_content
            )
        else:
            # Otherwise get latest memories
            return await self._get_recent_memory(
                memory_type=memory_type,
                user_id=user_id,
                conversation_id=conversation_id,
                limit=limit,
                min_importance=min_importance,
                include_content=include_content
            )
            
    async def _semantic_memory_search(
        self,
        query: str,
        memory_type: Optional[str] = None,
        user_id: Optional[int] = None,
        conversation_id: Optional[str] = None,
        limit: int = 10,
        min_importance: float = 0.0,
        recency_weight: float = 0.5,
        include_content: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Semantically search memory items.
        
        Args:
            query: The query string
            memory_type: Filter by memory type
            user_id: Filter by user ID
            conversation_id: Filter by conversation ID
            limit: Maximum number of items to return
            min_importance: Minimum importance score
            recency_weight: Weight for recency in ranking
            include_content: Whether to include full content
            
        Returns:
            List[Dict[str, Any]]: Retrieved memory items
        """
        # In a real implementation:
        # 1. Generate query embedding
        # 2. Search vector store
        # 3. Process and merge results
        
        # For demo purposes, we'll simulate this with a database query
        conditions = []
        params = []
        param_index = 1
        
        if memory_type:
            conditions.append(f"memory_type = ${param_index}")
            params.append(memory_type)
            param_index += 1
            
        if user_id:
            conditions.append(f"user_id = ${param_index}")
            params.append(user_id)
            param_index += 1
            
        if conversation_id:
            # Convert conversation_id to UUID if it's a string
            try:
                conv_id = uuid.UUID(conversation_id)
                conditions.append(f"conversation_id = ${param_index}")
                params.append(conv_id)
                param_index += 1
            except ValueError:
                logger.warning(f"Invalid conversation_id: {conversation_id}")
                
        if min_importance > 0:
            conditions.append(f"importance >= ${param_index}")
            params.append(min_importance)
            param_index += 1
            
        # Add condition to exclude expired items
        conditions.append(f"(expires_at IS NULL OR expires_at > NOW())")
        
        where_clause = " AND ".join(conditions) if conditions else "TRUE"
        
        # Simple full-text search on content for demo
        # In a real implementation, we would use vector search
        query_condition = f"content % ${param_index}"
        params.append(query)
        param_index += 1
        
        # Build query with content similarity and recency factors
        sql_query = f"""
            SELECT 
                id, 
                user_id, 
                conversation_id, 
                memory_type, 
                {"content," if include_content else ""} 
                importance, 
                access_count,
                created_at, 
                last_accessed_at,
                metadata,
                similarity(content, ${param_index-1}) as similarity,
                EXTRACT(EPOCH FROM (NOW() - created_at))/86400.0 as days_old
            FROM memory_items
            WHERE {where_clause} AND {query_condition}
            ORDER BY 
                (similarity * {1-recency_weight} + 
                (1.0/(days_old+1)) * {recency_weight}) DESC,
                importance DESC
            LIMIT {limit}
        """
        
        try:
            results = await self.relational_store.execute_query(sql_query, *params)
            
            # Format results
            memory_items = []
            for row in results:
                item = {
                    "id": row["id"],
                    "memory_type": row["memory_type"],
                    "importance": float(row["importance"]),
                    "access_count": row["access_count"],
                    "created_at": row["created_at"].isoformat() if row["created_at"] else None,
                    "last_accessed_at": row["last_accessed_at"].isoformat() if row["last_accessed_at"] else None,
                }
                
                if include_content:
                    item["content"] = row["content"]
                    
                if row["user_id"]:
                    item["user_id"] = row["user_id"]
                    
                if row["conversation_id"]:
                    item["conversation_id"] = str(row["conversation_id"])
                    
                if row["metadata"]:
                    try:
                        if isinstance(row["metadata"], str):
                            item["metadata"] = json.loads(row["metadata"])
                        else:
                            item["metadata"] = row["metadata"]
                    except:
                        item["metadata"] = {}
                
                # Add relevance score
                item["relevance"] = float(row["similarity"])
                    
                memory_items.append(item)
            
            # Update access count for retrieved items
            await self._update_access_count([row["id"] for row in results])
                
            return memory_items
            
        except Exception as e:
            logger.error(f"Error searching memory: {str(e)}")
            return []
            
    async def _get_recent_memory(
        self,
        memory_type: Optional[str] = None,
        user_id: Optional[int] = None,
        conversation_id: Optional[str] = None,
        limit: int = 10,
        min_importance: float = 0.0,
        include_content: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Get recent memory items based on filters.
        
        Args:
            memory_type: Filter by memory type
            user_id: Filter by user ID
            conversation_id: Filter by conversation ID
            limit: Maximum number of items to return
            min_importance: Minimum importance score
            include_content: Whether to include full content
            
        Returns:
            List[Dict[str, Any]]: Retrieved memory items
        """
        conditions = []
        params = []
        param_index = 1
        
        if memory_type:
            conditions.append(f"memory_type = ${param_index}")
            params.append(memory_type)
            param_index += 1
            
        if user_id:
            conditions.append(f"user_id = ${param_index}")
            params.append(user_id)
            param_index += 1
            
        if conversation_id:
            # Convert conversation_id to UUID if it's a string
            try:
                conv_id = uuid.UUID(conversation_id)
                conditions.append(f"conversation_id = ${param_index}")
                params.append(conv_id)
                param_index += 1
            except ValueError:
                logger.warning(f"Invalid conversation_id: {conversation_id}")
                
        if min_importance > 0:
            conditions.append(f"importance >= ${param_index}")
            params.append(min_importance)
            param_index += 1
            
        # Add condition to exclude expired items
        conditions.append(f"(expires_at IS NULL OR expires_at > NOW())")
        
        where_clause = " AND ".join(conditions) if conditions else "TRUE"
        
        sql_query = f"""
            SELECT 
                id, 
                user_id, 
                conversation_id, 
                memory_type, 
                {"content," if include_content else ""} 
                importance, 
                access_count,
                created_at, 
                last_accessed_at,
                metadata
            FROM memory_items
            WHERE {where_clause}
            ORDER BY importance DESC, last_accessed_at DESC, created_at DESC
            LIMIT {limit}
        """
        
        try:
            results = await self.relational_store.execute_query(sql_query, *params)
            
            # Format results
            memory_items = []
            for row in results:
                item = {
                    "id": row["id"],
                    "memory_type": row["memory_type"],
                    "importance": float(row["importance"]),
                    "access_count": row["access_count"],
                    "created_at": row["created_at"].isoformat() if row["created_at"] else None,
                    "last_accessed_at": row["last_accessed_at"].isoformat() if row["last_accessed_at"] else None,
                }
                
                if include_content:
                    item["content"] = row["content"]
                    
                if row["user_id"]:
                    item["user_id"] = row["user_id"]
                    
                if row["conversation_id"]:
                    item["conversation_id"] = str(row["conversation_id"])
                    
                if row["metadata"]:
                    try:
                        if isinstance(row["metadata"], str):
                            item["metadata"] = json.loads(row["metadata"])
                        else:
                            item["metadata"] = row["metadata"]
                    except:
                        item["metadata"] = {}
                    
                memory_items.append(item)
            
            # Update access count for retrieved items
            await self._update_access_count([row["id"] for row in results])
                
            return memory_items
            
        except Exception as e:
            logger.error(f"Error getting recent memory: {str(e)}")
            return []
            
    async def _update_access_count(self, memory_ids: List[int]) -> None:
        """
        Update access count for memory items.
        
        Args:
            memory_ids: List of memory item IDs
        """
        if not memory_ids:
            return
            
        # Update access count and last accessed timestamp
        id_list = ",".join([str(id) for id in memory_ids])
        
        query = f"""
            UPDATE memory_items
            SET 
                access_count = access_count + 1,
                last_accessed_at = NOW()
            WHERE id IN ({id_list})
        """
        
        try:
            await self.relational_store.execute_query(query)
        except Exception as e:
            logger.error(f"Error updating memory access count: {str(e)}")
            
    async def _prune_memory(
        self,
        memory_type: str,
        user_id: Optional[int] = None
    ) -> None:
        """
        Prune memory items based on limits.
        
        Args:
            memory_type: The memory type to prune
            user_id: Optional user ID to scope the pruning
        """
        # Get max items limit based on memory type
        max_items = 0
        if memory_type == "working":
            max_items = self.working_memory_max_items
        elif memory_type == "short_term":
            max_items = self.short_term_memory_max_items
        elif memory_type == "long_term":
            max_items = self.long_term_memory_max_items
        else:
            return
            
        # Don't prune if no limit is set
        if max_items <= 0:
            return
            
        # Build condition
        conditions = [f"memory_type = '{memory_type}'"]
        if user_id:
            conditions.append(f"user_id = {user_id}")
            
        where_clause = " AND ".join(conditions)
        
        # Count memory items
        count_query = f"SELECT COUNT(*) as count FROM memory_items WHERE {where_clause}"
        
        try:
            count_result = await self.relational_store.execute_query(count_query)
            count = count_result[0]["count"] if count_result else 0
            
            # If count exceeds limit, delete oldest items with lowest importance
            if count > max_items:
                excess = count - max_items
                
                # Delete excess items
                delete_query = f"""
                    DELETE FROM memory_items
                    WHERE id IN (
                        SELECT id FROM memory_items
                        WHERE {where_clause}
                        ORDER BY importance ASC, last_accessed_at ASC, created_at ASC
                        LIMIT {excess}
                    )
                """
                
                await self.relational_store.execute_query(delete_query)
                logger.info(f"Pruned {excess} items from {memory_type} memory")
                
        except Exception as e:
            logger.error(f"Error pruning memory: {str(e)}")
            
    async def promote_to_long_term(
        self,
        memory_id: int,
        new_importance: Optional[float] = None
    ) -> bool:
        """
        Promote a memory item to long-term memory.
        
        Args:
            memory_id: ID of the memory item
            new_importance: Optional new importance score
            
        Returns:
            bool: Success status
        """
        # Get memory item
        query = "SELECT * FROM memory_items WHERE id = $1"
        
        try:
            result = await self.relational_store.execute_query(query, memory_id)
            
            if not result or not result[0]:
                logger.warning(f"Memory item {memory_id} not found")
                return False
                
            memory = result[0]
            
            # If already long-term, just update importance if needed
            if memory["memory_type"] == "long_term":
                if new_importance is not None and new_importance != memory["importance"]:
                    update_query = "UPDATE memory_items SET importance = $1 WHERE id = $2"
                    await self.relational_store.execute_query(update_query, new_importance, memory_id)
                    logger.info(f"Updated importance for long-term memory item {memory_id}")
                    
                return True
                
            # Update memory type and importance
            importance = new_importance if new_importance is not None else max(memory["importance"], self.long_term_memory_threshold)
            
            update_query = """
                UPDATE memory_items 
                SET 
                    memory_type = 'long_term',
                    importance = $1,
                    expires_at = NULL
                WHERE id = $2
            """
            
            await self.relational_store.execute_query(update_query, importance, memory_id)
            logger.info(f"Promoted memory item {memory_id} to long-term memory")
            
            # Prune long-term memory if needed
            await self._prune_memory("long_term", memory["user_id"])
            
            return True
            
        except Exception as e:
            logger.error(f"Error promoting to long-term memory: {str(e)}")
            return False
            
    async def forget(
        self,
        memory_id: int
    ) -> bool:
        """
        Permanently delete a memory item.
        
        Args:
            memory_id: ID of the memory item to forget
            
        Returns:
            bool: Success status
        """
        query = "DELETE FROM memory_items WHERE id = $1"
        
        try:
            await self.relational_store.execute_query(query, memory_id)
            logger.info(f"Deleted memory item {memory_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting memory item: {str(e)}")
            return False
            
    async def forget_all(
        self,
        user_id: Optional[int] = None,
        conversation_id: Optional[str] = None,
        memory_type: Optional[str] = None
    ) -> int:
        """
        Delete all memory items matching the filters.
        
        Args:
            user_id: Filter by user ID
            conversation_id: Filter by conversation ID
            memory_type: Filter by memory type
            
        Returns:
            int: Number of deleted items
        """
        conditions = []
        params = []
        param_index = 1
        
        if user_id:
            conditions.append(f"user_id = ${param_index}")
            params.append(user_id)
            param_index += 1
            
        if conversation_id:
            # Convert conversation_id to UUID if it's a string
            try:
                conv_id = uuid.UUID(conversation_id)
                conditions.append(f"conversation_id = ${param_index}")
                params.append(conv_id)
                param_index += 1
            except ValueError:
                logger.warning(f"Invalid conversation_id: {conversation_id}")
                
        if memory_type:
            conditions.append(f"memory_type = ${param_index}")
            params.append(memory_type)
            param_index += 1
            
        # If no conditions, don't delete everything
        if not conditions:
            logger.warning("Attempted to delete all memory without filters, aborting")
            return 0
            
        where_clause = " AND ".join(conditions)
        query = f"DELETE FROM memory_items WHERE {where_clause} RETURNING id"
        
        try:
            result = await self.relational_store.execute_query(query, *params)
            deleted_count = len(result) if result else 0
            logger.info(f"Deleted {deleted_count} memory items")
            return deleted_count
        except Exception as e:
            logger.error(f"Error deleting memory items: {str(e)}")
            return 0

# Singleton instance
_memory_manager = None

def get_memory_manager() -> MemoryManager:
    """Get or create the memory manager singleton."""
    global _memory_manager
    if _memory_manager is None:
        _memory_manager = MemoryManager()
    return _memory_manager