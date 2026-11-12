import time
import secrets
from datetime import datetime, timezone, timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.user import User, UserRole, OrderStatus
from backend.app.models.catalog import Product
from backend.app.models.commerce import (
    SellerListing, InventoryReservation, ReservationStatus, SubOrder, SubOrderStatus,
    Shipment, ShipmentStatus, ReturnRequest, ReturnStatus, InventoryAuditLog, StockAction,
    SellerEscrowRecord, EscrowStatus
)


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_token(client: TestClient, email: str, role: str) -> str:
    # Register or login
    pwd = "Password@123"
    client.post("/api/v1/auth/register", json={
        "email": email,
        "password": pwd,
        "name": f"User {email.split('@')[0]}",
        "phone": "9876543210"
    })
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
    if resp.status_code == 200:
        return resp.json()["access_token"]
    raise RuntimeError(f"Login failed for {email}")


@pytest.fixture(scope="module")
def customer_headers(client):
    ts = int(time.time() * 1000)
    email = f"cust_mv_{ts}@example.com"
    token = get_token(client, email, "customer")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def seller_a_headers(client, db_session):
    ts = int(time.time() * 1000)
    email = f"seller_a_{ts}@example.com"
    token = get_token(client, email, "seller")
    user = db_session.query(User).filter(User.email == email).first()
    user.role = UserRole.SELLER
    db_session.commit()
    return {"Authorization": f"Bearer {token}", "user_id": user.id}


@pytest.fixture(scope="module")
def seller_b_headers(client, db_session):
    ts = int(time.time() * 1000) + 1
    email = f"seller_b_{ts}@example.com"
    token = get_token(client, email, "seller")
    user = db_session.query(User).filter(User.email == email).first()
    user.role = UserRole.SELLER
    db_session.commit()
    return {"Authorization": f"Bearer {token}", "user_id": user.id}


# =============================================================================
# Milestone A: Multi-Vendor Catalog (MV-001, MV-002)
# =============================================================================

def test_multi_seller_offers_on_master_product(client, seller_a_headers, seller_b_headers):
    """MV-001: Multiple sellers can list offers on the same master product."""
    # Seller A lists product b1
    resp_a = client.post("/api/v1/partners/seller/listings", json={
        "product_id": "b1",
        "sku": f"SKU-A-{secrets.token_hex(4)}",
        "price": 2800.0,
        "compare_at_price": 3200.0,
        "stock": 40,
        "is_active": True,
        "condition": "NEW",
        "shipping_lead_time_days": 2
    }, headers={"Authorization": seller_a_headers["Authorization"]})
    assert resp_a.status_code == 201
    listing_a = resp_a.json()
    assert listing_a["price"] == 2800.0

    # Seller B lists same product b1 at a lower price
    resp_b = client.post("/api/v1/partners/seller/listings", json={
        "product_id": "b1",
        "sku": f"SKU-B-{secrets.token_hex(4)}",
        "price": 2650.0,
        "compare_at_price": 3200.0,
        "stock": 25,
        "is_active": True,
        "condition": "NEW",
        "shipping_lead_time_days": 3
    }, headers={"Authorization": seller_b_headers["Authorization"]})
    assert resp_b.status_code == 201
    listing_b = resp_b.json()
    assert listing_b["price"] == 2650.0

    # Query public offers on master product
    offers_resp = client.get("/api/v1/catalog/products/b1/offers")
    assert offers_resp.status_code == 200
    data = offers_resp.json()
    assert data["product_id"] == "b1"
    assert data["offers_count"] >= 2
    assert data["lowest_price"] <= 2650.0
    # First offer must be lowest price
    assert data["offers"][0]["price"] <= data["offers"][1]["price"]


