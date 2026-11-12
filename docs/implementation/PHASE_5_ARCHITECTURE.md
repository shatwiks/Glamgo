# GLAMGO — PHASE 5 ARCHITECTURE & SYSTEM DESIGN
# MULTI-VENDOR COMMERCE & FULFILLMENT ENGINE

**Document Version:** 1.0.0 (Pre-Implementation Canonical Architecture)  
**Phase:** Phase 5 — Multi-Vendor Commerce & Fulfillment Engine  
**Date:** November 11, 2026  
**Status:** In Review (Planning Phase)  

---

## 1. HIGH-LEVEL SYSTEM ARCHITECTURE

The GlamGo Multi-Vendor Commerce Engine evolves the single-seller model into a decoupled, distributed commerce architecture. The engine manages the relationship between canonical master products and multiple competitive seller offerings, handles atomic inventory reservations, orchestrates split parent/child orders, coordinates independent courier shipments, and enforces financial escrow maturity.

```mermaid
graph TD
    subgraph Client_Tier [Client Tier - Vanilla JS ES Modules & Vite 7]
        A["Customer Unified Cart"]
        B["Multi-Seller Split Checkout"]
        C["Seller Fulfillment Center"]
        D["Admin Governance Console"]
    end

    subgraph API_Gateway [FastAPI Gateway & Routing Layer]
        E["/api/v1/orders/checkout (Split Orchestrator)"]
        F["/api/v1/partners/seller/suborders/*"]
        G["/api/v1/partners/seller/shipments/*"]
        H["/api/v1/orders/suborders/{id}/return"]
        I["/api/v1/partners/seller/financials"]
    end

    subgraph Core_Services [Business Logic & Service Layer]
        J["Reservation Engine (TTL & Concurrency)"]
        K["Order Orchestrator (Parent/Child Split)"]
        L["Fulfillment & Shipping Adapter"]
        M["Reverse Logistics & Inspection Service"]
        N["Escrow & Commission Ledger Engine"]
    end

    subgraph Data_Storage [PostgreSQL 16 Storage Layer]
        O["products (Master Identity)"]
        P["seller_listings (Offers & SKUs)"]
        Q["inventory_reservations (Active Holds)"]
        R["orders (Parent Order)"]
        S["suborders (Seller Child Orders)"]
        T["order_items (Line Items)"]
        U["shipments (Courier & Tracking)"]
        V["return_requests (Reverse Logistics)"]
        W["seller_escrow_ledger (Payout Maturity)"]
    end

    A --> E
    B --> E
    C --> F & G & H & I
    D --> E & F & I

    E --> J --> P & Q
    E --> K --> R & S & T
    F --> L --> S & U
    G --> L --> U
    H --> M --> V & P
    I --> N --> W
```

---

## 2. DATA ENTITY RELATIONSHIPS & DECOMPOSITION

### Entity Relationship Model

```mermaid
erDiagram
    Product ||--o{ SellerListing : "offered by (1:N)"
    User ||--o{ SellerListing : "owns (1:N as seller)"
    
    SellerListing ||--o{ ProductVariant : "has (1:N)"
    SellerListing ||--o{ InventoryReservation : "holds (1:N)"
    SellerListing ||--o{ OrderItem : "ordered as (1:N)"
    
    User ||--o{ Order : "places (1:N as customer)"
    Order ||--o{ SubOrder : "splits into (1:N)"
    User ||--o{ SubOrder : "fulfilled by (1:N as seller)"
    
    SubOrder ||--o{ OrderItem : "contains (1:N)"
    SubOrder ||--o| Shipment : "shipped via (1:1)"
    SubOrder ||--o{ ReturnRequest : "subject to (1:N)"
    SubOrder ||--o| SellerEscrowRecord : "reconciled in (1:1)"
    
    Order ||--o| PaymentTransaction : "paid via (1:1)"
```

### Entity Responsibilities

1. **`Product` (Master Catalog Identity):**
   - Stores canonical brand, product title, category, global description, ingredients, primary image gallery, and customer rating.
   - Decoupled from seller identity; acts as the single source of truth for beauty consumers.
2. **`SellerListing` (Seller Offer):**
   - Links a seller (`users.id`) to a `Product`.
   - Stores seller-specific SKU, pricing (`price`, compare-at `old_price`), stock quantity, fulfillment origin city, and active status.
3. **`InventoryReservation` (Concurrency Lock):**
   - Created at checkout session start; locks $Q$ units of a `SellerListing` with `expires_at = now() + 15m`.
   - Automatically released upon expiry if checkout is abandoned or payment fails.
