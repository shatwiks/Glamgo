import logging
from typing import Optional
import redis
from backend.app.core.config import settings

logger = logging.getLogger("glamgo.redis")

redis_client: Optional[redis.Redis] = None

if getattr(settings, "REDIS_URL", None) and settings.REDIS_URL.strip():
    try:
        redis_client = redis.from_url(
            settings.REDIS_URL.strip(),
            decode_responses=True,
            socket_timeout=3.0,
            socket_connect_timeout=3.0
        )
    except Exception as e:
        logger.warning("Failed to connect to Redis at %s: %s", settings.REDIS_URL, e)
        redis_client = None
else:
    logger.info("No REDIS_URL configured; operating in graceful in-memory fallback mode.")


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
