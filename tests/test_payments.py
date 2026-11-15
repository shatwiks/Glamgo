import hmac
import hashlib
import secrets
from types import SimpleNamespace
import razorpay.errors
import backend.app.api.v1.payments as payments_module
from backend.app.core.config import settings
from backend.app.models.catalog import Product
from backend.app.models.order import Order
from backend.app.models.payment import PaymentTransaction
from backend.app.models.user import Notification


def _sign(rzp_order_id: str, rzp_payment_id: str) -> str:
    msg = f"{rzp_order_id}|{rzp_payment_id}".encode("utf-8")
    return hmac.new(settings.RAZORPAY_KEY_SECRET.encode("utf-8"), msg, hashlib.sha256).hexdigest()


def _install_mock_razorpay(monkeypatch, *, payment_override=None, order_error=None, payment_error=None):
    created = {}

    def _create_order(payload):
        if order_error is not None:
            raise order_error
        rzp_id = f"order_test_{secrets.token_hex(6)}"
        created[rzp_id] = dict(payload)
        return {
            "id": rzp_id,
            "entity": "order",
            "amount": payload["amount"],
            "currency": payload["currency"],
            "receipt": payload["receipt"],
        }

    def _fetch_payment(payment_id):
        if payment_error is not None:
            raise payment_error
        if payment_override is not None:
            return payment_override(payment_id, created)
        rzp_order_id, payload = next(reversed(created.items()))
        return {
            "id": payment_id,
            "order_id": rzp_order_id,
            "amount": payload["amount"],
            "currency": "INR",
            "status": "captured",
            "captured": True,
        }

    fake_client = SimpleNamespace(
        order=SimpleNamespace(create=_create_order),
        payment=SimpleNamespace(fetch=_fetch_payment),
    )
    monkeypatch.setattr(payments_module, "get_razorpay_client", lambda: fake_client)
    return created


