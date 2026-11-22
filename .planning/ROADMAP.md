# Roadmap: GlamGo Luxury Beauty Marketplace

## Milestones

- ✅ **v1.0 Production Launch Readiness** - Phases 1-7 (shipped 2026-11-12)
- 🚧 **v2.0 End-to-End System Integration & Live Operations** - Phases 8-12 (in progress)

## Phases

<details>
<summary>✅ v1.0 Production Launch Readiness (Phases 1-7) - SHIPPED 2026-11-12</summary>

### Phase 1: Codebase Audit & Baseline Quality
**Goal**: Audit architecture, normalize database schema, and establish baseline test harness.
**Plans**: 1 plan

Plans:
- [x] 01-01: Architecture audit, SQLAlchemy models normalization, baseline test suite

### Phase 2: Administrator Command Centre & Platform Governance
**Goal**: Build platform administrator governance centre with live GMV metrics, partner moderation, and audit logs.
**Plans**: 1 plan

Plans:
- [x] 02-01: Admin dashboard layout, metrics endpoints, partner approval workflow

### Phase 2.1: Independent Security, Reliability & Financial Hardening
**Goal**: Audit trail immutability, role-based access control, and transaction locking.
**Plans**: 1 plan

Plans:
- [x] 02.1-01: Immutable audit logs, RBAC enforcement, financial transaction safety

### Phase 3: Customer Experience & Core Booking Engine
**Goal**: Customer booking journey, service catalog exploration, appointment slot reservations.
**Plans**: 1 plan

Plans:
- [x] 03-01: Customer discovery, booking calendar, appointment concurrency locking

### Phase 4: Partner Ecosystem & Multi-Persona Portals
**Goal**: Bespoke portals for independent professionals, salon owners, and retail sellers.
**Plans**: 1 plan

Plans:
- [x] 04-01: Professional, salon, and seller portals with RBAC isolation

### Phase 5: Multi-Vendor Catalog & Inventory Fulfillment
**Goal**: Multi-vendor commerce, split orders, stock reservation with 15-minute TTL, return gateway.
**Plans**: 1 plan

Plans:
- [x] 05-01: Master catalog, split cart checkout, atomic stock reservation, escrow ledger

### Phase 6: Production Infrastructure & Launch Readiness
**Goal**: Docker multi-stage build, Nginx reverse proxy, PostgreSQL backup drill, Redis caching.
**Plans**: 1 plan

Plans:
- [x] 06-01: Non-root containerization, Nginx edge proxy, disaster recovery verification, Redis rate limiter

### Phase 7: Final Production Launch Validation & Operational Runbooks
**Goal**: Production sign-off, multi-cloud blueprints (Vercel, Render, Railway, Fly.io, Netlify), and zero-defect audit.
**Plans**: 1 plan

Plans:
- [x] 07-01: Multi-cloud configuration, disaster recovery runbooks, CodeRabbit clean audit

</details>

### 🚧 v2.0 End-to-End System Integration & Live Operations (In Progress)

**Milestone Goal:** Operationalize real-time multi-persona workflows across at-home doorstep services, salon chair management, split e-commerce fulfillment, and automated escrow payouts.

#### Phase 8: Real-Time Event Bus & WebSocket Dispatch Gateway
**Goal**: Deliver asynchronous Redis-backed event pub/sub and WebSocket streaming so all 5 roles receive instant, sub-second operational notifications without client polling.
**Depends on**: Phase 7
**Requirements**: DISP-01, DISP-02, DISP-03
**Success Criteria** (what must be TRUE):
  1. FastAPI WebSocket connection (`/api/v1/ws/notifications`) establishes with JWT authentication and receives live messages from Redis channel `user:{user_id}:notifications`.
  2. Booking creation triggers a real-time dispatch ping to verified professionals within 10km with a 60-second acceptance countdown timer.
  3. If a professional rejects or timer expires, the backend automatically cascades the dispatch ping to the next available provider.
**Plans**: 1 plan

Plans:
- [ ] 08-01: Redis Pub/Sub event bus and FastAPI WebSocket/SSE notification gateway

