# GLAMGO — PHASE 2.1 SECURITY & AUTHORIZATION AUDIT REPORT

**Date:** November 11, 2026  
**Auditor:** Application Security Engineer & Principal Architect  
**Scope:** Endpoint authorization, RBAC enforcement across 5 personas, audit trail mechanics, IP extraction, and state machine integrity.  

---

## 1. COMPREHENSIVE RBAC MATRIX VERIFICATION

A 50-check authorization matrix was executed against all 10 administrative endpoints across all 5 user personas (Unauthenticated, Customer, Professional, Salon Owner, Seller, and Platform Administrator).

### 1.1 Test Results Summary

| Endpoint | Method | Unauthenticated (No Token) | Customer Token | Professional Token | Salon Owner Token | Seller Token | Administrator Token |
|---|---|---|---|---|---|---|---|
| `/api/v1/admin/stats` | `GET` | `401 Unauthorized` | `403 Forbidden` | `403 Forbidden` | `403 Forbidden` | `403 Forbidden` | `200 OK` |
| `/api/v1/admin/users` | `GET` | `401 Unauthorized` | `403 Forbidden` | `403 Forbidden` | `403 Forbidden` | `403 Forbidden` | `200 OK` |
| `/api/v1/admin/users/{id}/toggle-status` | `PATCH` | `401 Unauthorized` | `403 Forbidden` | `403 Forbidden` | `403 Forbidden` | `403 Forbidden` | `200 OK` (404 for bad ID) |
| `/api/v1/admin/users/{id}/role` | `PATCH` | `401 Unauthorized` | `403 Forbidden` | `403 Forbidden` | `403 Forbidden` | `403 Forbidden` | `200 OK` (404 for bad ID) |
| `/api/v1/admin/partners/drafts` | `GET` | `401 Unauthorized` | `403 Forbidden` | `403 Forbidden` | `403 Forbidden` | `403 Forbidden` | `200 OK` |
| `/api/v1/admin/partners/drafts/{id}/approve` | `PATCH` | `401 Unauthorized` | `403 Forbidden` | `403 Forbidden` | `403 Forbidden` | `403 Forbidden` | `200 OK` (404 for bad ID) |
| `/api/v1/admin/partners/drafts/{id}/reject` | `PATCH` | `401 Unauthorized` | `403 Forbidden` | `403 Forbidden` | `403 Forbidden` | `403 Forbidden` | `200 OK` (404 for bad ID) |
| `/api/v1/admin/audit-logs` | `GET` | `401 Unauthorized` | `403 Forbidden` | `403 Forbidden` | `403 Forbidden` | `403 Forbidden` | `200 OK` |
| `/api/v1/admin/bookings` | `GET` | `401 Unauthorized` | `403 Forbidden` | `403 Forbidden` | `403 Forbidden` | `403 Forbidden` | `200 OK` |
| `/api/v1/admin/orders` | `GET` | `401 Unauthorized` | `403 Forbidden` | `403 Forbidden` | `403 Forbidden` | `403 Forbidden` | `200 OK` |

**Verdict:** 50/50 tests passed. Zero unauthorized access or privilege leakage detected. Non-administrators are reliably rejected with `403 Forbidden`.

---

## 2. SECURITY FINDINGS & VULNERABILITY ASSESSMENTS

### Finding SEC-001 (Severity: HIGH): Non-Atomic Administrative Mutations & Audit Log Persistence
- **Affected File:** `backend/app/api/v1/admin.py` (lines 124, 161, 266, 314) and `backend/app/services/audit_service.py` (line 27).
- **Description:**  
  In endpoints `toggle_user_status`, `update_user_role`, `approve_partner_draft`, and `reject_partner_draft`, the core entity modification is committed to the database via `db.commit()` *before* invoking `log_admin_action()`. Subsequently, `log_admin_action()` performs a second `db.commit()`.
- **Impact:**  
  If the process crashes, the database disconnects, or an exception occurs between the first commit and the second commit, the sensitive administrative modification (e.g. promoting a user, suspending an account, approving a partner) is permanently saved, but **no audit log is recorded**. This breaks compliance, accountability, and non-repudiation.
- **Remediation:**  
  Refactor `log_admin_action()` to accept `commit: bool = True`. In administrative mutation endpoints, add the audit log entry to the active database session and execute a single atomic `db.commit()` for both the mutation and the log record:
  ```python
  try:
      # Apply mutation
      user.role = payload.role
      # Add audit record to session without committing
      log_admin_action(db=db, ..., commit=False)
      # Atomically commit both
      db.commit()
      db.refresh(user)
  except Exception:
      db.rollback()
      raise
  ```

---

### Finding SEC-002 (Severity: HIGH): Partner Moderation State Transition Inconsistency
- **Affected File:** `backend/app/api/v1/admin.py` (lines 211–326).
- **Description:**  
  The endpoints `approve_partner_draft` and `reject_partner_draft` do not validate the current `draft.status` before executing state transitions:
  1. An already `APPROVED` draft can be approved repeatedly, creating duplicate audit logs.
  2. An already `APPROVED` draft can subsequently be `REJECTED`. However, when rejected post-approval, the user's role remains `PROFESSIONAL` or `SALON_OWNER`, and their created `ProfessionalProfile` or `Salon` remains active in the public catalog.
  3. An already `REJECTED` draft can be rejected repeatedly, overwriting the initial rejection reason without warning.
- **Impact:**  
  Ghost partner authorizations where a partner's application is marked "Rejected" in the admin queue, yet the partner retains full active privileges and verified profile listings.
- **Remediation:**  
  Implement strict finite state machine validation:
  - Enforce that both `approve` and `reject` only accept drafts in `PENDING` status.
  - Return `400 Bad Request` if attempting to approve an already approved/rejected draft or reject an already approved draft.

---

### Finding SEC-003 (Severity: MEDIUM): Whitespace Rejection Reason Accepted
- **Affected File:** `backend/app/schemas/admin.py` (line 40).
- **Description:**  
  `PartnerDraftRejectRequest` declares `rejection_reason: str` without validation. Testing demonstrated that sending `"   "` was accepted with `200 OK` and persisted.
- **Impact:**  
  Violates compliance requirements that mandatory justification must accompany every partner application rejection.
- **Remediation:**  
  Add a Pydantic field validator ensuring `rejection_reason` is non-empty after whitespace stripping.

---

## 3. AUDIT TRAIL ACTOR & IP ATTRIBUTION REVIEW

1. **Actor Identity Attribution:**
   - In all mutation endpoints, `admin_id` is extracted strictly from the verified JWT sub claim via `admin_user: User = Depends(require_admin)` and assigned directly to the audit log.
   - It is impossible for an admin to spoof another admin's identity via request parameters.
2. **IP Address Handling:**
   - Client IP is captured via `request.client.host`.
   - The application does not blindly trust spoofable client headers such as `X-Forwarded-For` without proxy validation, preventing client IP spoofing in standard network environments.
3. **Sensitive Data Exposure in Audit Metadata:**
   - Inspected all JSON `details` payloads recorded across `admin_audit_logs`.
   - Payloads contain only relevant state descriptors (`email`, `old_role`, `new_role`, `rejection_reason`).
   - No passwords, hashes, JWT tokens, or credit card numbers are stored in audit logs.
