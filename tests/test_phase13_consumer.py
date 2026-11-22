import secrets
import time
from sqlalchemy import create_engine, inspect, text
from backend.app.core.config import settings
from backend.app.core.database import ensure_phase13_schema_columns
from backend.app.core.rate_limit import _in_memory_windows
from backend.app.models.catalog import Salon
from backend.app.models.user import Notification, User, UserRole
from backend.app.services.cache_service import cache_service


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


def test_catalog_salons_city_and_radius_filtering(client, db):
    # Ensure no leftover test-created salons pollute the seeded Bengaluru salon set
    stale = db.query(Salon).filter(Salon.name == "Atelier Silk Bengaluru").all()
    if stale:
        for row in stale:
            db.delete(row)
        db.commit()
        cache_service.invalidate_catalog()

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


def test_catalog_salons_sort_nearest_and_invalid_coords_rejected(client):
    nearest_resp = client.get(
        "/api/v1/catalog/salons",
        params={
            "city": "Bengaluru",
            "lat": 12.9784,
            "lng": 77.6408,
            "sort": "nearest",
        },
    )
    assert nearest_resp.status_code == 200
    salons = nearest_resp.json()
    assert len(salons) == 4
    distances = [s["distance_km"] for s in salons]
    assert all(d is not None for d in distances)
    assert distances == sorted(distances)
    assert salons[0]["id"] == "l5"

    bad_resp = client.get(
        "/api/v1/catalog/salons",
        params={"lat": 200, "lng": 77.6408},
    )
    assert bad_resp.status_code == 422


def _register_unique_customer(client, phone: str, prefix: str = "p13"):
    suffix = f"{int(time.time() * 1000)}_{secrets.token_hex(3)}"
    email = f"{prefix}_{suffix}@testglamgo.com"
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "InitialPassword@123",
            "name": f"User {suffix}",
            "phone": phone,
        },
    )
    assert resp.status_code == 200, resp.text
    return email, resp.json()


def _unique_phone():
    # Generate a unique 10-digit Indian mobile number starting with 9
    return f"9{secrets.randbelow(900_000_000) + 100_000_000}"


def test_password_reset_happy_path_replay_and_lockout(client):
    phone = _unique_phone()
    email, _ = _register_unique_customer(client, phone, prefix="reset")

    # Happy path
    req_resp = client.post("/api/v1/auth/password-reset/request", json={"email": email})
    assert req_resp.status_code == 200
    data = req_resp.json()
    assert "dev_code" in data
    code = data["dev_code"]
    assert len(code) == 6

    confirm_resp = client.post(
        "/api/v1/auth/password-reset/confirm",
        json={"email": email, "code": code, "new_password": "UpdatedPassword@456"},
    )
    assert confirm_resp.status_code == 200

    # New password works; old password rejected
    assert client.post("/api/v1/auth/login", json={"email": email, "password": "UpdatedPassword@456"}).status_code == 200
    assert client.post("/api/v1/auth/login", json={"email": email, "password": "InitialPassword@123"}).status_code == 401

    # Single-use replay rejected
    replay_resp = client.post(
        "/api/v1/auth/password-reset/confirm",
        json={"email": email, "code": code, "new_password": "ThirdPassword@789"},
    )
    assert replay_resp.status_code == 400

    # 5-failed-attempt lockout invalidates active code
    req2 = client.post("/api/v1/auth/password-reset/request", json={"email": email})
    assert req2.status_code == 200
    fresh_code = req2.json()["dev_code"]

    for attempt in range(4):
        bad = client.post(
            "/api/v1/auth/password-reset/confirm",
            json={"email": email, "code": "000000", "new_password": "LockoutPassword@123"},
        )
        assert bad.status_code == 400, f"attempt {attempt + 1} returned {bad.status_code}"

    fifth_bad = client.post(
        "/api/v1/auth/password-reset/confirm",
        json={"email": email, "code": "000000", "new_password": "LockoutPassword@123"},
    )
    assert fifth_bad.status_code == 429

    # Even the previously valid code is now invalidated
    post_lockout = client.post(
        "/api/v1/auth/password-reset/confirm",
        json={"email": email, "code": fresh_code, "new_password": "AfterLockout@123"},
    )
    assert post_lockout.status_code == 400