def test_catalog_moderation_and_duplicate_sku(client, seller_a_headers):
    """MV-002: Duplicate SKU per seller is rejected with 409 Conflict."""
    sku_val = f"UNIQUE-SKU-{secrets.token_hex(4)}"
    res1 = client.post("/api/v1/partners/seller/listings", json={
        "product_id": "b1",
        "sku": sku_val,
        "price": 2900.0,
        "stock": 10
    }, headers={"Authorization": seller_a_headers["Authorization"]})
    assert res1.status_code == 201

    # Second attempt with same SKU by same seller
    res2 = client.post("/api/v1/partners/seller/listings", json={
        "product_id": "b2",
        "sku": sku_val,
        "price": 1900.0,
        "stock": 5
    }, headers={"Authorization": seller_a_headers["Authorization"]})
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"].lower()


# =============================================================================
# Milestone B: Multi-Seller Cart & Split Checkout (MV-003, MV-004, MV-005)
# =============================================================================

def test_multi_seller_cart_grouping_and_shipping(client, customer_headers, seller_a_headers, seller_b_headers):
    """MV-003: Reserving items from 2 sellers groups them into separate packages with shipping fees."""
    # Create listing for Seller A
    res_a = client.post("/api/v1/partners/seller/listings", json={
        "product_id": "b2",
        "sku": f"CART-A-{secrets.token_hex(4)}",
        "price": 800.0,
        "stock": 20
    }, headers={"Authorization": seller_a_headers["Authorization"]})
    l_a = res_a.json()["id"]

    # Create listing for Seller B
    res_b = client.post("/api/v1/partners/seller/listings", json={
        "product_id": "b3",
        "sku": f"CART-B-{secrets.token_hex(4)}",
        "price": 1200.0,
        "stock": 15
    }, headers={"Authorization": seller_b_headers["Authorization"]})
    l_b = res_b.json()["id"]

    # Customer reserves items from both sellers
    reserve_res = client.post("/api/v1/orders/reserve", json={
        "items": [
            {"listing_id": l_a, "qty": 1},  # ₹800 (< ₹1500 -> ₹100 shipping)
            {"listing_id": l_b, "qty": 2}   # ₹2400 (>= ₹1500 -> ₹0 shipping)
        ]
    }, headers=customer_headers)
    assert reserve_res.status_code == 201
    data = reserve_res.json()
    assert "reservation_token" in data
    assert len(data["sellers"]) == 2
    assert data["total_subtotal"] == 3200.0
    assert data["total_shipping"] == 100.0
    assert data["grand_total"] == 3300.0


def test_split_checkout_parent_and_suborders(client, customer_headers, seller_a_headers, seller_b_headers):
    """MV-004: Checkout creates 1 parent Order and 2 child SubOrders with independent tracking."""
    # Create listings
    res_a = client.post("/api/v1/partners/seller/listings", json={
        "product_id": "b1",
        "sku": f"SPLIT-A-{secrets.token_hex(4)}",
        "price": 1000.0,
        "stock": 10
    }, headers={"Authorization": seller_a_headers["Authorization"]})
    l_a = res_a.json()["id"]

    res_b = client.post("/api/v1/partners/seller/listings", json={
        "product_id": "b2",
        "sku": f"SPLIT-B-{secrets.token_hex(4)}",
        "price": 1500.0,
        "stock": 10
    }, headers={"Authorization": seller_b_headers["Authorization"]})
    l_b = res_b.json()["id"]

    # Reserve
    res = client.post("/api/v1/orders/reserve", json={
        "items": [{"listing_id": l_a, "qty": 1}, {"listing_id": l_b, "qty": 1}]
    }, headers=customer_headers)
    token = res.json()["reservation_token"]

    # Checkout
    co_res = client.post("/api/v1/orders/checkout", json={
        "reservation_token": token,
        "address_label": "Home",
        "address_text": "402 Royal Palms, Bandra West, Mumbai 400050",
        "payment_method": "Razorpay"
    }, headers=customer_headers)
    assert co_res.status_code == 201
    order = co_res.json()
    assert order["order_id"].startswith("GG")
    assert len(order["suborders"]) == 2
    assert order["status"] == "placed"
    assert order["suborders"][0]["suborder_id"].startswith(order["order_id"])


