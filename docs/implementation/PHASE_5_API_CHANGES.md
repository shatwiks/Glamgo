# GLAMGO — PHASE 5 API SPECIFICATION & CONTRACTS
# MULTI-VENDOR COMMERCE & FULFILLMENT ENGINE

**Document Version:** 1.0.0 (Pre-Implementation Canonical API Specification)  
**Phase:** Phase 5 — Multi-Vendor Commerce & Fulfillment Engine  
**Date:** November 11, 2026  
**Status:** In Review (Planning Phase — No Code Modified)  
**Base URL:** `/api/v1`  
**Authentication:** Bearer JWT Header (`Authorization: Bearer <token>`)  

---

## 1. OVERVIEW & CONTRACT CONVENTIONS

Phase 5 introduces multi-vendor commerce capabilities while maintaining backward compatibility with Phase 1–4 endpoints.
- **Hierarchical Order Schema:** Parent `Order` endpoints now expose child `suborders` containing package-level tracking and fulfillment statuses.
- **Two-Phase Inventory Reservation:** Dedicated reservation endpoint with 15-minute TTL holds before payment checkout.
- **Strict Role-Based Access Control (RBAC):** Customer, Seller, and Admin roles strictly enforced via FastAPI dependencies.
- **Response Format:** All successful responses return JSON. Error responses return standard `{ "detail": "<error_message>" }` with standard HTTP error codes (`400`, `401`, `403`, `404`, `409`, `422`).

---

## 2. CUSTOMER COMMERCE APIS

### 2.1 Get Master Product Offers (Multi-Vendor Listings)
Fetches all active merchant offers for a specific master catalog item.

- **Endpoint:** `GET /api/v1/catalog/products/{product_id}/offers`
- **Auth:** Public
- **Response `200 OK`:**
```json
{
  "product_id": "b1",
  "product_name": "Celestial Glow Elixir",
  "offers_count": 3,
  "lowest_price": 2800.0,
  "offers": [
    {
      "listing_id": 14,
      "seller_id": 8,
      "seller_name": "Luxe Botanicals Official",
      "sku": "LB-CEL-01",
      "price": 2800.0,
      "compare_at_price": 3200.0,
      "stock": 42,
      "condition": "NEW",
      "shipping_lead_time_days": 2,
      "is_featured": true
    },
    {
      "listing_id": 29,
      "seller_id": 12,
      "seller_name": "Aura Cosmetics Direct",
      "sku": "ACD-GLOW-30",
      "price": 2950.0,
      "compare_at_price": 3200.0,
      "stock": 15,
      "condition": "NEW",
      "shipping_lead_time_days": 3,
      "is_featured": false
    }
  ]
}
```

---

### 2.2 Reserve Inventory (15-Minute TTL Hold)
Acquires a temporary reservation hold across selected seller listings to guarantee stock availability during payment execution.

- **Endpoint:** `POST /api/v1/orders/reserve`
- **Auth:** Customer (`ROLE_CUSTOMER`)
- **Request Body:**
```json
{
  "items": [
    { "listing_id": 14, "qty": 1 },
    { "listing_id": 31, "qty": 2 }
  ]
}
```
- **Response `201 Created`:**
```json
{
  "reservation_token": "res_a8f9c2e17d4b4a2e91001",
  "expires_at": "2026-11-11T06:15:00Z",
  "expires_in_seconds": 900,
  "sellers": [
    {
      "seller_id": 8,
      "seller_name": "Luxe Botanicals Official",
      "subtotal": 2800.0,
      "estimated_shipping_fee": 0.0,
      "items": [
        { "listing_id": 14, "product_name": "Celestial Glow Elixir", "qty": 1, "unit_price": 2800.0 }
      ]
    },
    {
      "seller_id": 15,
      "seller_name": "K-Beauty Haven",
      "subtotal": 1900.0,
      "estimated_shipping_fee": 100.0,
      "items": [
        { "listing_id": 31, "product_name": "Velvet Lip Souffle", "qty": 2, "unit_price": 950.0 }
      ]
    }
  ],
  "total_subtotal": 4700.0,
  "total_shipping": 100.0,
  "grand_total": 4800.0
}
```
- **Error `409 Conflict` (Insufficient Stock):**
```json
{
  "detail": "Insufficient stock for listing_id 14: requested 5, available 2"
}
```

---

