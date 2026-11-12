# GLAMGO — PHASE 2.1 FINANCIAL ANALYTICS & REVENUE VALIDATION REPORT

**Date:** November 11, 2026  
**Auditor:** Principal Software Architect & Financial Systems QA  
**Scope:** SQL queries and calculations in `GET /api/v1/admin/stats`, GMV calculation across verticals, average ticket values, cancellation handling, and commission reporting.  

---

## 1. FINANCIAL QUERY ARCHITECTURE

The platform financial metrics returned by `GET /api/v1/admin/stats` are computed dynamically via SQLAlchemy aggregation over PostgreSQL tables `bookings` and `orders`:

```python
booking_revenue = db.query(func.coalesce(func.sum(Booking.price), 0.0)).filter(
    Booking.status != BookingStatus.CANCELLED
).scalar() or 0.0

order_revenue = db.query(func.coalesce(func.sum(Order.total), 0.0)).filter(
    Order.status != OrderStatus.CANCELLED
).scalar() or 0.0

services_gmv = db.query(func.coalesce(func.sum(Booking.price), 0.0)).filter(
    Booking.type == "home",
    Booking.status != BookingStatus.CANCELLED
).scalar() or 0.0

salons_gmv = db.query(func.coalesce(func.sum(Booking.price), 0.0)).filter(
    Booking.type == "salon",
    Booking.status != BookingStatus.CANCELLED
).scalar() or 0.0

ecommerce_gmv = order_revenue

gmv = round(booking_revenue + order_revenue, 2)
platform_commission = round(gmv * 0.15, 2)
```

---

## 2. DATA VALIDATION AGAINST DATABASE RECORDS

An independent verification script was executed against all records in `bookings` and `orders`.

### 2.1 Bookings Breakdown
- **Total Bookings in Database:** 37
- **Active / Confirmed Bookings:** 27
- **Cancelled Bookings:** 10
- **Home Services GMV:** ₹28,481.00
- **Salon Visits GMV:** ₹7,192.00
- **Total Booking Revenue (Home + Salon):** ₹35,673.00
- **Reconciliation:** `Home GMV (₹28,481.00) + Salon GMV (₹7,192.00) == Total Booking Revenue (₹35,673.00)` (Exact 100% match).

### 2.2 E-Commerce Orders Breakdown
- **Total Orders in Database:** 19
- **Active Orders:** 19
- **Cancelled Orders:** 0
- **Total Order Revenue (E-Commerce GMV):** ₹67,830.00
- **Reconciliation:** Sum of individual order totals equals ₹67,830.00 (Exact match).

### 2.3 Gross Merchandise Value & Commission
- **Total GMV:** ₹35,673.00 (Bookings) + ₹67,830.00 (Orders) = **₹103,503.00**
- **Platform Commission (15%):** `103,503.00 * 0.15` = **₹15,525.45**
- **Reconciliation:** Mathematical precision verified against both database scalar functions and direct Python calculations.

---

## 3. AUDIT FINDINGS

### Finding FIN-001 (Severity: MEDIUM): Average Ticket Calculation Deflation
- **Affected File:** `backend/app/api/v1/admin.py` (lines 56, 62).
- **Description:**  
  The average booking value is calculated as:
  ```python
  total_bookings = db.query(func.count(Booking.id)).scalar() or 0
  avg_booking_val = round(booking_revenue / total_bookings, 2) if total_bookings > 0 else 0.0
  ```
  `total_bookings` counts **all 37 bookings**, including the 10 cancelled bookings. However, `booking_revenue` specifically excludes cancelled bookings.
- **Mathematical Impact:**
  - `Reported Value:` ₹35,673.00 / 37 bookings = **₹964.14**
  - `True Active Average Value:` ₹35,673.00 / 27 active bookings = **₹1,321.22**
  - This calculation error deflates the average booking value by **27.02%**, providing executive stakeholders with misleading unit economics.
- **Remediation:**  
  Compute the average over active revenue-generating transactions:
  ```python
  active_bookings_count = db.query(func.count(Booking.id)).filter(
      Booking.status != BookingStatus.CANCELLED
  ).scalar() or 0
  avg_booking_val = round(booking_revenue / active_bookings_count, 2) if active_bookings_count > 0 else 0.0
  ```

---

## 4. FINANCIAL VOCABULARY & ACCOUNTING RULES (INFORMATIONAL)

To ensure consistency in upcoming phases (Phase 4 Payments and Razorpay settlement):
1. **Gross Merchandise Value (GMV):** Defined as the total nominal value of all active, fulfilled, or in-flight services and product orders placed on GlamGo (excluding cancellations).
2. **Platform Commission:** The 15% marketplace service fee retained by GlamGo before partner disbursements.
3. **Refunds & Cancellations:** When an appointment or order is cancelled, its value is entirely excluded from GMV and platform commission.
