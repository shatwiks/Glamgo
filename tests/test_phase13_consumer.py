from sqlalchemy import create_engine, inspect, text
from backend.app.core.database import ensure_phase13_schema_columns


def test_ensure_phase13_schema_columns_idempotent_sqlite_and_pg(db):
    sqlite_engine = create_engine(
        "sqlite:///:memory:",
        pool_pre_ping=True,
        connect_args={"check_same_thread": False},
    )
    with sqlite_engine.begin() as conn:
        conn.execute(text("CREATE TABLE salons (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL)"))
        conn.execute(text("CREATE TABLE professional_profiles (id INTEGER PRIMARY KEY, name VARCHAR(255) NOT NULL)"))
        conn.execute(text("CREATE TABLE services (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL)"))
        conn.execute(text("CREATE TABLE bookings (id VARCHAR(50) PRIMARY KEY, title VARCHAR(255) NOT NULL)"))
        conn.execute(text("CREATE TABLE orders (id VARCHAR(50) PRIMARY KEY, total FLOAT NOT NULL)"))
        conn.execute(text("CREATE TABLE users (id INTEGER PRIMARY KEY, email VARCHAR(255) NOT NULL)"))

    added_first = ensure_phase13_schema_columns(sqlite_engine)
    assert len(added_first) > 0
    assert "salons.city" in added_first
    assert "salons.lat" in added_first
    assert "salons.lng" in added_first
    assert "professional_profiles.area" in added_first
    assert "services.service_cities" in added_first
    assert "bookings.arrival_otp" in added_first
    assert "bookings.addons_json" in added_first
    assert "orders.wallet_credit_applied" in added_first
    assert "users.reset_token_hash" in added_first
    assert "users.otp_code_hash" in added_first
    assert "users.wallet_credits" in added_first

    # Second pass on SQLite must be a clean idempotent no-op
    added_second = ensure_phase13_schema_columns(sqlite_engine)
    assert added_second == []

    sqlite_inspector = inspect(sqlite_engine)
    assert {"city", "lat", "lng"}.issubset({c["name"] for c in sqlite_inspector.get_columns("salons")})
    assert {"city", "area", "lat", "lng"}.issubset({c["name"] for c in sqlite_inspector.get_columns("professional_profiles")})
    assert "service_cities" in {c["name"] for c in sqlite_inspector.get_columns("services")}
    assert {"arrival_otp", "addons_json"}.issubset({c["name"] for c in sqlite_inspector.get_columns("bookings")})
    assert "wallet_credit_applied" in {c["name"] for c in sqlite_inspector.get_columns("orders")}
    assert {
        "reset_token_hash", "reset_token_expires_at", "reset_attempts",
        "otp_code_hash", "otp_expires_at", "otp_attempts",
        "referral_code", "wallet_credits",
    }.issubset({c["name"] for c in sqlite_inspector.get_columns("users")})

    # Verify PostgreSQL engine idempotency as well
    pg_engine = db.get_bind()
    ensure_phase13_schema_columns(pg_engine)
    pg_second = ensure_phase13_schema_columns(pg_engine)
    assert pg_second == []


def test_catalog_salons_city_and_radius_filtering(client):
    # City-only filter for Bengaluru returns all 4 seeded Bengaluru salons
    resp = client.get("/api/v1/catalog/salons?city=Bengaluru")
    assert resp.status_code == 200
    blr_salons = resp.json()
    assert len(blr_salons) == 4
    assert {s["id"] for s in blr_salons} == {"l5", "l6", "l7", "l8"}
    assert all(s["city"] == "Bengaluru" for s in blr_salons)

    # Bengaluru + Indiranagar coords + max_distance_km=8 returns l5 & l6 nearest-first
    near_resp = client.get(
        "/api/v1/catalog/salons",
        params={
            "city": "Bengaluru",
            "lat": 12.9784,
            "lng": 77.6408,
            "max_distance_km": 8,
        },
    )
    assert near_resp.status_code == 200
    near_salons = near_resp.json()
    assert [s["id"] for s in near_salons] == ["l5", "l6"]
    assert all(s["is_far"] is False for s in near_salons)
    assert near_salons[0]["distance_km"] <= near_salons[1]["distance_km"]

    # Direct /api/v1/salons/ endpoint stays in parity
    direct_resp = client.get("/api/v1/salons/?city=Delhi")
    assert direct_resp.status_code == 200
    delhi_salons = direct_resp.json()
    assert any(s["id"] == "l9" and s["city"] == "Delhi" for s in delhi_salons)


def test_catalog_services_and_professionals_city_filtering(client):
    svc_resp = client.get("/api/v1/catalog/services?city=Bengaluru")
    assert svc_resp.status_code == 200
    blr_services = svc_resp.json()
    blr_ids = {s["id"] for s in blr_services}
    assert "s9" in blr_ids
    assert "s5" in blr_ids
    assert "s7" not in blr_ids

    pro_resp = client.get("/api/v1/catalog/professionals?city=Bengaluru")
    assert pro_resp.status_code == 200
    blr_pros = pro_resp.json()
    pro_names = {p["name"] for p in blr_pros}
    assert {"Ananya Rao", "Kavya Menon", "Divya Nair"}.issubset(pro_names)
    assert "Nisha Kapoor" not in pro_names
    assert all(p["city"] == "Bengaluru" for p in blr_pros)
