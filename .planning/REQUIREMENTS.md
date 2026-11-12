# GlamGo Luxury Beauty Marketplace — Requirements Specification

**Project:** GlamGo Luxury Beauty Marketplace  
**Domain:** Luxury At-Home Beauty, Salon Discovery & Multi-Vendor E-Commerce  
**Milestone:** v2.0 End-to-End System Integration & Live Operations  
**Status:** Active Scoping  

---

## 1. Milestone v2.0 Requirements

### Real-Time Event Dispatch & WebSocket Notifications (Category: DISPATCH)
- [ ] **DISP-01**: Redis Pub/Sub event bus publishing live operational events (`booking.requested`, `booking.accepted`, `booking.status_changed`, `order.placed`, `order.fulfilled`).
- [ ] **DISP-02**: Asynchronous WebSocket / SSE gateway (`/api/v1/ws/notifications`) authenticated via JWT token, multiplexing real-time alerts to connected partner dashboards and customer sessions.
- [ ] **DISP-03**: 60-second provider dispatch countdown timer with automatic cascading fallback to alternate nearby verified professionals if unaccepted.

### Doorstep Beauty Journey & Live Tracking (Category: DOORSTEP)
- [ ] **DOOR-01**: Professional service lifecycle state transitions (`ACCEPTED` → `EN_ROUTE` → `ARRIVED` → `IN_PROGRESS` → `COMPLETED`) enforced with transactional timestamp logging.
- [ ] **DOOR-02**: Simulated live GPS coordinates streaming from en-route beauty professional to customer live appointment tracking view.
- [ ] **DOOR-03**: Secure 4-digit start-of-service verification PIN (generated in customer UI, validated by professional before unlocking `IN_PROGRESS`).
- [ ] **DOOR-04**: Customer post-service digital sign-off and instant rating/review submission modal upon job completion.

### Salon Multi-Stylist & Chair Capacity Management (Category: SALON)
- [ ] **SALN-01**: Salon multi-stylist roster scheduling with custom working hours, leave blocks, and specific service competencies.
- [ ] **SALN-02**: Physical chair capacity reservation algorithm preventing overlapping appointment bookings beyond physical salon station capacity.
- [ ] **SALN-03**: Front-desk walk-in customer management queue allowing salon receptionist to register walk-ins and dynamically decrement available chair capacity.
- [ ] **SALN-04**: In-parlour QR check-in and checkout billing confirmation for completed appointments.

### Multi-Vendor Split Fulfillment & Return Logistics (Category: COMMERCE)
- [ ] **COMM-01**: Seller suborder fulfillment workflow: packaging slip generation, weight verification, and courier waybill assignment (AWB tracking number).
- [ ] **COMM-02**: Multi-stage shipment tracking timeline (`PACKED` → `SHIPPED` → `IN_TRANSIT` → `OUT_FOR_DELIVERY` → `DELIVERED`) visible to customer.
- [ ] **COMM-03**: Customer self-service return request gateway with reason categorization within 7 days of delivery.
- [ ] **COMM-04**: Seller return inspection, automated inventory restock increment, and partial refund trigger.

### Financial Escrow Automation & Payout Settlement (Category: FIN)
- [ ] **FIN-01**: Automated escrow maturation worker transitioning funds from `HELD_IN_ESCROW` to `SETTLED` after 7-day return expiration (or service completion).
- [ ] **FIN-02**: Partner payout withdrawal gateway with bank account / UPI validation and Razorpay Route / mock disbursement execution.
- [ ] **FIN-03**: Automated 15% platform commission ledger deduction with downloadable monthly GST tax invoices.
- [ ] **FIN-04**: Admin financial reconciliation dashboard displaying platform gross margin, locked escrow balances, and pending disbursement queues.

---

