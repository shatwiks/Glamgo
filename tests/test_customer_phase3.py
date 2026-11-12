import hmac
import hashlib
import time
import secrets
import pytest
from fastapi.testclient import TestClient
from backend.app.core.config import settings
from backend.app.models.user import UserRole
from backend.app.models.booking import BookingStatus


def test_customer_profile_and_address_lifecycle(client: TestClient, customer_auth_headers):
    # 1. Get profile
    prof_res = client.get("/api/v1/users/profile", headers=customer_auth_headers)
    assert prof_res.status_code == 200
    user_data = prof_res.json()
    assert user_data["email"] == "aanya@example.com"
    assert user_data["role"] == "customer"

    # 2. Update profile
    orig_name = user_data["name"]
    update_res = client.put(
        "/api/v1/users/profile",
        headers=customer_auth_headers,
        json={"name": "Aanya K. Mehta", "phone": "98201 99887"}
    )
    assert update_res.status_code == 200
    updated_user = update_res.json()
    assert updated_user["name"] == "Aanya K. Mehta"
    assert updated_user["phone"] == "98201 99887"

    # Revert name
    client.put("/api/v1/users/profile", headers=customer_auth_headers, json={"name": orig_name})

    # 3. Add saved address
    addr_res = client.post(
        "/api/v1/users/addresses",
        headers=customer_auth_headers,
        json={
            "label": "Studio Loft",
            "text": "104 Turner Road, Bandra West, Mumbai 400050",
            "city": "Mumbai",
            "is_default": False
        }
    )
    assert addr_res.status_code == 200
    addr_data = addr_res.json()
    assert addr_data["label"] == "Studio Loft"
    addr_id = addr_data["id"]

    # 4. List addresses
    list_res = client.get("/api/v1/users/addresses", headers=customer_auth_headers)
    assert list_res.status_code == 200
    addrs = list_res.json()
    assert any(a["id"] == addr_id for a in addrs)

    # 5. Delete address
    del_res = client.delete(f"/api/v1/users/addresses/{addr_id}", headers=customer_auth_headers)
    assert del_res.status_code == 200

    # Verify deleted
    list_after = client.get("/api/v1/users/addresses", headers=customer_auth_headers).json()
    assert not any(a["id"] == addr_id for a in list_after)


def test_services_catalog_categories_and_search(client: TestClient):
    # 1. Distinct categories
    cat_res = client.get("/api/v1/services/categories")
    assert cat_res.status_code == 200
    cats = cat_res.json()
    assert "All" in cats
    assert len(cats) >= 4

    # 2. Filter by category
    hair_res = client.get("/api/v1/services/?category=Hair")
    assert hair_res.status_code == 200
    hair_services = hair_res.json()
    assert len(hair_services) > 0
    assert all(s["category"].lower() == "hair" for s in hair_services)

    # 3. Keyword query search
    search_res = client.get("/api/v1/services/?query=Facial")
    assert search_res.status_code == 200
    results = search_res.json()
    assert len(results) > 0
    assert any("facial" in s["name"].lower() or "facial" in s["desc"].lower() for s in results)


def test_professionals_directory_and_availability(client: TestClient):
    # 1. Get all verified professionals
    pro_res = client.get("/api/v1/professionals/")
    assert pro_res.status_code == 200
    pros = pro_res.json()
    assert len(pros) > 0
    first_pro = pros[0]
    assert first_pro["is_verified"] is True
    assert "specialty" in first_pro
    assert first_pro["rating"] >= 4.0

    # 2. Get specialist availability
    avail_res = client.get(f"/api/v1/professionals/{first_pro['id']}/availability")
    assert avail_res.status_code == 200
    days = avail_res.json()
    assert isinstance(days, list)
    assert len(days) > 0


def test_salon_directory_and_staff_details(client: TestClient):
    # 1. Get salons directory
    salon_res = client.get("/api/v1/salons/")
    assert salon_res.status_code == 200
    salons = salon_res.json()
    assert len(salons) > 0

    first_salon = salons[0]
    assert "name" in first_salon
    assert "area" in first_salon
    assert "services" in first_salon
    assert isinstance(first_salon["staff"], list)

    # 2. Salon area filtering
    bandra_salons = [s for s in salons if "bandra" in s["area"].lower()]
    assert len(bandra_salons) > 0


