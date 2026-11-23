import secrets
import time
from sqlalchemy import create_engine, inspect, text
from backend.app.core.config import settings
from backend.app.core.database import ensure_phase13_schema_columns
from backend.app.core.rate_limit import _in_memory_windows
from backend.app.models.catalog import Salon
from backend.app.models.booking import Booking, BookingStatus
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


def test_booking_addons_server_pricing_and_consistent_serialization(client, customer_auth_headers):
    date_str = f"2026-12-{(secrets.randbelow(20) + 5):02d}"
    time_str = "11:15 AM"
    idem_key = f"idem-p13-{secrets.token_hex(4)}"

    create_resp = client.post(
        "/api/v1/bookings/",
        headers=customer_auth_headers,
        json={
            "type": "home",
            "service_id": "s1",
            "professional": "Any available expert",
            "date": date_str,
            "time": time_str,
            "location": "24 Sea View Road, Bandra West, Mumbai",
            "idempotency_key": idem_key,
            "addons": ["addon-head-massage", "addon-sheet-mask", "invalid-forged-addon"],
        },
    )
    assert create_resp.status_code == 200, create_resp.text
    created = create_resp.json()
    booking_id = created["id"]

    # s1 base price is 1499.0 + head massage (299.0) + sheet mask (349.0) = 2147.0
    assert created["price"] == 2147.0
    assert created["status"] == "pending"
    assert created["arrival_otp"] is None
    addon_ids = [a["id"] for a in created["addons"]]
    assert addon_ids == ["addon-head-massage", "addon-sheet-mask"]

    # Idempotent replay must return the exact same serialized addons & arrival_otp
    replay_resp = client.post(
        "/api/v1/bookings/",
        headers=customer_auth_headers,
        json={
            "type": "home",
            "service_id": "s1",
            "professional": "Any available expert",
            "date": date_str,
            "time": time_str,
            "location": "24 Sea View Road, Bandra West, Mumbai",
            "idempotency_key": idem_key,
            "addons": ["addon-head-massage", "addon-sheet-mask"],
        },
    )
    assert replay_resp.status_code == 200
    assert replay_resp.json()["id"] == booking_id
    assert [a["id"] for a in replay_resp.json()["addons"]] == addon_ids

    # GET /bookings/{id} and GET /bookings/my serialize addons consistently via Booking.addons property
    detail_resp = client.get(f"/api/v1/bookings/{booking_id}", headers=customer_auth_headers)
    assert detail_resp.status_code == 200
    assert [a["id"] for a in detail_resp.json()["addons"]] == addon_ids
    assert detail_resp.json()["arrival_otp"] == created["arrival_otp"]

    my_resp = client.get("/api/v1/bookings/my", headers=customer_auth_headers)
    assert my_resp.status_code == 200
    my_match = next((b for b in my_resp.json() if b["id"] == booking_id), None)
    assert my_match is not None
    assert [a["id"] for a in my_match["addons"]] == addon_ids


def test_booking_reschedule_conflict_and_bola_protection(client, customer_auth_headers):
    slot_date = f"2027-01-{(secrets.randbelow(20) + 5):02d}"
    b1_resp = client.post(
        "/api/v1/bookings/",
        headers=customer_auth_headers,
        json={
            "type": "home",
            "service_id": "s1",
            "professional": "Nisha Kapoor",
            "date": slot_date,
            "time": "10:00 AM",
            "location": "Bandra West, Mumbai",
        },
    )
    assert b1_resp.status_code == 200, b1_resp.text
    b1 = b1_resp.json()

    b2_resp = client.post(
        "/api/v1/bookings/",
        headers=customer_auth_headers,
        json={
            "type": "home",
            "service_id": "s2",
            "professional": "Nisha Kapoor",
            "date": slot_date,
            "time": "12:00 PM",
            "location": "Bandra West, Mumbai",
        },
    )
    assert b2_resp.status_code == 200, b2_resp.text
    b2 = b2_resp.json()

    # 1. Rescheduling b1 into b2's occupied slot must return HTTP 409 Conflict
    conflict_resp = client.put(
        f"/api/v1/bookings/{b1['id']}/reschedule",
        headers=customer_auth_headers,
        json={"date": slot_date, "time": "12:00 PM"},
    )
    assert conflict_resp.status_code == 409

    # 2. Rescheduling b1 to an open slot succeeds
    ok_resp = client.put(
        f"/api/v1/bookings/{b1['id']}/reschedule",
        headers=customer_auth_headers,
        json={"date": slot_date, "time": "03:30 PM"},
    )
    assert ok_resp.status_code == 200, ok_resp.text
    assert ok_resp.json()["time"] == "03:30 PM"

    # 3. Another customer attempting to reschedule b1 must receive HTTP 403
    _, other_reg = _register_unique_customer(client, _unique_phone(), prefix="bola_resched")
    other_headers = {"Authorization": f"Bearer {other_reg['access_token']}"}
    bola_resp = client.put(
        f"/api/v1/bookings/{b1['id']}/reschedule",
        headers=other_headers,
        json={"date": slot_date, "time": "05:00 PM"},
    )
    assert bola_resp.status_code == 403


