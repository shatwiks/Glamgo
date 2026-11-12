import hmac
import hashlib
import json
import secrets
import pytest
from backend.app.core.config import settings
from backend.app.models.payment import PaymentTransaction
from backend.app.models.order import Order, OrderStatus
from backend.app.models.user import User, UserRole


def generate_webhook_signature(payload_bytes: bytes, secret: str) -> str:
    return hmac.new(secret.encode("utf-8"), payload_bytes, hashlib.sha256).hexdigest()


def test_razorpay_webhook_signature_and_lifecycle(client, db):
    # 1. Setup a test user, order, and transaction
    user = User(
        full_name="Webhook Test User",
        email=f"webhook_{secrets.token_hex(4)}@test.com",
        phone="9876543210",
        hashed_password="hashed_pass_test",
        role=UserRole.CUSTOMER
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    order_id = f"GG-WH-{secrets.token_hex(3).upper()}"
    order = Order(
        id=order_id,
        customer_id=user.id,
        subtotal=1500.0,
        total=1500.0,
        status=OrderStatus.PLACED,
        payment_status="pending",
        payment_method="UPI",
        address_label="Home",
        address_text="123 Test Street",
        date="2026-11-12"
    )
    db.add(order)

    razorpay_order_id = f"order_{secrets.token_hex(8)}"
    razorpay_payment_id = f"pay_{secrets.token_hex(8)}"
    tx = PaymentTransaction(
        user_id=user.id,
        order_id=order_id,
        razorpay_order_id=razorpay_order_id,
        amount=1500.0,
        currency="INR",
        status="created"
    )
    db.add(tx)
    db.commit()

    # 2. Test Invalid Webhook Signature
    fake_body = json.dumps({"event": "payment.captured", "payload": {}}).encode("utf-8")
    resp_bad = client.post(
        "/api/v1/payments/razorpay/webhook",
        content=fake_body,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": "invalid_hex_sig"}
    )
    assert resp_bad.status_code == 400
    assert "Invalid Razorpay webhook signature" in resp_bad.json()["detail"]

    # 3. Test Missing Signature Header
    resp_missing = client.post(
        "/api/v1/payments/razorpay/webhook",
        content=fake_body,
        headers={"Content-Type": "application/json"}
    )
    assert resp_missing.status_code == 400

    # 4. Test Valid Webhook for payment.captured
    webhook_payload = {
        "entity": "event",
        "account_id": "acc_glamgo_test",
        "event": "payment.captured",
        "contains": ["payment"],
        "payload": {
            "payment": {
                "entity": {
                    "id": razorpay_payment_id,
                    "order_id": razorpay_order_id,
                    "amount": 150000,
                    "status": "captured",
                    "method": "upi"
                }
            }
        }
    }
    payload_bytes = json.dumps(webhook_payload).encode("utf-8")
    valid_sig = generate_webhook_signature(payload_bytes, settings.RAZORPAY_WEBHOOK_SECRET)

    resp_valid = client.post(
        "/api/v1/payments/razorpay/webhook",
        content=payload_bytes,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": valid_sig}
    )
    assert resp_valid.status_code == 200, resp_valid.text
    assert resp_valid.json()["processed"] is True

    # Verify DB state mutation
    db.refresh(tx)
    db.refresh(order)
    assert tx.status == "captured"
    assert tx.razorpay_payment_id == razorpay_payment_id
    assert order.payment_status == "completed"

    # 5. Test Webhook Idempotency (replay attack / duplicate webhook delivery)
    resp_duplicate = client.post(
        "/api/v1/payments/razorpay/webhook",
        content=payload_bytes,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": valid_sig}
    )
    assert resp_duplicate.status_code == 200
    assert "Idempotent" in resp_duplicate.json().get("message", "")

    # 6. Test payment.failed event
    fail_order_id = f"order_{secrets.token_hex(8)}"
    fail_tx = PaymentTransaction(
        user_id=user.id,
        order_id=order_id,
        razorpay_order_id=fail_order_id,
        amount=1500.0,
        currency="INR",
        status="created"
    )
    db.add(fail_tx)
    db.commit()

    fail_payload = {
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": f"pay_fail_{secrets.token_hex(4)}",
                    "order_id": fail_order_id,
                    "status": "failed"
                }
            }
        }
    }
    fail_bytes = json.dumps(fail_payload).encode("utf-8")
    fail_sig = generate_webhook_signature(fail_bytes, settings.RAZORPAY_WEBHOOK_SECRET)

    resp_fail = client.post(
        "/api/v1/payments/razorpay/webhook",
        content=fail_bytes,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": fail_sig}
    )
    assert resp_fail.status_code == 200
    assert resp_fail.json()["processed"] is True
    db.refresh(fail_tx)
    assert fail_tx.status == "failed"
