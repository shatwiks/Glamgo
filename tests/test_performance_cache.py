import pytest
import time
from fastapi.testclient import TestClient
from backend.app.services.cache_service import cache_service
from backend.app.core.rate_limit import RateLimiter
from backend.app.core.redis_client import get_redis


def test_cache_service_crud_and_invalidation():
    test_key = "glamgo:catalog:test_product_123"
    test_data = {"id": "p_test", "name": "Silk Glow Serum", "price": 1299.0}

    # 1. Set key
    success = cache_service.set(test_key, test_data, ttl=60)
    assert success is True

    # 2. Get key
    cached = cache_service.get(test_key)
    assert cached is not None
    assert cached["name"] == "Silk Glow Serum"
    assert cached["price"] == 1299.0

    # 3. Invalidate pattern
    deleted_count = cache_service.invalidate_pattern("glamgo:catalog:test_product_*")
    assert deleted_count >= 1

    # 4. Verify gone
    cached_after = cache_service.get(test_key)
    assert cached_after is None


def test_rate_limiter_exceeded(client: TestClient):
    # Test auth rate limit by repeatedly hitting /api/v1/auth/login with invalid data
    # Limiter allows 15 requests in 60s
    limit = 15
    got_429 = False
    status_codes = []

    for i in range(limit + 5):
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "nonexistent@test.com", "password": "wrongpassword123"},
            headers={"x-test-rate-limit": "true"}
        )
        status_codes.append(resp.status_code)
        if resp.status_code == 429:
            got_429 = True
            assert "Retry-After" in resp.headers
            assert "X-RateLimit-Limit" in resp.headers
            break

    assert got_429 is True, f"Expected 429 Too Many Requests, got codes: {status_codes}"
