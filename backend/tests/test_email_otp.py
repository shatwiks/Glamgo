from contextlib import asynccontextmanager
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi import HTTPException

from backend.app.main import app
from backend.app.core.database import Base, get_db
from backend.app.models.user import User, UserRole
from backend.app.services.email_service import validate_real_email


@pytest.fixture
def test_setup(monkeypatch):
    engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    db = factory()

    def override():
        yield db

    app.dependency_overrides[get_db] = override

    @asynccontextmanager
    async def no_lifespan(app):
        yield

    monkeypatch.setattr(app.router, 'lifespan_context', no_lifespan)
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c, db
    app.dependency_overrides.clear()
    db.close()
    engine.dispose()


def test_validate_real_email_syntax():
    with pytest.raises(HTTPException) as exc:
        validate_real_email("notanemail")
    assert exc.value.status_code == 400


def test_validate_real_email_disposable():
    with pytest.raises(HTTPException) as exc:
        validate_real_email("spammer@mailinator.com")
    assert exc.value.status_code == 400
    assert "Disposable or temporary" in exc.value.detail


def test_validate_real_email_fake_domain():
    with pytest.raises(HTTPException) as exc:
        validate_real_email("fakeuser@nonexistentdomain123456789xyz.com")
    assert exc.value.status_code == 400
    assert "does not exist or has no active mail server" in exc.value.detail


def test_validate_real_email_legitimate():
    norm = validate_real_email("shatwik@gmail.com")
    assert norm == "shatwik@gmail.com"


def test_email_otp_full_flow(test_setup, monkeypatch):
    client, db = test_setup
    from backend.app.core.config import settings
    monkeypatch.setattr(settings, "ALLOW_DEV_OTP_ECHO", True)
    monkeypatch.setenv("ALLOW_DEV_OTP_ECHO", "true")

    email = "customer.verify@gmail.com"
    req_res = client.post("/api/v1/auth/otp/email/request", json={"email": email})
    assert req_res.status_code == 200
    body = req_res.json()
    assert "email" in body
    assert body["email"] == email
    otp = body.get("dev_otp") or body.get("otp")
    assert otp is not None
    assert len(otp) == 6

    # 2. Reject wrong OTP
    bad_res = client.post("/api/v1/auth/otp/email/verify", json={"email": email, "otp": "000000"})
    assert bad_res.status_code == 401

    # 3. Verify correct OTP
    ok_res = client.post("/api/v1/auth/otp/email/verify", json={"email": email, "otp": otp})
    assert ok_res.status_code == 200
    auth_data = ok_res.json()
    assert "access_token" in auth_data
    assert auth_data["role"] == "customer"
    assert auth_data["email"] == email
