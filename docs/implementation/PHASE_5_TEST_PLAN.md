# GLAMGO — PHASE 5 TEST PLAN & VERIFICATION HARNESS
# MULTI-VENDOR COMMERCE & FULFILLMENT ENGINE

**Document Version:** 1.0.0 (Pre-Implementation Canonical Test Plan)  
**Phase:** Phase 5 — Multi-Vendor Commerce & Fulfillment Engine  
**Date:** November 11, 2026  
**Status:** In Review (Planning Phase — Verification Specifications Only)  
**Target Test Suite:** `tests/test_multi_vendor_phase5.py`  

---

## 1. OBJECTIVES & QUALITY GATES

The Phase 5 test harness guarantees that GlamGo's multi-vendor commerce engine meets enterprise requirements for concurrency, transactional consistency, multi-tenant security, and financial reconciliation.

### Strict Verification Quality Gates
1. **Zero Regression:** All existing 38 tests across Phase 2 (`tests/test_admin_phase2.py`), Phase 3 (`tests/test_customer_phase3.py`), and Phase 4 (`tests/test_partner_phase4.py`) must continue to pass with 100% green status.
2. **Concurrency & Overselling Prevention:** Automated multi-threaded / concurrent async tests must prove that inventory cannot be oversold under simultaneous checkout requests for the same stock unit.
3. **Multi-Tenant Isolation:** Sellers must be strictly prohibited (403 Forbidden) from viewing, packing, shipping, or modifying suborders belonging to competing merchants.
4. **Financial Reconciliation:** 15% platform commissions, shipping fees, discounts, and escrow holding balances must mathematically reconcile to within 0.01 INR across all suborders.
5. **Frontend Production Build:** Vite build must complete cleanly without syntax errors, missing assets, or circular dependencies (`npm run build`).

---

## 2. COMPREHENSIVE STORY VERIFICATION MATRIX (`MV-001` TO `MV-016`)

| Story ID | Title | Target Test Function | Expected Behavior & Assertions |
| :--- | :--- | :--- | :--- |
| **MV-001** | Master Product & Seller Offer Listings | `test_multi_seller_offers_on_master_product` | 2 sellers list offers on product `b1` at ₹2800 and ₹2950; `GET /catalog/products/b1/offers` returns 2 offers ordered ascending by price. |
| **MV-002** | Catalog Moderation & Duplicate Prevention | `test_catalog_moderation_and_duplicate_sku` | Duplicate SKU submission for same seller returns 409 Conflict. Seller cannot list on unapproved/inactive master product. |
| **MV-003** | Multi-Seller Cart Grouping & Fees | `test_multi_seller_cart_grouping_and_shipping` | Cart with 2 items from Seller A and 1 item from Seller B groups items into 2 distinct seller packages with transparent shipping fees. |
| **MV-004** | Split Checkout & Suborder Generation | `test_split_checkout_parent_and_suborders` | Single checkout creates parent `Order` (e.g. `GG1001`) and 2 child `SubOrder` records (`GG1001-S1`, `GG1001-S2`) with accurate totals. |
| **MV-005** | Seller-Aware Coupon Apportionment | `test_coupon_discount_proportional_apportionment` | ₹300 coupon on ₹4700 total (₹2800 Seller A, ₹1900 Seller B) proportions discount proportionally: ₹178.72 to A, ₹121.28 to B. |
| **MV-006** | Atomic Stock Reservation (15-Min TTL) | `test_inventory_reservation_ttl_and_expiry` | Reservation hold locks stock for 15 minutes. Attempting checkout after expiry returns 410 Gone; background release restores available stock. |
| **MV-007** | Concurrency Locks & Stock Audit Log | `test_concurrency_race_condition_no_overselling` | 5 concurrent checkout attempts for a single remaining stock item; exactly 1 succeeds (201), 4 fail (409), and `inventory_audit_logs` has 1 entry. |
| **MV-008** | Parent Order Status Aggregation | `test_parent_order_status_aggregation_rules` | When Suborder A is `delivered` and Suborder B is `in_transit`, parent order status evaluates to `in_transit`. Parent becomes `delivered` only when both deliver. |
| **MV-009** | Independent Seller Suborder Fulfillment | `test_independent_seller_fulfillment_and_rbac` | Seller A packs and ships Suborder A. Attempt by Seller A to ship Suborder B returns 403 Forbidden. Suborder B status remains `placed`. |
| **MV-010** | Shipment Tracking & Carrier Metadata | `test_shipment_tracking_carrier_integration` | Seller assigns carrier "BlueDart" and tracking "BLU123456". Customer order detail displays tracking number and tracking URL. |
| **MV-011** | Delivery Confirmation & Timeline | `test_suborder_delivery_confirmation` | Confirming delivery sets `delivered_at` timestamp and triggers automated entry in `seller_escrow_records`. |
| **MV-012** | Customer Return Request Gateway | `test_customer_return_request_lifecycle` | Customer submits return for delivered item with reason and photo proof within 7 days. Attempting return on non-delivered item returns 400. |
| **MV-013** | Partial Return Restocking & Refund Reconciler | `test_partial_return_restocking_and_refund` | Seller approves return with `restock=true`; inventory increments, audit log records `RESTOCK_RETURN`, and refund transaction recorded. |
| **MV-014** | Suborder Financial Ledger & 15% Commission | `test_suborder_financial_ledger_15pct_commission` | On ₹2000 suborder, verifies platform fee = ₹300 (15%), net seller payout = ₹1700. Validated against `suborders.seller_payout`. |
| **MV-015** | Escrow Maturity Engine ($T+3$ Days) | `test_escrow_maturity_engine_post_delivery` | Escrow record starts in `HELD_IN_ESCROW`. Background engine run at $T+2$ days keeps it held; run at $T+3$ days matures status to `MATURED`. |
| **MV-016** | End-to-End Multi-Vendor Regression Harness | `test_e2e_multi_vendor_commerce_lifecycle` | Full regression cycle: 2 sellers, cart reserve, split checkout, payment capture, partial shipment, delivery, 1-item return, and escrow maturity. |

