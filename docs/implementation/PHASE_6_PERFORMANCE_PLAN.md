# GLAMGO — PERFORMANCE, INDEXING & SCALABILITY PLAN
## Latency Optimization, Caching & Load Testing Strategy

**Document Version:** 1.0.0  
**Phase:** Phase 6 — Milestone F Deliverable  
**Latency Target:** Read P95 < 200ms | Write P95 < 350ms  
**Throughput Target:** 150+ Requests / Second on Single 4-Core Host  
**Status:** Performance Plan & Indexing Blueprint  

---

## 1. Latency & Throughput Service Level Agreements (SLAs)

| Endpoint Category | Example Endpoints | P50 SLA | P95 SLA | P99 SLA | Target Availability |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Catalog Reads** | `GET /catalog/products`, `GET /catalog/services` | < 30ms | < 120ms | < 250ms | 99.95% |
| **Merchant Portals** | `GET /partners/seller/suborders`, `GET /admin/users` | < 45ms | < 180ms | < 350ms | 99.90% |
| **Bookings & Orders** | `POST /bookings`, `POST /orders/checkout` | < 85ms | < 280ms | < 500ms | 99.90% |
| **Payment Verification** | `POST /payments/razorpay/verify` | < 60ms | < 200ms | < 400ms | 99.99% |

---

## 2. Database Indexing Gap Analysis & Optimization

During the preflight database audit, several high-frequency foreign keys and filter columns were identified as lacking indexes, which will degrade query performance to full table sequential scans under load.

### Remediation DDL: Missing Performance Indexes

```sql
-- 1. Orders table: customer lookup and status filtering
CREATE INDEX IF NOT EXISTS ix_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS ix_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS ix_orders_created_at ON orders(created_at DESC);

-- 2. Bookings table: customer bookings and calendar availability lookups
CREATE INDEX IF NOT EXISTS ix_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS ix_bookings_service_id ON bookings(service_id);
CREATE INDEX IF NOT EXISTS ix_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS ix_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS ix_bookings_service_date_time ON bookings(service_id, date, time);

-- 3. Addresses & Notifications: customer profile lookups
CREATE INDEX IF NOT EXISTS ix_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS ix_notifications_user_id ON notifications(user_id);

-- 4. Catalog & Staff relationships
CREATE INDEX IF NOT EXISTS ix_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS ix_salon_staff_salon_id ON salon_staff(salon_id);
CREATE INDEX IF NOT EXISTS ix_reviews_user_id ON reviews(user_id);
```

---

## 3. SQLAlchemy Connection Pool Tuning

Current configuration in `backend/app/core/database.py`:
- `pool_size = 10`
- `max_overflow = 20`
- Lacks `pool_recycle` and `pool_timeout`.

### Production Hardened Pool Configuration:
```python
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,       # Validates connection health before issuing queries
    pool_size=20,             # Persistent pool connections per worker
    max_overflow=40,          # Temporary burst connections under traffic surges
    pool_recycle=1800,        # Recycle connections every 30 minutes to prevent stale TCP drops
    pool_timeout=30           # 30-second timeout before raising pool exhaustion error
)
```

---

## 4. Redis Read-Through Caching Architecture

Implement an in-memory caching layer for static and slow-moving catalog queries:

1. **`GET /catalog/products`:**
   - Key: `cache:catalog:products:all`
   - TTL: 300 seconds (5 minutes).
   - Invalidation Trigger: Dispatched whenever a merchant creates/updates a product or listing (`POST/PATCH /partners/seller/...`).
2. **`GET /catalog/services`:**
   - Key: `cache:catalog:services:all`
   - TTL: 600 seconds (10 minutes).
   - Invalidation Trigger: Dispatched on service updates.
3. **`GET /catalog/salons`:**
   - Key: `cache:catalog:salons:all`
   - TTL: 600 seconds (10 minutes).

---

## 5. Non-Destructive Load Testing Protocol

To validate throughput prior to public release without corrupting production data:
- Harness: AsyncIO Python test harness (`tests/load_test_benchmark.py`).
- Traffic Shape:
  - 10 Virtual Users (VU) warming up over 10 seconds.
  - 50 Concurrent Virtual Users executing mixed read/write flows for 60 seconds:
    - 70% Catalog browsing (`GET /catalog/products`, `GET /catalog/services`).
    - 15% Booking availability checks (`GET /catalog/professionals`).
    - 10% Two-phase inventory reservations (`POST /orders/reserve`).
    - 5% User profile & order tracking lookups (`GET /users/me`, `GET /orders`).
- Reported Metrics: Total requests, requests/sec, P50, P95, P99 latency, and error percentage (target: 0.00%).
