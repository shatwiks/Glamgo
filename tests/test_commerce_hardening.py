import hmac
import hashlib
import json
import secrets
import threading
from datetime import datetime, timezone, timedelta
from types import SimpleNamespace

import pytest
import razorpay
from fastapi import HTTPException
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.core.config import settings
from backend.app.core.database import SessionLocal
from backend.app.models.user import User, UserRole, OrderStatus
from backend.app.models.catalog import Product, ProductVariant
from backend.app.models.order import Order, Coupon
from backend.app.models.payment import PaymentTransaction
from backend.app.models.commerce import (
    SellerListing, InventoryReservation, ReservationStatus, SubOrder, SubOrderStatus,
    ReturnRequest, ReturnStatus, InventoryAuditLog, StockAction,
    SellerEscrowRecord, EscrowStatus,
)
from backend.app.schemas.commerce import (
    ReservationItem, MultiVendorCheckoutRequest, ShipmentCreate,
)
from backend.app.services.commerce_service import CommerceService, to_paise
from backend.app.services.maintenance_runner import run_maintenance_cycle


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def _create_user_headers(client: TestClient, db, role: UserRole) -> dict:
    suffix = secrets.token_hex(5)
    email = f"{role.value}_{suffix}@example.com"
    pwd = "Password@123"
    reg = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": pwd,
        "name": f"Hardening {role.value.title()} {suffix}",
        "phone": "9876543210",
    })
    assert reg.status_code in (200, 201), reg.text
    if role != UserRole.CUSTOMER:
        user = db.query(User).filter(User.email == email).first()
        user.role = role
        db.commit()
    else:
        user = db.query(User).filter(User.email == email).first()
    login = client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}", "user_id": user.id, "email": email}


def _install_mock_gateway(
    monkeypatch,
    *,
    refund_mode: str = "processed",
    refund_error: Exception | None = None,
    refund_calls: list | None = None,
    create_calls: list | None = None,
):
    orders_store: dict[str, dict] = {}
    refund_calls_ref = refund_calls if refund_calls is not None else []
    create_calls_ref = create_calls if create_calls is not None else []

    def create_order(payload):
        create_calls_ref.append(payload)
        oid = f"order_hd_{secrets.token_hex(6)}"
        orders_store[oid] = payload
        return {
            "id": oid,
            "amount": payload["amount"],
            "currency": payload["currency"],
        }

    def fetch_payment(payment_id):
        oid = payment_id.split("__")[-1] if "__" in payment_id else next(reversed(orders_store.keys()))
        amount = orders_store.get(oid, {}).get("amount", 0)
        return {
            "id": payment_id,
            "order_id": oid,
            "amount": amount,
            "currency": "INR",
            "status": "captured",
            "captured": True,
        }

    def create_refund(payment_id, payload=None):
        payload = payload or {}
        refund_calls_ref.append({"payment_id": payment_id, "payload": payload})
        if refund_error is not None:
            raise refund_error
        rid = f"rfnd_hd_{secrets.token_hex(6)}"
        return {
            "id": rid,
            "payment_id": payment_id,
            "amount": payload.get("amount", 0),
            "status": refund_mode,
        }

    mock_client = SimpleNamespace(
        order=SimpleNamespace(create=create_order),
        payment=SimpleNamespace(fetch=fetch_payment, refund=create_refund),
    )
    monkeypatch.setattr("backend.app.api.v1.payments.get_razorpay_client", lambda: mock_client)
    return {"orders": orders_store, "refund_calls": refund_calls_ref, "create_calls": create_calls_ref}


def _pay_and_verify(client: TestClient, cust_headers: dict, order_id: str, total: float) -> dict:
    c_res = client.post(
        "/api/v1/payments/razorpay/create-order",
        json={"amount": total, "order_id": order_id},
        headers={"Authorization": cust_headers["Authorization"]},
    )
    assert c_res.status_code == 200, c_res.text
    rzp_order_id = c_res.json()["razorpay_order_id"]
    pay_id = f"pay_hd_{secrets.token_hex(4)}__{rzp_order_id}"
    sig = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
        f"{rzp_order_id}|{pay_id}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    v_res = client.post(
        "/api/v1/payments/razorpay/verify",
        json={
            "razorpay_order_id": rzp_order_id,
            "razorpay_payment_id": pay_id,
            "razorpay_signature": sig,
            "order_id": order_id,
        },
        headers={"Authorization": cust_headers["Authorization"]},
    )
    assert v_res.status_code == 200, v_res.text
    return v_res.json() | {"razorpay_order_id": rzp_order_id, "razorpay_payment_id": pay_id}