---

## 3. INTEGRATION TEST SCENARIOS & CODE SNIPPETS

### 3.1 Concurrency & Overselling Test Spec (`MV-007`)
```python
import asyncio
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_concurrency_race_condition_no_overselling(async_client: AsyncClient, seller_auth_header, customer_tokens):
    # Setup: Create listing with stock = 1
    listing_res = await async_client.post(
        "/api/v1/partners/seller/listings",
        headers=seller_auth_header,
        json={"product_id": "b1", "sku": "RACE-TEST-01", "price": 1000.0, "stock": 1}
    )
    listing_id = listing_res.json()["id"]

    # Concurrently attempt 5 reservations for the 1 unit
    async def try_reserve(token):
        return await async_client.post(
            "/api/v1/orders/reserve",
            headers={"Authorization": f"Bearer {token}"},
            json={"items": [{"listing_id": listing_id, "qty": 1}]}
        )

    responses = await asyncio.gather(*(try_reserve(t) for t in customer_tokens[:5]))
    
    successes = [r for r in responses if r.status_code == 201]
    conflicts = [r for r in responses if r.status_code == 409]
    
    assert len(successes) == 1, "Exactly one customer must successfully reserve the single stock unit"
    assert len(conflicts) == 4, "Remaining four customers must receive 409 Conflict"
```

### 3.2 Escrow Maturity Validation Spec (`MV-015`)
```python
from datetime import datetime, timezone, timedelta

def test_escrow_maturity_engine_post_delivery(client, seller_auth, db_session):
    # Deliver suborder
    delivery_time = datetime.now(timezone.utc) - timedelta(days=4)
    # Simulate delivery timestamp 4 days ago
    escrow = db_session.query(SellerEscrowRecord).filter_by(seller_id=seller_auth["user_id"]).first()
    escrow.delivered_at = delivery_time
    escrow.matures_at = delivery_time + timedelta(days=3)
    db_session.commit()

    # Trigger maturity engine
    res = client.post("/api/v1/internal/escrow/mature")
    assert res.status_code == 200
    assert res.json()["matured_records_count"] >= 1

    # Check financials endpoint
    fin_res = client.get("/api/v1/partners/seller/financials", headers=seller_auth["header"])
    data = fin_res.json()
    assert data["matured_balance_available"] >= escrow.net_settlement
```

---

## 4. REGRESSION VERIFICATION COMMANDS

```powershell
# 1. Run complete backend test suite (Phase 2, 3, 4 + Phase 5)
.venv\Scripts\pytest tests/ -v

# 2. Verify specific Phase 5 test suite
.venv\Scripts\pytest tests/test_multi_vendor_phase5.py -v

# 3. Verify frontend production bundle
npm run build
```
