# GlamGo — Phase 2 Product Requirements Document (PRD) & Story Catalog

**Project:** GlamGo Luxury Beauty Marketplace  
**Document:** Product Requirements Document & Atomic Story Catalog  
**Phase:** Phase 2 — Dedicated Administrator Command Centre & Platform Governance  
**Target Architecture:** Ralph Autonomous Loop / GSD Ready  
**Date:** November 10, 2026  
**Status:** Ready for Execution (All stories initialized with `passed: false`)  

---

## 1. Product Overview & Strategic Goals

The purpose of Phase 2 is to deliver an enterprise-grade **Administrator Command Centre** for GlamGo, establishing complete operational control, moderation authority, and auditability over the three marketplace verticals (At-Home Services, Salons, and E-Commerce).

### Key Business Goals
1. **Security & Isolation:** Decouple administrative controls entirely from the Partner portal into a dedicated, authenticated route (`/admin`).
2. **Operational Moderation:** Provide platform administrators with tools to review, approve, or reject partner onboarding applications submitted by estheticians and salon owners.
3. **Auditability & Compliance:** Permanently record every administrative action into an immutable audit trail (`admin_audit_logs`).
4. **Platform Analytics:** Real-time visibility into Gross Merchandise Value (GMV), customer acquisition, service bookings, and e-commerce volume.

---

## 2. Atomic Story Catalog (Ralph & GSD Spec)

Each story is engineered to be small, independent, testable, and verifiable in a single context window.

---

### Story ADM-001: Database Migration for `admin_audit_logs` and `partner_drafts`
- **Story ID:** `ADM-001`
- **Title:** Create Alembic Migration for Admin Audit Logs and Partner Draft Moderation
- **Priority:** P0 (Blocker)
- **Dependencies:** None (Builds on revision `76376209092a`)
- **Relevant Files:**
  - `backend/alembic/versions/*_add_admin_audit_logs.py`
  - `backend/app/models/user.py`
  - `backend/app/models/catalog.py`
- **Description:**  
  Create an Alembic migration that introduces the `admin_audit_logs` table (tracking `admin_id`, `action`, `target_type`, `target_id`, `ip_address`, `details`, `created_at`) and adds moderation columns (`status`, `reviewed_by`, `reviewed_at`, `rejection_reason`) to the `partner_drafts` table.
- **Acceptance Criteria:**
  - `alembic upgrade head` executes without errors.
  - Table `admin_audit_logs` exists with proper foreign keys to `users.id`.
  - Table `partner_drafts` includes `status` enum (`PENDING`, `APPROVED`, `REJECTED`).
  - `alembic downgrade -1` cleanly rolls back changes.
- **Verification Requirements:**
  - Execute `alembic upgrade head` in PostgreSQL container.
  - Verify table definitions via information schema.
- **Completion Status:** `passed: false`

---

### Story ADM-002: Backend Admin Audit Logging Engine
- **Story ID:** `ADM-002`
- **Title:** Implement Backend Audit Logging Service and Dependency
- **Priority:** P0 (Blocker)
- **Dependencies:** `ADM-001`
- **Relevant Files:**
  - `backend/app/services/audit_service.py`
  - `backend/app/models/admin.py`
  - `backend/app/schemas/admin.py`
- **Description:**  
  Build a dedicated service function `log_admin_action()` that writes structured audit events to `admin_audit_logs`. Ensure that audit records cannot be deleted or mutated via API.
- **Acceptance Criteria:**
  - `log_admin_action()` captures admin ID, action type, target ID, client IP, and metadata JSON.
  - Exposes `GET /api/v1/admin/audit-logs` endpoint with pagination (`limit`, `offset`) and action filter.
  - Only users with `role: admin` can query the audit logs.
- **Verification Requirements:**
  - Unit test in `tests/test_admin.py` asserting audit log creation and query retrieval.
- **Completion Status:** `passed: false`

---