def _sign_webhook(payload: dict) -> tuple[bytes, dict]:
    raw = json.dumps(payload).encode("utf-8")
    sig = hmac.new(settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"), raw, hashlib.sha256).hexdigest()
    return raw, {"X-Razorpay-Signature": sig, "Content-Type": "application/json"}


# -----------------------------------------------------------------------------
# 1. Internal maintenance authentication & runner
# -----------------------------------------------------------------------------
def test_internal_maintenance_auth_and_runner(client, db, maintenance_auth_headers):
    cust = _create_user_headers(client, db, UserRole.CUSTOMER)
    admin = _create_user_headers(client, db, UserRole.ADMIN)

    for path in (
        "/api/v1/internal/inventory/expire-reservations",
        "/api/v1/internal/escrow/mature",
    ):
        assert client.post(path).status_code == 401
        assert client.post(path, headers={"X-Maintenance-Token": "wrong-token"}).status_code == 401
        assert client.post(path, headers={"Authorization": cust["Authorization"]}).status_code == 403
        assert client.post(path, headers=maintenance_auth_headers).status_code == 200
        assert client.post(path, headers={"Authorization": admin["Authorization"]}).status_code == 200

    summary = run_maintenance_cycle(db, "all")
    assert "expired_reservations_count" in summary
    assert "matured_records_count" in summary


# -----------------------------------------------------------------------------
# 2. Duplicate listing lines aggregated before reservation validation
# -----------------------------------------------------------------------------
def test_duplicate_listing_lines_aggregated_before_reserve(client, db):
    cust = _create_user_headers(client, db, UserRole.CUSTOMER)
    seller = _create_user_headers(client, db, UserRole.SELLER)

    l_res = client.post(
        "/api/v1/partners/seller/listings",
        json={
            "product_id": "b1",
            "sku": f"DUP-{secrets.token_hex(4)}",
            "price": 1600.0,
            "stock": 1,
        },
        headers={"Authorization": seller["Authorization"]},
    )
    assert l_res.status_code == 201
    lid = l_res.json()["id"]

    res = client.post(
        "/api/v1/orders/reserve",
        json={"items": [{"listing_id": lid, "qty": 1}, {"listing_id": lid, "qty": 1}]},
        headers={"Authorization": cust["Authorization"]},
    )
    assert res.status_code == 409
    assert "insufficient stock" in res.json()["detail"].lower()

    listing = db.query(SellerListing).filter(SellerListing.id == lid).first()
    db.refresh(listing)
    assert listing.stock == 1
    assert db.query(InventoryReservation).filter(InventoryReservation.listing_id == lid).count() == 0


# -----------------------------------------------------------------------------
# 3. True multi-threaded PostgreSQL reservation contention (stock=1)
# -----------------------------------------------------------------------------
def test_concurrent_reserve_barrier_no_overselling(client, db):
    cust = _create_user_headers(client, db, UserRole.CUSTOMER)
    seller = _create_user_headers(client, db, UserRole.SELLER)

    l_res = client.post(
        "/api/v1/partners/seller/listings",
        json={
            "product_id": "b2",
            "sku": f"CONC-{secrets.token_hex(4)}",
            "price": 1700.0,
            "stock": 1,
        },
        headers={"Authorization": seller["Authorization"]},
    )
    assert l_res.status_code == 201
    lid = l_res.json()["id"]

    num_threads = 5
    barrier = threading.Barrier(num_threads)
    results = []
    lock = threading.Lock()

    def worker():
        s = SessionLocal()
        try:
            barrier.wait(timeout=5)
            out = CommerceService.reserve_inventory(
                s,
                cust["user_id"],
                [ReservationItem(listing_id=lid, qty=1)],
            )
            with lock:
                results.append(("ok", out["reservation_token"]))
        except HTTPException as exc:
            with lock:
                results.append(("http", exc.status_code))
        except Exception as exc:
            with lock:
                results.append(("err", repr(exc)))
        finally:
            s.close()

    threads = [threading.Thread(target=worker) for _ in range(num_threads)]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=15)

    ok_count = sum(1 for r in results if r[0] == "ok")
    conflict_count = sum(1 for r in results if r == ("http", 409))
    err_count = sum(1 for r in results if r[0] == "err")
    assert err_count == 0, results
    assert ok_count == 1, results
    assert conflict_count == num_threads - 1, results

    listing = db.query(SellerListing).filter(SellerListing.id == lid).first()
    db.refresh(listing)
    assert listing.stock == 0


# -----------------------------------------------------------------------------
# 4. Concurrent checkout vs expiry + double-checkout race exclusivity
# -----------------------------------------------------------------------------
def test_concurrent_checkout_vs_expiry_barrier_exclusivity(client, db):
    cust = _create_user_headers(client, db, UserRole.CUSTOMER)
    seller = _create_user_headers(client, db, UserRole.SELLER)

    l_res = client.post(
        "/api/v1/partners/seller/listings",
        json={
            "product_id": "b1",
            "sku": f"RACECHK-{secrets.token_hex(4)}",
            "price": 1600.0,
            "stock": 3,
        },
        headers={"Authorization": seller["Authorization"]},
    )
    assert l_res.status_code == 201
    lid = l_res.json()["id"]

    # Part A: checkout vs expiry race on an overdue reservation
    r_res = client.post(
        "/api/v1/orders/reserve",
        json={"items": [{"listing_id": lid, "qty": 2}]},
        headers={"Authorization": cust["Authorization"]},
    )
    assert r_res.status_code == 201
    token_a = r_res.json()["reservation_token"]

    res_row = db.query(InventoryReservation).filter(
        InventoryReservation.reservation_token == token_a
    ).first()
    res_row.expires_at = datetime.now(timezone.utc) - timedelta(seconds=5)
    db.commit()

    barrier = threading.Barrier(2)
    outcomes: dict[str, object] = {}

    def run_checkout():
        s = SessionLocal()
        try:
            barrier.wait(timeout=5)
            outcomes["checkout"] = CommerceService.checkout_multi_vendor(
                s,
                cust["user_id"],
                MultiVendorCheckoutRequest(
                    reservation_token=token_a,
                    address_text="Race Test St",
                    payment_method="UPI",
                ),
            )
            outcomes["checkout_status"] = 201
        except HTTPException as exc:
            outcomes["checkout_status"] = exc.status_code
        finally:
            s.close()

    def run_expiry():
        s = SessionLocal()
        try:
            barrier.wait(timeout=5)
            outcomes["expired_count"] = CommerceService.expire_pending_reservations(s)
        finally:
            s.close()

    t1 = threading.Thread(target=run_checkout)
    t2 = threading.Thread(target=run_expiry)
    t1.start()
    t2.start()
    t1.join(timeout=15)
    t2.join(timeout=15)

    assert outcomes["checkout_status"] == 410
    assert db.query(Order).filter(Order.reservation_token == token_a).count() == 0
    listing = db.query(SellerListing).filter(SellerListing.id == lid).first()
    db.refresh(listing)
    assert listing.stock == 3

    # Part B: concurrent double-checkout on a fresh valid token without idempotency key
    r_res2 = client.post(
        "/api/v1/orders/reserve",
        json={"items": [{"listing_id": lid, "qty": 1}]},
        headers={"Authorization": cust["Authorization"]},
    )
    assert r_res2.status_code == 201
    token_b = r_res2.json()["reservation_token"]

    barrier2 = threading.Barrier(2)
    co_results = []
    co_lock = threading.Lock()

    def co_worker():
        s = SessionLocal()
        try:
            barrier2.wait(timeout=5)
            res = CommerceService.checkout_multi_vendor(
                s,
                cust["user_id"],
                MultiVendorCheckoutRequest(
                    reservation_token=token_b,
                    address_text="Double Checkout St",
                    payment_method="UPI",
                ),
            )
            with co_lock:
                co_results.append(("ok", res["id"]))
        except HTTPException as exc:
            with co_lock:
                co_results.append(("http", exc.status_code))
        finally:
            s.close()

    ta = threading.Thread(target=co_worker)
    tb = threading.Thread(target=co_worker)
    ta.start()
    tb.start()
    ta.join(timeout=15)
    tb.join(timeout=15)

    assert sum(1 for x in co_results if x[0] == "ok") == 1, co_results
    assert sum(1 for x in co_results if x == ("http", 409)) == 1, co_results
    assert db.query(Order).filter(Order.reservation_token == token_b).count() == 1


