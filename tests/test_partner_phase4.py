import time
import secrets
import pytest
from backend.app.models.user import User, UserRole, BookingStatus, OrderStatus
from backend.app.models.catalog import ProfessionalProfile, Salon, SalonStaff, Product, PartnerDraft


def get_auth_headers(client, email, password):
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, f"Login failed for {email}: {resp.text}"
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_partner_application_and_duplicate_prevention(client, db):
    ts = int(time.time() * 1000)
    customer_email = f"app_cust_{ts}@example.com"
    pwd = "Password@123"

    reg_resp = client.post("/api/v1/auth/register", json={
        "email": customer_email,
        "password": pwd,
        "name": f"Applicant {ts}",
        "phone": "9876543210"
    })
    assert reg_resp.status_code == 200
    headers = {"Authorization": f"Bearer {reg_resp.json()['access_token']}"}

    # 1. Submit valid partner application (PART-001)
    apply_resp = client.post("/api/v1/partners/apply", json={
        "role": "professional",
        "name": f"Studio Artist {ts}",
        "phone": "9876543210",
        "city": "Mumbai",
        "price": 2500.0,
        "description": "Certified bridal makeup artist with 7 years luxury salon experience.",
        "documents": ["https://example.com/cert1.pdf"],
        "portfolio_links": ["https://instagram.com/bridal_artist"]
    }, headers=headers)
    assert apply_resp.status_code == 200
    draft = apply_resp.json()
    assert draft["status"] == "PENDING"
    assert draft["name"] == f"Studio Artist {ts}"
    assert "https://example.com/cert1.pdf" in draft["description"]

    # Verify applicant role is still customer (no self-promotion)
    user_record = db.query(User).filter(User.email == customer_email).first()
    assert user_record.role == UserRole.CUSTOMER

    # 2. Duplicate submission for same role must be rejected with 409 Conflict (PART-002)
    dup_resp = client.post("/api/v1/partners/apply", json={
        "role": "professional",
        "name": f"Studio Artist {ts} Again",
        "price": 3000.0,
        "description": "Duplicate application attempt."
    }, headers=headers)
    assert dup_resp.status_code == 409
    assert "already pending" in dup_resp.json()["detail"]

    # 3. Invalid role request returns 400 Bad Request
    invalid_resp = client.post("/api/v1/partners/apply", json={
        "role": "astronaut",
        "name": "Invalid Role",
        "price": 1000.0,
        "description": "Invalid"
    }, headers=headers)
    assert invalid_resp.status_code == 400


def test_admin_partner_approval_and_role_escalation(client, admin_auth_headers, db):
    ts = int(time.time() * 1000)
    customer_email = f"approve_cust_{ts}@example.com"
    pwd = "Password@123"

    reg_resp = client.post("/api/v1/auth/register", json={
        "email": customer_email,
        "password": pwd,
        "name": f"Future Pro {ts}",
        "phone": "9876500001"
    })
    assert reg_resp.status_code == 200
    headers = {"Authorization": f"Bearer {reg_resp.json()['access_token']}"}

    # Submit application for professional
    apply_resp = client.post("/api/v1/partners/apply", json={
        "role": "professional",
        "name": f"Luxury Glow by {ts}",
        "phone": "9876500001",
        "city": "Bengaluru",
        "price": 1800.0,
        "description": "Certified aesthetician and skin specialist."
    }, headers=headers)
    assert apply_resp.status_code == 200
    draft_id = apply_resp.json()["id"]

    # Admin approves application (PART-002)
    approve_resp = client.patch(f"/api/v1/admin/partners/drafts/{draft_id}/approve", headers=admin_auth_headers)
    assert approve_resp.status_code == 200
    assert approve_resp.json()["status"] == "APPROVED"

    # Verify user role is promoted to professional
    promoted_user = db.query(User).filter(User.email == customer_email).first()
    assert promoted_user.role == UserRole.PROFESSIONAL

    # Verify ProfessionalProfile was auto-provisioned
    pro_profile = db.query(ProfessionalProfile).filter(ProfessionalProfile.user_id == promoted_user.id).first()
    assert pro_profile is not None
    assert pro_profile.name == promoted_user.full_name

    # Promoted user cannot re-apply for their current role (returns 400)
    reapply_resp = client.post("/api/v1/partners/apply", json={
        "role": "professional",
        "name": "Reapply attempt",
        "price": 1800.0,
        "description": "Reapply"
    }, headers=headers)
    assert reapply_resp.status_code == 400