def test_mobile_otp_happy_path_replay_and_lockout(client):
    phone = _unique_phone()
    email, _ = _register_unique_customer(client, f"+91 {phone[:5]} {phone[5:]}", prefix="otp")

    req_resp = client.post("/api/v1/auth/otp/request", json={"phone": phone})
    assert req_resp.status_code == 200
    otp = req_resp.json()["dev_otp"]
    assert len(otp) == 6

    verify_resp = client.post("/api/v1/auth/otp/verify", json={"phone": phone, "otp": otp})
    assert verify_resp.status_code == 200
    token_data = verify_resp.json()
    assert token_data["email"] == email
    assert "access_token" in token_data

    # Single-use replay rejected
    replay_resp = client.post("/api/v1/auth/otp/verify", json={"phone": phone, "otp": otp})
    assert replay_resp.status_code == 401

    # 5-failed-attempt lockout invalidates OTP
    req2 = client.post("/api/v1/auth/otp/request", json={"phone": phone})
    fresh_otp = req2.json()["dev_otp"]

    for _ in range(4):
        bad = client.post("/api/v1/auth/otp/verify", json={"phone": phone, "otp": "000000"})
        assert bad.status_code == 401

    fifth_bad = client.post("/api/v1/auth/otp/verify", json={"phone": phone, "otp": "000000"})
    assert fifth_bad.status_code == 429

    # Valid OTP was invalidated upon lockout
    after_lockout = client.post("/api/v1/auth/otp/verify", json={"phone": phone, "otp": fresh_otp})
    assert after_lockout.status_code == 401


def test_admin_excluded_from_password_reset_and_mobile_otp(client, db):
    admin = db.query(User).filter(User.email == "admin@glamgo.com").first()
    assert admin is not None and admin.role == UserRole.ADMIN

    # Password reset request must not issue code or store token hash for admin
    pr_req = client.post("/api/v1/auth/password-reset/request", json={"email": "admin@glamgo.com"})
    assert pr_req.status_code == 200
    assert "dev_code" not in pr_req.json()
    db.refresh(admin)
    assert admin.reset_token_hash is None

    # Password reset confirm must immediately reject admin with 403
    pr_confirm = client.post(
        "/api/v1/auth/password-reset/confirm",
        json={"email": "admin@glamgo.com", "code": "123456", "new_password": "HijackPassword@999"},
    )
    assert pr_confirm.status_code == 403

    # Mobile OTP request must not issue OTP or store otp_code_hash for admin
    otp_req = client.post("/api/v1/auth/otp/request", json={"phone": admin.phone or "9999900000"})
    assert otp_req.status_code == 200
    assert "dev_otp" not in otp_req.json()
    db.refresh(admin)
    assert admin.otp_code_hash is None

    # Mobile OTP verify must immediately reject admin with 403
    otp_verify = client.post(
        "/api/v1/auth/otp/verify",
        json={"phone": admin.phone or "9999900000", "otp": "123456"},
    )
    assert otp_verify.status_code == 403


def test_duplicate_phone_register_compat_and_otp_ambiguity_rejection(client, db):
    shared_phone = _unique_phone()
    email1, _ = _register_unique_customer(client, shared_phone, prefix="dup1")
    email2, _ = _register_unique_customer(client, shared_phone, prefix="dup2")

    # Requesting OTP for shared phone returns generic non-enumerating 200 without dev_otp or stored hashes
    req_resp = client.post("/api/v1/auth/otp/request", json={"phone": shared_phone})
    assert req_resp.status_code == 200
    assert "dev_otp" not in req_resp.json()

    u1 = db.query(User).filter(User.email == email1).first()
    u2 = db.query(User).filter(User.email == email2).first()
    assert u1.otp_code_hash is None
    assert u2.otp_code_hash is None

    # Verifying OTP for shared phone returns HTTP 409
    verify_resp = client.post("/api/v1/auth/otp/verify", json={"phone": shared_phone, "otp": "123456"})
    assert verify_resp.status_code == 409


