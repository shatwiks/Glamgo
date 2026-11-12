import logging
from typing import Optional
import redis
from backend.app.core.config import settings

logger = logging.getLogger("glamgo.redis")

try:
    redis_client: Optional[redis.Redis] = redis.from_url(
        settings.REDIS_URL,
        decode_responses=True,
        socket_timeout=3.0,
        socket_connect_timeout=3.0
    )
except Exception as e:
    logger.error("Failed to initialize Redis client: %s", e)
    redis_client = None


def get_redis() -> Optional[redis.Redis]:
    return redis_client


def check_redis_health() -> bool:
    if not redis_client:
        return False
    try:
        return bool(redis_client.ping())
    except Exception as e:
        logger.warning("Redis health check failed: %s", e)
        return False