def test_admin_partner_rejection_lifecycle(client, admin_auth_headers, db):
    ts = int(time.time() * 1000)
    customer_email = f"reject_cust_{ts}@example.com"
    pwd = "Password@123"

    reg_resp = client.post("/api/v1/auth/register", json={
        "email": customer_email,
        "password": pwd,
        "name": f"Reject Applicant {ts}",
        "phone": "9876500002"
    })
    assert reg_resp.status_code == 200
    headers = {"Authorization": f"Bearer {reg_resp.json()['access_token']}"}

    apply_resp = client.post("/api/v1/partners/apply", json={
        "role": "salon_owner",
        "name": f"Studio Imperfect {ts}",
        "phone": "9876500002",
        "city": "Mumbai",
        "price": 2000.0,
        "description": "Incomplete documentation application."
    }, headers=headers)
    draft_id = apply_resp.json()["id"]

    # Admin rejects application with documented reason (PART-002, PART-013)
    rejection_reason = "Missing valid commercial trade license and fire safety certificates."
    reject_resp = client.patch(f"/api/v1/admin/partners/drafts/{draft_id}/reject", json={
        "rejection_reason": rejection_reason
    }, headers=admin_auth_headers)
    assert reject_resp.status_code == 200
    assert reject_resp.json()["status"] == "REJECTED"
    assert reject_resp.json()["rejection_reason"] == rejection_reason

    # Verify user remained customer
    user_record = db.query(User).filter(User.email == customer_email).first()
    assert user_record.role == UserRole.CUSTOMER

    # Verify rejection notification was received
    notifs_resp = client.get("/api/v1/users/notifications", headers=headers)
    assert notifs_resp.status_code == 200
    texts = [n["text"] for n in notifs_resp.json()]
    assert any(rejection_reason in t for t in texts)


def test_professional_profile_and_services_management(client, pro_auth_headers):
    # 1. Fetch pro profile (PART-003)
    get_prof = client.get("/api/v1/partners/professional/profile", headers=pro_auth_headers)
    assert get_prof.status_code == 200
    data = get_prof.json()
    assert "name" in data

    # 2. Update pro profile
    update_prof = client.put("/api/v1/partners/professional/profile", json={
        "specialty": "Bridal & Haute Coiffure Master",
        "experience": "11 years luxury salon experience",
        "price": 3200.0,
        "img": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600"
    }, headers=pro_auth_headers)
    assert update_prof.status_code == 200
    updated = update_prof.json()
    assert updated["specialty"] == "Bridal & Haute Coiffure Master"
    assert updated["price"] == 3200.0

    # 3. Assign master catalog service (PART-004)
    assign_resp = client.post("/api/v1/partners/professional/services", json={
        "service_id": "s1"
    }, headers=pro_auth_headers)
    assert assign_resp.status_code == 200

    # 4. Fetch pro services
    srvs_resp = client.get("/api/v1/partners/professional/services", headers=pro_auth_headers)
    assert srvs_resp.status_code == 200
    srv_ids = [s["id"] for s in srvs_resp.json()]
    assert "s1" in srv_ids

    # 5. Availability day toggle (PART-005)
    avail_toggle = client.post("/api/v1/partners/availability/toggle?day=Wed", headers=pro_auth_headers)
    assert avail_toggle.status_code == 200
    assert isinstance(avail_toggle.json(), list)


def test_professional_booking_lifecycle_and_idor(client, pro_auth_headers, customer_auth_headers, db):
    ts = int(time.time() * 1000)
    pro = db.query(ProfessionalProfile).filter(ProfessionalProfile.name == "Nisha Kapoor").first()

    # Customer creates booking with Nisha
    b_resp = client.post("/api/v1/bookings/", json={
        "type": "home",
        "service_id": "s1",
        "professional_id": pro.id,
        "professional": pro.name,
        "date": f"{2040 + secrets.randbelow(40)}-{(secrets.randbelow(12) + 1):02d}-{(secrets.randbelow(28) + 1):02d}",
        "time": f"{(secrets.randbelow(12) + 1):02d}:{secrets.randbelow(60):02d} PM",
        "location": "Bandra West, Mumbai",
        "price": 1499.0
    }, headers=customer_auth_headers)
    assert b_resp.status_code == 200
    booking_id = b_resp.json()["id"]

    # Professional views their bookings (PART-005)
    pro_bookings = client.get("/api/v1/partners/professional/bookings", headers=pro_auth_headers)
    assert pro_bookings.status_code == 200
    ids = [b["id"] for b in pro_bookings.json()]
    assert booking_id in ids

    # IDOR Check: Customer attempts to complete professional booking -> 403 Forbidden
    idor_resp = client.patch(f"/api/v1/partners/professional/bookings/{booking_id}/status", json={
        "status": "completed"
    }, headers=customer_auth_headers)
    assert idor_resp.status_code == 403

    # Professional completes the appointment (PART-005)
    comp_resp = client.patch(f"/api/v1/partners/professional/bookings/{booking_id}/status", json={
        "status": "completed"
    }, headers=pro_auth_headers)
    assert comp_resp.status_code == 200
    assert comp_resp.json()["status"] == "completed"

    # Customer receives completion notification
    notifs_resp = client.get("/api/v1/users/notifications", headers=customer_auth_headers)
    assert notifs_resp.status_code == 200
    texts = [n["text"] for n in notifs_resp.json()]
    assert any("completed" in t and "review" in t for t in texts)