def test_coupon_discount_proportional_apportionment(client, customer_headers, seller_a_headers, seller_b_headers):
    """MV-005: Coupon discount is apportioned proportionally across suborders."""
    res_a = client.post("/api/v1/partners/seller/listings", json={
        "product_id": "b1",
        "sku": f"COUP-A-{secrets.token_hex(4)}",
        "price": 2000.0,
        "stock": 10
    }, headers={"Authorization": seller_a_headers["Authorization"]})
    l_a = res_a.json()["id"]

    res_b = client.post("/api/v1/partners/seller/listings", json={
        "product_id": "b2",
        "sku": f"COUP-B-{secrets.token_hex(4)}",
        "price": 1000.0,
        "stock": 10
    }, headers={"Authorization": seller_b_headers["Authorization"]})
    l_b = res_b.json()["id"]

    # Reserve total = ₹3000
    res = client.post("/api/v1/orders/reserve", json={
        "items": [{"listing_id": l_a, "qty": 1}, {"listing_id": l_b, "qty": 1}]
    }, headers=customer_headers)
    token = res.json()["reservation_token"]

    # Checkout with GLAM10 (10% off, up to max discount)
    co_res = client.post("/api/v1/orders/checkout", json={
        "reservation_token": token,
        "address_text": "Penthouse 12, Worli Sea Face, Mumbai",
        "coupon_code": "GLAM10"
    }, headers=customer_headers)
    assert co_res.status_code == 201
    data = co_res.json()
    # Total discount should be 300 (10% of 3000)
    assert data["discount"] == 300.0
    suborders = data["suborders"]
    # Seller A (2000 / 3000 = 66.67%) -> ~200 discount
    # Seller B (1000 / 3000 = 33.33%) -> ~100 discount
    sub_a = next(s for s in suborders if s["seller_id"] == seller_a_headers["user_id"])
    sub_b = next(s for s in suborders if s["seller_id"] == seller_b_headers["user_id"])
    assert sub_a["discount"] == 200.0
    assert sub_b["discount"] == 100.0


# =============================================================================
# Milestone C: Inventory Reservation & Concurrency (MV-006, MV-007)
# =============================================================================

def test_inventory_reservation_ttl_and_expiry(client, customer_headers, seller_a_headers, db_session):
    """MV-006: Inventory reservation hold has 15-minute TTL; expired holds are released."""
    res_a = client.post("/api/v1/partners/seller/listings", json={
        "product_id": "b1",
        "sku": f"TTL-A-{secrets.token_hex(4)}",
        "price": 1100.0,
        "stock": 5
    }, headers={"Authorization": seller_a_headers["Authorization"]})
    lid = res_a.json()["id"]

    # Reserve 2 units
    res = client.post("/api/v1/orders/reserve", json={
        "items": [{"listing_id": lid, "qty": 2}]
    }, headers=customer_headers)
    token = res.json()["reservation_token"]

    # Check listing stock is decremented to 3
    listing = db_session.query(SellerListing).filter(SellerListing.id == lid).first()
    assert listing.stock == 3

    # Fast-forward expiry into the past
    reservation = db_session.query(InventoryReservation).filter(InventoryReservation.reservation_token == token).first()
    reservation.expires_at = datetime.now(timezone.utc) - timedelta(minutes=5)
    db_session.commit()

    # Trigger background expiry engine
    exp_res = client.post("/api/v1/internal/inventory/expire-reservations")
    assert exp_res.status_code == 200
    assert exp_res.json()["expired_reservations_count"] >= 1

    # Check stock restored to 5
    db_session.refresh(listing)
    assert listing.stock == 5

    # Attempt checkout with expired token returns 410 Gone
    checkout_res = client.post("/api/v1/orders/checkout", json={
        "reservation_token": token,
        "address_text": "Colaba, Mumbai"
    }, headers=customer_headers)
    assert checkout_res.status_code == 410