def test_payment_order_requires_target_and_ignores_tampered_amount(client, db, customer_auth_headers, pro_auth_headers, monkeypatch):
    # 1. Bare client amount without order_id or booking_id must be rejected
    bare_resp = client.post("/api/v1/payments/razorpay/create-order", json={
        "amount": 2500.0,
        "order_id": None,
        "booking_id": None
    }, headers=customer_auth_headers)
    assert bare_resp.status_code == 400

    # 2. Create real GlamGo order with server-computed pricing & GLAM10 discount
    idem_key = f"idem-{secrets.token_hex(6)}"
    product_before = db.query(Product).filter(Product.id == "b1").first().stock
    order_payload = {
        "items": [{"id": "b1", "qty": 1}],
        "coupon": "GLAM10",
        "payment_method": "UPI",
        "address_label": "Home",
        "address_text": "24 Sea View Road, Bandra West",
        "idempotency_key": idem_key,
    }
    order_resp = client.post("/api/v1/orders/", json=order_payload, headers=customer_auth_headers)
    assert order_resp.status_code == 200, order_resp.text
    order = order_resp.json()
    expected_total = 1890.0 - 189.0  # 10% off 1890 = 189
    assert order["total"] == expected_total

    # Safe retry with same idempotency_key returns existing order without decrementing stock twice
    retry_order_resp = client.post("/api/v1/orders/", json=order_payload, headers=customer_auth_headers)
    assert retry_order_resp.status_code == 200
    assert retry_order_resp.json()["id"] == order["id"]
    db.expire_all()
    assert db.query(Product).filter(Product.id == "b1").first().stock == product_before - 1

    # 3. Ownership check on create-order
    wrong_owner = client.post("/api/v1/payments/razorpay/create-order", json={
        "amount": 1.0,
        "order_id": order["id"],
    }, headers=pro_auth_headers)
    assert wrong_owner.status_code == 403

    # 4. Create Razorpay order with spoofed amount=1.0 -> server enforces order.total * 100 paise
    created_calls = _install_mock_razorpay(monkeypatch)
    create_resp = client.post("/api/v1/payments/razorpay/create-order", json={
        "amount": 1.0,
        "order_id": order["id"],
    }, headers=customer_auth_headers)
    assert create_resp.status_code == 200, create_resp.text
    data = create_resp.json()
    rzp_order_id = data["razorpay_order_id"]
    assert data["amount"] == expected_total
    assert data["amount_paise"] == int(round(expected_total * 100))
    assert created_calls[rzp_order_id]["amount"] == int(round(expected_total * 100))

    # Persisted on Order row as well
    db_order = db.query(Order).filter(Order.id == order["id"]).first()
    assert db_order.razorpay_order_id == rzp_order_id

    # 5. Safe retry of create-order for same pending order reuses Razorpay order instead of creating duplicate
    retry_pay = client.post("/api/v1/payments/razorpay/create-order", json={
        "amount": 1.0,
        "order_id": order["id"],
    }, headers=customer_auth_headers)
    assert retry_pay.status_code == 200
    assert retry_pay.json()["razorpay_order_id"] == rzp_order_id
    assert len(created_calls) == 1

    # 6. Invalid signature rejected (400)
    rzp_payment_id = f"pay_test_{secrets.token_hex(6)}"
    valid_sig = _sign(rzp_order_id, rzp_payment_id)
    bad_sig = client.post("/api/v1/payments/razorpay/verify", json={
        "razorpay_order_id": rzp_order_id,
        "razorpay_payment_id": rzp_payment_id,
        "razorpay_signature": "invalid_sig",
        "order_id": order["id"],
    }, headers=customer_auth_headers)
    assert bad_sig.status_code == 400

    # 7. Non-owner verify rejected (403)
    forbidden = client.post("/api/v1/payments/razorpay/verify", json={
        "razorpay_order_id": rzp_order_id,
        "razorpay_payment_id": rzp_payment_id,
        "razorpay_signature": valid_sig,
        "order_id": order["id"],
    }, headers=pro_auth_headers)
    assert forbidden.status_code == 403

    # 8. Authentic verification succeeds once, blocks duplicates idempotently, and persists completed status
    ok_resp = client.post("/api/v1/payments/razorpay/verify", json={
        "razorpay_order_id": rzp_order_id,
        "razorpay_payment_id": rzp_payment_id,
        "razorpay_signature": valid_sig,
        "order_id": order["id"],
    }, headers=customer_auth_headers)
    assert ok_resp.status_code == 200
    assert ok_resp.json()["status"] == "captured"
    db.expire_all()
    assert db.query(Order).filter(Order.id == order["id"]).first().payment_status == "completed"

    paid_notifs_before = db.query(Notification).filter(
        Notification.text.contains(f"{order['id']} is confirmed & paid")
    ).count()
    assert paid_notifs_before == 1

    dup_resp = client.post("/api/v1/payments/razorpay/verify", json={
        "razorpay_order_id": rzp_order_id,
        "razorpay_payment_id": rzp_payment_id,
        "razorpay_signature": valid_sig,
        "order_id": order["id"],
    }, headers=customer_auth_headers)
    assert dup_resp.status_code == 200
    assert "already verified" in dup_resp.json()["message"].lower()
    assert db.query(Notification).filter(
        Notification.text.contains(f"{order['id']} is confirmed & paid")
    ).count() == 1


def test_razorpay_rejected_credentials_and_provider_failures(client, db, customer_auth_headers, monkeypatch):
    order = client.post("/api/v1/orders/", json={
        "items": [{"id": "b3", "qty": 1}],
        "payment_method": "UPI",
        "address_label": "Home",
        "address_text": "Bandra West",
    }, headers=customer_auth_headers).json()

    # 1. Invalid Razorpay credentials -> 502, NO synthetic order_tx created
    _install_mock_razorpay(monkeypatch, order_error=razorpay.errors.BadRequestError("Authentication failed"))
    auth_fail = client.post("/api/v1/payments/razorpay/create-order", json={
        "amount": order["total"],
        "order_id": order["id"],
    }, headers=customer_auth_headers)
    assert auth_fail.status_code == 502
    assert "authentication failed" in auth_fail.json()["detail"].lower()
    assert db.query(PaymentTransaction).filter(PaymentTransaction.order_id == order["id"]).count() == 0

    # 2. Provider gateway outage -> 503, NO synthetic order_tx created
    _install_mock_razorpay(monkeypatch, order_error=razorpay.errors.ServerError("Gateway timeout"))
    gw_fail = client.post("/api/v1/payments/razorpay/create-order", json={
        "amount": order["total"],
        "order_id": order["id"],
    }, headers=customer_auth_headers)
    assert gw_fail.status_code == 503
    assert db.query(PaymentTransaction).filter(PaymentTransaction.order_id == order["id"]).count() == 0


