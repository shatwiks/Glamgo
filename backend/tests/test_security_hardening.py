from contextlib import asynccontextmanager
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.core.config import settings
from backend.app.core.database import Base, get_db
from backend.app.core.rate_limit import _in_memory_windows
from backend.app.schemas.commerce import ShipmentCreate, ReturnRequestCreate


@pytest.fixture
def sec_client(monkeypatch):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    db = factory()

    def override():
        yield db

    app.dependency_overrides[get_db] = override

    @asynccontextmanager
    async def no_lifespan(app):
        yield

    monkeypatch.setattr(app.router, "lifespan_context", no_lifespan)
    _in_memory_windows.clear()
    with TestClient(app, raise_server_exceptions=True) as client:
        yield client, db
    app.dependency_overrides.clear()
    db.close()
    engine.dispose()


@pytest.mark.parametrize("bad_role", ["admin", "salon_owner", "professional", "seller"])
def test_public_register_blocks_all_non_customer_roles(sec_client, bad_role):
    client, _ = sec_client
    res = client.post(
        "/api/v1/auth/register",
        json={
            "email": f"attempt_{bad_role}@example.com",
            "password": "StrongPassword123!",
            "name": "Role Escalation Test",
            "role": bad_role,
        },
    )
    assert res.status_code == 403


def test_register_and_login_case_insensitive_and_password_bounds(sec_client):
    client, _ = sec_client
    # Short password (<6 chars) rejected with 422
    short_res = client.post(
        "/api/v1/auth/register",
        json={"email": "short@example.com", "password": "123", "name": "Short"},
    )
    assert short_res.status_code == 422

    # >72 byte password rejected cleanly with 422 (never HTTP 500)
    long_res = client.post(
        "/api/v1/auth/register",
        json={"email": "long@example.com", "password": "A" * 80, "name": "Long"},
    )
    assert long_res.status_code == 422

    # Mixed-case registration normalized; case-variant duplicate rejected
    ok_res = client.post(
        "/api/v1/auth/register",
        json={"email": "Alice.User@Example.COM", "password": "ValidPassword1!", "name": "Alice"},
    )
    assert ok_res.status_code == 200
    assert ok_res.json()["email"] == "alice.user@example.com"

    dup_res = client.post(
        "/api/v1/auth/register",
        json={"email": "alice.user@example.com", "password": "ValidPassword1!", "name": "Alice Dup"},
    )
    assert dup_res.status_code == 400

    # Mixed-case login succeeds; >72 byte password on login returns 401 (never 500)
    login_ok = client.post(
        "/api/v1/auth/login",
        json={"email": "ALICE.USER@example.com", "password": "ValidPassword1!"},
    )
    assert login_ok.status_code == 200

    login_long = client.post(
        "/api/v1/auth/login",
        json={"email": "alice.user@example.com", "password": "B" * 90},
    )
    assert login_long.status_code == 401


def test_rate_limiter_ignores_spoofed_xff_from_untrusted_peer(sec_client, monkeypatch):
    client, _ = sec_client
    monkeypatch.setattr("backend.app.core.rate_limit.get_redis", lambda: None)
    _in_memory_windows.clear()

    # Send 15 failed login attempts rotating X-Forwarded-For on every request; 16th MUST still be 429
    for i in range(15):
        r = client.post(
            "/api/v1/auth/login",
            headers={"x-test-rate-limit": "true", "X-Forwarded-For": f"203.0.113.{i + 1}"},
            json={"email": "nobody@example.com", "password": "wrongpassword"},
        )
        assert r.status_code == 401

    blocked = client.post(
        "/api/v1/auth/login",
        headers={"x-test-rate-limit": "true", "X-Forwarded-For": "198.51.100.99"},
        json={"email": "nobody@example.com", "password": "wrongpassword"},
    )
    assert blocked.status_code == 429


def test_shipment_and_return_schemas_block_javascript_urls():
    with pytest.raises(ValidationError):
        ShipmentCreate(
            carrier_name="BlueDart",
            tracking_number="BD123",
            tracking_url="javascript:alert(document.cookie)",
        )
    with pytest.raises(ValidationError):
        ReturnRequestCreate(
            order_item_id=1,
            reason="Damaged",
            evidence_image_url="data:text/html,<script>alert(1)</script>",
        )
    valid = ShipmentCreate(
        carrier_name="BlueDart",
        tracking_number="BD123",
        tracking_url="https://bluedart.com/track/BD123",
    )
    assert valid.tracking_url == "https://bluedart.com/track/BD123"


def test_multi_referrer_farming_and_prod_demo_gift_cards_blocked(sec_client, monkeypatch):
    client, _ = sec_client
    u1 = client.post("/api/v1/auth/register", json={"email": "ref1@example.com", "password": "Password123!", "name": "Ref One"}).json()
    u2 = client.post("/api/v1/auth/register", json={"email": "ref2@example.com", "password": "Password123!", "name": "Ref Two"}).json()
    u3 = client.post("/api/v1/auth/register", json={"email": "claimer@example.com", "password": "Password123!", "name": "Claimer"}).json()

    h1 = {"Authorization": f"Bearer {u1['access_token']}"}
    h2 = {"Authorization": f"Bearer {u2['access_token']}"}
    h3 = {"Authorization": f"Bearer {u3['access_token']}"}

    code1 = client.get("/api/v1/users/rewards", headers=h1).json()["referral_code"]
    code2 = client.get("/api/v1/users/rewards", headers=h2).json()["referral_code"]

    first_claim = client.post("/api/v1/users/rewards/redeem", headers=h3, json={"code": code1})
    assert first_claim.status_code == 200

    # Farming a second referrer's code on the same account must be blocked with 409
    second_claim = client.post("/api/v1/users/rewards/redeem", headers=h3, json={"code": code2})
    assert second_claim.status_code == 409

    # In production with ALLOW_DEMO_GIFT_CARDS=False, hardcoded GLAM500 is hidden & rejected
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "ALLOW_DEMO_GIFT_CARDS", False)
    rw_prod = client.get("/api/v1/users/rewards", headers=h3).json()
    assert rw_prod["gift_cards"] == []
    prod_gc = client.post("/api/v1/users/rewards/redeem", headers=h3, json={"code": "GLAM500"})
    assert prod_gc.status_code == 404


def test_request_id_header_sanitization(sec_client):
    client, _ = sec_client
    bad_cid = "evil\r\nSet-Cookie: hacked=1; " + ("X" * 200)
    res = client.get("/health/live", headers={"X-Request-ID": bad_cid})
    assert res.status_code == 200
    returned_cid = res.headers.get("X-Request-ID", "")
    assert returned_cid.startswith("req_")
    assert "evil" not in returned_cid
