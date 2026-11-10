# GlamGo — Security Audit, Vulnerability Assessment & Hardening Report

**Project:** GlamGo Luxury Beauty Marketplace  
**Document:** Security Audit & Vulnerability Assessment  
**Version:** 1.0 (Production Verified)  
**Date:** November 10, 2026  
**Audience:** Security Engineers, Principal Architects, Lead Developers  

---

## 1. Executive Summary

A comprehensive application security audit was performed against the GlamGo application stack, covering the FastAPI backend, PostgreSQL 16 database, Nginx edge proxy, and Vanilla JS single-page application.

The evaluation inspected the codebase for OWASP Top 10 vulnerabilities, authentication bypasses, broken object-level authorization (BOLA/IDOR), privilege escalation, race conditions, cryptographic hygiene, and client-side script injection.

```text
Security Findings Summary:
├── Critical Vulnerabilities Resolved: 1 (Privilege Escalation in Self-Registration)
├── High Vulnerabilities Resolved: 2 (Backdoor Signature Bypass & Booking Race Condition)
├── Medium Vulnerabilities Resolved: 2 (Predictable ID Collision & Stored XSS)
├── Low Vulnerabilities Resolved: 1 (Missing Review Router Route)
├── Open Security Recommendations: 4 (Admin Audit Trail, Rate Limiting, CSP, Password Rules)
└── Security Posture Verdict: SECURE FOR STAGING / READY FOR PHASE 2 GOVERNANCE
```

---

## 2. Detailed Findings: Resolved Vulnerabilities

### Finding SEC-01: Privilege Escalation via User Registration (CRITICAL)
- **Vulnerability Type:** CWE-269: Improper Privilege Management / Broken Access Control
- **Location:** `backend/app/api/v1/auth.py` and `backend/app/schemas/user.py`
- **Pre-Fix Condition:** The `UserRegister` schema accepted an optional or explicit `role: UserRole` field. A malicious actor could submit `{"email": "attacker@evil.com", "password": "...", "role": "admin"}` to directly provision an administrator account.
- **Impact:** Total platform compromise, access to all customer PII, order financial data, and administrative override.
- **Remediation Implemented:**
  - `UserRegister` schema was modified to either omit `role` or ignore incoming role specifications.
  - In `backend/app/api/v1/auth.py`, registration logic strictly forces `role = UserRole.CUSTOMER`.
  - Added an explicit security check: if a client requests an administrative role during public registration, the request is immediately aborted with `HTTP 403 Forbidden`:
    ```python
    if user_in.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Direct administrative registration is forbidden"
        )
    ```
- **Verification:** Automated regression test `test_admin_self_registration_forbidden` in `tests/test_auth.py` **PASSED**.

---

### Finding SEC-02: Cryptographic Signature Bypass in Payment Verification (HIGH)
- **Vulnerability Type:** CWE-347: Improper Verification of Cryptographic Signature
- **Location:** `backend/app/api/v1/payments.py`
- **Pre-Fix Condition:** The endpoint `/payments/razorpay/verify` included an unsafe fallback comparison:
  ```python
  # INSECURE LEGACY CODE:
  if req.razorpay_signature == "test_signature_valid" or verify_razorpay_signature(...):
  ```
  This allowed anyone knowing the static bypass string to confirm orders and bookings without transferring funds.
- **Impact:** Financial fraud, inventory theft, unpaid appointment scheduling.
- **Remediation Implemented:**
  - Removed all hardcoded test strings and backdoor shortcuts from production paths.
  - Verification strictly requires computing HMAC-SHA256 of `f"{order_id}|{payment_id}"` with `settings.RAZORPAY_KEY_SECRET`.
  - Comparison uses constant-time string comparison `hmac.compare_digest()` to eliminate side-channel timing attacks:
    ```python
    generated_signature = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
        f"{req.razorpay_order_id}|{req.razorpay_payment_id}".encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(generated_signature, req.razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid payment signature")
    ```
- **Verification:** Automated test `test_payment_order_and_hmac_verification` in `tests/test_payments.py` **PASSED**.

---

### Finding SEC-03: Concurrency Race Condition in Appointment Scheduling (HIGH)
- **Vulnerability Type:** CWE-362: Concurrent Execution using Shared Resource with Improper Synchronization ('Race Condition')
- **Location:** `backend/app/api/v1/bookings.py`
- **Pre-Fix Condition:** The booking endpoint performed a read query for conflicting slots, followed by a separate insert query without holding a database row lock. Under concurrent requests for the same specialist slot, both requests read zero conflicts and committed two overlapping bookings.
- **Impact:** Specialist double-booking, customer dissatisfaction, schedule disruption.
- **Remediation Implemented:**
  - Wrapped conflict validation and booking insertion inside a transaction with explicit row-level locking via SQLAlchemy's `.with_for_update()`:
    ```python
    conflict = db.query(Booking).filter(
        Booking.professional_id == booking_in.professional_id,
        Booking.booking_date == booking_in.booking_date,
        Booking.time_slot == booking_in.time_slot,
        Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED])
    ).with_for_update().first()

    if conflict:
        raise HTTPException(status_code=409, detail="Specialist is already booked")
    ```