4. **`Order` (Parent Customer Order):**
   - Represents the customer-facing basket transaction (`GG-XXXXX`).
   - Stores overall total, customer reference, payment status, aggregated fulfillment status, and delivery address.
5. **`SubOrder` (Seller Order Slice):**
   - Child order uniquely assigned to one seller (`SUB-XXXXX-SELLERID`).
   - Owns subtotal, seller shipping fee, allocated discount, and independent fulfillment lifecycle (`placed`, `packed`, `shipped`, `delivered`, `cancelled`).
6. **`Shipment` (Courier & Dispatch):**
   - Stores courier name, tracking number, dispatch date, estimated delivery, and delivery timestamp.
7. **`ReturnRequest` (Reverse Logistics):**
   - Tracks customer return requests, return reasons, condition descriptions, seller approval/rejection, and restocking flags.
8. **`SellerEscrowRecord` (Settlement Ledger):**
   - Tracks suborder gross, 15% marketplace commission, shipping reimbursement, refund deductions, and payout maturity status (`ESCROW_HOLD` vs `MATURED_FOR_PAYOUT`).

---

## 3. SEQUENCE DIAGRAMS & DATA FLOWS

### 3.1 Multi-Vendor Checkout & Split Order Creation

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Frontend as Vite Frontend
    participant API as Checkout Router
    participant DB as PostgreSQL
    participant Razorpay as Gateway

    Customer->>Frontend: Click "Place Order" (Multi-Seller Cart)
    Frontend->>API: POST /api/v1/orders/checkout
    
    rect rgb(240, 248, 255)
    note right of API: Atomic Transaction & Reservation
    API->>DB: BEGIN TRANSACTION
    API->>DB: SELECT stock FROM seller_listings WHERE id IN (...) FOR UPDATE
    API->>DB: Check availability >= requested_qty
    API->>DB: INSERT INTO inventory_reservations (expires_at = now + 15m)
    API->>DB: INSERT INTO orders (parent order, status=placed, payment_status=pending)
    API->>DB: INSERT INTO suborders (1 per unique seller, linked to parent)
    API->>DB: INSERT INTO order_items (linked to respective suborders)
    API->>DB: COMMIT TRANSACTION
    end

    API->>Razorpay: Create Razorpay Order (total = parent order total)
    Razorpay-->>API: razorpay_order_id
    API-->>Frontend: Return parent order_id & razorpay_order_id
    
    Customer->>Frontend: Complete UPI / Card Payment
    Frontend->>API: POST /api/v1/payments/razorpay/verify
    API->>API: Verify HMAC-SHA256 Signature
    
    rect rgb(245, 255, 245)
    note right of API: Payment Finalization
    API->>DB: BEGIN TRANSACTION
    API->>DB: UPDATE orders SET payment_status = 'completed'
    API->>DB: UPDATE seller_listings SET stock = stock - qty (finalize reservation)
    API->>DB: DELETE FROM inventory_reservations WHERE order_id = ...
    API->>DB: INSERT INTO seller_escrow_records (status = 'ESCROW_HOLD')
    API->>DB: COMMIT TRANSACTION
    end
    API-->>Frontend: Success (Order Confirmed)
```

---

### 3.2 Independent Seller Fulfillment & Tracking Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Seller_A as Seller A (Merchant)
    actor Seller_B as Seller B (Merchant)
    participant API as Partner Router
    participant DB as PostgreSQL
    actor Customer as Customer

    Seller_A->>API: PATCH /suborders/{sub_A}/status (status = 'packed')
    API->>DB: UPDATE suborders SET status = 'packed' WHERE id = sub_A
    API->>DB: Recompute parent order status -> 'placed' (partial progress)

    Seller_A->>API: POST /suborders/{sub_A}/shipment (carrier = 'BlueDart', tracking = 'BD12345')
    API->>DB: INSERT INTO shipments (...)
    API->>DB: UPDATE suborders SET status = 'shipped'
    API->>DB: Recompute parent order status -> 'partially_shipped'
    API->>Customer: Notify: "Seller A has dispatched your items via BlueDart #BD12345"

    Seller_B->>API: POST /suborders/{sub_B}/shipment (carrier = 'Delhivery', tracking = 'DL98765')
    API->>DB: INSERT INTO shipments (...)
    API->>DB: UPDATE suborders SET status = 'shipped'
    API->>DB: Recompute parent order status -> 'shipped' (all children shipped)
    API->>Customer: Notify: "Seller B has dispatched your items via Delhivery #DL98765"
```

---

