# GLAMGO — PHASE 3 PRD: CUSTOMER EXPERIENCE & CORE BOOKING ENGINE

**Document Version:** 1.0.0  
**Phase:** Phase 3 — Customer Experience & Core Booking Engine  
**Target Delivery Date:** November 11, 2026  
**Status:** Approved for Implementation Planning  
**Architect:** Principal Software Architect & Lead Full-Stack Engineer  

---

## 1. OBJECTIVE & BUSINESS SCOPE

The objective of Phase 3 is to transform GlamGo's customer application from a simulated frontend into a fully functional, production-ready luxury beauty marketplace across all three core verticals:
1. **At-Home Beauty Services:** On-demand and scheduled doorstep treatments by certified beauty specialists.
2. **Salon & Parlour Discovery:** Verified premium salon directory, treatments, staff schedules, and appointment bookings.
3. **Beauty E-Commerce Store:** Curated luxury cosmetic retail, real-time stock management, cart checkout, and shipment tracking.

The entire customer journey—from discovery and real-time availability checks, through conflict-proof scheduling, server-validated checkout with Razorpay payments, to self-service cancellation, order tracking, and verified reviews—must operate over authentic PostgreSQL database state with zero reliance on mock data.

---

## 2. ARCHITECTURAL PILLARS & NON-NEGOTIABLES

1. **Stack Preservation:**
   - Frontend: Vanilla JavaScript ES modules + Vite 7 + custom luxury editorial CSS design system (`Cormorant Garamond` + `Manrope`, luxury ivory, dark obsidian `#1a1917`, champagne `#c5a77d`).
   - Backend: Python 3.14 FastAPI + SQLAlchemy 2.0.
   - Database: PostgreSQL 16 + Alembic migrations.
   - Payments: Razorpay order creation and HMAC-SHA256 signature verification.
2. **Server-Side Financial & Inventory Authority:**
   - All pricing, discounts, taxes, and final totals are calculated and validated exclusively on the server.
   - Client-provided amounts in payment orders are never trusted.
   - Product inventory is locked (`with_for_update()`) and decremented inside database transactions.
3. **Concurrency & Double-Booking Prevention:**
   - Specialists and salon slots are row-locked (`with_for_update()`) during booking creation.
   - Conflicting slots trigger `409 Conflict` with clear user messaging.
4. **Strict Authorization & IDOR/BOLA Protection:**
   - Customers can only read and mutate their own bookings, orders, addresses, and reviews.
   - Any attempt to view or cancel another customer's resource returns `403 Forbidden`.
   - Customers can only cancel their appointments; completing or modifying appointments requires provider or admin privileges.
5. **Zero Data Loss & Database Integrity:**
   - Active database records are strictly preserved; no destructive table drops or resets.

---

## 3. USER STORIES & ACCEPTANCE CRITERIA (CUST-001 TO CUST-013)

### Milestone A — Customer Foundation

#### `CUST-001` (P0): Customer Authentication, Token Refresh & Session Persistence
- **Description:** Implement persistent authentication and session restoration for customer accounts.
- **Dependencies:** None.
- **Acceptance Criteria:**
  1. On page load, `init()` checks for an existing JWT access token and refresh token via `tokenStorage`.
  2. If token is present, verifies identity via `GET /api/v1/users/profile` and populates `state.user` (`id`, `name`, `email`, `phone`, `role`).
  3. If token is expired, attempts refresh via `POST /api/v1/auth/refresh`; on failure, clears tokens and routes to login modal.
  4. Logging in or registering seamlessly hydrates user state and closes the auth modal without dropping intended route.
  5. Logout clears all stored tokens (`access_token`, `refresh_token`), resets state, and re-renders the landing view.

#### `CUST-002` (P1): Profile Management, Saved Addresses & Location Sync
- **Description:** Enable customers to manage personal details and multiple delivery/service addresses.
- **Dependencies:** `CUST-001`.
- **Acceptance Criteria:**
  1. Customer can view and update their full name and phone number via `PUT /api/v1/users/profile`.
  2. Customer can view saved addresses from `GET /api/v1/users/addresses`.
  3. Customer can add a new address (`label`, `text`, `city`) via `POST /api/v1/users/addresses`.
  4. Customer can delete an address via `DELETE /api/v1/users/addresses/{id}` with immediate UI updates.
  5. Location selector in header updates `state.location` and sets default address for doorstep services.

