# GlamGo Luxury Beauty Marketplace — Requirements Specification

**Project:** GlamGo  
**Domain:** Luxury Beauty Services & Multi-Vendor E-Commerce  
**Status:** All Functional & Operational Requirements Satisfied  

---

## 1. Core Architectural Requirements
- **REQ-01 (Backend):** Python FastAPI with asynchronous request handling, lifespan context management, and dual health probes (`/health/live`, `/health/ready`).
- **REQ-02 (Database):** PostgreSQL 16 managed via SQLAlchemy 2.0 and Alembic forward-only migrations. Connection pooling configured with leak prevention.
- **REQ-03 (Cache):** Redis 7 in-memory cache supporting read-through query caching, mutation invalidation, and sliding-window rate limiting.
- **REQ-04 (Frontend):** Modern Vanilla JavaScript ES modules bundled with Vite 7 under an editorial luxury design system.
- **REQ-05 (Edge):** Nginx reverse proxy providing Gzip compression, static asset caching (1 year immutable for `/assets/`), and 30r/s rate-limiting zones.

---

## 2. Business Vertical Requirements
- **REQ-10 (At-Home Beauty):** Customer discovery, service category filtering, appointment booking with row-level concurrency locking preventing double bookings.
- **REQ-11 (Salon Discovery):** Salon directory, staff roster management, treatment menu browsing, and appointment calendar.
- **REQ-12 (Multi-Vendor E-Commerce):** Multi-vendor catalog, master product identity with seller-specific offers, unified cart grouping, parent order / suborder split checkout hierarchy, 15-minute inventory reservation TTL, return gateway (7-day window), and $T+3$ post-delivery escrow maturity.

---

## 3. Operational & Production Requirements
- **REQ-20 (Security):** Non-root container execution (`appuser: 10001`), HSTS, CSP, X-Frame-Options, X-Content-Type-Options, RBAC privilege escalation protection, and structured JSON logging with credential redaction.
- **REQ-21 (Payments):** Razorpay checkout integration with HMAC-SHA256 webhook signature verification and idempotency locks.
- **REQ-22 (Disaster Recovery):** Automated point-in-time PostgreSQL 16 binary backups (`pg_dump -Fc`) with validated restoration capability (<15 min RTO, <1 hr RPO).
- **REQ-23 (Observability):** Prometheus `/metrics` exposition and declarative Grafana dashboards.