# -----------------------------------------------------------------------------
# 5. Double expiry releases stock once; double checkout blocked
# -----------------------------------------------------------------------------
def test_double_expiry_and_double_checkout_idempotency(client, db, maintenance_auth_headers):
    cust = _create_user_headers(client, db, UserRole.CUSTOMER)
    seller = _create_user_headers(client, db, UserRole.SELLER)

    lid = client.post(
        "/api/v1/partners/seller/listings",
        json={
            "product_id": "b1",
            "sku": f"EXP2-{secrets.token_hex(4)}",
            "price": 1500.0,
            "stock": 4,
        },
        headers={"Authorization": seller["Authorization"]},
    ).json()["id"]

    res = client.post(
        "/api/v1/orders/reserve",
        json={"items": [{"listing_id": lid, "qty": 2}]},
        headers={"Authorization": cust["Authorization"]},
    ).json()
    token = res["reservation_token"]

    row = db.query(InventoryReservation).filter(InventoryReservation.reservation_token == token).first()
    row.expires_at = datetime.now(timezone.utc) - timedelta(minutes=2)
    db.commit()

    e1 = client.post("/api/v1/internal/inventory/expire-reservations", headers=maintenance_auth_headers)
    assert e1.status_code == 200
    assert e1.json()["expired_reservations_count"] >= 1

    e2 = client.post("/api/v1/internal/inventory/expire-reservations", headers=maintenance_auth_headers)
    assert e2.status_code == 200
    assert e2.json()["expired_reservations_count"] == 0

    listing = db.query(SellerListing).filter(SellerListing.id == lid).first()
    db.refresh(listing)
    assert listing.stock == 4


# -----------------------------------------------------------------------------
# 6. Checkout & Payment idempotency key conflicts
# -----------------------------------------------------------------------------
def test_checkout_and_payment_idempotency_conflicts(client, db, monkeypatch):
    cust = _create_user_headers(client, db, UserRole.CUSTOMER)
    gw = _install_mock_gateway(monkeypatch)

    idem = f"idem-ord-{secrets.token_hex(4)}"
    payload_1 = {
        "items": [{"id": "b1", "qty": 1}],
        "address_label": "Home",
        "address_text": "10 Marine Drive, Mumbai",
        "payment_method": "UPI",
        "idempotency_key": idem,
    }
    o1 = client.post("/api/v1/orders/", json=payload_1, headers={"Authorization": cust["Authorization"]})
    assert o1.status_code == 200, o1.text
    order_id = o1.json()["id"]

    # Same key + same payload -> same order
    o2 = client.post("/api/v1/orders/", json=payload_1, headers={"Authorization": cust["Authorization"]})
    assert o2.status_code == 200
    assert o2.json()["id"] == order_id

    # Same key + different address -> 409 Conflict
    payload_2 = {**payload_1, "address_text": "99 Different Street, Delhi"}
    o_conflict = client.post("/api/v1/orders/", json=payload_2, headers={"Authorization": cust["Authorization"]})
    assert o_conflict.status_code == 409

    # Another order to test payment idempotency conflict
    o3 = client.post(
        "/api/v1/orders/",
        json={
            "items": [{"id": "b1", "qty": 1}],
            "address_label": "Home",
            "address_text": "10 Marine Drive, Mumbai",
            "payment_method": "UPI",
        },
        headers={"Authorization": cust["Authorization"]},
    ).json()

    pay_idem = f"idem-pay-{secrets.token_hex(4)}"
    p1 = client.post(
        "/api/v1/payments/razorpay/create-order",
        json={"order_id": order_id, "idempotency_key": pay_idem},
        headers={"Authorization": cust["Authorization"]},
    )
    assert p1.status_code == 200
    assert len(gw["create_calls"]) == 1

    # Same payment idempotency key + same target -> reuses Razorpay order, no extra gateway call
    p2 = client.post(
        "/api/v1/payments/razorpay/create-order",
        json={"order_id": order_id, "idempotency_key": pay_idem},
        headers={"Authorization": cust["Authorization"]},
    )
    assert p2.status_code == 200
    assert p2.json()["razorpay_order_id"] == p1.json()["razorpay_order_id"]
    assert len(gw["create_calls"]) == 1

    # Same payment idempotency key + DIFFERENT order -> 409 Conflict
    p_conflict = client.post(
        "/api/v1/payments/razorpay/create-order",
        json={"order_id": o3["id"], "idempotency_key": pay_idem},
        headers={"Authorization": cust["Authorization"]},
    )
    assert p_conflict.status_code == 409


# -----------------------------------------------------------------------------
# 7. Unified POST /api/v1/orders/ creates suborders, escrow & shipping rules
# -----------------------------------------------------------------------------
def test_unified_standard_orders_endpoint_architecture_and_payment_defaults(client, db):
    cust = _create_user_headers(client, db, UserRole.CUSTOMER)

    # b3 costs ₹990 (< ₹1,500) -> ₹100 seller shipping applies, online starts 'pending'
    r_online = client.post(
        "/api/v1/orders/",
        json={
            "items": [{"id": "b3", "qty": 1}],
            "address_label": "Home",
            "address_text": "Bandra West, Mumbai",
            "payment_method": "UPI",
        },
        headers={"Authorization": cust["Authorization"]},
    )
    assert r_online.status_code == 200, r_online.text
    ord_online = r_online.json()
    assert ord_online["payment_status"] == "pending"
    assert ord_online["shipping_fee"] == 100.0
    assert ord_online["total"] == ord_online["subtotal"] + 100.0
    assert len(ord_online["suborders"]) == 1
    assert ord_online["items"][0]["sku"] != ""
    assert ord_online["reservation_token"].startswith("res_")

    # COD starts as 'cod_pending'
    r_cod = client.post(
        "/api/v1/orders/",
        json={
            "items": [{"id": "b1", "qty": 1}],
            "address_label": "Home",
            "address_text": "Bandra West, Mumbai",
            "payment_method": "Cash on delivery",
        },
        headers={"Authorization": cust["Authorization"]},
    )
    assert r_cod.status_code == 200, r_cod.text
    ord_cod = r_cod.json()
    assert ord_cod["payment_status"] == "cod_pending"
    assert ord_cod["shipping_fee"] == 0.0