def test_verify_rejects_uncaptured_or_mismatched_gateway_payment(client, db, customer_auth_headers, monkeypatch):
    order = client.post("/api/v1/orders/", json={
        "items": [{"id": "b3", "qty": 1}],
        "payment_method": "Credit / debit card",
        "address_label": "Home",
        "address_text": "Bandra West",
    }, headers=customer_auth_headers).json()

    created = _install_mock_razorpay(
        monkeypatch,
        payment_override=lambda pid, c: {
            "id": pid,
            "order_id": next(iter(c.keys())),
            "amount": 100,  # Tampered / mismatched amount (₹1 instead of ₹990)
            "currency": "INR",
            "status": "captured",
            "captured": True,
        }
    )
    rzp_order_id = client.post("/api/v1/payments/razorpay/create-order", json={
        "amount": order["total"],
        "order_id": order["id"],
    }, headers=customer_auth_headers).json()["razorpay_order_id"]

    rzp_payment_id = f"pay_tamper_{secrets.token_hex(5)}"
    sig = _sign(rzp_order_id, rzp_payment_id)

    amt_mismatch = client.post("/api/v1/payments/razorpay/verify", json={
        "razorpay_order_id": rzp_order_id,
        "razorpay_payment_id": rzp_payment_id,
        "razorpay_signature": sig,
        "order_id": order["id"],
    }, headers=customer_auth_headers)
    assert amt_mismatch.status_code == 400
    db.expire_all()
    assert db.query(Order).filter(Order.id == order["id"]).first().payment_status == "pending"

    # Also reject authorized-but-uncaptured status
    _install_mock_razorpay(
        monkeypatch,
        payment_override=lambda pid, c: {
            "id": pid,
            "order_id": rzp_order_id,
            "amount": int(round(order["total"] * 100)),
            "currency": "INR",
            "status": "authorized",
            "captured": False,
        }
    )
    uncaptured = client.post("/api/v1/payments/razorpay/verify", json={
        "razorpay_order_id": rzp_order_id,
        "razorpay_payment_id": rzp_payment_id,
        "razorpay_signature": sig,
        "order_id": order["id"],
    }, headers=customer_auth_headers)
    assert uncaptured.status_code == 400
    assert "not captured" in uncaptured.json()["detail"].lower()


def test_rejects_sub_100_paise_and_never_leaks_secret(client, db, customer_auth_headers, monkeypatch):
    order = client.post("/api/v1/orders/", json={
        "items": [{"id": "b3", "qty": 1}],
        "payment_method": "UPI",
        "address_label": "Home",
        "address_text": "Bandra West",
    }, headers=customer_auth_headers).json()

    db_order = db.query(Order).filter(Order.id == order["id"]).first()
    db_order.total = 0.50  # 50 paise (< 100 paise minimum)
    db.commit()

    sub_min = client.post("/api/v1/payments/razorpay/create-order", json={
        "order_id": order["id"],
    }, headers=customer_auth_headers)
    assert sub_min.status_code == 400
    assert "100 paise" in sub_min.json()["detail"].lower()

    db_order.total = 1.00  # Exact 100 paise minimum succeeds
    db.commit()
    _install_mock_razorpay(monkeypatch)
    exact_min = client.post("/api/v1/payments/razorpay/create-order", json={
        "order_id": order["id"],
    }, headers=customer_auth_headers)
    assert exact_min.status_code == 200
    body = exact_min.json()
    assert body["amount_paise"] == 100
    assert settings.RAZORPAY_KEY_SECRET not in str(body)
