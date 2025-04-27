"""
Cache store interface for Redis.

This module provides functions to interact with Redis for caching
retrieved documents, query transformations, and working memory.
"""

import os
import logging
import asyncio
import json
from typing import Dict, List, Any, Optional, Union, TypeVar, Generic
from redis.asyncio import Redis
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("superior_rag.storage.cache_store")

# Load environment variables
load_dotenv()

# Type variable for generic cache operations
T = TypeVar('T')

# Singleton instance
_cache_store = None

# Minimal mock for get_cache_store for testing
class MockCacheStore:
    async def get(self, key):
        return None
    async def set(self, key, value, expire=None, expiry=None):
        return True
    async def delete(self, key):
        return True

def init_cache_store():
    global _cache_store
    _cache_store = MockCacheStore()

def get_cache_store():
    global _cache_store
    if '_cache_store' not in globals() or _cache_store is None:
        raise RuntimeError("Cache store has not been initialized. Call init_cache_store() first.")
    return _cache_store

class CacheStore:
    """Interface for Redis cache store."""
    
    def __init__(self):
        self.client = None
        self.host = os.getenv("REDIS_HOST", "localhost")
        self.port = int(os.getenv("REDIS_PORT", "6379"))
        self.password = os.getenv("REDIS_PASSWORD", "")
        self.db = int(os.getenv("REDIS_DB", "0"))
        self.prefix = "superior_rag:"
        
    async def connect(self) -> None:
        """Connect to Redis server."""
        try:
            logger.info(f"Connecting to Redis at {self.host}:{self.port}...")
            self.client = Redis(
                host=self.host,
                port=self.port,
                password=self.password or None,
                db=self.db,
                encoding="utf-8",
                decode_responses=True
            )
            # Ping the server to verify connection
            await self.client.ping()
            logger.info("Successfully connected to Redis")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {str(e)}")
            raise
            
    async def close(self) -> None:
        """Close Redis connection."""
        if self.client:
            await self.client.close()
            logger.info("Disconnected from Redis")
            
    async def set(self, key: str, value: Any, expiry: Optional[int] = None) -> bool:
        """
        Set a value in the cache with optional expiration.
        
        Args:
            key: Cache key
            value: Value to store
            expiry: Optional expiration time in seconds
            
        Returns:
            bool: True if successful
        """
        if not self.client:
            await self.connect()
            
        try:
            # Convert complex types to JSON
            if not isinstance(value, (str, int, float, bool)):
                value = json.dumps(value)
                
            full_key = f"{self.prefix}{key}"
            
            if expiry:
                await self.client.setex(full_key, expiry, value)
            else:
                await self.client.set(full_key, value)
                
            logger.debug(f"Set value for key '{key}' in cache")
            return True
        except Exception as e:
            logger.error(f"Error setting cache value: {str(e)}")
            return False
            
    async def get(self, key: str) -> Any:
        """
        Get a value from the cache.
        
        Args:
            key: Cache key
            
        Returns:
            Any: The stored value or None if not found
        """
        if not self.client:
            await self.connect()
            
        try:
            full_key = f"{self.prefix}{key}"
            value = await self.client.get(full_key)
            
            if value is None:
                return None
                
            # Try to parse as JSON if it looks like a complex type
            if value.startswith('{') or value.startswith('['):
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    pass
                    
            logger.debug(f"Retrieved value for key '{key}' from cache")
            return value
        except Exception as e:
            logger.error(f"Error getting cache value: {str(e)}")
            return None
            
    async def delete(self, key: str) -> bool:
        """
        Delete a value from the cache.
        
        Args:
            key: Cache key
            
        Returns:
            bool: True if successful
        """
        if not self.client:
            await self.connect()
            
        try:
            full_key = f"{self.prefix}{key}"
            await self.client.delete(full_key)
            logger.debug(f"Deleted key '{key}' from cache")
            return True
        except Exception as e:
            logger.error(f"Error deleting cache value: {str(e)}")
            return False
            
    async def exists(self, key: str) -> bool:
        """
        Check if a key exists in the cache.
        
        Args:
            key: Cache key
            
        Returns:
            bool: True if the key exists
        """
        if not self.client:
            await self.connect()
            
        try:
            full_key = f"{self.prefix}{key}"
            return await self.client.exists(full_key)
        except Exception as e:
            logger.error(f"Error checking cache key existence: {str(e)}")
            return False
            
    async def ttl(self, key: str) -> int:
        """
        Get the remaining time to live for a key.
        
        Args:
            key: Cache key
            
        Returns:
            int: TTL in seconds, -1 if no expiry, -2 if key doesn't exist
        """
        if not self.client:
            await self.connect()
            
        try:
            full_key = f"{self.prefix}{key}"
            return await self.client.ttl(full_key)
        except Exception as e:
            logger.error(f"Error checking cache key TTL: {str(e)}")
            return -2
            
    async def expire(self, key: str, seconds: int) -> bool:
        """
        Set expiration time for a key.
        
        Args:
            key: Cache key
            seconds: TTL in seconds
            
        Returns:
            bool: True if successful
        """
        if not self.client:
            await self.connect()
            
        try:
            full_key = f"{self.prefix}{key}"
            return await self.client.expire(full_key, seconds)
        except Exception as e:
            logger.error(f"Error setting cache key expiration: {str(e)}")
            return False
            
    async def keys(self, pattern: str = "*") -> List[str]:
        """
        Get keys matching a pattern.
        
        Args:
            pattern: Pattern to match
            
        Returns:
            List[str]: List of matching keys
        """
        if not self.client:
            await self.connect()
            
        try:
            full_pattern = f"{self.prefix}{pattern}"
            keys = await self.client.keys(full_pattern)
            # Remove prefix from returned keys
            return [k[len(self.prefix):] for k in keys]
        except Exception as e:
            logger.error(f"Error getting cache keys: {str(e)}")
            return []
            
    async def mset(self, mapping: Dict[str, Any], expiry: Optional[int] = None) -> bool:
        """
        Set multiple values in the cache.
        
        Args:
            mapping: Dictionary of key-value pairs
            expiry: Optional expiration time in seconds
            
        Returns:
            bool: True if successful
        """
        if not self.client:
            await self.connect()
            
        try:
            # Add prefix to keys and convert complex values to JSON
            prefixed_mapping = {}
            for k, v in mapping.items():
                if not isinstance(v, (str, int, float, bool)):
                    v = json.dumps(v)
                prefixed_mapping[f"{self.prefix}{k}"] = v
                
            # Set values
            await self.client.mset(prefixed_mapping)
            
            # Set expiration if specified
            if expiry:
                for key in mapping.keys():
                    full_key = f"{self.prefix}{key}"
                    await self.client.expire(full_key, expiry)
                    
            logger.debug(f"Set {len(mapping)} values in cache")
            return True
        except Exception as e:
            logger.error(f"Error setting multiple cache values: {str(e)}")
            return False
            
    async def mget(self, keys: List[str]) -> List[Any]:
        """
        Get multiple values from the cache.
        
        Args:
            keys: List of cache keys
            
        Returns:
            List[Any]: List of values
        """
        if not self.client:
            await self.connect()
            
        try:
            # Add prefix to keys
            full_keys = [f"{self.prefix}{k}" for k in keys]
            
            # Get values
            values = await self.client.mget(full_keys)
            
            # Process values (attempt JSON parsing)
            processed_values = []
            for value in values:
                if value is None:
                    processed_values.append(None)
                elif isinstance(value, str) and (value.startswith('{') or value.startswith('[')):
                    try:
                        processed_values.append(json.loads(value))
                    except json.JSONDecodeError:
                        processed_values.append(value)
                else:
                    processed_values.append(value)
                    
            logger.debug(f"Retrieved {len(keys)} values from cache")
            return processed_values
        except Exception as e:
            logger.error(f"Error getting multiple cache values: {str(e)}")
            return [None] * len(keys)
            
    # Memory-specific methods
    
    async def add_to_working_memory(self, key: str, value: Any, user_id: str = "system") -> bool:
        """
        Add an item to working memory.
        
        Args:
            key: Item key
            value: Item value
            user_id: User ID for multi-user systems
            
        Returns:
            bool: True if successful
        """
        memory_key = f"memory:working:{user_id}:{key}"
        
        # Get config for working memory TTL
        from src.utils.config import load_config
        config = load_config()
        ttl = config.get("cache", {}).get("working_memory_ttl", 600)  # Default 10 minutes
        
        return await self.set(memory_key, value, expiry=ttl)
        
    async def get_from_working_memory(self, key: str, user_id: str = "system") -> Any:
        """
        Get an item from working memory.
        
        Args:
            key: Item key
            user_id: User ID for multi-user systems
            
        Returns:
            Any: The stored value or None if not found
        """
        memory_key = f"memory:working:{user_id}:{key}"
        return await self.get(memory_key)
        
    async def add_to_short_term_memory(self, key: str, value: Any, user_id: str = "system") -> bool:
        """
        Add an item to short-term memory.
        
        Args:
            key: Item key
            value: Item value
            user_id: User ID for multi-user systems
            
        Returns:
            bool: True if successful
        """
        memory_key = f"memory:short_term:{user_id}:{key}"
        
        # Get config for short-term memory TTL
        from src.utils.config import load_config
        config = load_config()
        days = config.get("cache", {}).get("short_term_memory_ttl_days", 7)  # Default 7 days
        ttl = days * 24 * 60 * 60  # Convert days to seconds
        
        return await self.set(memory_key, value, expiry=ttl)
        
    async def get_from_short_term_memory(self, key: str, user_id: str = "system") -> Any:
        """
        Get an item from short-term memory.
        
        Args:
            key: Item key
            user_id: User ID for multi-user systems
            
        Returns:
            Any: The stored value or None if not found
        """
        memory_key = f"memory:short_term:{user_id}:{key}"
        return await self.get(memory_key)
        
    async def get_working_memory_keys(self, user_id: str = "system") -> List[str]:
        """
        Get all working memory keys for a user.
        
        Args:
            user_id: User ID for multi-user systems
            
        Returns:
            List[str]: List of memory keys
        """
        pattern = f"memory:working:{user_id}:*"
        keys = await self.keys(pattern)
        
        # Remove the prefix
        prefix_len = len(f"memory:working:{user_id}:")
        return [k[prefix_len:] for k in keys]
        
    async def get_all_working_memory(self, user_id: str = "system") -> Dict[str, Any]:
        """
        Get all working memory items for a user.
        
        Args:
            user_id: User ID for multi-user systems
            
        Returns:
            Dict[str, Any]: Map of memory items
        """
        keys = await self.get_working_memory_keys(user_id)
        if not keys:
            return {}
            
        # Get all values
        memory_keys = [f"memory:working:{user_id}:{k}" for k in keys]
        values = await self.mget(memory_keys)
        
        # Create result dictionary
        result = {}
        for k, v in zip(keys, values):
            result[k] = v
            
        return result
        
    async def clear_working_memory(self, user_id: str = "system") -> bool:
        """
        Clear all working memory for a user.
        
        Args:
            user_id: User ID for multi-user systems
            
        Returns:
            bool: True if successful
        """
        pattern = f"memory:working:{user_id}:*"
        keys = await self.keys(pattern)
        
        if not keys:
            return True
            
        try:
            for key in keys:
                await self.delete(key)
            return True
        except Exception as e:
            logger.error(f"Error clearing working memory: {str(e)}")
            return False