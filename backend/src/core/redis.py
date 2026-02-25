"""
Redis configuration and client management for FusionAI Enterprise Suite
"""

import json
import logging
from typing import Any, Optional, Union
from datetime import timedelta

import redis.asyncio as redis
from redis.asyncio import ConnectionPool

from src.core.config import get_settings

logger = logging.getLogger(__name__)

# Get settings
settings = get_settings()

# Global Redis client
redis_client: Optional[redis.Redis] = None


async def init_redis() -> None:
    """Initialize Redis connection."""
    global redis_client
    
    try:
        # Create connection pool
        pool = ConnectionPool.from_url(
            settings.REDIS_URL,
            max_connections=settings.REDIS_MAX_CONNECTIONS,
            retry_on_timeout=True,
            socket_keepalive=True,
            socket_keepalive_options={},
        )
        
        # Create Redis client
        redis_client = redis.Redis(connection_pool=pool)
        
        # Test connection
        await redis_client.ping()
        
        logger.info("Redis connection established successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize Redis: {e}")
        raise


async def close_redis() -> None:
    """Close Redis connection."""
    global redis_client
    
    if redis_client:
        try:
            await redis_client.close()
            logger.info("Redis connection closed successfully")
        except Exception as e:
            logger.error(f"Error closing Redis connection: {e}")


def get_redis() -> redis.Redis:
    """Get Redis client instance."""
    if redis_client is None:
        raise RuntimeError("Redis client not initialized. Call init_redis() first.")
    return redis_client


# Cache operations
class CacheManager:
    """Redis cache manager with common operations."""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        try:
            value = await self.redis.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Error getting cache key {key}: {e}")
            return None
    
    async def set(
        self, 
        key: str, 
        value: Any, 
        ttl: Optional[Union[int, timedelta]] = None
    ) -> bool:
        """Set value in cache with optional TTL."""
        try:
            serialized_value = json.dumps(value, default=str)
            if ttl:
                await self.redis.setex(key, ttl, serialized_value)
            else:
                await self.redis.set(key, serialized_value)
            return True
        except Exception as e:
            logger.error(f"Error setting cache key {key}: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete key from cache."""
        try:
            result = await self.redis.delete(key)
            return result > 0
        except Exception as e:
            logger.error(f"Error deleting cache key {key}: {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache."""
        try:
            result = await self.redis.exists(key)
            return result > 0
        except Exception as e:
            logger.error(f"Error checking cache key {key}: {e}")
            return False
    
    async def expire(self, key: str, ttl: Union[int, timedelta]) -> bool:
        """Set expiration for key."""
        try:
            await self.redis.expire(key, ttl)
            return True
        except Exception as e:
            logger.error(f"Error setting expiration for key {key}: {e}")
            return False
    
    async def get_ttl(self, key: str) -> int:
        """Get TTL for key."""
        try:
            return await self.redis.ttl(key)
        except Exception as e:
            logger.error(f"Error getting TTL for key {key}: {e}")
            return -1
    
    async def increment(self, key: str, amount: int = 1) -> int:
        """Increment counter in cache."""
        try:
            return await self.redis.incrby(key, amount)
        except Exception as e:
            logger.error(f"Error incrementing key {key}: {e}")
            return 0
    
    async def decrement(self, key: str, amount: int = 1) -> int:
        """Decrement counter in cache."""
        try:
            return await self.redis.decrby(key, amount)
        except Exception as e:
            logger.error(f"Error decrementing key {key}: {e}")
            return 0
    
    async def get_keys(self, pattern: str = "*") -> list:
        """Get all keys matching pattern."""
        try:
            return await self.redis.keys(pattern)
        except Exception as e:
            logger.error(f"Error getting keys with pattern {pattern}: {e}")
            return []
    
    async def flush_all(self) -> bool:
        """Flush all keys from cache."""
        try:
            await self.redis.flushall()
            return True
        except Exception as e:
            logger.error(f"Error flushing cache: {e}")
            return False


# Global cache manager instance
cache_manager: Optional[CacheManager] = None


def get_cache_manager() -> CacheManager:
    """Get cache manager instance."""
    if cache_manager is None:
        raise RuntimeError("Cache manager not initialized. Call init_redis() first.")
    return cache_manager


# Session management
class SessionManager:
    """Redis-based session management."""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.session_prefix = "session:"
        self.default_ttl = timedelta(days=7)
    
    async def create_session(self, session_id: str, data: dict) -> bool:
        """Create new session."""
        key = f"{self.session_prefix}{session_id}"
        return await cache_manager.set(key, data, self.default_ttl)
    
    async def get_session(self, session_id: str) -> Optional[dict]:
        """Get session data."""
        key = f"{self.session_prefix}{session_id}"
        return await cache_manager.get(key)
    
    async def update_session(self, session_id: str, data: dict) -> bool:
        """Update session data."""
        key = f"{self.session_prefix}{session_id}"
        return await cache_manager.set(key, data, self.default_ttl)
    
    async def delete_session(self, session_id: str) -> bool:
        """Delete session."""
        key = f"{self.session_prefix}{session_id}"
        return await cache_manager.delete(key)
    
    async def extend_session(self, session_id: str) -> bool:
        """Extend session TTL."""
        key = f"{self.session_prefix}{session_id}"
        return await cache_manager.expire(key, self.default_ttl)


# Rate limiting
class RateLimiter:
    """Redis-based rate limiting."""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.rate_limit_prefix = "rate_limit:"
    
    async def is_allowed(
        self, 
        identifier: str, 
        limit: int, 
        window: int
    ) -> tuple[bool, int, int]:
        """
        Check if request is allowed based on rate limit.
        Returns (is_allowed, current_count, remaining_requests)
        """
        key = f"{self.rate_limit_prefix}{identifier}"
        
        try:
            # Use Redis pipeline for atomic operations
            pipe = self.redis.pipeline()
            
            # Increment counter
            pipe.incr(key)
            pipe.expire(key, window)
            
            results = await pipe.execute()
            current_count = results[0]
            
            if current_count == 1:
                # First request in window
                await self.redis.expire(key, window)
            
            is_allowed = current_count <= limit
            remaining = max(0, limit - current_count)
            
            return is_allowed, current_count, remaining
            
        except Exception as e:
            logger.error(f"Error checking rate limit for {identifier}: {e}")
            # Fail open - allow request if Redis is down
            return True, 0, limit


# Health check
async def check_redis_health() -> bool:
    """Check if Redis is healthy."""
    try:
        await redis_client.ping()
        return True
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        return False




