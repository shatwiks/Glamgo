import pytest
from fastapi.testclient import TestClient


def test_liveness_probe(client: TestClient):
    resp = client.get("/health/live")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "alive"
    assert "app" in data


def test_readiness_probe(client: TestClient):
    resp = client.get("/health/ready")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ready"
    assert data["database"] == "healthy"
    assert data["cache"] == "healthy"


def test_combined_health_probe(client: TestClient):
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "online"
    assert data["database"] == "healthy"
    assert data["cache"] == "healthy"


def test_prometheus_metrics_endpoint(client: TestClient):
    resp = client.get("/metrics")
    assert resp.status_code == 200
    body = resp.text
    # Check standard prometheus metrics and custom glamgo metrics
    assert "glamgo_http_requests_total" in body
    assert "glamgo_http_request_duration_seconds" in body
    assert "glamgo_orders_created_total" in body
    assert "glamgo_bookings_created_total" in body


def test_security_and_correlation_headers(client: TestClient):
    custom_cid = "test-corr-uuid-9999"
    resp = client.get("/health/live", headers={"x-request-id": custom_cid})
    assert resp.status_code == 200

    # Correlation ID propagation
    assert resp.headers.get("x-request-id") == custom_cid

    # Security headers
    assert resp.headers.get("x-frame-options") == "SAMEORIGIN"
    assert resp.headers.get("x-content-type-options") == "nosniff"
    assert resp.headers.get("referrer-policy") == "strict-origin-when-cross-origin"
    assert "default-src 'self'" in resp.headers.get("content-security-policy", "")
    assert "geolocation=()" in resp.headers.get("permissions-policy", "")
