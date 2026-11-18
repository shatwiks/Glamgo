from urllib.parse import urlparse
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.main import app
from backend.app.core.config import settings
from backend.app.core.database import Base, get_db
from backend.app.services.seed_service import seed_database
from backend.app.models.catalog import Product

# Safety guard: ensure tests only run against isolated local/container PostgreSQL
_db_host = (urlparse(settings.DATABASE_URL).hostname or "").lower()
if _db_host not in ("127.0.0.1", "localhost", "db"):
    raise RuntimeError(
        f"Refusing to run destructive test setup against non-local database host '{_db_host}'. "
        "Configure DATABASE_URL to point to an isolated local/disposable PostgreSQL instance."
    )

# Use testing connection or main postgres
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    # Populate ephemeral test-only gateway defaults if .env is absent in CI
    if not settings.RAZORPAY_KEY_ID:
        settings.RAZORPAY_KEY_ID = "rzp_test_ci_placeholder"
    if not settings.RAZORPAY_KEY_SECRET:
        settings.RAZORPAY_KEY_SECRET = "ci_test_secret_placeholder"
    if not settings.RAZORPAY_WEBHOOK_SECRET:
        settings.RAZORPAY_WEBHOOK_SECRET = "ci_webhook_secret_placeholder"
    if not settings.INTERNAL_MAINTENANCE_TOKEN:
        settings.INTERNAL_MAINTENANCE_TOKEN = "ci_maintenance_token_placeholder_32c"

    # Ensure database is seeded with initial data and reset catalog inventory
    db = TestingSessionLocal()
    try:
        seed_database(db)
        from backend.app.services.commerce_service import CommerceService
        for pid in ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7']:
            p = db.query(Product).filter(Product.id == pid).first()
            if p:
                listings = CommerceService.ensure_product_listings(db, p)
                canonical = [l for l in listings if l.seller_id == p.seller_id] or listings
                target_stock = 100 if len(canonical) <= 1 else 50
                for listing in canonical:
                    listing.stock = target_stock
                db.flush()
                CommerceService.sync_product_stock(db, pid)
        db.commit()
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
    # Login as default platform admin
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


@pytest.fixture
def maintenance_auth_headers():
    return {"X-Maintenance-Token": settings.INTERNAL_MAINTENANCE_TOKEN}