def test_rate_limiter_in_memory_fallback_without_redis(client, monkeypatch):
    monkeypatch.setattr("backend.app.core.rate_limit.get_redis", lambda: None)
    _in_memory_windows.clear()
    headers = {"x-test-rate-limit": "true", "X-Forwarded-For": "10.13.99.42"}

    try:
        for i in range(15):
            r = client.post(
                "/api/v1/auth/password-reset/request",
                json={"email": "nobody-ratelimit@example.com"},
                headers=headers,
            )
            assert r.status_code == 200, f"request {i + 1} failed with {r.status_code}"

        blocked = client.post(
            "/api/v1/auth/password-reset/request",
            json={"email": "nobody-ratelimit@example.com"},
            headers=headers,
        )
        assert blocked.status_code == 429
        assert "Retry-After" in blocked.headers
        assert blocked.headers.get("X-RateLimit-Remaining") == "0"
    finally:
        _in_memory_windows.clear()


def test_dev_codes_suppressed_in_staging_and_production(client, monkeypatch):
    phone = _unique_phone()
    email, _ = _register_unique_customer(client, phone, prefix="envgate")

    for env_name in ("staging", "production"):
        monkeypatch.setattr(settings, "ENVIRONMENT", env_name)
        pr_resp = client.post("/api/v1/auth/password-reset/request", json={"email": email})
        assert pr_resp.status_code == 200
        assert "dev_code" not in pr_resp.json()

        otp_resp = client.post("/api/v1/auth/otp/request", json={"phone": phone})
        assert otp_resp.status_code == 200
        assert "dev_otp" not in otp_resp.json()


def test_admin_approve_salon_owner_draft_activates_role_and_creates_salon(client, db, admin_auth_headers):
    phone = _unique_phone()
    applicant_email, reg_data = _register_unique_customer(client, phone, prefix="salonapp")
    applicant_headers = {"Authorization": f"Bearer {reg_data['access_token']}"}

    apply_resp = client.post(
        "/api/v1/partners/apply",
        headers=applicant_headers,
        json={
            "role": "salon_owner",
            "name": "Atelier Silk Bengaluru",
            "price": 1200.0,
            "description": "Boutique hair and botanical skincare studio.",
            "city": "Bengaluru",
            "phone": phone,
        },
    )
    assert apply_resp.status_code == 200, apply_resp.text
    draft_id = apply_resp.json()["id"]

    approve_resp = client.patch(
        f"/api/v1/admin/partners/drafts/{draft_id}/approve",
        headers=admin_auth_headers,
    )
    assert approve_resp.status_code == 200, approve_resp.text
    assert approve_resp.json()["status"] == "APPROVED"

    applicant = db.query(User).filter(User.email == applicant_email).first()
    db.refresh(applicant)
    assert applicant.role == UserRole.SALON_OWNER

    salon = db.query(Salon).filter(Salon.owner_id == applicant.id).first()
    try:
        assert salon is not None
        assert salon.name == "Atelier Silk Bengaluru"
        assert salon.city == "Bengaluru"
        assert salon.lat is not None and salon.lng is not None

        notif = (
            db.query(Notification)
            .filter(Notification.user_id == applicant.id, Notification.type == "partner")
            .order_by(Notification.id.desc())
            .first()
        )
        assert notif is not None
        assert "Salon Owner Hub" in notif.text
    finally:
        if salon is not None:
            db.delete(salon)
            db.commit()
        cache_service.invalidate_catalog()