def test_salon_profile_staff_and_booking_management(client):
    salon_headers = get_auth_headers(client, "salon@glamgo.com", "Salon@123456")
    customer_headers = get_auth_headers(client, "aanya@example.com", "Password@123")

    # 1. Salon profile update (PART-006)
    update_sal = client.put("/api/v1/partners/salon/profile", json={
        "name": "The Ivory Room Signature Studio",
        "area": "Bandra West, Mumbai",
        "hours": "09:00 AM - 09:00 PM",
        "about": "Sanctuary of contemporary luxury and high-touch treatments."
    }, headers=salon_headers)
    assert update_sal.status_code == 200
    assert update_sal.json()["name"] == "The Ivory Room Signature Studio"

    # 2. Add salon staff member (PART-007)
    add_staff = client.post("/api/v1/partners/salon/staff", json={
        "name": "Vikram Sethi",
        "specialty": "Artistic Director & Master Stylist",
        "img": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500"
    }, headers=salon_headers)
    assert add_staff.status_code == 200
    staff = add_staff.json()
    assert staff["name"] == "Vikram Sethi"
    staff_id = staff["id"]

    # 3. Get salon staff list
    staff_list = client.get("/api/v1/partners/salon/staff", headers=salon_headers)
    assert staff_list.status_code == 200
    assert any(s["id"] == staff_id for s in staff_list.json())

    # 4. Remove salon staff member
    del_staff = client.delete(f"/api/v1/partners/salon/staff/{staff_id}", headers=salon_headers)
    assert del_staff.status_code == 200

    # 5. Customer books at salon & salon owner completes appointment (PART-008)
    ts = int(time.time() * 1000)
    b_resp = client.post("/api/v1/bookings/", json={
        "type": "salon",
        "service_id": "s2",
        "salon_id": "l1",
        "professional": "The Ivory Room Expert",
        "date": f"{2040 + secrets.randbelow(40)}-{(secrets.randbelow(12) + 1):02d}-{(secrets.randbelow(28) + 1):02d}",
        "time": f"{(secrets.randbelow(12) + 1):02d}:{secrets.randbelow(60):02d} AM",
        "location": "The Ivory Room, Bandra West",
        "price": 899.0
    }, headers=customer_headers)
    assert b_resp.status_code == 200
    booking_id = b_resp.json()["id"]

    # Salon owner updates appointment status
    stat_resp = client.patch(f"/api/v1/partners/salon/bookings/{booking_id}/status", json={
        "status": "completed"
    }, headers=salon_headers)
    assert stat_resp.status_code == 200
    assert stat_resp.json()["status"] == "completed"