def test_booking_creation_and_row_lock_concurrency(client: TestClient, customer_auth_headers):
    rand_hex = secrets.token_hex(4)
    unique_date = f"{2035 + secrets.randbelow(50)}-{(secrets.randbelow(12) + 1):02d}-{(secrets.randbelow(28) + 1):02d}"
    unique_time = f"{(secrets.randbelow(12) + 1):02d}:{secrets.randbelow(60):02d} PM"

    booking_payload = {
        "type": "home",
        "service_id": "s1",
        "professional": "Nisha Kapoor",
        "date": unique_date,
        "time": unique_time,
        "location": "Bandra West, Mumbai"
    }

    # 1. Create booking
    res = client.post("/api/v1/bookings/", json=booking_payload, headers=customer_auth_headers)
    assert res.status_code == 200
    booking = res.json()
    assert booking["status"] == "confirmed"
    assert booking["professional"] == "Nisha Kapoor"

    # 2. Concurrency Conflict: duplicate slot rejected with 409 Conflict
    conflict_res = client.post("/api/v1/bookings/", json=booking_payload, headers=customer_auth_headers)
    assert conflict_res.status_code == 409
    assert "already booked" in conflict_res.json()["detail"].lower()

    # 3. Dynamic dispatch ("Any available expert")
    dispatch_payload = {
        "type": "home",
        "service_id": "s2",
        "professional": "Any available expert",
        "date": unique_date,
        "time": "11:45 AM",
        "location": "Juhu, Mumbai"
    }
    dispatch_res = client.post("/api/v1/bookings/", json=dispatch_payload, headers=customer_auth_headers)
    assert dispatch_res.status_code == 200
    assert dispatch_res.json()["status"] == "confirmed"


