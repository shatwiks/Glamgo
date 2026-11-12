# GLAMGO — PRODUCTION SECURITY PLAN & VULNERABILITY REMEDIATION
## Phase 6 Security & Hardening Specification

**Document Version:** 1.0.0  
**Phase:** Phase 6 — Milestone D Deliverable  
**Auditor:** Application Security Lead & Principal Software Architect  
**Status:** Audit & Remediation Plan  

---

## 1. Executive Summary

A comprehensive pre-launch security inspection of the GlamGo codebase was performed covering authentication, token mechanics, database ORM interactions, cross-tenant isolation, payment verification, cryptographic signatures, and container boundaries.

While the core application demonstrates excellent foundational controls—such as Bcrypt (12 rounds) password hashing, parameterized SQLAlchemy queries, and verified IDOR checks on bookings and orders—critical operational and configuration vulnerabilities were identified that must be remediated prior to public launch.

---

## 2. Severity-Classified Security Findings

| Finding ID | Severity | Category | Description | Remediation Plan |
| :--- | :---: | :--- | :--- | :--- |
| **SEC-CRIT-01** | **CRITICAL** | Secrets Management | Default hardcoded fallback `SECRET_KEY` present in `backend/app/core/config.py` and `docker-compose.yml`. | Enforce runtime startup assertion rejecting known default secrets; require `SECRET_KEY` with $\ge 32$ cryptographically random bytes via environment variable. |
| **SEC-HIGH-01** | **HIGH** | Network Perimeter | PostgreSQL (5439) and Redis (6382) bound to `0.0.0.0` in `docker-compose.yml`, exposing data stores to external network. | Strip public host port bindings from production Compose; restrict DB/Redis communication strictly to internal Docker network. |
| **SEC-HIGH-02** | **HIGH** | Abuse & Denial of Service | No API rate limiting on `/auth/login`, `/auth/register`, or `/payments/razorpay/create-order`. | Implement Redis-backed token bucket rate limiter: 5 attempts/min on login/register; 20 attempts/min on payment creation. |
| **SEC-HIGH-03** | **HIGH** | Financial Integrity | Razorpay webhook endpoint is missing; asynchronous payment confirmations (UPI, delayed callbacks) can cause order state drift. | Implement `POST /api/v1/payments/razorpay/webhook` with HMAC-SHA256 signature verification and idempotency ledger. |
| **SEC-MED-01** | **MEDIUM** | Session Security | `ACCESS_TOKEN_EXPIRE_MINUTES` is set to 24 hours (1440 minutes), creating an excessive compromise window. | Reduce access token TTL to 30 minutes; require refresh token rotation with Redis-backed revocation blacklist. |
| **SEC-MED-02** | **MEDIUM** | HTTP Transport Security | Nginx and FastAPI lack essential browser defense headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options). | Inject strict security headers in Nginx and add FastAPI middleware for Defense-in-Depth. |
| **SEC-MED-03** | **MEDIUM** | Health & Availability | `/health` endpoint only runs `SELECT 1` on PostgreSQL and ignores Redis connectivity. | Upgrade health check to verify both PostgreSQL connection and Redis `PING`. |
| **SEC-LOW-01** | **LOW** | Information Disclosure | Interactive Swagger `/docs` and `/redoc` are accessible unconditionally. | Disable OpenAPI documentation in production unless explicitly enabled via `ENABLE_DOCS=true`. |

---

## 3. Detailed Remediation Runbooks

### 3.1 SEC-CRIT-01: Secret Key Validation & Externalization
In `backend/app/core/config.py`, add validator:
```python
@field_validator("SECRET_KEY")
@classmethod
def validate_secret_key(cls, v: str, info) -> str:
    insecure_defaults = [
        "glamgo-super-secure-production-jwt-secret-key-cormorant-2026",
        "secret", "change_me", "default_secret"
    ]
    if v in insecure_defaults:
        raise ValueError("CRITICAL SECURITY ERROR: Default or insecure SECRET_KEY detected. Refusing to start in production.")
    if len(v) < 32:
        raise ValueError("CRITICAL SECURITY ERROR: SECRET_KEY must be at least 32 characters long.")
    return v
```

### 3.2 SEC-HIGH-02: Redis-Backed Distributed Rate Limiting
Enforce sliding-window rate limits via Redis:
- `/api/v1/auth/login`: 5 requests per minute per IP.
- `/api/v1/auth/register`: 3 requests per 10 minutes per IP.
- `/api/v1/orders/checkout`: 10 requests per minute per user.
- `/api/v1/payments/razorpay/create-order`: 15 requests per minute per user.

### 3.3 SEC-MED-02: Security Headers Policy
Configure in `nginx.conf`:
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; img-src 'self' https: data: blob:; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.razorpay.com; frame-ancestors 'none';" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(self)" always;
```

---

## 4. Tenant Isolation & IDOR Verification Matrix

The platform's role-based access control was verified across all personas:

| Resource | Customer | Beauty Professional | Salon Owner | Product Seller | Platform Administrator |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Customer Profile / Address** | Self Only | Denied | Denied | Denied | Full Audit Read |
| **Booking Records** | Own Bookings | Assigned To Pro | Booked At Salon | Denied | Full Read / Cancel |
| **Orders & Suborders** | Own Parent Order | Denied | Denied | Assigned Suborder | Full Governance |
| **Seller Listings** | Read Approved | Denied | Denied | Own Listings Only | Full Moderation |
| **Return Requests** | Own Requests | Denied | Denied | Own Suborders Only | Full Arbitration |
| **Financial Ledgers** | Denied | Own Statements | Own Statements | Own Escrow Records | Full Platform Ledger |
| **Admin Audit Logs** | Denied | Denied | Denied | Denied | Immutable Read |