def test_seller_product_variants_and_stock_alerts(client):
    seller_headers = get_auth_headers(client, "seller@glamgo.com", "Seller@123456")
    ts = int(time.time() * 1000)

    # 1. Create seller product (PART-009)
    prod_resp = client.post("/api/v1/partners/seller/products", json={
        "brand": "Lumière Botanique",
        "name": f"Rosewater Facial Mist {ts}",
        "category": "Skincare",
        "price": 2800.0,
        "old": 3200.0,
        "img": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500",
        "tag": "Organic",
        "description": "Distilled damask rose petals for instant hydration.",
        "stock": 25,
        "variants": ["100 ml"]
    }, headers=seller_headers)
    assert prod_resp.status_code == 200
    product = prod_resp.json()
    product_id = product["id"]
    assert product["name"] == f"Rosewater Facial Mist {ts}"

    # 2. Add product variant
    var_resp = client.post(f"/api/v1/partners/seller/products/{product_id}/variants", json={
        "name": "200 ml Travel Edition",
        "stock": 15
    }, headers=seller_headers)
    assert var_resp.status_code == 200
    assert var_resp.json()["name"] == "200 ml Travel Edition"

    # 3. Update stock to trigger low-stock alert (PART-010, PART-013)
    stock_resp = client.patch(f"/api/v1/partners/seller/products/{product_id}/stock", json={
        "stock": 3
    }, headers=seller_headers)
    assert stock_resp.status_code == 200
    assert stock_resp.json()["stock"] == 3

    # Verify seller received low-stock alert notification
    notifs = client.get("/api/v1/users/notifications", headers=seller_headers)
    assert notifs.status_code == 200
    texts = [n["text"] for n in notifs.json()]
    assert any("critically low" in t and product["name"] in t for t in texts)


def test_seller_order_fulfillment_lifecycle(client):
    seller_headers = get_auth_headers(client, "seller@glamgo.com", "Seller@123456")
    customer_headers = get_auth_headers(client, "aanya@example.com", "Password@123")

    # 1. Customer purchases product
    checkout_resp = client.post("/api/v1/orders/", json={
        "items": [{"id": "b1", "name": "Lumière Elixir", "qty": 1, "price": 2400.0}],
        "payment_method": "UPI",
        "address_label": "Home",
        "address_text": "24 Sea View Road, Bandra West"
    }, headers=customer_headers)
    assert checkout_resp.status_code == 200
    order_id = checkout_resp.json()["id"]

    # 2. Seller views incoming order (PART-011)
    orders_resp = client.get("/api/v1/partners/seller/orders", headers=seller_headers)
    assert orders_resp.status_code == 200
    order_ids = [o["id"] for o in orders_resp.json()]
    assert order_id in order_ids

    # 3. Seller advances fulfillment state: packed -> in_transit -> delivered
    for next_status in ["packed", "in_transit", "delivered"]:
        stat_resp = client.patch(f"/api/v1/partners/seller/orders/{order_id}/status", json={
            "status": next_status
        }, headers=seller_headers)
        assert stat_resp.status_code == 200
        assert stat_resp.json()["status"] == next_status

    # 4. Verify customer received tracking updates (PART-013)
    c_notifs = client.get("/api/v1/users/notifications", headers=customer_headers)
    assert c_notifs.status_code == 200
    texts = [n["text"] for n in c_notifs.json()]
    assert any(order_id in t and "Delivered" in t for t in texts)


def test_partner_financial_statements_and_commission(client):
    pro_headers = get_auth_headers(client, "nisha@glamgo.com", "Pro@123456")
    seller_headers = get_auth_headers(client, "seller@glamgo.com", "Seller@123456")

    # 1. Professional Financials (PART-012)
    pro_fin = client.get("/api/v1/partners/financials", headers=pro_headers)
    assert pro_fin.status_code == 200
    data = pro_fin.json()
    assert data["commission_rate"] == 0.15
    assert data["platform_commission"] == round(data["gross_sales"] * 0.15, 2)
    assert data["net_earnings"] == round(max(0.0, data["gross_sales"] - data["platform_commission"] - data["refund_deductions"]), 2)
    assert "settlement_summary" in data
    assert "statements" in data

    # 2. Seller Financials
    seller_fin = client.get("/api/v1/partners/financials", headers=seller_headers)
    assert seller_fin.status_code == 200
    s_data = seller_fin.json()
    assert s_data["commission_rate"] == 0.15
    assert s_data["platform_commission"] == round(s_data["gross_sales"] * 0.15, 2)
    assert s_data["net_earnings"] == round(max(0.0, s_data["gross_sales"] - s_data["platform_commission"] - s_data["refund_deductions"]), 2)


def test_partner_cross_tenant_idor_security_matrix(client):
    # Customer attempts to access partner protected routes -> 403 Forbidden
    cust_headers = get_auth_headers(client, "aanya@example.com", "Password@123")

    assert client.get("/api/v1/partners/professional/profile", headers=cust_headers).status_code == 403
    assert client.get("/api/v1/partners/salon/profile", headers=cust_headers).status_code == 403
    assert client.get("/api/v1/partners/seller/products", headers=cust_headers).status_code == 403
    assert client.get("/api/v1/partners/financials", headers=cust_headers).status_code == 403
