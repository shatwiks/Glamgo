# GLAMGO — PHASE 4 TEST PLAN & VERIFICATION HARNESS
# PARTNER ECOSYSTEM & BUSINESS OPERATIONS

**Document Version:** 1.0.0  
**Phase:** Phase 4 — Partner Ecosystem & Business Operations  
**Date:** November 11, 2026  
**Status:** Approved for Implementation  

---

## 1. TESTING STRATEGY & SCOPE

The Phase 4 test harness verifies the operational capabilities, governance controls, and security posture of GlamGo's partner ecosystem across all three supply-side verticals.

### Core Testing Pillars
1. **Application & Governance:** Verify multi-persona onboarding, validation, duplicate prevention, and administrative moderation.
2. **Operational Dashboards:** Verify Independent Professional, Salon Owner, and Product Seller workflows.
3. **Financial Integrity:** Verify 15% commission calculations, refund deductions, and real settlement tracking.
4. **Security & BOLA/IDOR Protection:** Verify that cross-partner data mutations and unauthorized role escalations are strictly rejected with `HTTP 403 Forbidden`.
5. **Full Regression:** Execute the full baseline test suite (28 existing tests + new Phase 4 suite) with 100% pass rate.
6. **Production Build Health:** Verify clean Vite 7 bundle compilation with zero runtime errors.

---

## 2. AUTOMATED TEST CASES (`tests/test_partner_phase4.py`)

| Test Function | Target Stories | Verification Objectives |
| :--- | :--- | :--- |
| `test_partner_application_and_duplicate_prevention` | `PART-001`, `PART-002` | Verifies application submission, schema validation, duplicate `PENDING` conflict (409), and rejection of existing partner re-application. |
| `test_admin_partner_approval_and_role_escalation` | `PART-001`, `PART-002` | Verifies admin review in moderation queue, approval, role promotion, profile auto-provisioning, and audit logging. |
| `test_professional_profile_and_services_management` | `PART-003`, `PART-004` | Verifies pro profile reading/updating, linking master catalog services to professional, and unlinking services. |
| `test_professional_availability_and_booking_lifecycle` | `PART-005` | Verifies availability day toggles, booking retrieval, and transition from `confirmed` to `completed`. |
| `test_salon_profile_and_staff_roster_management` | `PART-006`, `PART-007` | Verifies salon profile update, staff addition with specialty, staff deletion, and ownership verification. |
| `test_salon_appointment_management` | `PART-008` | Verifies salon appointment retrieval and appointment completion status update. |
| `test_seller_product_variants_and_inventory_alerts` | `PART-009`, `PART-010` | Verifies product creation by seller, variant creation, stock update, and low-stock alert notification generation. |
| `test_seller_order_fulfillment_lifecycle` | `PART-011` | Verifies incoming orders retrieval and fulfillment state progression (`placed` → `packed` → `in_transit` → `delivered`). |
| `test_partner_financial_statements_and_commission` | `PART-012` | Verifies gross sales, 15% platform commission computation, refund deductions, and transaction-level statement formatting. |
| `test_partner_operational_notifications` | `PART-013` | Verifies in-app notification dispatch on booking status changes, order fulfillment, low stock, and moderation decisions. |
| `test_partner_idor_and_bola_security_enforcement` | `PART-005`, `PART-008`, `PART-011` | Verifies that Partner A cannot modify Partner B's bookings, salon staff, products, or orders (strict 403 Forbidden). |

---

## 3. EXECUTION HARNESS COMMANDS

```powershell
# 1. Execute dedicated Phase 4 test suite
.venv\Scripts\pytest -v tests/test_partner_phase4.py

# 2. Execute full project regression suite (Phase 1, 2, 2.1, 3, and 4)
.venv\Scripts\pytest -v tests/

# 3. Verify frontend production compilation
npm run build
```

---

## 4. PASS / FAIL CRITERIA
- **Pass Threshold:** 100% test pass rate across all suites.
- Zero database state corruption or dropped records.
- Zero unhandled exceptions or 500 Internal Server Errors.
- Vite build completes in `< 1500ms` with zero warnings/errors.