- **Verification:** Automated test `test_booking_workflow_and_conflict_prevention` in `tests/test_bookings.py` **PASSED**.

---

### Finding SEC-04: ID Collision & Sequence Predictability (MEDIUM)
- **Vulnerability Type:** CWE-330: Use of Insufficiently Random Values
- **Location:** `backend/app/api/v1/orders.py` and `backend/app/api/v1/bookings.py`
- **Pre-Fix Condition:** Identifiers were constructed using timestamp millisecond substrings: `f"GG-{int(time.time()*1000)}"[7:]`. This resulted in truncated 7-character strings that collided when concurrent requests arrived within the same second.
- **Impact:** Database primary key collision crashes (`IntegrityError`), unpredictable order numbering.
- **Remediation Implemented:**
  - Replaced timestamp substrings with cryptographically secure hexadecimal entropy using Python's `secrets` module:
    ```python
    import secrets
    order_id = f"GG-{secrets.token_hex(4).upper()}"  # Example: GG-3F9A2B1C
    booking_id = f"BK-{secrets.token_hex(4).upper()}" # Example: BK-7E81DA09
    ```
- **Verification:** Zero collisions observed during automated order and booking test cycles.

---

### Finding SEC-05: Cross-Site Scripting (XSS) in Dynamic DOM Rendering (MEDIUM)
- **Vulnerability Type:** CWE-79: Improper Neutralization of Input During Web Page Generation ('Cross-Site Scripting')
- **Location:** `src/app.js`
- **Pre-Fix Condition:** Dynamic properties (such as user-submitted reviews, product names, or notes) were interpolated directly into template literals without HTML entity escaping.
- **Impact:** Stored XSS leading to session hijacking, token theft, or defacement.
- **Remediation Implemented:**
  - Introduced an HTML sanitization helper function `esc()`:
    ```javascript
    function esc(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    ```
  - Applied `esc()` across all interpolated user inputs in cards, tables, reviews, and notifications.

---

## 3. Remaining Security Work & Phase 2 Hardening Roadmap

The following four recommendations are classified for implementation in Phase 2 and Phase 3:

| Rec ID | Severity | Category | Description & Proposed Remediation | Target Phase |
| :---: | :---: | :---: | :--- | :---: |
| **REC-01** | **HIGH** | Governance | **Immutable Administrative Audit Logging (`admin_audit_logs`):** All admin actions (user toggles, partner approvals, manual refunds) must be permanently logged in a dedicated database table with IP address, actor ID, action type, and JSON payload diffs. | **Phase 2** |
| **REC-02** | **MEDIUM** | DDoS / Brute Force | **Redis Rate Limiting on Auth Endpoints:** Implement sliding-window rate limiting on `/api/v1/auth/login` (e.g. 5 attempts / minute / IP) and `/api/v1/auth/register` (e.g. 3 attempts / hour / IP) using Redis. | **Phase 2** |
| **REC-03** | **MEDIUM** | Network Security | **Content Security Policy (CSP) & Security Headers in Nginx:** Add `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Strict-Transport-Security` headers to `nginx.conf`. | **Phase 2** |
| **REC-04** | **LOW** | Identity | **Password Complexity Policy:** Enforce regex validation in `UserRegister` schema requiring at least 8 characters, one uppercase letter, one lowercase letter, and one numeric digit. | **Phase 2** |

---

## 4. Authentication & JWT Lifecycle Verification

- **Algorithm:** HMAC using SHA-256 (`HS256`).
- **Secret Key:** Loaded exclusively from `settings.SECRET_KEY` (env var), defaulting to a 64-character entropy key in development.
- **Access Token TTL:** 30 minutes (`ACCESS_TOKEN_EXPIRE_MINUTES = 30`).
- **Refresh Token TTL:** 7 days (`REFRESH_TOKEN_EXPIRE_DAYS = 7`).
- **Token Storage:** Tokens are stored in `localStorage` by client and passed in HTTP `Authorization: Bearer` header.
- **Client Auto-Refresh:** Verified that `src/api.js` captures `401 Unauthorized` responses and initiates automatic refresh without session termination.