def test_arrival_otp_strict_validation_null_guard_and_partner_privacy(
    client, db, customer_auth_headers, pro_auth_headers
):
    slot_date = f"2027-02-{(secrets.randbelow(20) + 5):02d}"
    b_resp = client.post(
        "/api/v1/bookings/",
        headers=customer_auth_headers,
        json={
            "type": "home",
            "service_id": "s1",
            "professional": "Nisha Kapoor",
            "date": slot_date,
            "time": "02:00 PM",
            "location": "Bandra West, Mumbai",
        },
    )
    assert b_resp.status_code == 200, b_resp.text
    b_data = b_resp.json()
    booking_id = b_data["id"]
    assert b_data["arrival_otp"] is None
    # Arrival verification applies after payment; prepare a paid booking for these PIN checks.
    b_row = db.query(Booking).filter(Booking.id == booking_id).one()
    b_row.payment_status = "completed"
    b_row.status = BookingStatus.CONFIRMED
    b_row.arrival_otp = "1234"
    db.commit()
    true_otp = b_row.arrival_otp

    # (d) Partner bookings listing MUST omit plaintext arrival_otp (T-13-06 privacy boundary)
    pro_list_resp = client.get("/api/v1/partners/professional/bookings", headers=pro_auth_headers)
    assert pro_list_resp.status_code == 200
    listed = next((row for row in pro_list_resp.json() if row["id"] == booking_id), None)
    assert listed is not None
    assert "arrival_otp" not in listed

    # (c.1) Non-4-digit or non-numeric OTP rejected with HTTP 422 by BookingOtpVerifyRequest
    for invalid_otp in ("", "123", "12345", "12a4"):
        r422 = client.post(
            f"/api/v1/bookings/{booking_id}/verify-arrival-otp",
            headers=pro_auth_headers,
            json={"otp": invalid_otp},
        )
        assert r422.status_code == 422, f"Expected 422 for {invalid_otp!r}, got {r422.status_code}"

    # (c.2) Wrong 4-digit PIN rejected with HTTP 400
    wrong_pin = "9999" if true_otp != "9999" else "0000"
    r_wrong = client.post(
        f"/api/v1/bookings/{booking_id}/verify-arrival-otp",
        headers=pro_auth_headers,
        json={"otp": wrong_pin},
    )
    assert r_wrong.status_code == 400

    # (c.3) Correct 4-digit PIN accepted with HTTP 200
    r_ok = client.post(
        f"/api/v1/bookings/{booking_id}/verify-arrival-otp",
        headers=pro_auth_headers,
        json={"otp": true_otp},
    )
    assert r_ok.status_code == 200
    assert r_ok.json()["verified"] is True
    assert r_ok.json()["stage"] == "arrived"

    # (c.4) Legacy NULL arrival_otp rejected with HTTP 400 BEFORE hmac.compare_digest
    b_row = db.query(Booking).filter(Booking.id == booking_id).first()
    b_row.arrival_otp = None
    db.commit()
    r_null = client.post(
        f"/api/v1/bookings/{booking_id}/verify-arrival-otp",
        headers=pro_auth_headers,
        json={"otp": true_otp},
    )
    assert r_null.status_code == 400

    # (c.5) CANCELLED or COMPLETED booking rejected with HTTP 400
    b_row.arrival_otp = true_otp
    b_row.status = BookingStatus.CANCELLED
    db.commit()
    r_cancelled = client.post(
        f"/api/v1/bookings/{booking_id}/verify-arrival-otp",
        headers=pro_auth_headers,
        json={"otp": true_otp},
    )
    assert r_cancelled.status_code == 400