### 2.3 Multi-Vendor Split Checkout
Consumes the active `reservation_token`, generates the parent order and seller suborders, and creates the Razorpay payment transaction.

- **Endpoint:** `POST /api/v1/orders/checkout`
- **Auth:** Customer (`ROLE_CUSTOMER`)
- **Request Body:**
```json
{
  "reservation_token": "res_a8f9c2e17d4b4a2e91001",
  "address_label": "Home",
  "address_text": "402 Royal Palms, Bandra West, Mumbai 400050",
  "coupon_code": "LUXE10",
  "payment_method": "Razorpay"
}
```
- **Response `201 Created`:**
```json
{
  "order_id": "GG9481230",
  "date": "11 Nov 2026",
  "status": "placed",
  "subtotal": 4700.0,
  "discount": 300.0,
  "shipping": 100.0,
  "total": 4500.0,
  "suborders": [
    {
      "suborder_id": "GG9481230-S1",
      "seller_id": 8,
      "seller_name": "Luxe Botanicals Official",
      "subtotal": 2800.0,
      "discount": 178.72,
      "shipping_fee": 0.0,
      "total": 2621.28,
      "status": "placed",
      "items_count": 1
    },
    {
      "suborder_id": "GG9481230-S2",
      "seller_id": 15,
      "seller_name": "K-Beauty Haven",
      "subtotal": 1900.0,
      "discount": 121.28,
      "shipping_fee": 100.0,
      "total": 1878.72,
      "status": "placed",
      "items_count": 2
    }
  ],
  "payment": {
    "gateway": "Razorpay",
    "razorpay_order_id": "order_Rz981048123",
    "amount": 4500.0,
    "currency": "INR",
    "key_id": "rzp_test_mock_glamgo"
  }
}
```
- **Error `410 Gone` (Reservation Expired):**
```json
{
  "detail": "Reservation res_a8f9c2e17d4b4a2e91001 has expired. Please re-add items to cart."
}
```

---

### 2.4 Customer Order Detail with Suborders & Tracking
Fetches parent order along with granular suborders and courier tracking.

- **Endpoint:** `GET /api/v1/orders/{order_id}`
- **Auth:** Customer (`ROLE_CUSTOMER`) / Admin
- **Response `200 OK`:**
```json
{
  "id": "GG9481230",
  "date": "11 Nov 2026",
  "status": "in_transit",
  "subtotal": 4700.0,
  "discount": 300.0,
  "shipping": 100.0,
  "total": 4500.0,
  "address_text": "402 Royal Palms, Bandra West, Mumbai 400050",
  "suborders": [
    {
      "suborder_id": "GG9481230-S1",
      "seller_id": 8,
      "seller_name": "Luxe Botanicals Official",
      "status": "in_transit",
      "total": 2621.28,
      "shipment": {
        "carrier_name": "BlueDart Express",
        "tracking_number": "BLU984102941",
        "tracking_url": "https://bluedart.com/track/BLU984102941",
        "shipped_at": "2026-11-11T08:30:00Z",
        "status": "in_transit"
      },
      "items": [
        {
          "order_item_id": 401,
          "name": "Celestial Glow Elixir",
          "qty": 1,
          "price": 2800.0,
          "return_eligible": false
        }
      ]
    },
    {
      "suborder_id": "GG9481230-S2",
      "seller_id": 15,
      "seller_name": "K-Beauty Haven",
      "status": "delivered",
      "total": 1878.72,
      "shipment": {
        "carrier_name": "Delhivery",
        "tracking_number": "DEL110948102",
        "tracking_url": "https://delhivery.com/track/DEL110948102",
        "delivered_at": "2026-11-11T12:00:00Z",
        "status": "delivered"
      },
      "items": [
        {
          "order_item_id": 402,
          "name": "Velvet Lip Souffle",
          "qty": 2,
          "price": 950.0,
          "return_eligible": true,
          "return_deadline": "2026-11-18T12:00:00Z"
        }
      ]
    }
  ]
}
```

---

### 2.5 Submit Return Request
Allows a customer to request a return for a specific delivered item.

