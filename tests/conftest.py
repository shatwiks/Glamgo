import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.main import app
from backend.app.core.config import settings
from backend.app.core.database import Base, get_db
from backend.app.services.seed_service import seed_database

# Use testing connection or main postgres
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    # Ensure database is seeded with initial data
    db = TestingSessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def customer_auth_headers(client):
    # Login as default customer Aanya Mehta
    resp = client.post("/api/v1/auth/login", json={
        "email": "aanya@example.com",
        "password": "Password@123"
    })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_auth_headers(client):
    resp = client.post("/api/v1/auth/login", json={
        "email": "admin@glamgo.com",
        "password": "Admin@123456"
    })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def pro_auth_headers(client):
    resp = client.post("/api/v1/auth/login", json={
        "email": "nisha@glamgo.com",
        "password": "Pro@123456"
    })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