def test_concurrency_race_condition_no_overselling(client, customer_headers, seller_a_headers):
    """MV-007: When stock is 1, concurrent reservations prevent overselling."""
    res_a = client.post("/api/v1/partners/seller/listings", json={
        "product_id": "b1",
        "sku": f"RACE-{secrets.token_hex(4)}",
        "price": 1500.0,
        "stock": 1
    }, headers={"Authorization": seller_a_headers["Authorization"]})
    lid = res_a.json()["id"]

    # First reservation succeeds
    r1 = client.post("/api/v1/orders/reserve", json={
        "items": [{"listing_id": lid, "qty": 1}]
    }, headers=customer_headers)
    assert r1.status_code == 201

    # Immediate second reservation fails with 409 Conflict (0 left)
    r2 = client.post("/api/v1/orders/reserve", json={
        "items": [{"listing_id": lid, "qty": 1}]
    }, headers=customer_headers)
    assert r2.status_code == 409
    assert "insufficient stock" in r2.json()["detail"].lower()


# =============================================================================
# Milestones D & E: Suborder Fulfillment, Logistics & Tracking (MV-008 to MV-011)
# =============================================================================

def test_independent_seller_fulfillment_and_rbac(client, customer_headers, seller_a_headers, seller_b_headers):
    """MV-008, MV-009, MV-010, MV-011: Independent fulfillment, RBAC isolation, tracking, rollup."""
    res_a = client.post("/api/v1/partners/seller/listings", json={
        "product_id": "b1",
        "sku": f"FULFILL-A-{secrets.token_hex(4)}",
        "price": 1800.0,
        "stock": 10
    }, headers={"Authorization": seller_a_headers["Authorization"]})
    l_a = res_a.json()["id"]

    res_b = client.post("/api/v1/partners/seller/listings", json={
        "product_id": "b2",
        "sku": f"FULFILL-B-{secrets.token_hex(4)}",
        "price": 1200.0,
        "stock": 10
    }, headers={"Authorization": seller_b_headers["Authorization"]})
    l_b = res_b.json()["id"]

    # Reserve & Checkout
    res = client.post("/api/v1/orders/reserve", json={
        "items": [{"listing_id": l_a, "qty": 1}, {"listing_id": l_b, "qty": 1}]
    }, headers=customer_headers)
    token = res.json()["reservation_token"]

    co = client.post("/api/v1/orders/checkout", json={
        "reservation_token": token,
        "address_text": "Juhu Tara Road, Mumbai"
    }, headers=customer_headers).json()

    parent_id = co["order_id"]
    suborders = co["suborders"]
    sub_a_id = next(s["suborder_id"] for s in suborders if s["seller_id"] == seller_a_headers["user_id"])
    sub_b_id = next(s["suborder_id"] for s in suborders if s["seller_id"] == seller_b_headers["user_id"])

    # RBAC Security Test: Seller B attempts to pack Seller A's suborder -> 403 Forbidden
    hack_res = client.post(f"/api/v1/partners/seller/suborders/{sub_a_id}/pack", headers={"Authorization": seller_b_headers["Authorization"]})
    assert hack_res.status_code == 403

    # Seller A packs their suborder
    pack_res = client.post(f"/api/v1/partners/seller/suborders/{sub_a_id}/pack", headers={"Authorization": seller_a_headers["Authorization"]})
    assert pack_res.status_code == 200

    # Seller A ships their suborder with BlueDart tracking
    ship_res = client.post(f"/api/v1/partners/seller/suborders/{sub_a_id}/ship", json={
        "carrier_name": "BlueDart Express",
        "tracking_number": "BLU984102941",
        "tracking_url": "https://bluedart.com/track/BLU984102941"
    }, headers={"Authorization": seller_a_headers["Authorization"]})
    assert ship_res.status_code == 200
    assert ship_res.json()["status"] == "in_transit"

    # Parent Order Rollup: Since Suborder A is in_transit, parent order status rolls up to in_transit
    parent_check = client.get(f"/api/v1/orders/{parent_id}", headers=customer_headers).json()
    assert parent_check["status"] == "in_transit"

    # Seller A delivers their suborder
    del_res = client.post(f"/api/v1/partners/seller/suborders/{sub_a_id}/deliver", headers={"Authorization": seller_a_headers["Authorization"]})
    assert del_res.status_code == 200

    # Seller B is still placed -> parent order is still in_transit
    parent_check = client.get(f"/api/v1/orders/{parent_id}", headers=customer_headers).json()
    assert parent_check["status"] == "in_transit"

    # Seller B packs, ships, and delivers their suborder
    client.post(f"/api/v1/partners/seller/suborders/{sub_b_id}/pack", headers={"Authorization": seller_b_headers["Authorization"]})
    client.post(f"/api/v1/partners/seller/suborders/{sub_b_id}/ship", json={
        "carrier_name": "Delhivery",
        "tracking_number": "DEL88291039"
    }, headers={"Authorization": seller_b_headers["Authorization"]})
    client.post(f"/api/v1/partners/seller/suborders/{sub_b_id}/deliver", headers={"Authorization": seller_b_headers["Authorization"]})

    # Now that BOTH suborders are delivered, parent order rolls up to delivered
    final_parent = client.get(f"/api/v1/orders/{parent_id}", headers=customer_headers).json()
    assert final_parent["status"] == "delivered"


