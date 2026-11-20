"""
Comprehensive regression & concurrency test suite covering the four independent
code-review commerce findings, maintenance dry-run/recovery, and readiness policy:

  1. Canonical listing backfill without stock duplication, ambiguity handling,
     multi-seller isolation, reservation deferral, crash-restart, and idempotency.
  2. Refund initiation safety after lost responses, provider X-Refund-Idempotency
     header & payload consistency, reconciliation before retry, concurrent approval
     blocking, SessionLocal DB-failure recovery, distinct partial refunds, and
     cumulative refund caps.
  3. Exactly-once refund accounting under controlled multi-session Postgres
     interleaving (webhook vs sync HTTP response, concurrent webhooks, duplicate
     webhooks, delayed non-final callbacks after PROCESSED, worker re-runs, and
     strict provider payload validation).
  4. Payment verification on cancelled OOS orders and durable OOS refund recovery
     (pending, failed, unknown, completed, operator escalation, repeated capture
     webhooks, concurrent verify + webhook, independent of ReturnRequest).
  5. Maintenance --dry-run zero-write guarantee, CLI exit codes (0/2/1),
     authenticated internal refund recovery endpoint, and /health/ready policy.
"""

from datetime import datetime, timezone, timedelta
import hashlib
import hmac
import json
import os
import secrets
import subprocess
import sys
import threading
from types import SimpleNamespace

import pytest
import razorpay.errors
import requests
from fastapi.testclient import TestClient
from sqlalchemy import event
from sqlalchemy.exc import OperationalError

from backend.app.core.config import settings
from backend.app.core.database import SessionLocal, engine, get_db
from backend.app.core import redis_client as redis_client_mod
from backend.app.main import app
from backend.app.models.catalog import Product, ProductVariant
from backend.app.models.commerce import (
    SellerListing,
    InventoryReservation,
    ReservationStatus,
    SubOrder,
    SubOrderStatus,
    ReturnRequest,
    ReturnStatus,
    InventoryAuditLog,
    StockAction,
    SellerEscrowRecord,
    EscrowStatus,
    RefundRecord,
    RefundAccountingEntry,
)
from backend.app.models.order import Order, OrderItem, OrderStatus
from backend.app.models.payment import PaymentTransaction
from backend.app.models.user import User, UserRole, Notification
from backend.app.schemas.commerce import ReturnDecisionRequest
from backend.app.services.commerce_service import CommerceService, to_paise
from backend.app.services.inventory_backfill import run_inventory_backfill
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


def _create_user(client: TestClient, db, role: UserRole) -> dict:
    suffix = secrets.token_hex(5)
    email = f"rem_{role.value}_{suffix}@example.com"
    pwd = "Password@123"
    reg = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": pwd,
        "name": f"Rem {role.value.title()} {suffix}",
        "phone": "9876543210",
    })
    assert reg.status_code in (200, 201), reg.text
    user = db.query(User).filter(User.email == email).first()
    if role != UserRole.CUSTOMER:
        user.role = role
        db.commit()
    login = client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}", "user_id": user.id, "email": email, "name": user.full_name}