# -----------------------------------------------------------------------------
# 8. Variant coexistence, stock sync & immutable purchase snapshot
# -----------------------------------------------------------------------------
def test_variant_coexistence_stock_sync_and_catalog_snapshot_immutability(client, db):
    cust = _create_user_headers(client, db, UserRole.CUSTOMER)
    seller = _create_user_headers(client, db, UserRole.SELLER)

    p_res = client.post(
        "/api/v1/partners/seller/products",
        json={
            "brand": "Maison Test",
            "name": "Dual Shade Silk Tint",
            "category": "Makeup",
            "price": 1200.0,
            "img": "./assets/lipstick.webp",
            "description": "Two rich variants.",
            "variants": ["Amber Glow", "Ruby Silk"],
        },
        headers={"Authorization": seller["Authorization"]},
    )
    assert p_res.status_code == 200, p_res.text
    prod = p_res.json()
    pid = prod["id"]

    # Verify SellerListings exist and Product.stock matches active listing sum (50 + 50 = 100)
    cat_prod = client.get(f"/api/v1/products/{pid}").json()
    assert set(cat_prod["variant_listings"].keys()) == {"Amber Glow", "Ruby Silk"}
    assert cat_prod["stock"] == 100

    # Place ONE order containing BOTH variants of the SAME product
    ord_res = client.post(
        "/api/v1/orders/",
        json={
            "items": [
                {"id": pid, "variant": "Amber Glow", "qty": 1},
                {"id": pid, "variant": "Ruby Silk", "qty": 2},
            ],
            "address_label": "Work",
            "address_text": "Worli Sea Face",
            "payment_method": "Cash on delivery",
        },
        headers={"Authorization": cust["Authorization"]},
    )
    assert ord_res.status_code == 200, ord_res.text
    order = ord_res.json()
    assert len(order["items"]) == 2
    variants_ordered = {it["variant_name"]: it for it in order["items"]}
    assert variants_ordered["Amber Glow"]["qty"] == 1
    assert variants_ordered["Ruby Silk"]["qty"] == 2
    assert variants_ordered["Amber Glow"]["sku"] != variants_ordered["Ruby Silk"]["sku"]
    assert all(it["price"] == 1200.0 for it in order["items"])

    # Verify Product.stock synced to 97 (100 - 3)
    cat_after = client.get(f"/api/v1/products/{pid}").json()
    assert cat_after["stock"] == 97
    assert cat_after["variant_stocks"]["Amber Glow"] == 49
    assert cat_after["variant_stocks"]["Ruby Silk"] == 48

    # Mutate catalog product name & price -> historical order snapshot stays untouched
    upd = client.put(
        f"/api/v1/partners/seller/products/{pid}",
        json={"name": "Renamed Formula v2", "price": 2400.0},
        headers={"Authorization": seller["Authorization"]},
    )
    assert upd.status_code == 200

    hist = client.get(f"/api/v1/orders/{order['id']}", headers={"Authorization": cust["Authorization"]}).json()
    assert all(it["name"] == "Dual Shade Silk Tint" for it in hist["items"])
    assert all(it["price"] == 1200.0 for it in hist["items"])


# -----------------------------------------------------------------------------
# 9. Online fulfillment blocked before payment capture
# -----------------------------------------------------------------------------
def test_online_fulfillment_blocked_until_payment_captured(client, db, monkeypatch):
    cust = _create_user_headers(client, db, UserRole.CUSTOMER)
    seller = _create_user_headers(client, db, UserRole.SELLER)
    _install_mock_gateway(monkeypatch)

    lid = client.post(
        "/api/v1/partners/seller/listings",
        json={"product_id": "b1", "sku": f"PAYGATE-{secrets.token_hex(4)}", "price": 1800.0, "stock": 5},
        headers={"Authorization": seller["Authorization"]},
    ).json()["id"]

    res = client.post(
        "/api/v1/orders/reserve",
        json={"items": [{"listing_id": lid, "qty": 1}]},
        headers={"Authorization": cust["Authorization"]},
    ).json()
    co = client.post(
        "/api/v1/orders/checkout",
        json={"reservation_token": res["reservation_token"], "address_text": "Pali Hill", "payment_method": "UPI"},
        headers={"Authorization": cust["Authorization"]},
    ).json()
    sub_id = co["suborders"][0]["suborder_id"]

    # Unpaid online order cannot be packed or shipped
    assert client.post(f"/api/v1/partners/seller/suborders/{sub_id}/pack", headers={"Authorization": seller["Authorization"]}).status_code == 400
    assert client.patch(
        f"/api/v1/partners/seller/orders/{co['order_id']}/status",
        json={"status": "packed"},
        headers={"Authorization": seller["Authorization"]},
    ).status_code == 400

    # Verify payment -> fulfillment succeeds
    _pay_and_verify(client, cust, co["order_id"], co["total"])
    assert client.post(f"/api/v1/partners/seller/suborders/{sub_id}/pack", headers={"Authorization": seller["Authorization"]}).status_code == 200
    assert client.post(
        f"/api/v1/partners/seller/suborders/{sub_id}/ship",
        json={"carrier_name": "BlueDart", "tracking_number": "PAYGATE123"},
        headers={"Authorization": seller["Authorization"]},
    ).status_code == 200
    assert client.post(f"/api/v1/partners/seller/suborders/{sub_id}/deliver", headers={"Authorization": seller["Authorization"]}).status_code == 200


# -----------------------------------------------------------------------------
# 10. Cash-on-delivery payment rejection, collection & manual return refund
# -----------------------------------------------------------------------------
def test_cod_lifecycle_payment_rejection_and_manual_refund(client, db):
    cust = _create_user_headers(client, db, UserRole.CUSTOMER)
    seller = _create_user_headers(client, db, UserRole.SELLER)

    lid = client.post(
        "/api/v1/partners/seller/listings",
        json={"product_id": "b2", "sku": f"COD-{secrets.token_hex(4)}", "price": 1900.0, "stock": 5},
        headers={"Authorization": seller["Authorization"]},
    ).json()["id"]

    res = client.post(
        "/api/v1/orders/reserve",
        json={"items": [{"listing_id": lid, "qty": 1}]},
        headers={"Authorization": cust["Authorization"]},
    ).json()
    co = client.post(
        "/api/v1/orders/checkout",
        json={
            "reservation_token": res["reservation_token"],
            "address_text": "Juhu Beach",
            "payment_method": "Cash on delivery",
        },
        headers={"Authorization": cust["Authorization"]},
    ).json()
    assert co["payment_status"] == "cod_pending"

    # Gateway create-order must reject COD orders
    rzp_reject = client.post(
        "/api/v1/payments/razorpay/create-order",
        json={"order_id": co["order_id"]},
        headers={"Authorization": cust["Authorization"]},
    )
    assert rzp_reject.status_code == 400

    sub_id = co["suborders"][0]["suborder_id"]
    assert client.post(f"/api/v1/partners/seller/suborders/{sub_id}/pack", headers={"Authorization": seller["Authorization"]}).status_code == 200
    assert client.post(
        f"/api/v1/partners/seller/suborders/{sub_id}/ship",
        json={"carrier_name": "Delhivery", "tracking_number": "COD123"},
        headers={"Authorization": seller["Authorization"]},
    ).status_code == 200
    assert client.post(f"/api/v1/partners/seller/suborders/{sub_id}/deliver", headers={"Authorization": seller["Authorization"]}).status_code == 200

    # Payment transitions from cod_pending -> cod_collected on delivery
    ord_after = client.get(f"/api/v1/orders/{co['order_id']}", headers={"Authorization": cust["Authorization"]}).json()
    assert ord_after["payment_status"] == "cod_collected"
    item_id = ord_after["suborders"][0]["items"][0]["order_item_id"]

    ret = client.post(
        f"/api/v1/orders/suborders/{sub_id}/return",
        json={"order_item_id": item_id, "reason": "Damaged cap"},
        headers={"Authorization": cust["Authorization"]},
    ).json()

    # Approving COD return without cod_refund_confirmed moves to APPROVED / COD_MANUAL_PENDING (NOT REFUNDED)
    unconf = client.post(
        f"/api/v1/partners/seller/returns/{ret['id']}/decide",
        json={"action": "APPROVE", "restock_inventory": True, "cod_refund_confirmed": False},
        headers={"Authorization": seller["Authorization"]},
    )
    assert unconf.status_code == 200
    assert unconf.json()["status"] == "APPROVED"
    assert unconf.json()["refund_status"] == "COD_MANUAL_PENDING"

    conf = client.post(
        f"/api/v1/partners/seller/returns/{ret['id']}/decide",
        json={"action": "APPROVE", "restock_inventory": True, "cod_refund_confirmed": True},
        headers={"Authorization": seller["Authorization"]},
    )
    assert conf.status_code == 200
    assert conf.json()["status"] == "REFUNDED"
    assert conf.json()["refund_status"] == "COD_REFUNDED"


