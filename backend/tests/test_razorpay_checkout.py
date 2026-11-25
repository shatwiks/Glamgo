"""Tests for Razorpay Standard Web Checkout order creation and signature verification."""
import hashlib
import hmac
import razorpay
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.core.config import settings
from backend.app.core.database import Base, get_db
from backend.app.core.security import hash_password
import backend.app.api.v1.payments as payments_mod
from backend.app.models.user import User, UserRole, BookingStatus
from backend.app.models.catalog import Service
from backend.app.models.booking import Booking


def _setup_test_env(monkeypatch, booking_price=250.0):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, expire_on_commit=False)
    db = Session()

    user = User(
        email="rzp_customer@example.com",
        full_name="Rzp Customer",
        phone="9876543210",
        role=UserRole.CUSTOMER,
        hashed_password=hash_password("ValidPass123!"),
        is_active=True,
    )
    service = Service(
        id="svc-rzp",
        name="Luxury Facial",
        category="Skin",
        price=booking_price,
        duration="60 min",
        img="/test.webp",
        desc="Facial",
        service_cities="Mumbai",
    )
    db.add_all([user, service])
    db.commit()
    db.refresh(user)

    booking = Booking(
        id="BK-RZP-1",
        customer_id=user.id,
        type="home",
        title="Luxury Facial",
        service_id="svc-rzp",
        professional="Any available expert",
        date="2099-12-15",
        time="11:00 AM",
        location="Bandra West, Mumbai",
        price=booking_price,
        status=BookingStatus.PENDING,
        payment_status="pending",
    )
    db.add(booking)
    db.commit()

    monkeypatch.setattr(settings, "RAZORPAY_KEY_ID", "rzp_test_mock_key")
    monkeypatch.setattr(settings, "RAZORPAY_KEY_SECRET", "mock_secret_value_for_hmac_tests")
    app.dependency_overrides[get_db] = lambda: db
    client = TestClient(app)
    login = client.post("/api/v1/auth/login", json={"email": user.email, "password": "ValidPass123!"})
    assert login.status_code == 200
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    return engine, db, client, headers, booking


def test_create_order_minimum_amount_100_paise(monkeypatch):
    engine, db, client, headers, _ = _setup_test_env(monkeypatch, booking_price=0.50)
    try:
        res = client.post(
            "/api/v1/payments/razorpay/create-order",
            headers=headers,
            json={"booking_id": "BK-RZP-1"},
        )
        assert res.status_code == 400
        assert "100 paise" in res.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_db, None)
        db.close()
        engine.dispose()


def test_create_order_auth_and_api_error_handling(monkeypatch):
    engine, db, client, headers, _ = _setup_test_env(monkeypatch, booking_price=199.0)
    try:
        class AuthFailClient:
            class order:
                @staticmethod
                def create(_payload):
                    raise razorpay.errors.BadRequestError("Authentication failed: invalid api key")

        monkeypatch.setattr(payments_mod, "get_razorpay_client", lambda: AuthFailClient())
        res_401 = client.post(
            "/api/v1/payments/razorpay/create-order",
            headers=headers,
            json={"booking_id": "BK-RZP-1"},
        )
        assert res_401.status_code == 401

        # Clear initiating booking tx for next check
        from backend.app.models.payment import PaymentTransaction
        db.query(PaymentTransaction).delete()
        db.commit()

        class ServerFailClient:
            class order:
                @staticmethod
                def create(_payload):
                    raise razorpay.errors.ServerError("Upstream Razorpay 500")

        monkeypatch.setattr(payments_mod, "get_razorpay_client", lambda: ServerFailClient())
        res_500 = client.post(
            "/api/v1/payments/razorpay/create-order",
            headers=headers,
            json={"booking_id": "BK-RZP-1"},
        )
        assert res_500.status_code == 500
    finally:
        app.dependency_overrides.pop(get_db, None)
        db.close()
        engine.dispose()


def test_create_and_verify_payment_hmac_sha256_lifecycle(monkeypatch):
    engine, db, client, headers, booking = _setup_test_env(monkeypatch, booking_price=250.0)
    try:
        class MockRazorpayClient:
            class order:
                @staticmethod
                def create(payload):
                    assert payload["amount"] == 25000
                    assert payload["currency"] == "INR"
                    return {
                        "id": "order_MockStandard123",
                        "amount": 25000,
                        "currency": "INR",
                        "receipt": payload["receipt"],
                    }

            class payment:
                @staticmethod
                def fetch(payment_id):
                    return {
                        "id": payment_id,
                        "order_id": "order_MockStandard123",
                        "amount": 25000,
                        "currency": "INR",
                        "status": "captured",
                        "captured": True,
                    }

        monkeypatch.setattr(payments_mod, "get_razorpay_client", lambda: MockRazorpayClient())

        # Step 1: Create Order
        create_res = client.post(
            "/api/v1/payments/razorpay/create-order",
            headers=headers,
            json={"booking_id": booking.id},
        )
        assert create_res.status_code == 200, create_res.text
        body = create_res.json()
        assert body["order_id"] == "order_MockStandard123"
        assert body["razorpay_order_id"] == "order_MockStandard123"
        assert body["amount_paise"] == 25000
        assert body["currency"] == "INR"

        # Step 2: Verify missing fields -> 400 (not 422)
        missing_res = client.post(
            "/api/v1/payments/razorpay/verify",
            headers=headers,
            json={"razorpay_order_id": "order_MockStandard123"},
        )
        assert missing_res.status_code == 400

        # Step 3: Verify mismatched signature -> 400, must NOT mark paid
        bad_sig_res = client.post(
            "/api/v1/payments/razorpay/verify",
            headers=headers,
            json={
                "razorpay_order_id": "order_MockStandard123",
                "razorpay_payment_id": "pay_MockPay999",
                "razorpay_signature": "00" * 32,
                "booking_id": booking.id,
            },
        )
        assert bad_sig_res.status_code == 400
        db.refresh(booking)
        assert booking.payment_status == "pending"
        assert booking.status == BookingStatus.PENDING

        # Step 4: Verify valid HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET) -> 200 & paid
        valid_sig = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
            b"order_MockStandard123|pay_MockPay999",
            hashlib.sha256,
        ).hexdigest()
        ok_res = client.post(
            "/api/v1/payments/razorpay/verify",
            headers=headers,
            json={
                "razorpay_order_id": "order_MockStandard123",
                "razorpay_payment_id": "pay_MockPay999",
                "razorpay_signature": valid_sig,
                "booking_id": booking.id,
            },
        )
        assert ok_res.status_code == 200, ok_res.text
        assert ok_res.json()["success"] is True
        db.refresh(booking)
        assert booking.payment_status == "completed"
        assert booking.status == BookingStatus.CONFIRMED
    finally:
        app.dependency_overrides.pop(get_db, None)
        db.close()
        engine.dispose()
