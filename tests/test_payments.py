import hmac
import hashlib
from backend.app.core.config import settings


def test_payment_order_and_hmac_verification(client, customer_auth_headers, pro_auth_headers):
    # 1. Create a payment order
    create_resp = client.post("/api/v1/payments/razorpay/create-order", json={
        "amount": 2500.0,
        "order_id": None,
        "booking_id": None
    }, headers=customer_auth_headers)
    assert create_resp.status_code == 200, create_resp.text
    order_data = create_resp.json()
    rzp_order_id = order_data["razorpay_order_id"]
    assert rzp_order_id.startswith("order_")

    # 2. Compute authentic HMAC-SHA256 signature
    rzp_payment_id = "pay_test_payment_99812"
    msg = f"{rzp_order_id}|{rzp_payment_id}".encode("utf-8")
    valid_signature = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
        msg,
        hashlib.sha256
    ).hexdigest()

    # 3. Invalid signature should be rejected (400)
    invalid_resp = client.post("/api/v1/payments/razorpay/verify", json={
        "razorpay_order_id": rzp_order_id,
        "razorpay_payment_id": rzp_payment_id,
        "razorpay_signature": "fraudulent_signature_value"
    }, headers=customer_auth_headers)
    assert invalid_resp.status_code == 400

    # 4. Unknown order ID should return 404
    missing_resp = client.post("/api/v1/payments/razorpay/verify", json={
        "razorpay_order_id": "order_non_existent_123456",
        "razorpay_payment_id": rzp_payment_id,
        "razorpay_signature": valid_signature
    }, headers=customer_auth_headers)
    assert missing_resp.status_code == 404

    # 5. Non-owner user should be rejected (403 Forbidden)
    forbidden_resp = client.post("/api/v1/payments/razorpay/verify", json={
        "razorpay_order_id": rzp_order_id,
        "razorpay_payment_id": rzp_payment_id,
        "razorpay_signature": valid_signature
    }, headers=pro_auth_headers)
    assert forbidden_resp.status_code == 403

    # 6. Authentic signature from owning customer succeeds
    success_resp = client.post("/api/v1/payments/razorpay/verify", json={
        "razorpay_order_id": rzp_order_id,
        "razorpay_payment_id": rzp_payment_id,
        "razorpay_signature": valid_signature
    }, headers=customer_auth_headers)
    assert success_resp.status_code == 200
    res = success_resp.json()
    assert res["success"] is True
    assert res["status"] == "captured"