---

### Milestone B — At-Home Beauty Services

#### `CUST-003` (P0): Dynamic Service Categories, Live Search & Sorting
- **Description:** Power the At-Home services vertical with live backend categories, real-time search, and sorting.
- **Dependencies:** `CUST-001`.
- **Acceptance Criteria:**
  1. Service categories are fetched dynamically from `GET /api/v1/services/categories`.
  2. Selecting a category filter chips updates the view with matching services from `GET /api/v1/services/?category=...`.
  3. Global search bar filters doorstep services by name and description with responsive debounce.
  4. Filter by sorting options: Price (Low to High, High to Low), Duration, and Popularity/Rating.
  5. Service cards display duration, rating, review count, price in INR, and "Book now" CTA.

#### `CUST-004` (P0): Verified Professional Directory & Availability Discovery
- **Description:** Display verified beauty professionals and dynamic schedule availability for doorstep care.
- **Dependencies:** `CUST-003`.
- **Acceptance Criteria:**
  1. Displays certified specialists from `GET /api/v1/professionals/?specialty=...` with verified badge, specialty, experience, rating, and starting price.
  2. Professional profile card or detail modal displays available days fetched from `GET /api/v1/professionals/{id}/availability`.
  3. Clicking "Book specialist" initiates the booking flow with the specialist pre-selected.

---

### Milestone C — Salon Discovery

#### `CUST-005` (P0): Salon Directory, Area Filtering & Profile Pages
- **Description:** Discover luxury salons with neighbourhood filtering, photo galleries, and details.
- **Dependencies:** `CUST-001`.
- **Acceptance Criteria:**
  1. Salons listed from `GET /api/v1/salons` with area, rating, price band, opening hours, and tags.
  2. Filter salons by area (e.g., Bandra West, Juhu, Khar West) and treatment category.
  3. Dedicated salon profile view (`salon-detail`) displaying description, address, operating hours, amenities, and available services.
  4. Salon detail view renders salon staff members with specialties and photos from `staff` relationship.

#### `CUST-006` (P0): Salon Treatment Selection & Booking Entry Point
- **Description:** Enable customers to choose specific treatments at a salon and enter the scheduling flow.
- **Dependencies:** `CUST-005`.
- **Acceptance Criteria:**
  1. Salon treatments are listed on the salon detail page with duration and pricing.
  2. Clicking "Book appointment" on a salon treatment launches the booking engine pre-filled with the salon and service.
  3. Customer can pick a specific salon staff member or choose "Any available expert".

---

### Milestone D — Core Booking Engine

#### `CUST-007` (P0): Multi-Step Booking Wizard with Slot Availability Validation
- **Description:** High-precision booking wizard guiding customers through service, provider, date, time slot, and address selection.
- **Dependencies:** `CUST-003`, `CUST-004`, `CUST-006`.
- **Acceptance Criteria:**
  1. Wizard supports 4 structured steps:
     - Step 1: Service Confirmation & Duration.
     - Step 2: Professional / Staff Selection (Specific specialist or dynamic dispatch).
     - Step 3: Date & Time Slot Selection (next 14 days, validated available slots).
     - Step 4: Location (Saved address selector for home, or salon address) & Price Summary.
  2. Selecting date and time checks against conflicting bookings.
  3. Clear validation feedback if required selections are missing before advancing steps.

#### `CUST-008` (P0): Transactional Booking Creation, Row-Lock Conflict Prevention & Cancellation Lifecycle
- **Description:** Backend transactional booking creation with concurrency protection and customer cancellation rules.
- **Dependencies:** `CUST-007`.
- **Acceptance Criteria:**
  1. Invokes `POST /api/v1/bookings/` inside a database transaction.
  2. Row-locks existing bookings (`with_for_update()`) to prevent double-booking the same specialist at the same date and time.
  3. If conflict occurs, returns `409 Conflict` with clear user toast notification.
  4. On success, generates unguessable booking ID (`BK-XXXXXXXX`), adds customer confirmation notification, and navigates to `booking-success`.
  5. In `My bookings` tab, customer can view active appointments and cancel upcoming bookings via `PATCH /api/v1/bookings/{id}/status` with `status: "cancelled"`.
  6. Customer cannot cancel other customers' bookings (returns `403 Forbidden`).
  7. Customer cannot set status to `completed` or `in_progress` (returns `403 Forbidden`).

---