def _sign_webhook(payload: dict) -> tuple[bytes, dict]:
    raw = json.dumps(payload).encode("utf-8")
    sig = hmac.new(settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"), raw, hashlib.sha256).hexdigest()
    return raw, {"X-Razorpay-Signature": sig, "Content-Type": "application/json"}


def _create_paid_delivered_order(
    client: TestClient,
    db,
    cust: dict,
    seller: dict,
    monkeypatch,
    *,
    unit_price: float = 1000.0,
    qty: int = 1,
    with_variants: bool = False,
) -> dict:
    sku = f"REMSKU-{secrets.token_hex(4)}"
    if with_variants:
        l_res = client.post(
            "/api/v1/partners/seller/listings",
            json={"product_id": "b1", "variant_name": "30 ml", "sku": sku, "price": unit_price, "stock": 10},
            headers={"Authorization": seller["Authorization"]},
        )
    else:
        l_res = client.post(
            "/api/v1/partners/seller/listings",
            json={"product_id": "b1", "sku": sku, "price": unit_price, "stock": 10},
            headers={"Authorization": seller["Authorization"]},
        )
    assert l_res.status_code == 201, l_res.text
    lid = l_res.json()["id"]

    res = client.post(
        "/api/v1/orders/reserve",
        json={"items": [{"listing_id": lid, "qty": qty}]},
        headers={"Authorization": cust["Authorization"]},
    ).json()
    co = client.post(
        "/api/v1/orders/checkout",
        json={"reservation_token": res["reservation_token"], "address_text": "10 Carmichael Road", "payment_method": "UPI"},
        headers={"Authorization": cust["Authorization"]},
    ).json()

    orders_store = {}

    def create_order(payload):
        oid = f"order_rem_{secrets.token_hex(5)}"
        orders_store[oid] = payload
        return {"id": oid, "amount": payload["amount"], "currency": "INR"}

    def fetch_payment(pid):
        oid = pid.split("__")[-1]
        return {
            "id": pid,
            "order_id": oid,
            "amount": orders_store[oid]["amount"],
            "currency": "INR",
            "status": "captured",
            "captured": True,
        }

    mock_pay_client = SimpleNamespace(
        order=SimpleNamespace(create=create_order),
        payment=SimpleNamespace(fetch=fetch_payment),
    )
    monkeypatch.setattr("backend.app.api.v1.payments.get_razorpay_client", lambda: mock_pay_client)

    rzp_oid = client.post(
        "/api/v1/payments/razorpay/create-order",
        json={"order_id": co["order_id"]},
        headers={"Authorization": cust["Authorization"]},
    ).json()["razorpay_order_id"]
    pay_id = f"pay_rem_{secrets.token_hex(4)}__{rzp_oid}"
    sig = hmac.new(settings.RAZORPAY_KEY_SECRET.encode(), f"{rzp_oid}|{pay_id}".encode(), hashlib.sha256).hexdigest()
    v = client.post(
        "/api/v1/payments/razorpay/verify",
        json={"razorpay_order_id": rzp_oid, "razorpay_payment_id": pay_id, "razorpay_signature": sig, "order_id": co["order_id"]},
        headers={"Authorization": cust["Authorization"]},
    )
    assert v.status_code == 200 and v.json()["payment_status"] == "completed", v.text

    sub_id = co["suborders"][0]["suborder_id"]
    assert client.post(f"/api/v1/partners/seller/suborders/{sub_id}/pack", headers={"Authorization": seller["Authorization"]}).status_code == 200
    assert client.post(
        f"/api/v1/partners/seller/suborders/{sub_id}/ship",
        json={"carrier_name": "BlueDart", "tracking_number": f"REM{secrets.token_hex(3)}"},
        headers={"Authorization": seller["Authorization"]},
    ).status_code == 200
    assert client.post(f"/api/v1/partners/seller/suborders/{sub_id}/deliver", headers={"Authorization": seller["Authorization"]}).status_code == 200

    order_detail = client.get(f"/api/v1/orders/{co['order_id']}", headers={"Authorization": cust["Authorization"]}).json()
    item_id = order_detail["suborders"][0]["items"][0]["order_item_id"]
    escrow = db.query(SellerEscrowRecord).filter(SellerEscrowRecord.suborder_id == sub_id).first()
    db.refresh(escrow)
    return {
        "order_id": co["order_id"],
        "suborder_id": sub_id,
        "item_id": item_id,
        "listing_id": lid,
        "payment_id": pay_id,
        "razorpay_order_id": rzp_oid,
        "total": float(co["total"]),
        "total_paise": to_paise(co["total"]),
        "initial_net": float(escrow.net_settlement),
    }


# =============================================================================
# 1. Canonical Listing Backfill & Inventory Preservation
# =============================================================================

def test_canonical_backfill_preserves_stock_multiseller_history_reservations_and_interruptions(client, db):
    seller_a = _create_user(client, db, UserRole.SELLER)
    seller_b = _create_user(client, db, UserRole.SELLER)
    cust = _create_user(client, db, UserRole.CUSTOMER)

    # Product 1 (exact repro + multi-seller + historical order snapshot):
    # Owner Seller A has 1 active unscoped legacy listing (stock=10) + 2 variants (5 each).
    # Independent Seller B has their own active variant listing ('30 ml', stock=7).
    # Historical OrderItem points to Seller A's legacy listing ID.
    p1 = f"rem_b_exact_{secrets.token_hex(3)}"
    prod1 = Product(
        id=p1, seller_id=seller_a["user_id"], brand="Atelier", name="Exact Backfill Elixir",
        category="Skincare", price=1000.0, img="./assets/serum.webp",
        description="Exact stock split test", stock=10, is_active=True,
    )
    db.add(prod1)
    db.flush()
    db.add_all([
        ProductVariant(product_id=p1, name="30 ml", stock=5),
        ProductVariant(product_id=p1, name="50 ml", stock=5),
    ])
    leg1 = SellerListing(
        product_id=p1, seller_id=seller_a["user_id"], variant_name="",
        sku=f"LEG1-{secrets.token_hex(3)}", price=1000.0, stock=10, is_active=True,
    )
    indep_b = SellerListing(
        product_id=p1, seller_id=seller_b["user_id"], variant_name="30 ml",
        sku=f"INDB-{secrets.token_hex(3)}", price=1050.0, stock=7, is_active=True,
    )
    db.add_all([leg1, indep_b])
    db.flush()
    hist_ord = Order(
        id=f"GGHIST{secrets.token_hex(3).upper()}", customer_id=cust["user_id"], date="2026-10-01",
        subtotal=1000.0, total=1000.0, status=OrderStatus.DELIVERED, payment_method="UPI",
        payment_status="completed", address_text="Historic St",
    )
    db.add(hist_ord)
    db.flush()
    hist_item = OrderItem(
        order_id=hist_ord.id, product_id=p1, seller_listing_id=leg1.id, seller_id=seller_a["user_id"],
        seller_name=seller_a["name"], sku=leg1.sku, variant_name="", name=prod1.name, qty=1, price=1000.0,
    )
    db.add(hist_item)

    # Product 2: Legacy listing with active PENDING reservation -> must defer safely
    p2 = f"rem_b_res_{secrets.token_hex(3)}"
    prod2 = Product(
        id=p2, seller_id=seller_a["user_id"], brand="Atelier", name="Reserved Lotion",
        category="Skincare", price=900.0, img="./assets/serum.webp",
        description="Reserved hold test", stock=8, is_active=True,
    )
    db.add(prod2)
    db.flush()
    db.add_all([
        ProductVariant(product_id=p2, name="Small", stock=4),
        ProductVariant(product_id=p2, name="Large", stock=4),
    ])
    leg2 = SellerListing(
        product_id=p2, seller_id=seller_a["user_id"], variant_name="",
        sku=f"LEG2-{secrets.token_hex(3)}", price=900.0, stock=6, is_active=True,
    )
    db.add(leg2)
    db.flush()
    res_token_2 = f"res_bf_{secrets.token_hex(6)}"
    db.add(InventoryReservation(
        reservation_token=res_token_2, listing_id=leg2.id, user_id=cust["user_id"],
        variant_name="Small", quoted_unit_price=900.0, qty=2,
        status=ReservationStatus.PENDING, expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
    ))

    # Product 3: Ambiguous legacy allocation (legacy=10, variants=7+7=14) -> report discrepancy, never guess
    p3 = f"rem_b_amb_{secrets.token_hex(3)}"
    prod3 = Product(
        id=p3, seller_id=seller_a["user_id"], brand="Atelier", name="Ambiguous Mist",
        category="Skincare", price=1200.0, img="./assets/serum.webp",
        description="Ambiguous mismatch", stock=10, is_active=True,
    )
    db.add(prod3)
    db.flush()
    db.add_all([
        ProductVariant(product_id=p3, name="V1", stock=7),
        ProductVariant(product_id=p3, name="V2", stock=7),
    ])
    leg3 = SellerListing(
        product_id=p3, seller_id=seller_a["user_id"], variant_name="",
        sku=f"LEG3-{secrets.token_hex(3)}", price=1200.0, stock=10, is_active=True,
    )
    db.add(leg3)

    # Product 4: Missing seller_id with zero listings -> must never assign to unrelated seller
    p4 = f"rem_b_nosel_{secrets.token_hex(3)}"
    prod4 = Product(
        id=p4, seller_id=None, brand="Atelier", name="Orphan Product",
        category="Skincare", price=800.0, img="./assets/serum.webp",
        description="Missing seller", stock=5, is_active=True,
    )
    db.add(prod4)

    # Product 5: Clean second migratable legacy product (to test interrupted run + restart)
    p5 = f"rem_b_p5_{secrets.token_hex(3)}"
    prod5 = Product(
        id=p5, seller_id=seller_a["user_id"], brand="Atelier", name="Restart Test Balm",
        category="Skincare", price=700.0, img="./assets/serum.webp",
        description="Restartability check", stock=12, is_active=True,
    )
    db.add(prod5)
    db.flush()
    db.add_all([
        ProductVariant(product_id=p5, name="Warm", stock=5),
        ProductVariant(product_id=p5, name="Cool", stock=7),
    ])
    leg5 = SellerListing(
        product_id=p5, seller_id=seller_a["user_id"], variant_name="",
        sku=f"LEG5-{secrets.token_hex(3)}", price=700.0, stock=12, is_active=True,
    )
    db.add(leg5)
    db.commit()

    # A) Verify --dry-run executes ZERO DML writes and accurately projects p1 (17 -> 17) and discrepancies
    dml_writes = []

    def _track_writes(conn, cursor, statement, parameters, context, executemany):
        op = statement.lstrip().split(" ", 1)[0].upper()
        if op in ("INSERT", "UPDATE", "DELETE"):
            dml_writes.append(statement[:80])

    event.listen(engine, "before_cursor_execute", _track_writes)
    try:
        dry_p1 = run_inventory_backfill(SessionLocal, dry_run=True, product_id=p1)
        assert dry_p1["before_totals"]["active_listing_stock"] == 17  # 10 (A) + 7 (B)
        assert dry_p1["after_totals"]["active_listing_stock"] == 17   # NOT 27!
        assert dry_p1["products_migrated"] == 1
        assert dml_writes == []

        dry_p3 = run_inventory_backfill(SessionLocal, dry_run=True, product_id=p3)
        assert dry_p3["products_skipped_ambiguous"] == 1
        assert dry_p3["discrepancies"][0]["reason"] == "legacy_variant_stock_mismatch"
        assert dml_writes == []
    finally:
        event.remove(engine, "before_cursor_execute", _track_writes)

    # B) Apply p1 -> exact stock preservation (10 -> 5 + 5, B stays 7 => total 17)
    res_p1 = run_inventory_backfill(SessionLocal, dry_run=False, product_id=p1)
    assert res_p1["before_totals"]["active_listing_stock"] == 17
    assert res_p1["after_totals"]["active_listing_stock"] == 17
    assert res_p1["delta_active_listing_stock"] == 0
    assert res_p1["products_migrated"] == 1

    db.expire_all()
    p1_active = db.query(SellerListing).filter(SellerListing.product_id == p1, SellerListing.is_active == True).all()
    assert sorted((l.seller_id, l.variant_name, l.stock) for l in p1_active) == sorted([
        (seller_a["user_id"], "30 ml", 5),
        (seller_a["user_id"], "50 ml", 5),
        (seller_b["user_id"], "30 ml", 7),
    ])
    leg1_db = db.query(SellerListing).filter(SellerListing.id == leg1.id).first()
    assert leg1_db.is_active is False and leg1_db.stock == 0
    hist_item_db = db.query(OrderItem).filter(OrderItem.id == hist_item.id).first()
    assert hist_item_db.seller_listing_id == leg1.id  # historical FK snapshot intact
    assert db.query(Product).filter(Product.id == p1).first().stock == 17

    # Repeat apply on p1 -> strict no-op
    res_p1_repeat = run_inventory_backfill(SessionLocal, dry_run=False, product_id=p1)
    assert res_p1_repeat["products_migrated"] == 0
    assert res_p1_repeat["products_already_canonical"] == 1
    assert res_p1_repeat["delta_active_listing_stock"] == 0

    # C) Reservation deferral -> leg2 remains active while reservation is PENDING, checkout succeeds
    res_p2 = run_inventory_backfill(SessionLocal, dry_run=False, product_id=p2)
    assert res_p2["products_deferred_reservations"] == 1
    assert res_p2["discrepancies"][0]["reason"] == "active_pending_reservations"
    db.expire_all()
    assert db.query(SellerListing).filter(SellerListing.id == leg2.id).first().is_active is True

    # Release the hold (restock 2 back into leg2: 6 -> 8), then re-run backfill cleanly!
    CommerceService.release_reservation_hold(db, res_token_2)
    db.expire_all()
    assert db.query(SellerListing).filter(SellerListing.id == leg2.id).first().stock == 8
    res_p2_after = run_inventory_backfill(SessionLocal, dry_run=False, product_id=p2)
    assert res_p2_after["products_migrated"] == 1
    assert res_p2_after["after_totals"]["active_listing_stock"] == 8

    # D) Ambiguous (p3) and missing-seller (p4) skipped without guessing or inventing stock
    res_p3 = run_inventory_backfill(SessionLocal, dry_run=False, product_id=p3)
    assert res_p3["products_skipped_ambiguous"] == 1
    db.expire_all()
    assert db.query(SellerListing).filter(SellerListing.id == leg3.id).first().is_active is True
    assert db.query(SellerListing).filter(SellerListing.product_id == p3).count() == 1

    res_p4 = run_inventory_backfill(SessionLocal, dry_run=False, product_id=p4)
    assert res_p4["products_skipped_ambiguous"] == 1
    assert res_p4["discrepancies"][0]["reason"] == "missing_or_ambiguous_product_seller"
    assert db.query(SellerListing).filter(SellerListing.product_id == p4).count() == 0

    # E) Interrupted full run & restartability + CLI subprocess exit codes
    def _crash_after_one(pid, idx, rep):
        if pid == p5:
            return
        raise RuntimeError("Simulated worker crash mid-batch")

    # Test crash BEFORE p5 vs after: crash right before processing all products or after p1
    call_count = {"n": 0}

    def _crash_on_second(pid, idx, rep):
        call_count["n"] += 1
        if call_count["n"] == 2:
            raise RuntimeError("Simulated mid-batch process kill")

    with pytest.raises(RuntimeError, match="mid-batch"):
        run_inventory_backfill(SessionLocal, dry_run=False, on_product_processed=_crash_on_second)

    # Restart full backfill -> completes remaining migratable products (including p5) cleanly and idempotently
    full_run = run_inventory_backfill(SessionLocal, dry_run=False)
    db.expire_all()
    p5_active = db.query(SellerListing).filter(SellerListing.product_id == p5, SellerListing.is_active == True).all()
    assert sorted((l.variant_name, l.stock) for l in p5_active) == [("Cool", 7), ("Warm", 5)]

    # Repeat full backfill -> zero further migrations
    repeat_run = run_inventory_backfill(SessionLocal, dry_run=False)
    assert repeat_run["products_migrated"] == 0
    assert repeat_run["products_created_initial"] == 0

    # CLI exits 2 because p3 & p4 discrepancies intentionally remain unresolved
    cli_proc = subprocess.run(
        [sys.executable, "-m", "backend.app.services.inventory_backfill", "--dry-run", "--product-id", p1],
        capture_output=True, text=True, check=False,
    )
    assert cli_proc.returncode == 0, cli_proc.stderr
    cli_json = json.loads(cli_proc.stdout)
    assert cli_json["mode"] == "dry_run" and cli_json["status"] == "ok"


# =============================================================================
# 2. Refund Initiation Safety After Lost Responses, Concurrency & Caps
# =============================================================================

def test_refund_lost_response_reconciliation_idempotency_concurrency_partial_and_caps(client, db, monkeypatch):
    cust = _create_user(client, db, UserRole.CUSTOMER)
    seller = _create_user(client, db, UserRole.SELLER)

    # ---- Part A: Provider accepts refund #1 then ReadTimeout loses response; retry reconciles (1 gateway refund) ----
    ord_a = _create_paid_delivered_order(client, db, cust, seller, monkeypatch, unit_price=1000.0, qty=1)
    ret_a_id = client.post(
        f"/api/v1/orders/suborders/{ord_a['suborder_id']}/return",
        json={"order_item_id": ord_a["item_id"], "reason": "Seal damaged"},
        headers={"Authorization": cust["Authorization"]},
    ).json()["id"]

    gateway_ledger = {}
    refund_post_calls = []

    def gw_accept_then_timeout(pay_id, payload=None, headers=None, **kwargs):
        refund_post_calls.append({"payment_id": pay_id, "payload": dict(payload or {}), "headers": dict(headers or {})})
        rid = f"rfnd_lost_{secrets.token_hex(4)}"
        gateway_ledger[rid] = {
            "id": rid,
            "payment_id": pay_id,
            "amount": payload["amount"],
            "receipt": payload.get("receipt"),
            "notes": payload.get("notes", {}),
            "status": "processed",
        }
        if len(refund_post_calls) == 1:
            raise requests.exceptions.ReadTimeout("Simulated lost HTTP response after gateway accepted refund")
        return gateway_ledger[rid]

    def gw_list_refunds(pay_id, opts=None, **kwargs):
        items = [r for r in gateway_ledger.values() if r["payment_id"] == pay_id]
        return {"entity": "collection", "count": len(items), "items": items}

    def gw_fetch_refund(pay_id, rid, **kwargs):
        return gateway_ledger[rid]

    monkeypatch.setattr(
        "backend.app.api.v1.payments.get_razorpay_client",
        lambda: SimpleNamespace(
            payment=SimpleNamespace(
                refund=gw_accept_then_timeout,
                fetch_multiple_refund=gw_list_refunds,
                fetch_refund_id=gw_fetch_refund,
            )
        ),
    )

    r1 = client.post(
        f"/api/v1/partners/seller/returns/{ret_a_id}/decide",
        json={"action": "APPROVE", "restock_inventory": True},
        headers={"Authorization": seller["Authorization"]},
    )
    assert r1.status_code == 503  # Unknown outcome -> retryable 503, NOT flat FAILED
    db.expire_all()
    rec_a = db.query(RefundRecord).filter(RefundRecord.return_request_id == ret_a_id).first()
    assert rec_a is not None
    assert rec_a.status == "SUBMITTED_UNKNOWN"
    assert len(rec_a.idempotency_key) >= 10
    assert "X-Refund-Idempotency" in refund_post_calls[0]["headers"]
    assert refund_post_calls[0]["headers"]["X-Refund-Idempotency"] == rec_a.idempotency_key

    # Retry approval -> reconciles via fetch_multiple_refund WITHOUT calling payment.refund a second time!
    r2 = client.post(
        f"/api/v1/partners/seller/returns/{ret_a_id}/decide",
        json={"action": "APPROVE", "restock_inventory": True},
        headers={"Authorization": seller["Authorization"]},
    )
    assert r2.status_code == 200, r2.text
    assert r2.json()["status"] == "REFUNDED"
    assert len(refund_post_calls) == 1  # Strictly 1 gateway refund submission!
    assert len(gateway_ledger) == 1

    # ---- Part B: Provider NEVER received timed-out request -> retry sends IDENTICAL X-Refund-Idempotency & payload ----
    ord_b = _create_paid_delivered_order(client, db, cust, seller, monkeypatch, unit_price=1000.0, qty=1)
    ret_b_id = client.post(
        f"/api/v1/orders/suborders/{ord_b['suborder_id']}/return",
        json={"order_item_id": ord_b["item_id"], "reason": "Shade wrong"},
        headers={"Authorization": cust["Authorization"]},
    ).json()["id"]

    drop_calls = []

    def gw_drop_before_create_then_ok(pay_id, payload=None, headers=None, **kwargs):
        drop_calls.append({"payload": dict(payload or {}), "headers": dict(headers or {})})
        if len(drop_calls) == 1:
            raise requests.exceptions.ConnectTimeout("Connection dropped before gateway recorded request")
        return {
            "id": f"rfnd_retry_b_{secrets.token_hex(4)}",
            "payment_id": pay_id,
            "amount": payload["amount"],
            "receipt": payload.get("receipt"),
            "notes": payload.get("notes", {}),
            "status": "processed",
        }

    monkeypatch.setattr(
        "backend.app.api.v1.payments.get_razorpay_client",
        lambda: SimpleNamespace(
            payment=SimpleNamespace(
                refund=gw_drop_before_create_then_ok,
                fetch_multiple_refund=lambda pid, opts=None, **kw: {"entity": "collection", "count": 0, "items": []},
            )
        ),
    )
    b1 = client.post(
        f"/api/v1/partners/seller/returns/{ret_b_id}/decide",
        json={"action": "APPROVE", "restock_inventory": False},
        headers={"Authorization": seller["Authorization"]},
    )
    assert b1.status_code == 503
    b2 = client.post(
        f"/api/v1/partners/seller/returns/{ret_b_id}/decide",
        json={"action": "APPROVE", "restock_inventory": False},
        headers={"Authorization": seller["Authorization"]},
    )
    assert b2.status_code == 200 and b2.json()["status"] == "REFUNDED"
    assert len(drop_calls) == 2
    assert drop_calls[0]["headers"]["X-Refund-Idempotency"] == drop_calls[1]["headers"]["X-Refund-Idempotency"]
    assert drop_calls[0]["payload"] == drop_calls[1]["payload"]

    # ---- Part C: Simultaneous concurrent approval requests -> only 1 gateway refund issued ----
    ord_c = _create_paid_delivered_order(client, db, cust, seller, monkeypatch, unit_price=1600.0, qty=1)
    ret_c_id = client.post(
        f"/api/v1/orders/suborders/{ord_c['suborder_id']}/return",
        json={"order_item_id": ord_c["item_id"], "reason": "Damaged box"},
        headers={"Authorization": cust["Authorization"]},
    ).json()["id"]

    conc_refund_calls = []
    entered_gw = threading.Event()
    release_gw = threading.Event()

    def gw_blocking(pay_id, payload=None, headers=None, **kwargs):
        conc_refund_calls.append(dict(headers or {}))
        entered_gw.set()
        release_gw.wait(timeout=10)
        return {"id": f"rfnd_conc_{secrets.token_hex(4)}", "payment_id": pay_id, "amount": payload["amount"], "status": "processed"}

    monkeypatch.setattr(
        "backend.app.api.v1.payments.get_razorpay_client",
        lambda: SimpleNamespace(payment=SimpleNamespace(refund=gw_blocking)),
    )

    outcomes_c = []
    lock_c = threading.Lock()

    def run_approve_worker(is_leader: bool):
        s = SessionLocal()
        try:
            if not is_leader:
                assert entered_gw.wait(timeout=5)
            out = CommerceService.decide_return(s, seller["user_id"], ret_c_id, ReturnDecisionRequest(action="APPROVE", restock_inventory=True))
            with lock_c:
                outcomes_c.append(("ok", out.status.value))
        except Exception as exc:
            with lock_c:
                outcomes_c.append(("http", getattr(exc, "status_code", repr(exc))))
        finally:
            s.close()

    t1 = threading.Thread(target=run_approve_worker, args=(True,))
    t2 = threading.Thread(target=run_approve_worker, args=(False,))
    t1.start()
    t2.start()
    assert entered_gw.wait(timeout=5)
    # Give second thread a moment to hit IN_FLIGHT guard while t1 is outside locks at gateway
    t2.join(timeout=5)
    release_gw.set()
    t1.join(timeout=10)

    assert len(conc_refund_calls) == 1
    assert ("ok", "REFUNDED") in outcomes_c
    assert ("http", 409) in outcomes_c

    # ---- Part D: Local DB write failure after provider succeeds -> SessionLocal fallback settles ----
    ord_d = _create_paid_delivered_order(client, db, cust, seller, monkeypatch, unit_price=1600.0, qty=1)
    ret_d_id = client.post(
        f"/api/v1/orders/suborders/{ord_d['suborder_id']}/return",
        json={"order_item_id": ord_d["item_id"], "reason": "Spilled"},
        headers={"Authorization": cust["Authorization"]},
    ).json()["id"]

    d_calls = []

    def gw_ok_d(pay_id, payload=None, headers=None, **kwargs):
        d_calls.append(1)
        return {"id": f"rfnd_dbfail_{secrets.token_hex(4)}", "payment_id": pay_id, "amount": payload["amount"], "status": "processed"}

    monkeypatch.setattr(
        "backend.app.api.v1.payments.get_razorpay_client",
        lambda: SimpleNamespace(payment=SimpleNamespace(refund=gw_ok_d)),
    )

    with SessionLocal() as s_fail:
        orig_commit = s_fail.commit
        commit_count = {"n": 0}

        def failing_post_gateway_commit():
            commit_count["n"] += 1
            # commit #1 is pre-gateway APPROVED+IN_FLIGHT transition (Wait: execute_or_reconcile does commit before HTTP, create_intent+decide_return does 1 commit, execute does 1 IN_FLIGHT commit, then apply_provider_refund_outcome does commit #3!)
            if commit_count["n"] == 3:
                raise OperationalError("SELECT 1", {}, Exception("Simulated transient DB failure post-gateway"))
            return orig_commit()

        s_fail.commit = failing_post_gateway_commit
        ret_d = CommerceService.decide_return(s_fail, seller["user_id"], ret_d_id, ReturnDecisionRequest(action="APPROVE", restock_inventory=False))
        assert ret_d.status == ReturnStatus.REFUNDED

    assert len(d_calls) == 1
    db.expire_all()
    assert db.query(RefundAccountingEntry).filter(RefundAccountingEntry.order_id == ord_d["order_id"]).count() == 1

    # ---- Part E: Two legitimate partial refunds with distinct identities + cumulative cap ----
    ord_e = _create_paid_delivered_order(client, db, cust, seller, monkeypatch, unit_price=900.0, qty=2)
    # 2 * 900 = 1800 subtotal (< 1500? No, 1800 >= 1500 so shipping=0, total=1800)
    part1 = client.post(
        f"/api/v1/orders/suborders/{ord_e['suborder_id']}/return",
        json={"order_item_id": ord_e["item_id"], "qty": 1, "reason": "First unit leaked"},
        headers={"Authorization": cust["Authorization"]},
    ).json()
    part2 = client.post(
        f"/api/v1/orders/suborders/{ord_e['suborder_id']}/return",
        json={"order_item_id": ord_e["item_id"], "qty": 1, "reason": "Second unit cracked"},
        headers={"Authorization": cust["Authorization"]},
    ).json()
    assert part1["id"] != part2["id"]

    partial_calls = []

    def gw_partial(pay_id, payload=None, headers=None, **kwargs):
        partial_calls.append({"headers": dict(headers or {}), "amount": payload["amount"], "receipt": payload["receipt"]})
        return {"id": f"rfnd_part_{secrets.token_hex(4)}", "payment_id": pay_id, "amount": payload["amount"], "status": "processed"}

    monkeypatch.setattr(
        "backend.app.api.v1.payments.get_razorpay_client",
        lambda: SimpleNamespace(payment=SimpleNamespace(refund=gw_partial)),
    )
    p1_dec = client.post(f"/api/v1/partners/seller/returns/{part1['id']}/decide", json={"action": "APPROVE"}, headers={"Authorization": seller["Authorization"]})
    assert p1_dec.status_code == 200 and p1_dec.json()["status"] == "REFUNDED"
    p2_dec = client.post(f"/api/v1/partners/seller/returns/{part2['id']}/decide", json={"action": "APPROVE"}, headers={"Authorization": seller["Authorization"]})
    assert p2_dec.status_code == 200 and p2_dec.json()["status"] == "REFUNDED"
    assert len(partial_calls) == 2
    assert partial_calls[0]["headers"]["X-Refund-Idempotency"] != partial_calls[1]["headers"]["X-Refund-Idempotency"]
    assert partial_calls[0]["receipt"] != partial_calls[1]["receipt"]

    # Attempting an extra forged/manual ReturnRequest exceeding captured payment amount must fail 400 with 0 gateway calls
    over_ret = ReturnRequest(
        id=f"RET-OVER-{secrets.token_hex(3)}",
        suborder_id=ord_e["suborder_id"],
        order_item_id=ord_e["item_id"],
        customer_id=cust["user_id"],
        seller_id=seller["user_id"],
        return_qty=1,
        reason="Over-refund tamper check",
        status=ReturnStatus.REQUESTED,
        refund_amount=100.0,
        refund_paise=10000,
    )
    db.add(over_ret)
    db.commit()
    over_resp = client.post(
        f"/api/v1/partners/seller/returns/{over_ret.id}/decide",
        json={"action": "APPROVE", "restock_inventory": False},
        headers={"Authorization": seller["Authorization"]},
    )
    assert over_resp.status_code == 400
    assert len(partial_calls) == 2  # gateway never called


# =============================================================================
# 3. Exactly-Once Refund Accounting (Multi-Session Postgres Interleaving)
# =============================================================================

def test_exactly_once_refund_accounting_interleaving_concurrency_and_validation(client, db, monkeypatch):
    cust = _create_user(client, db, UserRole.CUSTOMER)
    seller = _create_user(client, db, UserRole.SELLER)

    # ---- Case 1: Webhook completes BEFORE sync HTTP response commits ----
    ord1 = _create_paid_delivered_order(client, db, cust, seller, monkeypatch, unit_price=1000.0, qty=1)
    # 1000 + 100 shipping = 1100 paid, net_settlement = 935.0, refund_amount = 1000.0 -> comm rev 150, seller ded 850 -> net 85.0
    ret1_id = client.post(
        f"/api/v1/orders/suborders/{ord1['suborder_id']}/return",
        json={"order_item_id": ord1["item_id"], "reason": "Interleave webhook first"},
        headers={"Authorization": cust["Authorization"]},
    ).json()["id"]

    rfnd_1 = f"rfnd_iwf_{secrets.token_hex(5)}"
    gw_entered = threading.Event()
    wh_finished = threading.Event()

    def gw_interleave_first(pay_id, payload=None, headers=None, **kwargs):
        gw_entered.set()
        assert wh_finished.wait(timeout=10)
        return {"id": rfnd_1, "payment_id": pay_id, "amount": payload["amount"], "status": "processed"}

    monkeypatch.setattr(
        "backend.app.api.v1.payments.get_razorpay_client",
        lambda: SimpleNamespace(payment=SimpleNamespace(refund=gw_interleave_first)),
    )

    sync_res = []

    def sync_caller():
        s = SessionLocal()
        try:
            r = CommerceService.decide_return(s, seller["user_id"], ret1_id, ReturnDecisionRequest(action="APPROVE", restock_inventory=False))
            sync_res.append(r.status.value)
        finally:
            s.close()

    ts = threading.Thread(target=sync_caller)
    ts.start()
    assert gw_entered.wait(timeout=5)

    # Webhook finishes FIRST while sync request is still awaiting gateway response return
    raw_wh1, hdr_wh1 = _sign_webhook({
        "event": "refund.processed",
        "payload": {
            "refund": {
                "entity": {
                    "id": rfnd_1,
                    "payment_id": ord1["payment_id"],
                    "amount": 100000,
                    "status": "processed",
                    "notes": {"return_id": ret1_id},
                }
            }
        },
    })
    wh1_resp = client.post("/api/v1/payments/razorpay/webhook", content=raw_wh1, headers=hdr_wh1)
    assert wh1_resp.status_code == 200, wh1_resp.text
    wh_finished.set()
    ts.join(timeout=10)
    assert sync_res == ["REFUNDED"]

    db.expire_all()
    esc1 = db.query(SellerEscrowRecord).filter(SellerEscrowRecord.suborder_id == ord1["suborder_id"]).first()
    rec1 = db.query(RefundRecord).filter(RefundRecord.return_request_id == ret1_id).first()
    assert db.query(RefundAccountingEntry).filter(RefundAccountingEntry.refund_record_id == rec1.id).count() == 1
    assert esc1.refunded_amount == 1000.0
    assert esc1.reversed_commission == 150.0
    assert esc1.net_settlement == pytest.approx(ord1["initial_net"] - 850.0, abs=0.01)

    # ---- Case 2: Duplicate sequential webhooks + Two concurrent webhooks (threading.Barrier) ----
    dup_wh = client.post("/api/v1/payments/razorpay/webhook", content=raw_wh1, headers=hdr_wh1)
    assert dup_wh.status_code == 200

    # Concurrent webhook deliveries on a second order starting from pending refund
    ord2 = _create_paid_delivered_order(client, db, cust, seller, monkeypatch, unit_price=1000.0, qty=1)
    ret2_id = client.post(
        f"/api/v1/orders/suborders/{ord2['suborder_id']}/return",
        json={"order_item_id": ord2["item_id"], "reason": "Concurrent webhooks"},
        headers={"Authorization": cust["Authorization"]},
    ).json()["id"]
    rfnd_2 = f"rfnd_cwh_{secrets.token_hex(5)}"
    monkeypatch.setattr(
        "backend.app.api.v1.payments.get_razorpay_client",
        lambda: SimpleNamespace(
            payment=SimpleNamespace(
                refund=lambda pay_id, payload=None, headers=None, **kw: {
                    "id": rfnd_2, "payment_id": pay_id, "amount": payload["amount"], "status": "pending",
                }
            )
        ),
    )
    p_res = client.post(f"/api/v1/partners/seller/returns/{ret2_id}/decide", json={"action": "APPROVE"}, headers={"Authorization": seller["Authorization"]})
    assert p_res.status_code == 200 and p_res.json()["status"] == "REFUND_PENDING"

    raw_wh2, hdr_wh2 = _sign_webhook({
        "event": "refund.processed",
        "payload": {"refund": {"entity": {"id": rfnd_2, "payment_id": ord2["payment_id"], "amount": 100000, "status": "processed", "notes": {"return_id": ret2_id}}}},
    })
    barrier_wh = threading.Barrier(2)
    wh_statuses = []
    wh_lock = threading.Lock()

    def wh_worker():
        barrier_wh.wait(timeout=5)
        r = client.post("/api/v1/payments/razorpay/webhook", content=raw_wh2, headers=hdr_wh2)
        with wh_lock:
            wh_statuses.append(r.status_code)

    def isolated_wh_get_db():
        s = SessionLocal()
        try:
            yield s
        finally:
            s.close()

    orig_wh_override = app.dependency_overrides.get(get_db)
    app.dependency_overrides[get_db] = isolated_wh_get_db
    try:
        w1 = threading.Thread(target=wh_worker)
        w2 = threading.Thread(target=wh_worker)
        w1.start()
        w2.start()
        w1.join(timeout=10)
        w2.join(timeout=10)
    finally:
        if orig_wh_override is not None:
            app.dependency_overrides[get_db] = orig_wh_override
        else:
            app.dependency_overrides.pop(get_db, None)
    assert wh_statuses == [200, 200]

    db.expire_all()
    rec2 = db.query(RefundRecord).filter(RefundRecord.return_request_id == ret2_id).first()
    esc2 = db.query(SellerEscrowRecord).filter(SellerEscrowRecord.suborder_id == ord2["suborder_id"]).first()
    assert db.query(RefundAccountingEntry).filter(RefundAccountingEntry.refund_record_id == rec2.id).count() == 1
    assert esc2.refunded_amount == 1000.0
    assert esc2.reversed_commission == 150.0
    assert esc2.net_settlement == pytest.approx(ord2["initial_net"] - 850.0, abs=0.01)

    # ---- Case 3: Delayed refund.failed and refund.created AFTER PROCESSED preserve terminal balances ----
    raw_late_fail, hdr_late_fail = _sign_webhook({
        "event": "refund.failed",
        "payload": {"refund": {"entity": {"id": rfnd_2, "payment_id": ord2["payment_id"], "amount": 100000, "status": "failed", "notes": {"return_id": ret2_id}}}},
    })
    raw_late_pend, hdr_late_pend = _sign_webhook({
        "event": "refund.created",
        "payload": {"refund": {"entity": {"id": rfnd_2, "payment_id": ord2["payment_id"], "amount": 100000, "status": "pending", "notes": {"return_id": ret2_id}}}},
    })
    assert client.post("/api/v1/payments/razorpay/webhook", content=raw_late_fail, headers=hdr_late_fail).status_code == 200
    assert client.post("/api/v1/payments/razorpay/webhook", content=raw_late_pend, headers=hdr_late_pend).status_code == 200

    # Repeated recovery worker passes also keep balances untouched
    run_maintenance_cycle(db, "recover-refunds")
    run_maintenance_cycle(db, "recover-refunds")

    db.expire_all()
    db.refresh(rec2)
    db.refresh(esc2)
    assert rec2.status == "PROCESSED"
    assert db.query(ReturnRequest).filter(ReturnRequest.id == ret2_id).first().status == ReturnStatus.REFUNDED
    assert esc2.refunded_amount == 1000.0
    assert esc2.net_settlement == pytest.approx(ord2["initial_net"] - 850.0, abs=0.01)

    # ---- Case 4: Strict validation: omitted status, mismatched amount, or mismatched payment_id rejected ----
    ord3 = _create_paid_delivered_order(client, db, cust, seller, monkeypatch, unit_price=1000.0, qty=1)
    ret3_id = client.post(
        f"/api/v1/orders/suborders/{ord3['suborder_id']}/return",
        json={"order_item_id": ord3["item_id"], "reason": "Validation check"},
        headers={"Authorization": cust["Authorization"]},
    ).json()["id"]

    # Sync gateway omitting 'status' -> NEVER inferred as 'processed', returns 502 and escalates record without mutating escrow
    monkeypatch.setattr(
        "backend.app.api.v1.payments.get_razorpay_client",
        lambda: SimpleNamespace(
            payment=SimpleNamespace(
                refund=lambda pay_id, payload=None, headers=None, **kw: {
                    "id": f"rfnd_nostat_{secrets.token_hex(4)}",
                    "payment_id": pay_id,
                    "amount": payload["amount"],
                }
            )
        ),
    )
    bad_gw = client.post(f"/api/v1/partners/seller/returns/{ret3_id}/decide", json={"action": "APPROVE"}, headers={"Authorization": seller["Authorization"]})
    assert bad_gw.status_code == 502
    db.expire_all()
    rec3 = db.query(RefundRecord).filter(RefundRecord.return_request_id == ret3_id).first()
    esc3 = db.query(SellerEscrowRecord).filter(SellerEscrowRecord.suborder_id == ord3["suborder_id"]).first()
    assert rec3.status == "REQUIRES_OPERATOR"
    assert esc3.refunded_amount == 0.0

    # Reset rec3 to PENDING to test webhook validation rejection (without corrupting pending state)
    rec3.status = "PENDING"
    rec3.provider_refund_id = f"rfnd_val_{secrets.token_hex(4)}"
    db.commit()

    # Mismatched amount webhook -> HTTP 400, zero escrow change
    raw_bad_amt, hdr_bad_amt = _sign_webhook({
        "event": "refund.processed",
        "payload": {"refund": {"entity": {"id": rec3.provider_refund_id, "payment_id": ord3["payment_id"], "amount": 50000, "status": "processed"}}},
    })
    assert client.post("/api/v1/payments/razorpay/webhook", content=raw_bad_amt, headers=hdr_bad_amt).status_code == 400
    # Mismatched payment_id webhook -> HTTP 400
    raw_bad_pid, hdr_bad_pid = _sign_webhook({
        "event": "refund.processed",
        "payload": {"refund": {"entity": {"id": rec3.provider_refund_id, "payment_id": "pay_wrong", "amount": 100000, "status": "processed"}}},
    })
    assert client.post("/api/v1/payments/razorpay/webhook", content=raw_bad_pid, headers=hdr_bad_pid).status_code == 400
    # Missing status webhook -> HTTP 400
    raw_no_stat, hdr_no_stat = _sign_webhook({
        "event": "refund.processed",
        "payload": {"refund": {"entity": {"id": rec3.provider_refund_id, "payment_id": ord3["payment_id"], "amount": 100000}}},
    })
    assert client.post("/api/v1/payments/razorpay/webhook", content=raw_no_stat, headers=hdr_no_stat).status_code == 400
    db.expire_all()
    assert db.query(RefundRecord).filter(RefundRecord.id == rec3.id).first().status == "PENDING"
    assert db.query(SellerEscrowRecord).filter(SellerEscrowRecord.id == esc3.id).first().refunded_amount == 0.0


# =============================================================================
# 4. Payment Verification on Cancelled OOS Orders & Durable OOS Refund Recovery
# =============================================================================

def test_oos_payment_verify_accuracy_durable_recovery_and_concurrent_callbacks(
    client, db, monkeypatch, maintenance_auth_headers
):
    cust1 = _create_user(client, db, UserRole.CUSTOMER)
    cust2 = _create_user(client, db, UserRole.CUSTOMER)
    seller = _create_user(client, db, UserRole.SELLER)

    def _setup_oos_order(stock_qty: int = 1):
        lid = client.post(
            "/api/v1/partners/seller/listings",
            json={"product_id": "b1", "sku": f"OOSREC-{secrets.token_hex(4)}", "price": 1800.0, "stock": stock_qty},
            headers={"Authorization": seller["Authorization"]},
        ).json()["id"]
        r1 = client.post("/api/v1/orders/reserve", json={"items": [{"listing_id": lid, "qty": stock_qty}]}, headers={"Authorization": cust1["Authorization"]}).json()
        co1 = client.post("/api/v1/orders/checkout", json={"reservation_token": r1["reservation_token"], "address_text": "Marine Drive", "payment_method": "UPI"}, headers={"Authorization": cust1["Authorization"]}).json()

        rzp_order_id = f"order_oos_{secrets.token_hex(5)}"
        pay_id = f"pay_oos_{secrets.token_hex(5)}__{rzp_order_id}"
        orders_map = {rzp_order_id: to_paise(co1["total"])}
        monkeypatch.setattr(
            "backend.app.api.v1.payments.get_razorpay_client",
            lambda: SimpleNamespace(
                order=SimpleNamespace(create=lambda p: {"id": rzp_order_id, "amount": p["amount"], "currency": "INR"}),
                payment=SimpleNamespace(fetch=lambda pid: {"id": pid, "order_id": rzp_order_id, "amount": orders_map[rzp_order_id], "currency": "INR", "status": "captured", "captured": True}),
            ),
        )
        c_res = client.post("/api/v1/payments/razorpay/create-order", json={"order_id": co1["order_id"]}, headers={"Authorization": cust1["Authorization"]})
        assert c_res.status_code == 200

        # Expire payment window -> stock restored, then bought out by cust2
        ord_row = db.query(Order).filter(Order.id == co1["order_id"]).first()
        ord_row.payment_expires_at = datetime.now(timezone.utc) - timedelta(minutes=2)
        db.commit()
        client.post("/api/v1/internal/inventory/expire-reservations", headers=maintenance_auth_headers)

        r2 = client.post("/api/v1/orders/reserve", json={"items": [{"listing_id": lid, "qty": stock_qty}]}, headers={"Authorization": cust2["Authorization"]}).json()
        client.post("/api/v1/orders/checkout", json={"reservation_token": r2["reservation_token"], "address_text": "Colaba", "payment_method": "COD"}, headers={"Authorization": cust2["Authorization"]})

        sig = hmac.new(settings.RAZORPAY_KEY_SECRET.encode(), f"{rzp_order_id}|{pay_id}".encode(), hashlib.sha256).hexdigest()
        return {"order_id": co1["order_id"], "rzp_order_id": rzp_order_id, "pay_id": pay_id, "sig": sig, "amount_paise": orders_map[rzp_order_id]}

    # ---- Scenario A: Failed OOS refund -> verify returns refund_pending_oos (NEVER completed!) -> recovery completes -> verify returns refunded_oos ----
    s_a = _setup_oos_order()

    def gw_fail_then_recover(pay_id, payload=None, headers=None, **kwargs):
        raise razorpay.errors.BadRequestError("Temporary bank rejection")

    monkeypatch.setattr(
        "backend.app.api.v1.payments.get_razorpay_client",
        lambda: SimpleNamespace(
            payment=SimpleNamespace(
                fetch=lambda pid: {"id": pid, "order_id": s_a["rzp_order_id"], "amount": s_a["amount_paise"], "currency": "INR", "status": "captured", "captured": True},
                refund=gw_fail_then_recover,
            )
        ),
    )

    v1 = client.post(
        "/api/v1/payments/razorpay/verify",
        json={"razorpay_order_id": s_a["rzp_order_id"], "razorpay_payment_id": s_a["pay_id"], "razorpay_signature": s_a["sig"], "order_id": s_a["order_id"]},
        headers={"Authorization": cust1["Authorization"]},
    )
    assert v1.status_code == 200
    assert v1.json()["success"] is False
    assert v1.json()["payment_status"] == "refund_pending_oos"
    assert v1.json()["order_status"] == "cancelled"

    # Retrying verify MUST return success=False, refund_pending_oos (NOT success=True/completed!), 0 extra notifications, 0 ReturnRequests
    notif_count_before = db.query(Notification).filter(Notification.user_id == cust1["user_id"], Notification.text.contains(s_a["order_id"])).count()
    v2 = client.post(
        "/api/v1/payments/razorpay/verify",
        json={"razorpay_order_id": s_a["rzp_order_id"], "razorpay_payment_id": s_a["pay_id"], "razorpay_signature": s_a["sig"], "order_id": s_a["order_id"]},
        headers={"Authorization": cust1["Authorization"]},
    )
    assert v2.status_code == 200
    assert v2.json()["success"] is False
    assert v2.json()["status"] == "refund_pending_oos"
    assert v2.json()["payment_status"] == "refund_pending_oos"
    assert db.query(Notification).filter(Notification.user_id == cust1["user_id"], Notification.text.contains(s_a["order_id"])).count() == notif_count_before
    assert db.query(ReturnRequest).filter(ReturnRequest.customer_id == cust1["user_id"]).count() == 0

    # Make recovery due immediately and run recovery endpoint with maintenance auth
    oos_rec_a = db.query(RefundRecord).filter(RefundRecord.order_id == s_a["order_id"]).first()
    assert oos_rec_a.status == "FAILED" and oos_rec_a.refund_type == "OOS_AUTO"
    oos_rec_a.next_retry_at = datetime.now(timezone.utc) - timedelta(seconds=1)
    db.commit()

    # Now gateway succeeds as processed; also verify repeated payment.captured webhook triggers recovery cleanly
    rec_a_calls = []

    def gw_oos_recover_ok(pay_id, payload=None, headers=None, **kwargs):
        rec_a_calls.append(dict(headers or {}))
        return {"id": f"rfnd_oos_ok_{secrets.token_hex(4)}", "payment_id": pay_id, "amount": payload["amount"], "status": "processed"}

    monkeypatch.setattr(
        "backend.app.api.v1.payments.get_razorpay_client",
        lambda: SimpleNamespace(payment=SimpleNamespace(refund=gw_oos_recover_ok)),
    )

    # Test authenticated /internal/refunds/recover endpoint
    assert client.post("/api/v1/internal/refunds/recover").status_code == 401
    assert client.post("/api/v1/internal/refunds/recover", headers={"Authorization": cust1["Authorization"]}).status_code == 403
    rec_resp = client.post("/api/v1/internal/refunds/recover", headers=maintenance_auth_headers)
    assert rec_resp.status_code == 200
    assert rec_resp.json()["processed_count"] >= 1
    assert len(rec_a_calls) == 1

    # Retrying verify now accurately returns refunded_oos
    v3 = client.post(
        "/api/v1/payments/razorpay/verify",
        json={"razorpay_order_id": s_a["rzp_order_id"], "razorpay_payment_id": s_a["pay_id"], "razorpay_signature": s_a["sig"], "order_id": s_a["order_id"]},
        headers={"Authorization": cust1["Authorization"]},
    )
    assert v3.status_code == 200
    assert v3.json()["success"] is False
    assert v3.json()["payment_status"] == "refunded_oos"
    assert v3.json()["refund_status"] == "PROCESSED"
    assert v3.json()["refund_id"] is not None

    # ---- Scenario B: Repeated capture webhook triggers recovery on pending OOS order + lost response reconciliation + concurrent verify+webhook ----
    s_b = _setup_oos_order()
    # First capture happens via webhook while refund response is lost -> SUBMITTED_UNKNOWN
    b_gw_refunds = {}

    def gw_oos_lost(pay_id, payload=None, headers=None, **kwargs):
        rid = f"rfnd_oos_lost_{secrets.token_hex(4)}"
        b_gw_refunds[rid] = {"id": rid, "payment_id": pay_id, "amount": payload["amount"], "receipt": payload["receipt"], "notes": payload["notes"], "status": "processed"}
        raise requests.exceptions.ReadTimeout("Lost OOS refund response")

    monkeypatch.setattr(
        "backend.app.api.v1.payments.get_razorpay_client",
        lambda: SimpleNamespace(
            payment=SimpleNamespace(
                refund=gw_oos_lost,
                fetch_multiple_refund=lambda pid, opts=None, **kw: {"entity": "collection", "count": len(b_gw_refunds), "items": list(b_gw_refunds.values())},
            )
        ),
    )

    cap_wh_bytes, cap_wh_hdr = _sign_webhook({
        "event": "payment.captured",
        "payload": {"payment": {"entity": {"id": s_b["pay_id"], "order_id": s_b["rzp_order_id"], "amount": s_b["amount_paise"], "currency": "INR", "status": "captured"}}},
    })
    wh_b1 = client.post("/api/v1/payments/razorpay/webhook", content=cap_wh_bytes, headers=cap_wh_hdr)
    assert wh_b1.status_code == 200
    assert wh_b1.json()["outcome"] == "oos_needs_refund"

    # Repeated capture webhook MUST attempt reconciliation/recovery (does NOT silently bypass!)
    wh_b2 = client.post("/api/v1/payments/razorpay/webhook", content=cap_wh_bytes, headers=cap_wh_hdr)
    assert wh_b2.status_code == 200
    assert wh_b2.json()["outcome"] == "oos_recovery_attempted"
    assert wh_b2.json()["payment_status"] == "refunded_oos"
    assert len(b_gw_refunds) == 1  # Reconciled, NEVER issued a second gateway refund!

    # ---- Scenario C: Concurrent verify + capture webhook on OOS cancelled order -> 1 RefundRecord, 1 gateway refund ----
    s_c = _setup_oos_order()
    c_refund_calls = []
    monkeypatch.setattr(
        "backend.app.api.v1.payments.get_razorpay_client",
        lambda: SimpleNamespace(
            payment=SimpleNamespace(
                fetch=lambda pid: {"id": pid, "order_id": s_c["rzp_order_id"], "amount": s_c["amount_paise"], "currency": "INR", "status": "captured", "captured": True},
                refund=lambda pay_id, payload=None, headers=None, **kw: (c_refund_calls.append(1) or {"id": f"rfnd_oos_c_{secrets.token_hex(4)}", "payment_id": pay_id, "amount": payload["amount"], "status": "processed"}),
            )
        ),
    )
    cap_c_bytes, cap_c_hdr = _sign_webhook({
        "event": "payment.captured",
        "payload": {"payment": {"entity": {"id": s_c["pay_id"], "order_id": s_c["rzp_order_id"], "amount": s_c["amount_paise"], "currency": "INR", "status": "captured"}}},
    })
    barrier_c = threading.Barrier(2)
    res_c = []
    lock_c = threading.Lock()

    def call_verify_c():
        barrier_c.wait(timeout=5)
        r = client.post(
            "/api/v1/payments/razorpay/verify",
            json={"razorpay_order_id": s_c["rzp_order_id"], "razorpay_payment_id": s_c["pay_id"], "razorpay_signature": s_c["sig"], "order_id": s_c["order_id"]},
            headers={"Authorization": cust1["Authorization"]},
        )
        with lock_c:
            res_c.append(("verify", r.status_code))

    def call_wh_c():
        barrier_c.wait(timeout=5)
        r = client.post("/api/v1/payments/razorpay/webhook", content=cap_c_bytes, headers=cap_c_hdr)
        with lock_c:
            res_c.append(("wh", r.status_code))

    def isolated_get_db():
        s = SessionLocal()
        try:
            yield s
        finally:
            s.close()

    orig_override = app.dependency_overrides.get(get_db)
    app.dependency_overrides[get_db] = isolated_get_db
    try:
        tc1 = threading.Thread(target=call_verify_c)
        tc2 = threading.Thread(target=call_wh_c)
        tc1.start()
        tc2.start()
        tc1.join(timeout=10)
        tc2.join(timeout=10)
    finally:
        if orig_override is not None:
            app.dependency_overrides[get_db] = orig_override
        else:
            app.dependency_overrides.pop(get_db, None)

    assert dict(res_c) == {"verify": 200, "wh": 200}
    db.expire_all()
    assert len(c_refund_calls) == 1
    assert db.query(RefundRecord).filter(RefundRecord.order_id == s_c["order_id"]).count() == 1
    assert db.query(RefundAccountingEntry).filter(RefundAccountingEntry.order_id == s_c["order_id"]).count() == 1


# =============================================================================
# 5. Maintenance --dry-run Zero-Write Proof, Exit Codes & Readiness Policy
# =============================================================================

def test_maintenance_dry_run_zero_writes_exit_codes_and_readiness_policy(client, db, monkeypatch):
    # Ensure at least one expired reservation & unresolved refund exist so --dry-run inspects non-zero rows
    cust = _create_user(client, db, UserRole.CUSTOMER)
    seller = _create_user(client, db, UserRole.SELLER)
    lid = client.post(
        "/api/v1/partners/seller/listings",
        json={"product_id": "b1", "sku": f"DRY-{secrets.token_hex(4)}", "price": 1500.0, "stock": 5},
        headers={"Authorization": seller["Authorization"]},
    ).json()["id"]
    res_tok = client.post("/api/v1/orders/reserve", json={"items": [{"listing_id": lid, "qty": 1}]}, headers={"Authorization": cust["Authorization"]}).json()["reservation_token"]
    res_row = db.query(InventoryReservation).filter(InventoryReservation.reservation_token == res_tok).first()
    res_row.expires_at = datetime.now(timezone.utc) - timedelta(minutes=2)
    db.commit()

    dml_writes = []
    gw_called = []

    def _track_writes(conn, cursor, statement, parameters, context, executemany):
        op = statement.lstrip().split(" ", 1)[0].upper()
        if op in ("INSERT", "UPDATE", "DELETE"):
            dml_writes.append(statement[:80])

    monkeypatch.setattr("backend.app.api.v1.payments.get_razorpay_client", lambda: gw_called.append(1))
    event.listen(engine, "before_cursor_execute", _track_writes)
    try:
        dry_summary = run_maintenance_cycle(db, "all", dry_run=True)
        assert dry_summary["dry_run"] is True
        assert dry_summary["expired_reservations_count"] >= 1
        assert gw_called == []
        assert dml_writes == []
    finally:
        event.remove(engine, "before_cursor_execute", _track_writes)

    # Stock unchanged after dry-run (still 4 reserved)
    db.expire_all()
    assert db.query(SellerListing).filter(SellerListing.id == lid).first().stock == 4

    # Subprocess CLI --task all --dry-run returns JSON & exit code 0 when no REQUIRES_OPERATOR records, or 2 if any exist
    op_count = db.query(RefundRecord).filter(RefundRecord.status == "REQUIRES_OPERATOR").count()
    proc = subprocess.run(
        [sys.executable, "-m", "backend.app.services.maintenance_runner", "--task", "all", "--dry-run"],
        capture_output=True, text=True, check=False,
    )
    assert proc.returncode == (2 if op_count > 0 else 0), proc.stderr
    cli_out = json.loads(proc.stdout)
    assert cli_out["dry_run"] is True

    # Readiness probe policy matrix
    orig_redis_url = settings.REDIS_URL
    orig_redis_req = settings.REDIS_REQUIRED
    try:
        # Case 1: REDIS_URL="" & REDIS_REQUIRED=False -> 200 fallback_memory
        monkeypatch.setattr(settings, "REDIS_URL", "")
        monkeypatch.setattr(settings, "REDIS_REQUIRED", False)
        r_mem = client.get("/health/ready")
        assert r_mem.status_code == 200
        assert r_mem.json()["status"] == "ready"
        assert r_mem.json()["cache"] == "fallback_memory"

        # Case 2: REDIS_URL="" & REDIS_REQUIRED=True -> 503 unhealthy (NEVER forced 200!)
        monkeypatch.setattr(settings, "REDIS_REQUIRED", True)
        r_req_missing = client.get("/health/ready")
        assert r_req_missing.status_code == 503
        assert r_req_missing.json()["status"] == "degraded"
        assert r_req_missing.json()["cache"] == "unhealthy"

        # Case 3: REDIS_URL set & Redis down -> 503 unhealthy even if REDIS_REQUIRED=False
        monkeypatch.setattr(settings, "REDIS_URL", orig_redis_url or "redis://127.0.0.1:6382/0")
        monkeypatch.setattr(settings, "REDIS_REQUIRED", False)
        monkeypatch.setattr(redis_client_mod, "check_redis_health", lambda: False)
        r_down = client.get("/health/ready")
        assert r_down.status_code == 503
        assert r_down.json()["cache"] == "unhealthy"
    finally:
        settings.REDIS_URL = orig_redis_url
        settings.REDIS_REQUIRED = orig_redis_req