# =============================================================================
# Milestone F: Reverse Logistics & Returns (MV-012, MV-013)
# =============================================================================

def test_customer_return_request_and_seller_approval_restock(client, customer_headers, seller_a_headers, db_session):
    """MV-012, MV-013: Customer submits return within 7 days; seller approves with restock."""
    res_a = client.post("/api/v1/partners/seller/listings", json={
        "product_id": "b1",
        "sku": f"RET-{secrets.token_hex(4)}",
        "price": 2500.0,
        "stock": 10
    }, headers={"Authorization": seller_a_headers["Authorization"]})
    lid = res_a.json()["id"]

    # Reserve & Checkout
    res = client.post("/api/v1/orders/reserve", json={
        "items": [{"listing_id": lid, "qty": 1}]
    }, headers=customer_headers)
    token = res.json()["reservation_token"]

    co = client.post("/api/v1/orders/checkout", json={
        "reservation_token": token,
        "address_text": "Bandra West, Mumbai"
    }, headers=customer_headers).json()

    sub_id = co["suborders"][0]["suborder_id"]

    # Must deliver before return can be initiated
    client.post(f"/api/v1/partners/seller/suborders/{sub_id}/ship", json={
        "carrier_name": "BlueDart", "tracking_number": "BLU111"
    }, headers={"Authorization": seller_a_headers["Authorization"]})
    client.post(f"/api/v1/partners/seller/suborders/{sub_id}/deliver", headers={"Authorization": seller_a_headers["Authorization"]})

    # Get order items
    order_detail = client.get(f"/api/v1/orders/{co['order_id']}", headers=customer_headers).json()
    item_id = order_detail["suborders"][0]["items"][0]["order_item_id"]

    # Customer submits return request
    ret_res = client.post(f"/api/v1/orders/suborders/{sub_id}/return", json={
        "order_item_id": item_id,
        "reason": "Damaged bottle / seal broken",
        "detailed_explanation": "Product leaked inside shipment box."
    }, headers=customer_headers)
    assert ret_res.status_code == 201
    ret_data = ret_res.json()
    assert ret_data["status"] == "REQUESTED"
    return_id = ret_data["id"]

    # Seller approves return with inventory restocking
    dec_res = client.post(f"/api/v1/partners/seller/returns/{return_id}/decide", json={
        "action": "APPROVE",
        "restock_inventory": True
    }, headers={"Authorization": seller_a_headers["Authorization"]})
    assert dec_res.status_code == 200
    assert dec_res.json()["status"] == "REFUNDED"
    assert dec_res.json()["restock_approved"] is True

    # Verify inventory was restocked back to 10
    listing = db_session.query(SellerListing).filter(SellerListing.id == lid).first()
    assert listing.stock == 10

    # Verify audit log entry
    audit = db_session.query(InventoryAuditLog).filter(
        InventoryAuditLog.listing_id == lid,
        InventoryAuditLog.action == StockAction.RESTOCK_RETURN
    ).first()
    assert audit is not None


