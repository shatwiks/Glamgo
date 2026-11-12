# GLAMGO — PHASE 3 TEST PLAN & VERIFICATION HARNESS

**Document Version:** 1.0.0  
**Phase:** Phase 3 — Customer Experience & Core Booking Engine  
**Status:** Approved Test Specification  

---

## 1. SCOPE & OBJECTIVES

This test plan defines the automated and conversational verification requirements for GlamGo's customer marketplace experience and core booking engine across all 13 stories (`CUST-001` to `CUST-013`).

Testing covers:
1. Concurrency and double-booking conflict prevention with row locking.
2. Server-side financial calculations (subtotal, coupon caps, net totals).
3. Cryptographic HMAC signature verification for Razorpay payments.
4. BOLA / IDOR security enforcement across customer bookings and orders.
5. Frontend SPA rendering, navigation, and Vite production bundle integrity.

---

## 2. AUTOMATED TEST SUITE: `tests/test_customer_phase3.py`

### Test Cases Matrix:

| Test ID | Test Function | Target Story | Validated Criteria |
|---|---|---|---|
| **TC-CUST-01** | `test_customer_profile_and_address_lifecycle` | `CUST-001`, `CUST-002` | Profile update, address creation, address deletion, default address selection. |
| **TC-CUST-02** | `test_services_catalog_categories_and_search` | `CUST-003` | Live categories distinct listing, category filter, case-insensitive keyword search. |
| **TC-CUST-03** | `test_professionals_directory_and_availability` | `CUST-004` | Verified specialists listing, availability days extraction. |
| **TC-CUST-04** | `test_salon_directory_and_staff_details` | `CUST-005`, `CUST-006` | Salon listing, area filter, profile retrieval, staff listing with specialties. |
| **TC-CUST-05** | `test_booking_creation_and_row_lock_concurrency` | `CUST-007`, `CUST-008` | Booking creation, row lock double-booking rejection (`409 Conflict`), dynamic specialist assignment. |
| **TC-CUST-06** | `test_booking_cancellation_and_idor_protection` | `CUST-008` | Customer cancellation (`200 OK`), completion rejection (`403 Forbidden`), foreign customer cancellation rejection (`403 Forbidden`). |
| **TC-CUST-07** | `test_order_checkout_inventory_and_coupon_enforcement` | `CUST-009` | Stock decrement with `with_for_update()`, coupon discount calculation, out-of-stock rejection (`400 Bad Request`). |
| **TC-CUST-08** | `test_razorpay_order_and_signature_verification_lifecycle` | `CUST-010` | Payment order creation, valid HMAC-SHA256 verification (`captured`), tampered signature rejection (`400 Bad Request`), foreign user payment verification rejection (`403 Forbidden`). |
| **TC-CUST-09** | `test_reviews_creation_and_customer_notifications` | `CUST-011`, `CUST-012` | Verified review submission, my reviews listing, notification trigger on booking and order placement. |

---

## 3. REGRESSION & SECURITY GATES

Before marking any story or milestone as passed:
1. **Full Pytest Suite:** All existing tests (`test_admin.py`, `test_admin_phase2.py`, `test_auth.py`, `test_bookings.py`, `test_catalog.py`, `test_orders.py`, `test_partners.py`, `test_payments.py`, `test_reviews.py`) plus the new `test_customer_phase3.py` must achieve **100% pass rate**.
2. **Frontend Production Build:** `npm run build` must compile cleanly with exit code 0 and zero module errors.
3. **Database Integrity:** Zero unhandled Alembic migrations; active schema remains at head.