### Story ADM-003: Backend Partner Onboarding Moderation APIs
- **Story ID:** `ADM-003`
- **Title:** Implement Partner Draft Approval and Rejection Endpoints
- **Priority:** P0 (Blocker)
- **Dependencies:** `ADM-001`, `ADM-002`
- **Relevant Files:**
  - `backend/app/api/v1/admin.py`
  - `backend/app/schemas/admin.py`
  - `backend/app/models/catalog.py`
- **Description:**  
  Implement moderation endpoints enabling platform administrators to review submitted partner drafts. Approving a draft atomically updates `partner_drafts.status = 'APPROVED'`, updates the user's role to `PROFESSIONAL` or `SALON_OWNER`, and provisions the initial specialist profile or salon record.
- **Acceptance Criteria:**
  - `GET /api/v1/admin/partners/drafts` lists drafts filtered by status (`PENDING`, `APPROVED`, `REJECTED`).
  - `PATCH /api/v1/admin/partners/drafts/{id}/approve` transitions status and promotes user role.
  - `PATCH /api/v1/admin/partners/drafts/{id}/reject` requires a rejection note.
  - All moderation actions write an entry into `admin_audit_logs`.
- **Verification Requirements:**
  - Automated test in `tests/test_admin.py` testing draft submission, approval flow, and role transition.
- **Completion Status:** `passed: false`

---

### Story ADM-004: Backend User Role Management & Profile Administration
- **Story ID:** `ADM-004`
- **Title:** Implement Admin User Role Promotion and Detailed Account Queries
- **Priority:** P1 (High)
- **Dependencies:** `ADM-002`
- **Relevant Files:**
  - `backend/app/api/v1/admin.py`
  - `backend/app/schemas/admin.py`
- **Description:**  
  Provide administrative capabilities to promote/demote user roles (`PATCH /api/v1/admin/users/{id}/role`) and fetch comprehensive user details including order history count and active bookings count.
- **Acceptance Criteria:**
  - Endpoint validates permissible role transitions.
  - Prevents an admin from demoting their own account.
  - Every role modification triggers an audit log record.
- **Verification Requirements:**
  - Pytest testing role update and self-demotion prevention.
- **Completion Status:** `passed: false`

---

### Story ADM-005: Backend Platform Analytics & Vertical GMV Breakdown
- **Story ID:** `ADM-005`
- **Title:** Expand Admin Analytics with Vertical GMV & Growth Trajectories
- **Priority:** P1 (High)
- **Dependencies:** None
- **Relevant Files:**
  - `backend/app/api/v1/admin.py`
  - `backend/app/schemas/admin.py`
- **Description:**  
  Enhance `GET /api/v1/admin/stats` to return discrete Gross Merchandise Value (GMV) metrics partitioned by At-Home Services, Salon Visits, and E-Commerce Store sales, alongside 30-day booking and order volume aggregates.
- **Acceptance Criteria:**
  - Response includes `services_gmv`, `salons_gmv`, `ecommerce_gmv`, and `total_gmv`.
  - Calculates average booking value and average order value.
- **Verification Requirements:**
  - Pytest verifying correct mathematical aggregation against seeded data.
- **Completion Status:** `passed: false`

---

### Story ADM-006: Frontend API Client Extension for Admin Governance
- **Story ID:** `ADM-006`
- **Title:** Add Admin API Methods in `src/api.js`
- **Priority:** P0 (Blocker)
- **Dependencies:** `ADM-002`, `ADM-003`, `ADM-004`, `ADM-005`
- **Relevant Files:**
  - `src/api.js`
- **Description:**  
  Add client-side functions in `src/api.js`: `apiGetAdminStats()`, `apiGetAdminUsers()`, `apiToggleUserStatus()`, `apiUpdateUserRole()`, `apiGetAdminDrafts()`, `apiApprovePartnerDraft()`, `apiRejectPartnerDraft()`, and `apiGetAuditLogs()`.