### Milestone E — Checkout and Payments

#### `CUST-009` (P0): E-Commerce Cart, Server-Validated Checkout & Coupon Engine
- **Description:** Cart management, server-side price recalculation, and promotional coupon discounts.
- **Dependencies:** `CUST-001`, `CUST-002`.
- **Acceptance Criteria:**
  1. Cart persists across session; allows incrementing, decrementing, and removing items.
  2. Checkout page requires selected delivery address from saved addresses or prompts address creation.
  3. Validates coupon code against `POST /api/v1/orders/coupon/validate` (e.g. `GLAM10` 10% discount, max ₹300).
  4. Invokes `POST /api/v1/orders/` which re-verifies inventory with `with_for_update()`, decrements stock, validates coupon server-side, and generates `GG-XXXXXXXX` order ID.
  5. Rejects out-of-stock orders with `400 Bad Request`.

#### `CUST-010` (P0): Razorpay Payment Integration & Server Signature Verification
- **Description:** End-to-end payment processing with Razorpay order creation, client modal, and server HMAC-SHA256 verification.
- **Dependencies:** `CUST-008`, `CUST-009`.
- **Acceptance Criteria:**
  1. For online payments (UPI, Card), backend creates a Razorpay payment order via `POST /api/v1/payments/razorpay/create-order`.
  2. Backend recalculates order/booking total server-side instead of trusting client amounts.
  3. Integrates Razorpay checkout workflow; handles successful payment response (`razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`).
  4. Submits payment details to `POST /api/v1/payments/razorpay/verify`.
  5. Backend cryptographically verifies signature using HMAC-SHA256 with `RAZORPAY_KEY_SECRET`.
  6. On successful verification, transaction status is updated to `captured`, and order/booking payment status is marked `completed`.
  7. Supports Cash on Delivery (COD) mode with `pending` payment status.
  8. For cancelled bookings/orders with captured payments, marks refund status as `pending_refund`.

---

### Milestone F — Customer Account and Notifications

#### `CUST-011` (P1): Unified Order & Appointment History with Order Tracking
- **Description:** Complete customer portal displaying upcoming appointments, past treatments, and order tracking.
- **Dependencies:** `CUST-008`, `CUST-009`.
- **Acceptance Criteria:**
  1. `My bookings` tab categorizes appointments into Upcoming and Past with service name, provider, date, time, location, price, and status badge.
  2. Each booking displays a "Cancel appointment" button if status is `confirmed`.
  3. `My orders` tab lists historical retail purchases with order ID, date, items, total, and payment method.
  4. "Track order" button opens `trackingPage` showing visual 4-step progress: `Order placed` -> `Packed with care` -> `On its way` -> `Delivered`.

#### `CUST-012` (P1): Verified Reviews & In-App Notification Center
- **Description:** Customer feedback loop for completed services and retail products, plus notifications.
- **Dependencies:** `CUST-008`, `CUST-011`.
- **Acceptance Criteria:**
  1. `Reviews` tab displays customer's verified review history from `GET /api/v1/reviews/my`.
  2. Customer can submit a review with 1-5 star rating and comment for booked services or purchased products via `POST /api/v1/reviews/`.
  3. Submissions update service/product ratings dynamically.
  4. Header notification bell displays unread badge if new notifications exist.
  5. Clicking notification bell displays notifications modal with timestamps and event details.

---

### Milestone G — Integration and Regression

#### `CUST-013` (P0): End-to-End Regression Harness & Production Verification
- **Description:** Full-scope automated test suite covering all customer workflows and ensuring zero regressions in admin and partner features.
- **Dependencies:** All previous stories (`CUST-001` through `CUST-012`).
- **Acceptance Criteria:**
  1. Author `tests/test_customer_phase3.py` with comprehensive tests:
     - Customer registration, login, profile edit, address management.
     - Service discovery, category filtering, search.
     - Salon discovery, detail retrieval, staff assignment.
     - Booking creation, double-booking conflict prevention (409).
     - Customer booking cancellation and RBAC/IDOR protection (403 on foreign bookings).
     - Cart order creation, inventory decrement, coupon validation.
     - Razorpay order creation, valid signature verification, tampered signature rejection (400).
     - Review submission and rating update.
  2. Full test suite (`pytest -v tests/`) achieves 100% pass rate.
  3. Vite 7 production build (`npm run build`) compiles cleanly with exit code 0.
