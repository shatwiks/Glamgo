import json
import logging
from typing import Any, Optional
from backend.app.core.redis_client import get_redis

logger = logging.getLogger("glamgo.cache")

CATALOG_CACHE_TTL = 300  # 5 minutes default


class CacheService:
    """Production Redis caching layer with seamless fallback on cache miss or Redis outage."""

    @staticmethod
    def get(key: str) -> Optional[Any]:
        r = get_redis()
        if not r:
            return None
        try:
            val = r.get(key)
            if val is not None:
                return json.loads(val)
        except Exception as e:
            logger.warning("Cache GET failed for key '%s': %s", key, e)
        return None

    @staticmethod
    def set(key: str, value: Any, ttl: int = CATALOG_CACHE_TTL) -> bool:
        r = get_redis()
        if not r:
            return False
        try:
            serialized = json.dumps(value, default=str)
            return bool(r.set(key, serialized, ex=ttl))
        except Exception as e:
            logger.warning("Cache SET failed for key '%s': %s", key, e)
            return False

    @staticmethod
    def invalidate_pattern(pattern: str) -> int:
        r = get_redis()
        if not r:
            return 0
        try:
            keys = list(r.scan_iter(match=pattern))
            if keys:
                return r.delete(*keys)
            return 0
        except Exception as e:
            logger.warning("Cache INVALIDATE failed for pattern '%s': %s", pattern, e)
            return 0

    @classmethod
    def invalidate_catalog(cls, category: Optional[str] = None) -> int:
        pattern = f"glamgo:catalog:{category}*" if category else "glamgo:catalog:*"
        return cls.invalidate_pattern(pattern)


cache_service = CacheService()
