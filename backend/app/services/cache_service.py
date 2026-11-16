import fnmatch
import json
import logging
import threading
import time
from typing import Any, Optional
from backend.app.core.redis_client import get_redis

logger = logging.getLogger("glamgo.cache")

CATALOG_CACHE_TTL = 300  # 5 minutes default
_mem_lock = threading.Lock()
_mem_store: dict[str, tuple[float, str]] = {}


class CacheService:
    """Production Redis caching layer with seamless in-memory TTL fallback."""

    @staticmethod
    def get(key: str) -> Optional[Any]:
        r = get_redis()
        if not r:
            now = time.monotonic()
            with _mem_lock:
                entry = _mem_store.get(key)
                if not entry:
                    return None
                expires_at, raw = entry
                if now >= expires_at:
                    _mem_store.pop(key, None)
                    return None
            return json.loads(raw)
        try:
            val = r.get(key)
            if val is not None:
                return json.loads(val)
        except Exception as e:
            logger.warning("Cache GET failed for key '%s': %s", key, e)
        return None

    @staticmethod
    def set(key: str, value: Any, ttl: int = CATALOG_CACHE_TTL) -> bool:
        try:
            serialized = json.dumps(value, default=str)
        except Exception as e:
            logger.warning("Cache serialize failed for key '%s': %s", key, e)
            return False

        r = get_redis()
        if not r:
            with _mem_lock:
                _mem_store[key] = (time.monotonic() + max(1, int(ttl)), serialized)
            return True
        try:
            return bool(r.set(key, serialized, ex=ttl))
        except Exception as e:
            logger.warning("Cache SET failed for key '%s': %s", key, e)
            return False

    @staticmethod
    def invalidate_pattern(pattern: str) -> int:
        r = get_redis()
        if not r:
            with _mem_lock:
                keys = [k for k in _mem_store if fnmatch.fnmatchcase(k, pattern)]
                for k in keys:
                    _mem_store.pop(k, None)
                return len(keys)
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