#### Phase 9: Doorstep Service Operational Workflow & Live Tracking
**Goal**: Provide full end-to-end transparency for at-home beauty appointments from provider acceptance to doorstep departure.
**Depends on**: Phase 8
**Requirements**: DOOR-01, DOOR-02, DOOR-03, DOOR-04
**Success Criteria** (what must be TRUE):
  1. Provider can progress status from `ACCEPTED` → `EN_ROUTE` → `ARRIVED` → `IN_PROGRESS` → `COMPLETED` through their portal.
  2. Customer sees real-time status transitions and simulated live GPS route movement on their appointment tracking screen.
  3. Service transition to `IN_PROGRESS` strictly requires entering the customer's secret 4-digit OTP generated upon booking.
  4. Marking job `COMPLETED` prompts customer for digital sign-off and instant rating/review submission.
**Plans**: 1 plan

Plans:
- [ ] 09-01: Technician state machine, simulated GPS tracking, and start-of-service PIN verification

#### Phase 10: Salon Multi-Stylist Scheduling & Chair Capacity Engine
**Goal**: Prevent appointment collisions and optimize in-parlour capacity across stylists and physical treatment stations.
**Depends on**: Phase 8
**Requirements**: SALN-01, SALN-02, SALN-03, SALN-04
**Success Criteria** (what must be TRUE):
  1. Salon owners can define stylist working hours, lunch breaks, days off, and assigned treatments.
  2. Booking engine validates both stylist availability AND chair capacity for the requested duration before confirming a slot.
  3. Front-desk receptionist can add walk-in clients, immediately reserving a chair and updating live salon occupancy.
  4. Completed in-salon treatments update customer booking status to `COMPLETED` and record in-parlour billing details.
**Plans**: 1 plan

Plans:
- [ ] 10-01: Stylist roster management, chair capacity concurrency limiter, and walk-in queue

#### Phase 11: Multi-Vendor Split Fulfillment & Return Logistics Pipeline
**Goal**: Connect sellers to logistics fulfillment and customer post-purchase lifecycle with automated reverse logistics.
**Depends on**: Phase 8
**Requirements**: COMM-01, COMM-02, COMM-03, COMM-04
**Success Criteria** (what must be TRUE):
  1. Sellers can view pending suborders, print packing slips, and generate courier waybills with assigned tracking numbers.
  2. Customer order details page displays live shipment milestone timeline (`PACKED`, `SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`).
  3. Customer can initiate return requests within 7 days of delivery with reason selection.
  4. Seller return approval triggers automatic warehouse stock re-increment and releases customer refund.
**Plans**: 1 plan

Plans:
- [ ] 11-01: Suborder fulfillment packaging slip, waybill assignment, customer shipment timeline, and return restocking

#### Phase 12: Automated Financial Escrow, Payout Release & Platform Settlement
**Goal**: Complete the financial lifecycle by releasing escrow funds securely to partners and tracking platform revenues.
**Depends on**: Phase 11
**Requirements**: FIN-01, FIN-02, FIN-03, FIN-04
**Success Criteria** (what must be TRUE):
  1. Escrow release worker transitions suborder funds to `SETTLED` exactly when the 7-day return window closes without dispute.
  2. Verified partners can view available balance and submit withdrawal requests to their registered bank account.
  3. Platform automatically deducts 15% commission fee and generates downloadable monthly GST tax summary invoices.
  4. Platform Admin Command Centre displays live escrow balances, settled partner payouts, and platform gross profit.
**Plans**: 1 plan

Plans:
- [ ] 12-01: Scheduled escrow release background task, partner payout portal, and financial reconciliation reporting