### 3.3 Reverse Logistics & Item Return Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant API as Orders API
    participant DB as PostgreSQL
    actor Seller as Seller
    participant Gateway as Razorpay Refund

    Customer->>API: POST /suborders/{id}/return (item_id, reason='damaged', photos=[...])
    API->>DB: Verify suborder status == 'delivered' AND delivered_at >= now - 7 days
    API->>DB: INSERT INTO return_requests (status = 'PENDING_SELLER_REVIEW')
    API->>DB: UPDATE suborders SET status = 'return_requested'
    API->>Seller: Notify: "New return request for SubOrder #SUB-123"

    Seller->>API: PATCH /seller/returns/{id}/approve (restock = true)
    API->>DB: UPDATE return_requests SET status = 'APPROVED'
    API->>DB: UPDATE seller_listings SET stock = stock + return_qty (restocked)
    API->>DB: INSERT INTO inventory_audit_logs (reason = 'RETURN_RESTOCK')
    API->>DB: UPDATE seller_escrow_records SET refund_deductions = refund_deductions + amount
    API->>Gateway: POST /refunds (amount = item_refund_amount)
    Gateway-->>API: Refund Processed
    API->>DB: UPDATE payment_transactions SET status = 'partially_refunded'
    API->>Customer: Notify: "Return approved. Refund of ₹X processed to source payment."
```

---

## 4. CONCURRENCY & RACE-CONDITION DEFENSE

### 4.1 Row-Locking Reservation Strategy
To eliminate inventory race conditions during high-demand drops (e.g. flash sales on luxury cosmetics):
1. The checkout service initiates a transaction and executes:
   ```sql
   SELECT id, stock FROM seller_listings 
   WHERE id = :listing_id 
   FOR UPDATE;
   ```
2. The available stock is evaluated:
   $$\text{Available Stock} = \text{Current Stock} - \sum \text{Unexpired Active Reservations}$$
3. If $\text{Available Stock} \ge \text{Requested Qty}$, an `InventoryReservation` is created with a 15-minute expiration timestamp.
4. If unavailable, an `HTTP 409 Conflict` is returned immediately with the exact remaining available count.

### 4.2 Background Reservation Cleanup Sweeper
A scheduled background task runs periodically to release stale reservations:
```sql
DELETE FROM inventory_reservations 
WHERE expires_at < NOW() AND status = 'HELD';
```
This guarantees that abandoned checkout sessions automatically return reserved inventory to the public marketplace without manual administrative intervention.

---

## 5. ESCROW MATURITY & SETTLEMENT PIPELINE

GlamGo enforces a $T+3$ day escrow holding policy to safeguard marketplace trust and financial solvency:

```mermaid
stateDiagram-v2
    [*] --> PAYMENT_CAPTURED: Customer payment verified
    PAYMENT_CAPTURED --> ESCROW_HOLD: Suborder created (Gross recorded)
    ESCROW_HOLD --> IN_DELIVERY: Suborder in transit
    IN_DELIVERY --> DELIVERED: Courier confirms delivery (delivered_at recorded)
    
    DELIVERED --> RETURN_WINDOW: Customer 7-day return window opens
    DELIVERED --> MATURED: delivered_at + 3 days elapsed with no open dispute
    RETURN_WINDOW --> DISPUTED: Customer initiates return request
    DISPUTED --> REFUND_ADJUSTED: Seller approves return (Deducted from escrow)
    
    MATURED --> SETTLEMENT_READY: Added to next partner payout batch
    SETTLEMENT_READY --> DISBURSED: Admin bank transfer completed + UTR recorded
    DISBURSED --> [*]
```

---

## 6. SECURITY & BOLA/IDOR ACCESS MATRIX

| Resource Endpoint | Access Filter | Role Guard | Error on Violation |
| :--- | :--- | :--- | :--- |
| `GET /partners/seller/suborders` | `suborder.seller_id == user.id` | `require_seller` | Only returns owned suborders |
| `PATCH /partners/seller/suborders/{id}/*` | `suborder.seller_id == user.id` | `require_seller` | `403 Forbidden` |
| `POST /partners/seller/shipments` | `shipment.suborder.seller_id == user.id` | `require_seller` | `403 Forbidden` |
| `PATCH /partners/seller/returns/{id}/*` | `return_request.suborder.seller_id == user.id`| `require_seller` | `403 Forbidden` |
| `GET /orders/{parent_id}` | `order.customer_id == user.id` | `get_current_user` | `403 Forbidden` |
| `POST /orders/suborders/{id}/return` | `suborder.order.customer_id == user.id` | `get_current_user` | `403 Forbidden` |