# =============================================================================
# Milestone G: Multi-Vendor Settlement & Escrow Maturity (MV-014, MV-015)
# =============================================================================

def test_escrow_maturity_engine_post_delivery(client, customer_headers, seller_a_headers, db_session):
    """MV-014, MV-015: Escrow holds funds for T+3 days post-delivery; matures afterwards."""
    res_a = client.post("/api/v1/partners/seller/listings", json={
        "product_id": "b1",
        "sku": f"ESCROW-{secrets.token_hex(4)}",
        "price": 2000.0,
        "stock": 5
    }, headers={"Authorization": seller_a_headers["Authorization"]})
    lid = res_a.json()["id"]

    res = client.post("/api/v1/orders/reserve", json={
        "items": [{"listing_id": lid, "qty": 1}]
    }, headers=customer_headers)
    token = res.json()["reservation_token"]

    co = client.post("/api/v1/orders/checkout", json={
        "reservation_token": token,
        "address_text": "Bandra, Mumbai"
    }, headers=customer_headers).json()

    sub_id = co["suborders"][0]["suborder_id"]

    # Ship and deliver
    client.post(f"/api/v1/partners/seller/suborders/{sub_id}/ship", json={
        "carrier_name": "BlueDart", "tracking_number": "BLU999"
    }, headers={"Authorization": seller_a_headers["Authorization"]})
    client.post(f"/api/v1/partners/seller/suborders/{sub_id}/deliver", headers={"Authorization": seller_a_headers["Authorization"]})

    # Check financials immediately post-delivery -> funds in escrow
    fin1 = client.get("/api/v1/partners/seller/financials", headers={"Authorization": seller_a_headers["Authorization"]}).json()
    assert fin1["funds_in_escrow"] > 0

    # Simulate delivery timestamp 4 days in the past
    escrow = db_session.query(SellerEscrowRecord).filter(SellerEscrowRecord.suborder_id == sub_id).first()
    past_delivery = datetime.now(timezone.utc) - timedelta(days=4)
    escrow.delivered_at = past_delivery
    escrow.matures_at = past_delivery + timedelta(days=3)
    db_session.commit()

    # Trigger maturity engine
    mat_res = client.post("/api/v1/internal/escrow/mature")
    assert mat_res.status_code == 200
    assert mat_res.json()["matured_records_count"] >= 1

    # Check financials now -> funds transferred from escrow to matured balance
    fin2 = client.get("/api/v1/partners/seller/financials", headers={"Authorization": seller_a_headers["Authorization"]}).json()
    assert fin2["matured_balance_available"] >= escrow.net_settlement


# =============================================================================
# Milestone H: Full End-to-End Multi-Vendor Regression Harness (MV-016)
# =============================================================================