#### Phase 13: Dual-Track Consumer (`main`) & Turnkey Showcase (`feat/turnkey-platform`) Product Upgrades
**Goal**: Elevate `main` into a conversion-ready, city-persistent, code-split consumer marketplace with full auth/booking lifecycle polish, and elevate `feat/turnkey-platform` into an interactive white-label buyer & partner-acquisition showcase with live rebranding, ROI calculators, deliverables matrix, lead capture, and multi-city distance filtering.
**Depends on**: Phase 7
**Requirements**: MAIN-01, MAIN-02, MAIN-03, MAIN-04, MAIN-05, TURN-01, TURN-02, TURN-03, TURN-04, TURN-05
**Success Criteria** (what must be TRUE):
  1. On `main`, FastAPI persists `city`, `lat`, `lng`, and serviceable `cities` across `Salon`, `ProfessionalProfile`, and `Service`, and `/api/v1/catalog/salons` supports city and max-distance filtering.
  2. On `main`, customers can use Forgot Password / Mobile OTP sign-in, 1-tap booking reschedule, 4-digit arrival OTP display, optional service add-ons, city-scoped `⌘K` search, clean autocomplete dismissal, Policy/Trust modals, Referral/Gift Card credits, and lazy-loaded dashboard chunks.
  3. On `main`, Admin partner approval upgrades the applicant's role and emits a studio-activation notification while maintaining strict RBAC isolation.
  4. On `feat/turnkey-platform`, evaluators have the Bengaluru/Mumbai/Delhi city & distance filter engine while preserving 1-click access to all 4 operational dashboards, plus a Live White-Label Brand Customizer (brand name, currency, accent), Dual-Mode ROI Calculator, Acquisition vs. Listing Comparison Matrix, Architecture Spec, Lead-Capture Proposal form, and Reset Sandbox Data control.
**Plans**: 4 plans

Plans:
- [ ] 13-01-PLAN.md — Flagship Consumer Website (`main`, Wave 1) — Backend multi-city GPS persistence, SQLite/PG auto-migration, `/api/v1/catalog/salons` radius filtering, hardened Password Reset & Mobile OTP auth, and Admin partner activation (`MAIN-01`, `MAIN-02`)
- [ ] 13-02-PLAN.md — Flagship Consumer Website (`main`, Wave 2) — Booking reschedule/OTP/add-ons, city-scoped `⌘K` search, autocomplete dismissal, dynamic code-splitting, policy drawers, SEO JSON-LD, and end-to-end Referral/Gift Card checkout credits (`MAIN-03`, `MAIN-04`, `MAIN-05`)
- [ ] 13-03-PLAN.md — Turnkey Buyer & Partner Showcase (`feat/turnkey-platform`, Wave 3) — Multi-city & Haversine distance engine parity sync preserving 1-click 4-dashboard access + Live White-Label Brand Customizer (`TURN-01`, `TURN-02`)
- [ ] 13-04-PLAN.md — Turnkey Buyer & Partner Showcase (`feat/turnkey-platform`, Wave 4) — Dual-mode ROI calculator, 3-tier comparison matrix, architecture deliverables spec, proposal lead capture with CSV formula sanitization, and Reset Sandbox Data (`TURN-03`, `TURN-04`, `TURN-05`)

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Codebase Audit | v1.0 | 1/1 | Complete | 2026-11-10 |
| 2. Admin Command Centre | v1.0 | 1/1 | Complete | 2026-11-10 |
| 2.1. Security & Financial Hardening | v1.0 | 1/1 | Complete | 2026-11-10 |
| 3. Customer Booking Engine | v1.0 | 1/1 | Complete | 2026-11-10 |
| 4. Partner Portals | v1.0 | 1/1 | Complete | 2026-11-11 |
| 5. Multi-Vendor Commerce | v1.0 | 1/1 | Complete | 2026-11-11 |
| 6. Production Infrastructure | v1.0 | 1/1 | Complete | 2026-11-11 |
| 7. Final Production Launch | v1.0 | 1/1 | Complete | 2026-11-12 |
| 8. Real-Time Event Bus | v2.0 | 0/1 | Not started | - |
| 9. Doorstep Service Workflow | v2.0 | 0/1 | Not started | - |
| 10. Salon Chair Capacity | v2.0 | 0/1 | Not started | - |
| 11. Multi-Vendor Fulfillment | v2.0 | 0/1 | Not started | - |
| 12. Automated Financial Escrow | v2.0 | 0/1 | Not started | - |
| 13. Dual-Track Main & Turnkey Upgrades | v2.0 | 0/4 | Planning | - |