- **Acceptance Criteria:**
  - All methods pass the Bearer token automatically via `apiRequest()`.
  - Error responses emit actionable UI notifications.
- **Verification Requirements:**
  - Code inspection and invocation verification in browser console.
- **Completion Status:** `passed: false`

---

### Story ADM-007: Dedicated `/admin` Frontend SPA Route & Command Centre Shell
- **Story ID:** `ADM-007`
- **Title:** Decouple Admin from Partner View into Dedicated `/admin` SPA Layout
- **Priority:** P0 (Blocker)
- **Dependencies:** `ADM-006`
- **Relevant Files:**
  - `src/app.js`
  - `src/styles.css`
  - `index.html`
- **Description:**  
  Remove the administrative tab from the Partner page. Create a dedicated `adminPage()` view handler in `src/app.js` with an editorial dark luxury layout, persistent sidebar navigation (Overview, Moderation, Users, Bookings, Orders, Audit Logs), header bar with active admin identity, and client-side route guard.
- **Acceptance Criteria:**
  - Navigating to `admin` route renders the dedicated command centre shell.
  - Non-admin users are blocked and redirected to `home` with an alert.
  - Responsive across mobile, tablet, and desktop viewports.
- **Verification Requirements:**
  - Manual browser testing and Vite build verification.
- **Completion Status:** `passed: false`

---

### Story ADM-008: Frontend Partner Onboarding Moderation Queue & Modals
- **Story ID:** `ADM-008`
- **Title:** Implement Partner Draft Review Queue with Approval/Rejection Modals
- **Priority:** P0 (Blocker)
- **Dependencies:** `ADM-007`
- **Relevant Files:**
  - `src/app.js`
  - `src/styles.css`
- **Description:**  
  Build the moderation queue interface in `adminPage()`. Lists submitted drafts with business type badges (`Professional` vs `Salon`), applicant name, and submission timestamp. Clicking "Review Application" opens a modal displaying submitted certifications and permits with "Approve Application" and "Reject with Reason" action buttons.
- **Acceptance Criteria:**
  - Clicking "Approve" triggers `apiApprovePartnerDraft()`, removes draft from pending view, and updates status badge.
  - Clicking "Reject" prompts for a rejection reason, calls `apiRejectPartnerDraft()`, and updates state.
- **Verification Requirements:**
  - UI walkthrough of approval and rejection flows.
- **Completion Status:** `passed: false`

---

### Story ADM-009: Frontend User Governance & Role Management Interface
- **Story ID:** `ADM-009`
- **Title:** Implement User Directory Table with Role Selector & Status Toggling
- **Priority:** P1 (High)
- **Dependencies:** `ADM-007`
- **Relevant Files:**
  - `src/app.js`
- **Description:**  
  Construct an interactive user management data table featuring search by name/email, role filtering tabs, account status toggles (`Active` / `Suspended`), and role promotion dropdowns.
- **Acceptance Criteria:**
  - Instant UI update upon toggling user active status.
  - Prevents admin self-suspension from the client interface.
- **Verification Requirements:**
  - Interactive status toggle and role update verification.
- **Completion Status:** `passed: false`

---

### Story ADM-010: Frontend Audit Log Inspector & Executive Analytics Dashboard
- **Story ID:** `ADM-010`
- **Title:** Implement Immutable Audit Log Viewer and Executive KPI Widgets
- **Priority:** P1 (High)
- **Dependencies:** `ADM-007`
- **Relevant Files:**
  - `src/app.js`
- **Description:**  
  Build the Overview and Audit Log tabs in the Admin Command Centre:
  - Overview: Key KPI cards (Total GMV, Monthly Bookings, E-Commerce Volume, Active Partners) and vertical contribution bars.
  - Audit Log: Chronological ledger table displaying timestamp, admin user, action taken, target type/ID, and expandable JSON details.