def test_e2e_multi_vendor_commerce_lifecycle(client, customer_headers, seller_a_headers, seller_b_headers, db_session):
    """MV-016: Complete end-to-end lifecycle verification across all Phase 5 capabilities."""
    # 1. Sellers list offers
    res_a = client.post("/api/v1/partners/seller/listings", json={
        "product_id": "b1",
        "sku": f"E2E-A-{secrets.token_hex(4)}",
        "price": 2200.0,
        "stock": 10
    }, headers={"Authorization": seller_a_headers["Authorization"]}).json()

    res_b = client.post("/api/v1/partners/seller/listings", json={
        "product_id": "b2",
        "sku": f"E2E-B-{secrets.token_hex(4)}",
        "price": 1800.0,
        "stock": 10
    }, headers={"Authorization": seller_b_headers["Authorization"]}).json()

    # 2. Customer reserves items
    reserve = client.post("/api/v1/orders/reserve", json={
        "items": [{"listing_id": res_a["id"], "qty": 1}, {"listing_id": res_b["id"], "qty": 1}]
    }, headers=customer_headers).json()
    assert "reservation_token" in reserve

    # 3. Customer checks out
    checkout = client.post("/api/v1/orders/checkout", json={
        "reservation_token": reserve["reservation_token"],
        "address_text": "Nariman Point, Mumbai",
        "coupon_code": "GLAM10"
    }, headers=customer_headers).json()
    order_id = checkout["order_id"]
    sub_a = next(s["suborder_id"] for s in checkout["suborders"] if s["seller_id"] == seller_a_headers["user_id"])
    sub_b = next(s["suborder_id"] for s in checkout["suborders"] if s["seller_id"] == seller_b_headers["user_id"])

    # 4. Seller A packs and ships with tracking
    client.post(f"/api/v1/partners/seller/suborders/{sub_a}/pack", headers={"Authorization": seller_a_headers["Authorization"]})
    client.post(f"/api/v1/partners/seller/suborders/{sub_a}/ship", json={
        "carrier_name": "BlueDart Express",
        "tracking_number": "E2E-BLU-999"
    }, headers={"Authorization": seller_a_headers["Authorization"]})

    # 5. Seller A delivers
    client.post(f"/api/v1/partners/seller/suborders/{sub_a}/deliver", headers={"Authorization": seller_a_headers["Authorization"]})

    # 6. Customer returns item from Seller A's suborder
    order_info = client.get(f"/api/v1/orders/{order_id}", headers=customer_headers).json()
    sub_a_data = next(s for s in order_info["suborders"] if s["suborder_id"] == sub_a)
    item_id = sub_a_data["items"][0]["order_item_id"]
    ret_res = client.post(f"/api/v1/orders/suborders/{sub_a}/return", json={
        "order_item_id": item_id,
        "reason": "Fragrance mismatch"
    }, headers=customer_headers)
    assert ret_res.status_code == 201
    ret = ret_res.json()

    # 7. Seller A approves return
    client.post(f"/api/v1/partners/seller/returns/{ret['id']}/decide", json={
        "action": "APPROVE",
        "restock_inventory": True
    }, headers={"Authorization": seller_a_headers["Authorization"]})

    # 8. Seller B fulfills suborder B
    client.post(f"/api/v1/partners/seller/suborders/{sub_b}/pack", headers={"Authorization": seller_b_headers["Authorization"]})
    client.post(f"/api/v1/partners/seller/suborders/{sub_b}/ship", json={
        "carrier_name": "Delhivery",
        "tracking_number": "E2E-DEL-888"
    }, headers={"Authorization": seller_b_headers["Authorization"]})
    client.post(f"/api/v1/partners/seller/suborders/{sub_b}/deliver", headers={"Authorization": seller_b_headers["Authorization"]})

    # 9. Verify parent order is delivered
    final_order = client.get(f"/api/v1/orders/{order_id}", headers=customer_headers).json()
    assert final_order["status"] == "delivered"

    # 10. Verify financial statement and escrow maturity
    escrow_b = db_session.query(SellerEscrowRecord).filter(SellerEscrowRecord.suborder_id == sub_b).first()
    past_date = datetime.now(timezone.utc) - timedelta(days=4)
    escrow_b.delivered_at = past_date
    escrow_b.matures_at = past_date + timedelta(days=3)
    db_session.commit()

    client.post("/api/v1/internal/escrow/mature")
    fin_b = client.get("/api/v1/partners/seller/financials", headers={"Authorization": seller_b_headers["Authorization"]}).json()
    assert fin_b["matured_balance_available"] >= escrow_b.net_settlement