- **Endpoint:** `POST /api/v1/orders/suborders/{suborder_id}/return`
- **Auth:** Customer (`ROLE_CUSTOMER`)
- **Request Body:**
```json
{
  "order_item_id": 402,
  "reason": "Damaged during transit / broken seal",
  "detailed_explanation": "The applicator brush was snapped inside the bottle upon opening.",
  "evidence_image_url": "https://images.glamgo.com/returns/damage_proof_402.jpg"
}
```
- **Response `201 Created`:**
```json
{
  "return_id": "RET-GG9481230-01",
  "suborder_id": "GG9481230-S2",
  "order_item_id": 402,
  "status": "REQUESTED",
  "refund_amount": 1878.72,
  "created_at": "2026-11-11T14:00:00Z",
  "message": "Return request submitted to seller. Review will complete within 48 hours."
}
```

---

## 3. SELLER FULFILLMENT & INVENTORY APIS

### 3.1 Seller Listings Management
- `GET /api/v1/partners/seller/listings`: Returns authenticated seller's catalog offers, active stock, SKU, and unit prices.
- `POST /api/v1/partners/seller/listings`: Creates a new offer linked to an existing master product.
- `PATCH /api/v1/partners/seller/listings/{listing_id}`: Updates price, SKU, active status, or adds stock.

### 3.2 Seller Suborder Queue & Lifecycle
- `GET /api/v1/partners/seller/suborders`: Lists all suborders for the seller with query filters (`?status=placed,packed`).
- `GET /api/v1/partners/seller/suborders/{suborder_id}`: Detailed suborder packing list with customer shipping label.
- `POST /api/v1/partners/seller/suborders/{suborder_id}/pack`: Transitions suborder from `placed` to `packed`.
- `POST /api/v1/partners/seller/suborders/{suborder_id}/ship`: Transitions suborder to `in_transit`.
  - **Request Body:**
    ```json
    {
      "carrier_name": "BlueDart Express",
      "tracking_number": "BLU984102941",
      "tracking_url": "https://bluedart.com/track/BLU984102941"
    }
    ```
- `POST /api/v1/partners/seller/suborders/{suborder_id}/deliver`: Confirms delivery, initiates parent order rollup, and locks payout into the escrow ledger.

### 3.3 Seller Return Management
- `GET /api/v1/partners/seller/returns`: Lists pending return requests for the seller's packages.
- `POST /api/v1/partners/seller/returns/{return_id}/decide`:
  - **Request Body:**
    ```json
    {
      "action": "APPROVE", // or "REJECT"
      "restock_inventory": true,
      "rejection_reason": null
    }
    ```
  - **Behavior:** If `APPROVE` and `restock_inventory=true`, triggers `inventory_audit_logs` restock and initiates a payment refund transaction.

### 3.4 Seller Financial & Escrow Dashboard
- `GET /api/v1/partners/seller/financials`: Returns detailed balance breakdown:
```json
{
  "currency": "INR",
  "gross_sales": 145000.0,
  "platform_commission_15pct": 21750.0,
  "refund_deductions": 3757.44,
  "funds_in_escrow": 24200.0,
  "matured_balance_available": 95292.56,
  "total_disbursed": 80000.0,
  "escrow_batches": [
    {
      "suborder_id": "GG9481230-S2",
      "net_amount": 1596.91,
      "status": "HELD_IN_ESCROW",
      "delivered_at": "2026-11-11T12:00:00Z",
      "matures_at": "2026-11-14T12:00:00Z"
    }
  ]
}
```

---

## 4. ADMIN & BACKGROUND ENGINE APIS

### 4.1 Master Product Moderation
- `GET /api/v1/admin/listings/moderation`: Retrieves new master products or flagged seller offers.
- `POST /api/v1/admin/listings/{listing_id}/moderate`: Approves or flags fraudulent listings.

### 4.2 Background Task: Expire Abandoned Reservations
- `POST /api/v1/internal/inventory/expire-reservations` (Triggered via cron/worker every 5 mins):
  - Locates `inventory_reservations` where `status = 'PENDING'` AND `expires_at < NOW()`.
  - Atomically marks them `EXPIRED` and logs `RESERVATION_RELEASE` in `inventory_audit_logs`.

### 4.3 Background Task: Mature Escrow Ledger
- `POST /api/v1/internal/escrow/mature` (Triggered via cron/worker daily):
  - Finds `seller_escrow_records` where `status = 'HELD_IN_ESCROW'` AND `matures_at <= NOW()`.
  - Transitions status to `MATURED`, releasing funds into seller's withdrawable balance.