def test_rewards_gift_card_referral_and_replay_guards(client):
    _, reg1 = _register_unique_customer(client, _unique_phone(), prefix="referrer")
    h1 = {"Authorization": f"Bearer {reg1['access_token']}"}

    _, reg2 = _register_unique_customer(client, _unique_phone(), prefix="referee")
    h2 = {"Authorization": f"Bearer {reg2['access_token']}"}

    # (a) GET /api/v1/users/rewards issues a persistent referral_code
    rw1 = client.get("/api/v1/users/rewards", headers=h1)
    assert rw1.status_code == 200
    rw1_data = rw1.json()
    ref_code_1 = rw1_data["referral_code"]
    assert ref_code_1.startswith("GLAM-")
    assert rw1_data["wallet_credits"] == 0.0

    # Calling again returns the same deterministic referral_code
    assert client.get("/api/v1/users/rewards", headers=h1).json()["referral_code"] == ref_code_1

    # (b.1) Redeem official gift card GLAM500 (+₹500)
    gc_resp = client.post("/api/v1/users/rewards/redeem", headers=h2, json={"code": "glam500"})
    assert gc_resp.status_code == 200, gc_resp.text
    assert gc_resp.json()["kind"] == "gift_card"
    assert gc_resp.json()["credited_amount"] == 500.0
    assert gc_resp.json()["wallet_credits"] == 500.0

    # (b.2) Duplicate replay of GLAM500 rejected with HTTP 409
    replay_gc = client.post("/api/v1/users/rewards/redeem", headers=h2, json={"code": "GLAM500"})
    assert replay_gc.status_code == 409

    # (b.3) Self-referral rejected with HTTP 400
    self_ref = client.post("/api/v1/users/rewards/redeem", headers=h1, json={"code": ref_code_1})
    assert self_ref.status_code == 400

    # (b.4) Valid referral credits +₹300 to both referee (user 2) and referrer (user 1)
    ref_resp = client.post("/api/v1/users/rewards/redeem", headers=h2, json={"code": ref_code_1})
    assert ref_resp.status_code == 200, ref_resp.text
    assert ref_resp.json()["kind"] == "referral"
    assert ref_resp.json()["credited_amount"] == 300.0
    assert ref_resp.json()["wallet_credits"] == 800.0  # 500 + 300

    # Referrer also received +₹300
    rw1_after = client.get("/api/v1/users/rewards", headers=h1).json()
    assert rw1_after["wallet_credits"] == 300.0

    # Duplicate referral replay rejected with HTTP 409
    replay_ref = client.post("/api/v1/users/rewards/redeem", headers=h2, json={"code": ref_code_1})
    assert replay_ref.status_code == 409


def test_checkout_with_apply_wallet_credit_deducts_balance_atomically(client, db):
    email, reg = _register_unique_customer(client, _unique_phone(), prefix="wallet_checkout")
    headers = {"Authorization": f"Bearer {reg['access_token']}"}

    # Credit ₹500 via GLAM500 gift card
    redeem_resp = client.post("/api/v1/users/rewards/redeem", headers=headers, json={"code": "GLAM500"})
    assert redeem_resp.status_code == 200
    assert redeem_resp.json()["wallet_credits"] == 500.0

    # Reserve 1 unit of b1 (The Daily Renewal Serum, ₹1890 >= ₹1500 so shipping is 0)
    res_resp = client.post(
        "/api/v1/orders/reserve",
        headers=headers,
        json={"items": [{"product_id": "b1", "variant_name": "30 ml", "qty": 1}]},
    )
    assert res_resp.status_code in (200, 201), res_resp.text
    res_data = res_resp.json()
    reservation_token = res_data["reservation_token"]
    gross_grand_total = float(res_data["grand_total"])
    assert gross_grand_total > 500.0

    # Checkout with apply_wallet_credit=True
    idem_key = f"chk-wallet-{secrets.token_hex(4)}"
    chk_resp = client.post(
        "/api/v1/orders/checkout",
        headers=headers,
        json={
            "reservation_token": reservation_token,
            "address_label": "Home",
            "address_text": "100 Feet Road, Indiranagar, Bengaluru 560038",
            "payment_method": "Cash on delivery",
            "idempotency_key": idem_key,
            "apply_wallet_credit": True,
        },
    )
    assert chk_resp.status_code in (200, 201), chk_resp.text
    chk_data = chk_resp.json()

    assert chk_data["wallet_credit_applied"] == 500.0
    assert chk_data["total"] == round(gross_grand_total - 500.0, 2)

    # Idempotent replay returns identical wallet_credit_applied without double-deducting
    replay_chk = client.post(
        "/api/v1/orders/checkout",
        headers=headers,
        json={
            "reservation_token": reservation_token,
            "address_label": "Home",
            "address_text": "100 Feet Road, Indiranagar, Bengaluru 560038",
            "payment_method": "Cash on delivery",
            "idempotency_key": idem_key,
            "apply_wallet_credit": True,
        },
    )
    assert replay_chk.status_code in (200, 201)
    assert replay_chk.json()["wallet_credit_applied"] == 500.0
    assert replay_chk.json()["total"] == chk_data["total"]

    # User's wallet_credits in DB is now 0.0
    u_row = db.query(User).filter(User.email == email).first()
    db.refresh(u_row)
    assert float(u_row.wallet_credits or 0.0) == 0.0