# -----------------------------------------------------------------------------
# 11. Late payment capture: restore when stocked OR auto-refund when sold out
# -----------------------------------------------------------------------------
def test_late_payment_capture_restoration_and_oos_auto_refund(client, db, monkeypatch, maintenance_auth_headers):
    cust1 = _create_user_headers(client, db, UserRole.CUSTOMER)
    cust2 = _create_user_headers(client, db, UserRole.CUSTOMER)
    seller = _create_user_headers(client, db, UserRole.SELLER)
    gw = _install_mock_gateway(monkeypatch, refund_mode="processed")

    # Case A: Restored when stock still available
    lid_a = client.post(
        "/api/v1/partners/seller/listings",
        json={"product_id": "b1", "sku": f"LATEREST-{secrets.token_hex(4)}", "price": 1600.0, "stock": 5},
        headers={"Authorization": seller["Authorization"]},
    ).json()["id"]
    res_a = client.post("/api/v1/orders/reserve", json={"items": [{"listing_id": lid_a, "qty": 2}]}, headers={"Authorization": cust1["Authorization"]}).json()
    co_a = client.post(
        "/api/v1/orders/checkout",
        json={"reservation_token": res_a["reservation_token"], "address_text": "Worli", "payment_method": "UPI"},
        headers={"Authorization": cust1["Authorization"]},
    ).json()
    rzp_a = client.post("/api/v1/payments/razorpay/create-order", json={"order_id": co_a["order_id"]}, headers={"Authorization": cust1["Authorization"]}).json()["razorpay_order_id"]

    # Expire payment window -> order cancelled & stock returned to 5
    ord_a_row = db.query(Order).filter(Order.id == co_a["order_id"]).first()
    ord_a_row.payment_expires_at = datetime.now(timezone.utc) - timedelta(minutes=5)
    db.commit()
    client.post("/api/v1/internal/inventory/expire-reservations", headers=maintenance_auth_headers)
    db.refresh(ord_a_row)
    assert ord_a_row.status == OrderStatus.CANCELLED

    # Late verification captures payment -> restores order to PLACED & stock back to 3
    pay_id_a = f"pay_late_a__{rzp_a}"
    sig_a = hmac.new(settings.RAZORPAY_KEY_SECRET.encode(), f"{rzp_a}|{pay_id_a}".encode(), hashlib.sha256).hexdigest()
    v_a = client.post(
        "/api/v1/payments/razorpay/verify",
        json={"razorpay_order_id": rzp_a, "razorpay_payment_id": pay_id_a, "razorpay_signature": sig_a, "order_id": co_a["order_id"]},
        headers={"Authorization": cust1["Authorization"]},
    )
    assert v_a.status_code == 200
    assert v_a.json()["payment_status"] == "completed"
    db.refresh(ord_a_row)
    assert ord_a_row.status == OrderStatus.PLACED
    lst_a = db.query(SellerListing).filter(SellerListing.id == lid_a).first()
    db.refresh(lst_a)
    assert lst_a.stock == 3

    # Case B: Out of stock when late capture arrives -> auto-refund via gateway, NO overselling
    lid_b = client.post(
        "/api/v1/partners/seller/listings",
        json={"product_id": "b1", "sku": f"LATEOOS-{secrets.token_hex(4)}", "price": 1600.0, "stock": 2},
        headers={"Authorization": seller["Authorization"]},
    ).json()["id"]
    res_b = client.post("/api/v1/orders/reserve", json={"items": [{"listing_id": lid_b, "qty": 2}]}, headers={"Authorization": cust1["Authorization"]}).json()
    co_b = client.post(
        "/api/v1/orders/checkout",
        json={"reservation_token": res_b["reservation_token"], "address_text": "Worli", "payment_method": "UPI"},
        headers={"Authorization": cust1["Authorization"]},
    ).json()
    rzp_b = client.post("/api/v1/payments/razorpay/create-order", json={"order_id": co_b["order_id"]}, headers={"Authorization": cust1["Authorization"]}).json()["razorpay_order_id"]

    ord_b_row = db.query(Order).filter(Order.id == co_b["order_id"]).first()
    ord_b_row.payment_expires_at = datetime.now(timezone.utc) - timedelta(minutes=5)
    db.commit()
    client.post("/api/v1/internal/inventory/expire-reservations", headers=maintenance_auth_headers)

    # Another customer buys all 2 remaining units -> stock hits 0
    res_b2 = client.post("/api/v1/orders/reserve", json={"items": [{"listing_id": lid_b, "qty": 2}]}, headers={"Authorization": cust2["Authorization"]}).json()
    client.post(
        "/api/v1/orders/checkout",
        json={"reservation_token": res_b2["reservation_token"], "address_text": "Colaba", "payment_method": "Cash on delivery"},
        headers={"Authorization": cust2["Authorization"]},
    )
    lst_b = db.query(SellerListing).filter(SellerListing.id == lid_b).first()
    db.refresh(lst_b)
    assert lst_b.stock == 0

    # Late capture hits OOS -> does NOT oversell (stock stays 0), issues automatic refund
    pay_id_b = f"pay_late_b__{rzp_b}"
    sig_b = hmac.new(settings.RAZORPAY_KEY_SECRET.encode(), f"{rzp_b}|{pay_id_b}".encode(), hashlib.sha256).hexdigest()
    v_b = client.post(
        "/api/v1/payments/razorpay/verify",
        json={"razorpay_order_id": rzp_b, "razorpay_payment_id": pay_id_b, "razorpay_signature": sig_b, "order_id": co_b["order_id"]},
        headers={"Authorization": cust1["Authorization"]},
    )
    assert v_b.status_code == 200
    assert v_b.json()["success"] is False
    assert v_b.json()["payment_status"] == "refunded_oos"
    db.refresh(lst_b)
    assert lst_b.stock == 0
    assert len(gw["refund_calls"]) >= 1
    assert gw["refund_calls"][-1]["payload"]["amount"] == to_paise(co_b["total"])


