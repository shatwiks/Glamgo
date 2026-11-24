import ipaddress
import os
import time
import logging
import threading
from typing import Dict, List
from fastapi import Request, HTTPException, status
from backend.app.core.redis_client import get_redis

logger = logging.getLogger("glamgo.ratelimit")

_in_memory_lock = threading.Lock()
_in_memory_windows: Dict[str, List[float]] = {}
MAX_IN_MEMORY_KEYS = 5000


def _extract_client_ip(request: Request) -> str:
    """Resolve client IP safely without trusting client-spoofed left-most X-Forwarded-For."""
    peer_host = (request.client.host if request.client and request.client.host else "").strip()
    trusted_proxy = False
    if peer_host in ("testclient", "localhost"):
        trusted_proxy = False
    elif peer_host:
        try:
            ip_obj = ipaddress.ip_address(peer_host)
            trusted_proxy = ip_obj.is_loopback or ip_obj.is_private
        except ValueError:
            trusted_proxy = False

    if trusted_proxy:
        xff = request.headers.get("x-forwarded-for", "")
        if xff:
            # Take the right-most hop appended by the reverse proxy, never the client-controlled left-most hop
            hops = [h.strip() for h in xff.split(",") if h.strip()]
            for candidate in reversed(hops):
                try:
                    ipaddress.ip_address(candidate)
                    return candidate
                except ValueError:
                    continue

    return peer_host or "unknown"


class RateLimiter:
    """Sliding-window Redis rate limiter dependency for FastAPI.

    Enforces request limits per client IP or identified token.
    Falls back to a thread-safe in-memory sliding window when Redis is unavailable.
    """

    def __init__(self, requests: int, window_seconds: int, prefix: str = "rl"):
        self.requests = requests
        self.window_seconds = window_seconds
        self.prefix = prefix

    def _enforce_in_memory(self, key: str, client_ip: str, now: float, window_start: float):
        with _in_memory_lock:
            if key not in _in_memory_windows and len(_in_memory_windows) >= MAX_IN_MEMORY_KEYS:
                expired_keys = [
                    k for k, timestamps in _in_memory_windows.items()
                    if not timestamps or timestamps[-1] <= window_start
                ]
                for k in expired_keys:
                    _in_memory_windows.pop(k, None)
                if len(_in_memory_windows) >= MAX_IN_MEMORY_KEYS:
                    oldest_key = next(iter(_in_memory_windows))
                    _in_memory_windows.pop(oldest_key, None)

            bucket = [ts for ts in _in_memory_windows.get(key, []) if ts > window_start]
            if len(bucket) >= self.requests:
                _in_memory_windows[key] = bucket
                logger.warning(
                    "In-memory rate limit exceeded for prefix=%s ip=%s count=%d limit=%d",
                    self.prefix, client_ip, len(bucket), self.requests
                )
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Maximum {self.requests} requests per {self.window_seconds}s.",
                    headers={
                        "Retry-After": str(self.window_seconds),
                        "X-RateLimit-Limit": str(self.requests),
                        "X-RateLimit-Remaining": "0"
                    }
                )
            bucket.append(now)
            _in_memory_windows[key] = bucket

    async def __call__(self, request: Request):
        # During automated test suite runs, bypass rate limiting unless explicitly testing it
        if os.environ.get("PYTEST_CURRENT_TEST") and request.headers.get("x-test-rate-limit") != "true":
            return

        client_ip = _extract_client_ip(request)
        key = f"glamgo:ratelimit:{self.prefix}:{client_ip}"
        now = time.time()
        window_start = now - self.window_seconds

        r = get_redis()
        if not r:
            self._enforce_in_memory(key, client_ip, now, window_start)
            return

        try:
            pipe = r.pipeline(transaction=True)
            # Remove timestamps outside current window
            pipe.zremrangebyscore(key, 0, window_start)
            # Count remaining timestamps
            pipe.zcard(key)
            # Add current timestamp
            pipe.zadd(key, {str(now): now})
            # Set key expiration
            pipe.expire(key, self.window_seconds + 1)
            results = pipe.execute()

            current_count = results[1]  # zcard before adding current request

            if current_count >= self.requests:
                logger.warning(
                    "Rate limit exceeded for prefix=%s ip=%s count=%d limit=%d",
                    self.prefix, client_ip, current_count, self.requests
                )
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Maximum {self.requests} requests per {self.window_seconds}s.",
                    headers={
                        "Retry-After": str(self.window_seconds),
                        "X-RateLimit-Limit": str(self.requests),
                        "X-RateLimit-Remaining": "0"
                    }
                )
        except HTTPException:
            raise
        except Exception as e:
            logger.warning("Rate limiter Redis error for key %s: %s (falling back to in-memory)", key, e)
            self._enforce_in_memory(key, client_ip, now, window_start)
