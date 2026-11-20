import logging
from typing import Optional, Tuple
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


def get_redis_status() -> Tuple[str, bool]:
    """
    Evaluate cache readiness according to configuration policy:
      - If REDIS_URL is configured: ping must succeed -> ('healthy', True) else ('unhealthy', False).
      - If REDIS_URL is intentionally blank:
          - If REDIS_REQUIRED is True -> ('unhealthy', False)
          - Otherwise intentional single-instance memory fallback -> ('fallback_memory', True).
    """
    redis_url = (getattr(settings, "REDIS_URL", None) or "").strip()
    redis_required = bool(getattr(settings, "REDIS_REQUIRED", False))

    if not redis_url:
        if redis_required:
            return "unhealthy", False
        return "fallback_memory", True

    if check_redis_health():
        return "healthy", True
    return "unhealthy", False