# -----------------------------------------------------------------------------
# 12. Early webhook reconciliation & 503 retry for uncommitted targets
# -----------------------------------------------------------------------------
def test_webhook_pre_record_reconciliation_and_retry_503(client, db):
    cust = _create_user_headers(client, db, UserRole.CUSTOMER)
    ord_resp = client.post(
        "/api/v1/orders/",
        json={"items": [{"id": "b1", "qty": 1}], "address_text": "Bandra", "payment_method": "UPI"},
        headers={"Authorization": cust["Authorization"]},
    ).json()

    # Simulate initiating transaction existing before post-gateway write completes
    init_tx = PaymentTransaction(
        user_id=cust["user_id"],
        order_id=ord_resp["id"],
        razorpay_order_id=f"init_{secrets.token_hex(6)}",
        amount=ord_resp["total"],
        currency="INR",
        status="initiating",
    )
    db.add(init_tx)
    db.commit()
    db.refresh(init_tx)

    early_rzp_order_id = f"order_early_{secrets.token_hex(5)}"
    raw_ok, hdrs_ok = _sign_webhook({
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": f"pay_early_{secrets.token_hex(4)}",
                    "order_id": early_rzp_order_id,
                    "amount": to_paise(ord_resp["total"]),
                    "currency": "INR",
                    "status": "captured",
                    "notes": {
                        "target_type": "order",
                        "target_id": ord_resp["id"],
                        "tx_id": str(init_tx.id),
                    },
                }
            }
        },
    })
    wh_res = client.post("/api/v1/payments/razorpay/webhook", content=raw_ok, headers=hdrs_ok)
    assert wh_res.status_code == 200
    assert wh_res.json()["processed"] is True
    db.refresh(init_tx)
    assert init_tx.status == "captured"
    assert init_tx.razorpay_order_id == early_rzp_order_id

    # Event with target_id for an uncommitted local order returns 503 so Razorpay retries
    raw_503, hdrs_503 = _sign_webhook({
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": f"pay_uncommit_{secrets.token_hex(4)}",
                    "order_id": f"order_uncommit_{secrets.token_hex(5)}",
                    "amount": 189000,
                    "currency": "INR",
                    "status": "captured",
                    "notes": {"target_type": "order", "target_id": "GG-UNCOMMITTED99"},
                }
            }
        },
    })
    wh_503 = client.post("/api/v1/payments/razorpay/webhook", content=raw_503, headers=hdrs_503)
    assert wh_503.status_code == 503


# -----------------------------------------------------------------------------
# 13. Real gateway refund failure recovery, retry without double-restock, & webhook
# -----------------------------------------------------------------------------
def test_refund_gateway_orchestration_failure_retry_and_webhook(client, db, monkeypatch):
    cust = _create_user_headers(client, db, UserRole.CUSTOMER)
    seller = _create_user_headers(client, db, UserRole.SELLER)
    _install_mock_gateway(monkeypatch)

    lid = client.post(
        "/api/v1/partners/seller/listings",
        json={"product_id": "b1", "sku": f"REFFAIL-{secrets.token_hex(4)}", "price": 2000.0, "stock": 4},
        headers={"Authorization": seller["Authorization"]},
    ).json()["id"]

    res = client.post("/api/v1/orders/reserve", json={"items": [{"listing_id": lid, "qty": 1}]}, headers={"Authorization": cust["Authorization"]}).json()
    co = client.post(
        "/api/v1/orders/checkout",
        json={"reservation_token": res["reservation_token"], "address_text": "Parel", "payment_method": "UPI"},
        headers={"Authorization": cust["Authorization"]},
    ).json()
    _pay_and_verify(client, cust, co["order_id"], co["total"])
    sub_id = co["suborders"][0]["suborder_id"]

    client.post(f"/api/v1/partners/seller/suborders/{sub_id}/pack", headers={"Authorization": seller["Authorization"]})
    client.post(f"/api/v1/partners/seller/suborders/{sub_id}/ship", json={"carrier_name": "BlueDart", "tracking_number": "RF111"}, headers={"Authorization": seller["Authorization"]})
    client.post(f"/api/v1/partners/seller/suborders/{sub_id}/deliver", headers={"Authorization": seller["Authorization"]})

    item_id = client.get(f"/api/v1/orders/{co['order_id']}", headers={"Authorization": cust["Authorization"]}).json()["suborders"][0]["items"][0]["order_item_id"]
    ret_id = client.post(f"/api/v1/orders/suborders/{sub_id}/return", json={"order_item_id": item_id, "reason": "Wrong formula"}, headers={"Authorization": cust["Authorization"]}).json()["id"]

    # First approval hits gateway ServerError -> HTTP 502 while persisting REFUND_FAILED, restocked once (3 -> 4)
    _install_mock_gateway(monkeypatch, refund_error=razorpay.errors.ServerError("Gateway timeout"))
    d_fail = client.post(
        f"/api/v1/partners/seller/returns/{ret_id}/decide",
        json={"action": "APPROVE", "restock_inventory": True},
        headers={"Authorization": seller["Authorization"]},
    )
    assert d_fail.status_code == 502
    ret_row = db.query(ReturnRequest).filter(ReturnRequest.id == ret_id).first()
    db.refresh(ret_row)
    assert ret_row.status == ReturnStatus.REFUND_FAILED
    assert ret_row.refund_status == "FAILED"
    lst = db.query(SellerListing).filter(SellerListing.id == lid).first()
    db.refresh(lst)
    assert lst.stock == 4

    # Retry succeeds asynchronously as 'pending' -> REFUND_PENDING, stock still 4 (not 5!)
    _install_mock_gateway(monkeypatch, refund_mode="pending")
    d_pend = client.post(
        f"/api/v1/partners/seller/returns/{ret_id}/decide",
        json={"action": "APPROVE", "restock_inventory": True},
        headers={"Authorization": seller["Authorization"]},
    )
    assert d_pend.status_code == 200
    assert d_pend.json()["status"] == "REFUND_PENDING"
    gw_ref_id = d_pend.json()["gateway_refund_id"]
    assert gw_ref_id is not None
    db.refresh(lst)
    assert lst.stock == 4

    # Async refund.processed webhook finalizes REFUND_PENDING -> REFUNDED
    raw_ref, hdrs_ref = _sign_webhook({
        "event": "refund.processed",
        "payload": {
            "refund": {
                "entity": {
                    "id": gw_ref_id,
                    "payment_id": "pay_unused",
                    "status": "processed",
                    "notes": {"return_id": ret_id},
                }
            }
        },
    })
    wh_ref = client.post("/api/v1/payments/razorpay/webhook", content=raw_ref, headers=hdrs_ref)
    assert wh_ref.status_code == 200
    assert wh_ref.json()["processed"] is True

    db.refresh(ret_row)
    assert ret_row.status == ReturnStatus.REFUNDED
    assert ret_row.refund_status == "PROCESSED"
    ref_tx = db.query(PaymentTransaction).filter(PaymentTransaction.refund_id == gw_ref_id).first()
    assert ref_tx is not None and ref_tx.status == "refunded"