## 2. Validated Requirements (Milestone v1.0 — Completed)
- **REQ-01 (Backend):** Python FastAPI with asynchronous request handling, lifespan context management, and dual health probes (`/health/live`, `/health/ready`).
- **REQ-02 (Database):** PostgreSQL 16 managed via SQLAlchemy 2.0 and Alembic forward-only migrations. Connection pooling configured with leak prevention.
- **REQ-03 (Cache):** Redis 7 in-memory cache supporting read-through query caching, mutation invalidation, and sliding-window rate limiting.
- **REQ-04 (Frontend):** Modern Vanilla JavaScript ES modules bundled with Vite 7 under an editorial luxury design system.
- **REQ-05 (Edge):** Nginx reverse proxy providing Gzip compression, static asset caching (1 year immutable for `/assets/`), and 30r/s rate-limiting zones.
- **REQ-10 (At-Home Beauty):** Customer discovery, service category filtering, appointment booking with row-level concurrency locking preventing double bookings.
- **REQ-11 (Salon Discovery):** Salon directory, staff roster management, treatment menu browsing, and appointment calendar.
- **REQ-12 (Multi-Vendor E-Commerce):** Multi-vendor catalog, master product identity with seller-specific offers, unified cart grouping, parent order / suborder split checkout hierarchy, 15-minute inventory reservation TTL, return gateway (7-day window), and $T+3$ post-delivery escrow maturity.
- **REQ-20 (Security):** Non-root container execution (`appuser: 10001`), HSTS, CSP, X-Frame-Options, X-Content-Type-Options, RBAC privilege escalation protection, and structured JSON logging with credential redaction.
- **REQ-21 (Payments):** Razorpay checkout integration with HMAC-SHA256 webhook signature verification and idempotency locks.
- **REQ-22 (Disaster Recovery):** Automated point-in-time PostgreSQL 16 binary backups (`pg_dump -Fc`) with validated restoration capability (<15 min RTO, <1 hr RPO).
- **REQ-23 (Observability):** Prometheus `/metrics` exposition and declarative Grafana dashboards.

---

## 3. Future Requirements (Deferred to v3.0+)
- **FUT-01:** AI-driven dynamic surge pricing based on real-time stylist availability and regional demand spikes.
- **FUT-02:** Native iOS and Android React Native mobile applications with background geofencing and push notifications (APNS/FCM).
- **FUT-03:** Live video beauty consultation streaming directly between certified aestheticians and customers.

---

## 4. Out of Scope (Explicit Exclusions)
- **Direct Peer-to-Peer Cash Transfers:** All payments must flow through Razorpay escrow; cash-on-delivery is out of scope for luxury services to prevent chargebacks and safety risks.
- **Unverified Third-Party Courier Webhooks:** Courier integration will run through unified mock/Shiprocket adapter interfaces rather than direct raw carrier webhooks to maintain gateway stability.

---

## 5. Traceability Matrix

| Requirement ID | Milestone Phase | Planned Status |
|:---|:---:|:---:|
| `DISP-01` | Phase 8 | Planned |
| `DISP-02` | Phase 8 | Planned |
| `DISP-03` | Phase 8 | Planned |
| `DOOR-01` | Phase 9 | Planned |
| `DOOR-02` | Phase 9 | Planned |
| `DOOR-03` | Phase 9 | Planned |
| `DOOR-04` | Phase 9 | Planned |
| `SALN-01` | Phase 10 | Planned |
| `SALN-02` | Phase 10 | Planned |
| `SALN-03` | Phase 10 | Planned |
| `SALN-04` | Phase 10 | Planned |
| `COMM-01` | Phase 11 | Planned |
| `COMM-02` | Phase 11 | Planned |
| `COMM-03` | Phase 11 | Planned |
| `COMM-04` | Phase 11 | Planned |
| `FIN-01` | Phase 12 | Planned |
| `FIN-02` | Phase 12 | Planned |
| `FIN-03` | Phase 12 | Planned |
| `FIN-04` | Phase 12 | Planned |