- **Acceptance Criteria:**
  - Live data hydration from `/api/v1/admin/stats` and `/api/v1/admin/audit-logs`.
  - Clean pagination controls for audit records.
- **Verification Requirements:**
  - Data rendering verified against live API responses.
- **Completion Status:** `passed: false`

---

### Story ADM-011: Automated Integration & Verification Test Suite for Admin
- **Story ID:** `ADM-011`
- **Title:** Create Comprehensive Automated Pytest & Regression Suite for Phase 2
- **Priority:** P0 (Blocker)
- **Dependencies:** `ADM-001` through `ADM-010`
- **Relevant Files:**
  - `tests/test_admin.py`
  - `tests/test_moderation.py`
- **Description:**  
  Write automated integration tests covering the complete Phase 2 feature set: audit log generation, partner draft moderation, user role modifications, unauthorized access blocking, and executive analytics aggregation.
- **Acceptance Criteria:**
  - All new tests pass with 100% success rate.
  - All existing 12 tests continue to pass (zero regressions).
  - Clean `npm run build` succeeds without bundle errors.
- **Verification Requirements:**
  - Execute `pytest -v tests/` and `npm run build`.
- **Completion Status:** `passed: false`

---

## 3. Ralph `prd.json` Export Specification

When Phase 2 execution begins, this catalog can be serialized directly into Ralph's `prd.json`:

```json
{
  "project": "GlamGo",
  "phase": "Phase 2 - Administrator Command Centre & Platform Governance",
  "version": "1.0.0",
  "stories": [
    {
      "id": "ADM-001",
      "title": "Database Migration for admin_audit_logs and partner_drafts",
      "priority": "P0",
      "dependencies": [],
      "passed": false
    },
    {
      "id": "ADM-002",
      "title": "Backend Admin Audit Logging Engine",
      "priority": "P0",
      "dependencies": ["ADM-001"],
      "passed": false
    },
    {
      "id": "ADM-003",
      "title": "Backend Partner Onboarding Moderation APIs",
      "priority": "P0",
      "dependencies": ["ADM-001", "ADM-002"],
      "passed": false
    },
    {
      "id": "ADM-004",
      "title": "Backend User Role Management & Profile Administration",
      "priority": "P1",
      "dependencies": ["ADM-002"],
      "passed": false
    },
    {
      "id": "ADM-005",
      "title": "Backend Platform Analytics & Vertical GMV Breakdown",
      "priority": "P1",
      "dependencies": [],
      "passed": false
    },
    {
      "id": "ADM-006",
      "title": "Frontend API Client Extension for Admin Governance",
      "priority": "P0",
      "dependencies": ["ADM-002", "ADM-003", "ADM-004", "ADM-005"],
      "passed": false
    },
    {
      "id": "ADM-007",
      "title": "Dedicated /admin Frontend SPA Route & Command Centre Shell",
      "priority": "P0",
      "dependencies": ["ADM-006"],
      "passed": false
    },
    {
      "id": "ADM-008",
      "title": "Frontend Partner Onboarding Moderation Queue & Modals",
      "priority": "P0",
      "dependencies": ["ADM-007"],
      "passed": false
    },
    {
      "id": "ADM-009",
      "title": "Frontend User Governance & Role Management Interface",
      "priority": "P1",
      "dependencies": ["ADM-007"],
      "passed": false
    },
    {
      "id": "ADM-010",
      "title": "Frontend Audit Log Inspector & Executive Analytics Dashboard",
      "priority": "P1",
      "dependencies": ["ADM-007"],
      "passed": false
    },
    {
      "id": "ADM-011",
      "title": "Automated Integration & Verification Test Suite for Admin",
      "priority": "P0",
      "dependencies": ["ADM-001", "ADM-002", "ADM-003", "ADM-004", "ADM-005", "ADM-006", "ADM-007", "ADM-008", "ADM-009", "ADM-010"],
      "passed": false
    }
  ]
}
```