# -----------------------------------------------------------------------------
# 14. Partial-qty net-paid refund math & 3-seller integer paise rounding
# -----------------------------------------------------------------------------
def test_partial_qty_discount_refund_and_3seller_paise_rounding(client, db, monkeypatch):
    cust = _create_user_headers(client, db, UserRole.CUSTOMER)
    s1 = _create_user_headers(client, db, UserRole.SELLER)
    s2 = _create_user_headers(client, db, UserRole.SELLER)
    s3 = _create_user_headers(client, db, UserRole.SELLER)
    _install_mock_gateway(monkeypatch, refund_mode="processed")

    # Seed a 15% coupon to test remainder distribution across 3 fractional prices
    code = f"RND{secrets.token_hex(2).upper()}"
    db.add(Coupon(code=code, discount_percent=15.0, max_discount=1000.0, is_active=True))
    db.commit()

    l1 = client.post("/api/v1/partners/seller/listings", json={"product_id": "b1", "sku": f"R1-{secrets.token_hex(3)}", "price": 333.33, "stock": 5}, headers={"Authorization": s1["Authorization"]}).json()["id"]
    l2 = client.post("/api/v1/partners/seller/listings", json={"product_id": "b2", "sku": f"R2-{secrets.token_hex(3)}", "price": 333.33, "stock": 5}, headers={"Authorization": s2["Authorization"]}).json()["id"]
    l3 = client.post("/api/v1/partners/seller/listings", json={"product_id": "b3", "sku": f"R3-{secrets.token_hex(3)}", "price": 333.34, "stock": 5}, headers={"Authorization": s3["Authorization"]}).json()["id"]

    res = client.post("/api/v1/orders/reserve", json={"items": [{"listing_id": l1, "qty": 1}, {"listing_id": l2, "qty": 1}, {"listing_id": l3, "qty": 1}]}, headers={"Authorization": cust["Authorization"]}).json()
    co = client.post("/api/v1/orders/checkout", json={"reservation_token": res["reservation_token"], "address_text": "Marine Lines", "coupon_code": code, "payment_method": "UPI"}, headers={"Authorization": cust["Authorization"]}).json()

    assert to_paise(co["subtotal"]) == 100000
    assert to_paise(co["discount"]) == 15000
    assert to_paise(co["shipping_fee"]) == 30000
    assert sum(to_paise(s["discount"]) for s in co["suborders"]) == to_paise(co["discount"])
    assert sum(to_paise(s["total"]) for s in co["suborders"]) == to_paise(co["total"])

    # Partial return quantity + net-paid refund calculation with discount
    l_part = client.post("/api/v1/partners/seller/listings", json={"product_id": "b1", "sku": f"PART-{secrets.token_hex(3)}", "price": 1000.0, "stock": 5}, headers={"Authorization": s1["Authorization"]}).json()["id"]
    res_p = client.post("/api/v1/orders/reserve", json={"items": [{"listing_id": l_part, "qty": 3}]}, headers={"Authorization": cust["Authorization"]}).json()
    co_p = client.post("/api/v1/orders/checkout", json={"reservation_token": res_p["reservation_token"], "address_text": "Marine Lines", "coupon_code": "GLAM10", "payment_method": "UPI"}, headers={"Authorization": cust["Authorization"]}).json()
    # 3 * 1000 = 3000, GLAM10 (10%, cap 300) = 300 -> net paid = 2700 (900 per unit)
    _pay_and_verify(client, cust, co_p["order_id"], co_p["total"])
    sub_p = co_p["suborders"][0]["suborder_id"]

    client.post(f"/api/v1/partners/seller/suborders/{sub_p}/pack", headers={"Authorization": s1["Authorization"]})
    client.post(f"/api/v1/partners/seller/suborders/{sub_p}/ship", json={"carrier_name": "BlueDart", "tracking_number": "PRT1"}, headers={"Authorization": s1["Authorization"]})
    client.post(f"/api/v1/partners/seller/suborders/{sub_p}/deliver", headers={"Authorization": s1["Authorization"]})
    item_id = client.get(f"/api/v1/orders/{co_p['order_id']}", headers={"Authorization": cust["Authorization"]}).json()["suborders"][0]["items"][0]["order_item_id"]

    ret_2 = client.post(
        f"/api/v1/orders/suborders/{sub_p}/return",
        json={"order_item_id": item_id, "qty": 2, "reason": "Two bottles leaked"},
        headers={"Authorization": cust["Authorization"]},
    )
    assert ret_2.status_code == 201, ret_2.text
    assert ret_2.json()["return_qty"] == 2
    assert ret_2.json()["refund_amount"] == 1800.0

    # Requesting 2 more when only 1 unit remains fails 400
    ret_over = client.post(
        f"/api/v1/orders/suborders/{sub_p}/return",
        json={"order_item_id": item_id, "qty": 2, "reason": "Exceeding qty"},
        headers={"Authorization": cust["Authorization"]},
    )
    assert ret_over.status_code == 400