def test_booking_cancellation_and_idor_protection(client: TestClient, customer_auth_headers, pro_auth_headers):
    # 1. Create appointment to test cancellation with unique date/time
    unique_date = f"2038-0{(int(time.time() * 10) % 8) + 1}-{(int(time.time() * 100) % 25) + 1:02d}"
    unique_time = f"{(int(time.time() * 7) % 9) + 1:02d}:{(int(time.time() * 13) % 45) + 10:02d} AM"

    res = client.post("/api/v1/bookings/", json={
        "type": "home",
        "service_id": "s3",
        "professional": "Nisha Kapoor",
        "date": unique_date,
        "time": unique_time,
        "location": "Pali Hill, Bandra"
    }, headers=customer_auth_headers)
    assert res.status_code == 200
    booking_id = res.json()["id"]

    # 2. Customer cannot set status to 'completed' (403)
    complete_attempt = client.patch(
        f"/api/v1/bookings/{booking_id}/status",
        headers=customer_auth_headers,
        json={"status": "completed"}
    )
    assert complete_attempt.status_code == 403

    # 3. Non-owner (Pro) cannot cancel customer's booking unless assigned (403)
    # Register an unrelated customer
    rand = secrets.token_hex(4)
    client.post("/api/v1/auth/register", json={
        "email": f"intruder_{rand}@example.com",
        "password": "Password123!",
        "name": "Intruder User",
        "phone": "9800000000"
    })
    intruder_login = client.post("/api/v1/auth/login", json={"email": f"intruder_{rand}@example.com", "password": "Password123!"})
    intruder_headers = {"Authorization": f"Bearer {intruder_login.json()['access_token']}"}

    intruder_cancel = client.patch(
        f"/api/v1/bookings/{booking_id}/status",
        headers=intruder_headers,
        json={"status": "cancelled"}
    )
    assert intruder_cancel.status_code == 403

    # 4. Owning customer can cancel their appointment
    cancel_res = client.patch(
        f"/api/v1/bookings/{booking_id}/status",
        headers=customer_auth_headers,
        json={"status": "cancelled"}
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"


def test_order_checkout_inventory_and_coupon_enforcement(client: TestClient, customer_auth_headers):
    # 1. Coupon validation
    coupon_res = client.post("/api/v1/orders/coupon/validate", json={"code": "GLAM10", "subtotal": 4000.0})
    assert coupon_res.status_code == 200
    coupon_data = coupon_res.json()
    assert coupon_data["valid"] is True
    assert coupon_data["discount"] == 300.0  # Capped at ₹300

    # 2. Place order with coupon
    order_res = client.post(
        "/api/v1/orders/",
        headers=customer_auth_headers,
        json={
            "items": [{"id": "b1", "qty": 1}],
            "coupon": "GLAM10",
            "payment_method": "UPI",
            "address_label": "Home",
            "address_text": "Sea View Road, Bandra"
        }
    )
    assert order_res.status_code == 200
    order_data = order_res.json()
    assert order_data["id"].startswith("GG")
    assert order_data["discount"] > 0
    assert order_data["total"] == order_data["subtotal"] - order_data["discount"]

    # 3. Out-of-stock rejection
    oos_res = client.post(
        "/api/v1/orders/",
        headers=customer_auth_headers,
        json={
            "items": [{"id": "b1", "qty": 999999}],
            "payment_method": "UPI",
            "address_label": "Home",
            "address_text": "Sea View Road, Bandra"
        }
    )
    assert oos_res.status_code == 400
    assert "insufficient stock" in oos_res.json()["detail"].lower()


def test_razorpay_order_and_signature_verification_lifecycle(client: TestClient, customer_auth_headers, pro_auth_headers):
    # 1. Place order
    order = client.post(
        "/api/v1/orders/",
        headers=customer_auth_headers,
        json={
            "items": [{"id": "b3", "qty": 1}],
            "payment_method": "Credit / debit card",
            "address_label": "Home",
            "address_text": "Bandra West"
        }
    ).json()

    # 2. Create Razorpay order (backend validates amount against order total)
    create_pay = client.post(
        "/api/v1/payments/razorpay/create-order",
        headers=customer_auth_headers,
        json={
            "amount": 1.0,  # Deliberately spoofed amount, server must overwrite with order.total
            "order_id": order["id"],
            "booking_id": None
        }
    )
    assert create_pay.status_code == 200
    pay_data = create_pay.json()
    assert pay_data["amount"] == order["total"], "Server should enforce order.total over client spoofed amount"
    rzp_order_id = pay_data["razorpay_order_id"]

    # 3. Compute authentic HMAC-SHA256 signature
    rzp_payment_id = f"pay_{secrets.token_hex(6)}"
    msg = f"{rzp_order_id}|{rzp_payment_id}".encode("utf-8")
    valid_sig = hmac.new(settings.RAZORPAY_KEY_SECRET.encode("utf-8"), msg, hashlib.sha256).hexdigest()

    # 4. Tampered signature rejected (400)
    fraud_res = client.post(
        "/api/v1/payments/razorpay/verify",
        headers=customer_auth_headers,
        json={
            "razorpay_order_id": rzp_order_id,
            "razorpay_payment_id": rzp_payment_id,
            "razorpay_signature": "fraudulent_signature"
        }
    )
    assert fraud_res.status_code == 400

    # 5. Non-owner verification rejected (403)
    forbidden_res = client.post(
        "/api/v1/payments/razorpay/verify",
        headers=pro_auth_headers,
        json={
            "razorpay_order_id": rzp_order_id,
            "razorpay_payment_id": rzp_payment_id,
            "razorpay_signature": valid_sig
        }
    )
    assert forbidden_res.status_code == 403

    # 6. Valid signature succeeds (200)
    verify_res = client.post(
        "/api/v1/payments/razorpay/verify",
        headers=customer_auth_headers,
        json={
            "razorpay_order_id": rzp_order_id,
            "razorpay_payment_id": rzp_payment_id,
            "razorpay_signature": valid_sig
        }
    )
    assert verify_res.status_code == 200
    assert verify_res.json()["status"] == "captured"


def test_reviews_creation_and_customer_notifications(client: TestClient, customer_auth_headers):
    # 1. Post review
    rev_res = client.post(
        "/api/v1/reviews",
        headers=customer_auth_headers,
        json={
            "item_id": "s1",
            "item_type": "service",
            "rating": 5,
            "comment": "Exceptional bridal care ritual with great attention to detail."
        }
    )
    assert rev_res.status_code == 200
    rev_data = rev_res.json()
    assert rev_data["rating"] == 5
    assert "Exceptional" in rev_data["comment"]

    # 2. Get my reviews
    my_revs_res = client.get("/api/v1/reviews/my", headers=customer_auth_headers)
    assert my_revs_res.status_code == 200
    my_revs = my_revs_res.json()
    assert any(r["id"] == rev_data["id"] for r in my_revs)

    # 3. Get customer notifications
    notifs_res = client.get("/api/v1/users/notifications", headers=customer_auth_headers)
    assert notifs_res.status_code == 200
    notifs = notifs_res.json()
    assert isinstance(notifs, list)
