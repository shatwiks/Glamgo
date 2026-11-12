# GLAMGO — PHASE 6 PRODUCT REQUIREMENTS DOCUMENT (PRD)
## Production Infrastructure & Launch Readiness

**Document Version:** 1.0.0  
**Phase:** Phase 6 — Production Infrastructure & Launch Readiness  
**Target Architecture:** FastAPI, PostgreSQL 16, Redis 7, Nginx, Docker, Vite 7 (Vanilla JS ES Modules)  
**Status:** Preflight & Planning Stage  

---

## 1. Executive Summary & Objective

GlamGo is a luxury beauty marketplace operating across three primary verticals:
1. At-home beauty and wellness services.
2. Salon and parlour discovery and appointments.
3. Multi-vendor beauty e-commerce.

Following the successful completion and verification of Phases 1 through 5, GlamGo possesses a complete functional core: customer discovery, booking engine, merchant portals (professional, salon owner, product seller), administrator command centre, multi-vendor catalog decoupling, two-phase inventory reservation, suborder packaging, carrier tracking, reverse logistics, and $T+3$ day escrow accounting.

The objective of **Phase 6** is **operational and production launch readiness**. Phase 6 does not add new consumer or merchant features; instead, it establishes the operational, security, financial, and reliability infrastructure required to safely launch GlamGo to real customers, merchants, and beauty professionals.

---

## 2. Core Principles & Governance Rules

1. **Empirical Verification Over Assumptions:** A passing local test suite is not equivalent to production readiness. No claim of deployment, payment capture, courier integration, backup recovery, or monitoring health may be made without empirical test execution.
2. **Preservation of Existing Stack:** Maintain the existing stack (FastAPI, PostgreSQL 16, SQLAlchemy 2.0, Alembic, Redis 7, Nginx, Docker, Vite 7 Vanilla JS ES modules).
3. **Non-Destructive Database Operations:** Never drop, reset, or overwrite `glamgo_db`. All schema enhancements must be applied via forward-only, transactional Alembic migrations.
4. **Data Isolation & Zero Secret Leakage:** No credentials, production API keys, database passwords, or customer PII may ever be committed to source code or logged in plain text.
5. **Zero-Trust Security Posture:** Every endpoint must enforce strict role-based access control (RBAC), tenant isolation, and cryptographic signature validation.

---

## 3. Milestone Breakdown & Scope

### Milestone A — Infrastructure Audit & Multi-Stage Environment Separation
- **ENV-001 (P0):** Multi-stage Docker configurations separating development, staging, and production.
- **ENV-002 (P0):** Nginx hardening: TLS termination, HTTP/2, security headers, Gzip compression, and rate limiting.
- **ENV-003 (P0):** FastAPI lifespan lifecycle management: engine warmup, clean connection pool teardown, and Redis connection lifecycle.
- **ENV-004 (P0):** Network boundary enforcement: internalizing PostgreSQL (5432) and Redis (6379) within an isolated Docker network.

### Milestone B — Deployment Architecture & Cloud Strategy
- **DEP-001 (P0):** Production topology recommendation (VPS / Cloud Run / Kubernetes) balancing cost (<$100/mo initial) and operational complexity.
- **DEP-002 (P1):** Object storage strategy for user uploads, portfolio images, and KYC documents (S3 / GCS presigned URLs).
- **DEP-003 (P1):** CDN and edge caching architecture for static frontend assets and media.
- **DEP-004 (P0):** Automated SSL/TLS certificate acquisition and renewal runbook (Let's Encrypt / Certbot).

### Milestone C — Database Reliability & Disaster Recovery
- **DAT-001 (P0):** Automated PostgreSQL backup engine with compression and encryption.
- **DAT-002 (P0):** Empirical backup restoration test harness verifying zero data corruption.
- **DAT-003 (P0):** Disaster Recovery Plan with documented Recovery Time Objective (RTO < 1h) and Recovery Point Objective (RPO < 15m).
- **DAT-004 (P1):** SQLAlchemy connection pool tuning (`pool_size`, `max_overflow`, `pool_recycle`, `pool_timeout`).

### Milestone D — Security Audit & Hardening
- **SEC-001 (P0):** Secret key externalization: mandatory runtime validation rejecting hardcoded defaults.
- **SEC-002 (P0):** JWT lifecycle hardening: shortening access token TTL (30 min), refresh token revocation, and active session invalidation.
- **SEC-003 (P0):** Distributed API rate limiting via Redis token bucket on authentication and financial mutation endpoints.
- **SEC-004 (P0):** Security headers enforcement (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy).
- **SEC-005 (P1):** Dependency vulnerability audit (`pip audit` and `npm audit`) and remediation.

### Milestone E — Payment & Financial Readiness (Razorpay)
- **PAY-001 (P0):** Asynchronous Razorpay webhook receiver (`POST /api/v1/payments/razorpay/webhook`).
- **PAY-002 (P0):** Cryptographic webhook HMAC-SHA256 signature verification.
- **PAY-003 (P0):** Webhook idempotency ledger preventing double-crediting or duplicate status rollups.
- **PAY-004 (P1):** Delayed and failed payment recovery workflows with reconciliation scripts.
- **PAY-005 (P1):** Automated refund initiation for merchant-approved return requests.

### Milestone F — Performance, Indexing & Scalability
- **PERF-001 (P0):** Database query optimization: adding missing indexes on foreign keys and high-frequency filter columns (`orders.customer_id`, `bookings.customer_id`, `bookings.date`).
- **PERF-002 (P1):** Redis read-through caching for high-traffic public catalog endpoints (`/catalog/products`, `/catalog/services`, `/catalog/salons`).
- **PERF-003 (P0):** Non-destructive controlled concurrency benchmark measuring throughput, latency (P50/P95/P99), and error rates.

### Milestone G — Observability & Alerting
- **OBS-001 (P0):** Structured JSON logging with request correlation IDs (`X-Request-ID`).
- **OBS-002 (P0):** Prometheus metrics exporter exposing HTTP request duration, status codes, active DB connections, and cache hit rates.
- **OBS-003 (P1):** Deep health check hierarchy (`/health/live` vs `/health/ready` checking DB and Redis connectivity).
- **OBS-004 (P1):** Operational alert definitions for payment failure spikes, 5xx error rates, and connection pool exhaustion.

### Milestone H — Final Launch Validation
- **VAL-001 (P0):** Comprehensive end-to-end user journey verification covering customer, professional, salon owner, seller, and admin roles.
- **VAL-002 (P0):** Cross-device browser validation (desktop and mobile viewports) ensuring editorial luxury design integrity.

---

## 4. Non-Functional Requirements & Launch Gate Criteria

| Dimension | Target Specification | Enforcement Mechanism |
| :--- | :--- | :--- |
| **Availability** | 99.9% uptime target | Dual-node container redundancy / auto-restart |
| **API Latency** | P95 < 250ms for read endpoints; P95 < 500ms for writes | Query indexing, Redis caching, connection pooling |
| **Security** | Zero critical/high vulnerabilities; strict RBAC & IDOR guards | Automated test matrix and cryptographic validation |
| **Data Protection** | RPO < 15 minutes, RTO < 60 minutes | Automated daily & hourly WAL backups with tested restore |
| **Financial Integrity** | Exact paisa reconciliation across suborders, fees, and escrow | Zero floating-point discrepancies; HMAC-verified transactions |