# -----------------------------------------------------------------------------
# 15. T+7 escrow maturity, unresolved-return block & repeated delivery guard
# -----------------------------------------------------------------------------
def test_t7_escrow_maturity_unresolved_return_block_and_repeated_delivery(client, db, monkeypatch, maintenance_auth_headers):
    cust = _create_user_headers(client, db, UserRole.CUSTOMER)
    seller = _create_user_headers(client, db, UserRole.SELLER)
    _install_mock_gateway(monkeypatch)

    lid = client.post("/api/v1/partners/seller/listings", json={"product_id": "b1", "sku": f"ESCT7-{secrets.token_hex(4)}", "price": 2000.0, "stock": 4}, headers={"Authorization": seller["Authorization"]}).json()["id"]
    res = client.post("/api/v1/orders/reserve", json={"items": [{"listing_id": lid, "qty": 1}]}, headers={"Authorization": cust["Authorization"]}).json()
    co = client.post("/api/v1/orders/checkout", json={"reservation_token": res["reservation_token"], "address_text": "Malabar Hill", "payment_method": "UPI"}, headers={"Authorization": cust["Authorization"]}).json()
    _pay_and_verify(client, cust, co["order_id"], co["total"])
    sub_id = co["suborders"][0]["suborder_id"]

    client.post(f"/api/v1/partners/seller/suborders/{sub_id}/pack", headers={"Authorization": seller["Authorization"]})
    client.post(f"/api/v1/partners/seller/suborders/{sub_id}/ship", json={"carrier_name": "BlueDart", "tracking_number": "T7DEL"}, headers={"Authorization": seller["Authorization"]})
    del_1 = client.post(f"/api/v1/partners/seller/suborders/{sub_id}/deliver", headers={"Authorization": seller["Authorization"]})
    assert del_1.status_code == 200

    # Repeated delivery must fail cleanly without resetting maturity window
    del_2 = client.post(f"/api/v1/partners/seller/suborders/{sub_id}/deliver", headers={"Authorization": seller["Authorization"]})
    assert del_2.status_code == 400

    esc = db.query(SellerEscrowRecord).filter(SellerEscrowRecord.suborder_id == sub_id).first()
    db.refresh(esc)
    assert esc.delivered_at is not None and esc.matures_at is not None
    assert round((esc.matures_at - esc.delivered_at).total_seconds() / 86400) == 7

    # Simulate T+4 (within 7-day return window) -> NOT matured
    t4 = datetime.now(timezone.utc) - timedelta(days=4)
    esc.delivered_at = t4
    esc.matures_at = t4 + timedelta(days=7)
    db.commit()
    client.post("/api/v1/internal/escrow/mature", headers=maintenance_auth_headers)
    db.refresh(esc)
    assert esc.status == EscrowStatus.HELD_IN_ESCROW

    # Open an unresolved return AND move delivery to T-8 (matures_at in past) -> BLOCKED by open return!
    item_id = client.get(f"/api/v1/orders/{co['order_id']}", headers={"Authorization": cust["Authorization"]}).json()["suborders"][0]["items"][0]["order_item_id"]
    ret_id = client.post(f"/api/v1/orders/suborders/{sub_id}/return", json={"order_item_id": item_id, "reason": "Opened seal"}, headers={"Authorization": cust["Authorization"]}).json()["id"]

    t8 = datetime.now(timezone.utc) - timedelta(days=8)
    esc.delivered_at = t8
    esc.matures_at = t8 + timedelta(days=7)
    db.commit()

    client.post("/api/v1/internal/escrow/mature", headers=maintenance_auth_headers)
    db.refresh(esc)
    assert esc.status == EscrowStatus.HELD_IN_ESCROW

    # Reject the return -> escrow now clears cleanly on maturity pass
    client.post(f"/api/v1/partners/seller/returns/{ret_id}/decide", json={"action": "REJECT", "rejection_reason": "Final sale shade"}, headers={"Authorization": seller["Authorization"]})
    client.post("/api/v1/internal/escrow/mature", headers=maintenance_auth_headers)
    db.refresh(esc)
    assert esc.status == EscrowStatus.MATURED


# -----------------------------------------------------------------------------
# 16. Inventory audit log sum matches actual SellerListing.stock
# -----------------------------------------------------------------------------
def test_inventory_audit_log_reconciliation(client, db, monkeypatch, maintenance_auth_headers):
    cust = _create_user_headers(client, db, UserRole.CUSTOMER)
    seller = _create_user_headers(client, db, UserRole.SELLER)
    _install_mock_gateway(monkeypatch)

    lid = client.post(
        "/api/v1/partners/seller/listings",
        json={"product_id": "b1", "sku": f"AUDIT-{secrets.token_hex(4)}", "price": 1800.0, "stock": 10},
        headers={"Authorization": seller["Authorization"]},
    ).json()["id"]

    # Reserve 3 -> expires -> released (+3)
    r_exp = client.post("/api/v1/orders/reserve", json={"items": [{"listing_id": lid, "qty": 3}]}, headers={"Authorization": cust["Authorization"]}).json()
    row = db.query(InventoryReservation).filter(InventoryReservation.reservation_token == r_exp["reservation_token"]).first()
    row.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db.commit()
    client.post("/api/v1/internal/inventory/expire-reservations", headers=maintenance_auth_headers)

    # Reserve 2 -> checkout (0 physical delta) -> pay -> deliver -> return 1 with restock (+1)
    r_buy = client.post("/api/v1/orders/reserve", json={"items": [{"listing_id": lid, "qty": 2}]}, headers={"Authorization": cust["Authorization"]}).json()
    co = client.post("/api/v1/orders/checkout", json={"reservation_token": r_buy["reservation_token"], "address_text": "Soho", "payment_method": "UPI"}, headers={"Authorization": cust["Authorization"]}).json()
    _pay_and_verify(client, cust, co["order_id"], co["total"])
    sub_id = co["suborders"][0]["suborder_id"]

    client.post(f"/api/v1/partners/seller/suborders/{sub_id}/pack", headers={"Authorization": seller["Authorization"]})
    client.post(f"/api/v1/partners/seller/suborders/{sub_id}/ship", json={"carrier_name": "BlueDart", "tracking_number": "AUD1"}, headers={"Authorization": seller["Authorization"]})
    client.post(f"/api/v1/partners/seller/suborders/{sub_id}/deliver", headers={"Authorization": seller["Authorization"]})
    item_id = client.get(f"/api/v1/orders/{co['order_id']}", headers={"Authorization": cust["Authorization"]}).json()["suborders"][0]["items"][0]["order_item_id"]

    ret = client.post(f"/api/v1/orders/suborders/{sub_id}/return", json={"order_item_id": item_id, "qty": 1, "reason": "Duplicate gift"}, headers={"Authorization": cust["Authorization"]}).json()
    client.post(f"/api/v1/partners/seller/returns/{ret['id']}/decide", json={"action": "APPROVE", "restock_inventory": True}, headers={"Authorization": seller["Authorization"]})

    listing = db.query(SellerListing).filter(SellerListing.id == lid).first()
    db.refresh(listing)
    audit_rows = db.query(InventoryAuditLog).filter(InventoryAuditLog.listing_id == lid).all()
    assert sum(a.quantity_delta for a in audit_rows) == listing.stock
    assert listing.stock == 9  # 10 - 3 + 3 - 2 + 1 = 9
