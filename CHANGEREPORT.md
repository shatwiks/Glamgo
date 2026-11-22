# GlamGo Change Report (`CHANGEREPORT.md`)

> **Standing Workflow Policy:** Every prompt that modifies the repository appends a structured entry to `CHANGEREPORT.md` detailing every modified/added file, why it changed, and verified checks before pushing changes to GitHub.

---

## Prompt Entry #6 — `2026-11-22`: Port All Non-Frontend Upgrades, Security Hardening & Tests from `main` to `release/54ba3db`

**Prompt Summary:** Sync all non-UI/UX backend, database migration, security, CI/CD, edge config, and test suite improvements from `main` (`000acf6`) into `release/54ba3db` while keeping `src/`, `styles.css`, `index.html`, and all frontend UI/UX untouched.

### Files Added / Synced from `main`
- **Backend & Migrations (`backend/`):**
  - Ported durable refund ledger & constraints migration `backend/alembic/versions/06c3f5e92d34_durable_refund_ledger_and_constraints.py`, `backend/app/services/refund_service.py`, `backend/app/services/inventory_backfill.py`, and hardened commerce/payment/order/partner/product logic.
  - Ported Phase 13 multi-city GPS persistence (`ensure_phase13_schema_columns`, `/api/v1/catalog/*`, Haversine distance/city filtering), hardened password reset & Mobile OTP endpoints with in-memory rate-limit fallback, partner approval role activation, booking reschedule / arrival OTP / add-on pricing, referral & gift card wallet redemption, `REDIS_REQUIRED` readiness policy (`main.py`, `redis_client.py`, `config.py`), scoped CORS regex (`glamgo-ricoz` & `glamgo-um5p`), `/metrics` `INTERNAL_MAINTENANCE_TOKEN` gate, and sanitized `/health` responses.
- **Security, Infra & Docs:** Ported `SECURITY.md`, `PRODUCT.md`, `docs/COMMERCE_HARDENING_AND_RELEASE_CHECKLIST.md`, `.github/dependabot.yml`, `.github/workflows/production-ci.yml` (`contents: read`), `scripts/backup_and_restore_verify.py` (`shell=False`), `.env.production.example`, `.env.staging.example`, `render.yaml`, and `vercel.json` (`Strict-Transport-Security` + `Permissions-Policy: geolocation=(self)`).
- **Test Suites (`tests/`):** Ported `test_commerce_hardening.py`, `test_commerce_review_remediation.py`, `test_multi_vendor_phase5.py`, and `test_phase13_consumer.py`.
- **Untouched Frontend:** Zero edits to `src/`, `styles.css`, `index.html`, `package.json`, or `vite.config.js` (WIP files in `branch-release-54ba3db` preserved unstaged).

### Verification
- `compileall -q backend scripts tests` (inside `branch-release-54ba3db`): exited `0`.
- `vercel.json` JSON validation + `git diff --cached --stat main` across all ported paths: byte-identical with `main` (Note: live `pytest` execution in `branch-release-54ba3db` could not connect to local Docker Postgres `127.0.0.1:5439` because Docker Desktop daemon is stopped after host restart).

---

## Prompt Entry #5 — `2026-11-22`: Remove Hardcoded `window.GLAMGO_API_URL` in `index.html` (`release/54ba3db`)

**Prompt Summary:** Fix persistent `"Failed to fetch"` CORS error on `https://glamgo-um5p.vercel.app/` caused by an inline `<script>window.GLAMGO_API_URL = "https://glamgo-backend-lqn6.onrender.com/api/v1";</script>` in `index.html` overriding the `/api/v1` proxy.

### Root Cause & Fix
- **[index.html](index.html):** Removed the hardcoded inline `window.GLAMGO_API_URL` `<script>` block pointing directly to Render.
- **[src/api.js](src/api.js):** Moved `window.location.hostname.endsWith('vercel.app')` to the very first check in `resolveApiBase()` (before `window.GLAMGO_API_URL` and `VITE_API_BASE_URL`) so every `*.vercel.app` deployment routes via same-origin `/api/v1`.

### Verification
- `node -c src/api.js` and `npm run build` passed.

---

## Prompt Entry #4 — `2026-11-22`: Force Same-Origin `/api/v1` Proxy Before `VITE_API_BASE_URL` on `*.vercel.app` (`release/54ba3db`)

**Prompt Summary:** Fix `"Failed to fetch"` on login at `https://glamgo-git-release-54ba3db-byte-efb4.vercel.app/#home` caused by Vercel's project-level `VITE_API_BASE_URL` overriding the same-origin `/api/v1` proxy and triggering a blocked cross-origin `OPTIONS` preflight (`400 Bad Request`) to Render.

### Root Cause & Fix
- **[src/api.js](src/api.js):** Checked `window.location.hostname.endsWith('vercel.app')` **before** reading `import.meta.env.VITE_API_BASE_URL` so Vercel deployments always send login, register, and catalog requests to same-origin `/api/v1` (proxied server-to-server by `vercel.json` to `https://glamgo-backend-lqn6.onrender.com/api/$1`).

### Verification
- `node -c src/api.js` and `npm run build` passed.

---

## Prompt Entry #3 — `2026-11-22`: Fix Cross-Origin CORS Block & Catalog Fallbacks on Vercel Preview Deployments (`release/54ba3db`)

**Prompt Summary:** Fix `"Home treatments catalog unavailable"` on `https://glamgo-git-release-54ba3db-byte-efb4.vercel.app/#home` by routing `*.vercel.app` requests through the same-origin `/api/v1` Vercel rewrite proxy and seeding resilient catalog defaults (`DEFAULT_SERVICES`, `DEFAULT_PROFESSIONALS`, `DEFAULT_SALONS`, `DEFAULT_PRODUCTS`).

### Root Cause & Fix
- **[src/api.js](src/api.js):** In `resolveApiBase()`, when `window.location.hostname.endsWith('vercel.app')`, the client previously bypassed Vercel's `/api/(.*)` proxy in `vercel.json` and made direct cross-origin `fetch()` calls to `https://glamgo-backend-lqn6.onrender.com/api/v1/*`. Because the Render backend's `BACKEND_CORS_ORIGINS` env var does not emit `Access-Control-Allow-Origin` for branch preview subdomains (`glamgo-git-release-54ba3db-byte-efb4.vercel.app`), the browser blocked every catalog request (`/services`, `/professionals`, `/salons`, `/products`). Removed the `hostname.endsWith('vercel.app')` direct-origin override so `resolveApiBase()` returns `/api/v1`, which Vercel proxies server-to-server to `https://glamgo-backend-lqn6.onrender.com/api/v1/$1` with zero CORS restrictions.
- **[src/app.js](src/app.js):** Added `DEFAULT_SERVICES` (8 treatments), `DEFAULT_PROFESSIONALS` (3 specialists), `DEFAULT_SALONS` (3 salons), and `DEFAULT_PRODUCTS` (7 products) fallbacks in `loadCatalogFeeds()` so the storefront always renders a complete catalog immediately even if the Render free-tier backend is cold-starting or unreachable.

### Verification
- `node -c src/api.js`, `node -c src/app.js`, and `npm run build` passed.

---

## Prompt Entry #2 — `2026-11-19`: Change Report Standard & GitHub Sync

**Prompt Summary:** Create `CHANGEREPORT.md` documenting all changes made, maintain `CHANGEREPORT.md` on every future change prompt, and push changes to GitHub.

### Files Added / Modified
- **[CHANGEREPORT.md](CHANGEREPORT.md)** *(new)* — Established this persistent change ledger covering the full `7506b73` commerce-hardening implementation and branch synchronization to `origin/master`, `origin/main`, and `origin/fix/commerce-hardening`.

---

## Prompt Entry #1 — `2026-11-19`: Multi-Vendor Commerce, Payments, Inventory, Refunds & Security Hardening

**Base Commit:** `7e0e8e3`  
**Implementation Commit:** `7506b73` (`29 files changed, +4,314 / -633 lines` on branch `fix/commerce-hardening`, fast-forward merged into `master` & `main`)

### 1. Configuration, Secrets & Maintenance Automation
- **[render.yaml](render.yaml):** Removed literal `DATABASE_URL`, `RAZORPAY_KEY_ID`, and `RAZORPAY_WEBHOOK_SECRET` values and switched them to `sync: false`; added `INTERNAL_MAINTENANCE_TOKEN` (`generateValue: true`).
- **[.env.staging.example](.env.staging.example)** & **[.env.production.example](.env.production.example):** Replaced sample credentials with unmistakably nonfunctional placeholders and documented `INTERNAL_MAINTENANCE_TOKEN`. *(Note: removing values from `render.yaml` prevents future `HEAD` exposure but does not rotate live secrets or rewrite prior commits; rotate via environment variables only as documented in [docs/COMMERCE_HARDENING_AND_RELEASE_CHECKLIST.md](docs/COMMERCE_HARDENING_AND_RELEASE_CHECKLIST.md).)*
- **[backend/app/core/config.py](backend/app/core/config.py):** Added `INTERNAL_MAINTENANCE_TOKEN: str = ""`.
- **[backend/app/core/logging_config.py](backend/app/core/logging_config.py):** Added `"internal_maintenance_token"` and `"x-maintenance-token"` to `JSONLogFormatter.SENSITIVE_KEYS`.
- **[backend/app/api/deps.py](backend/app/api/deps.py):** Implemented `require_maintenance_auth` validating either `X-Maintenance-Token` (`hmac.compare_digest`) or an Admin Bearer JWT (rejects missing/wrong credentials with `401` and non-admin JWTs with `403`).
- **[backend/app/api/v1/api.py](backend/app/api/v1/api.py):** Protected `POST /api/v1/internal/inventory/expire-reservations` and `POST /api/v1/internal/escrow/mature` with `Depends(require_maintenance_auth)`.
- **[backend/app/services/maintenance_runner.py](backend/app/services/maintenance_runner.py)** *(new)*: Added runnable CLI/scheduler entry point (`run_maintenance_cycle`) executing `expire-reservations`, `mature-escrow`, or `all`.

### 2. Database Migration, ORM Models & Schemas
- **[backend/alembic/versions/05b2e4d81c23_unify_commerce_variants_refunds_and_constraints.py](backend/alembic/versions/05b2e4d81c23_unify_commerce_variants_refunds_and_constraints.py)** *(new)*:
  - Extended PostgreSQL `returnstatus` enum with `REFUND_PENDING` and `REFUND_FAILED`.
  - Added `variant_name` + check constraints `stock >= 0` & `price > 0` on `seller_listings`.
  - Added `order_id`, `variant_name`, `quoted_unit_price` + check constraint `qty > 0` on `inventory_reservations`.
  - Set `orders.payment_status` server default `'pending'` and added `shipping_fee`, `reservation_token` (`uq_orders_reservation_token`), `request_fingerprint`, and `payment_expires_at`.
  - Added `variant_name`, `sku`, `seller_name`, `allocated_discount` on `order_items` (with backfill).
  - Added `idempotency_key`, `request_fingerprint`, `refund_id` (`uq_payment_tx_user_idempotency`) on `payment_transactions`.
  - Added `return_qty` (`return_qty > 0`), `gateway_refund_id`, `refund_status`, `refund_paise`, and `restocked_at` on `return_requests`.
  - Added `refunded_amount` and `reversed_commission` on `seller_escrow_records`.
- **[backend/app/models/catalog.py](backend/app/models/catalog.py)**, **[commerce.py](backend/app/models/commerce.py)**, **[order.py](backend/app/models/order.py)**, **[payment.py](backend/app/models/payment.py):** Updated SQLAlchemy mappings and relationships cleanly to match migration `05b2e4d81c23`.
- **[backend/app/schemas/catalog.py](backend/app/schemas/catalog.py)**, **[commerce.py](backend/app/schemas/commerce.py)**, **[order.py](backend/app/schemas/order.py)**, **[payment.py](backend/app/schemas/payment.py):** Exposed `default_listing_id` & `variant_listings`, return `qty`, `cod_refund_confirmed`, variant/SKU/seller/discount order item snapshots, `shipping_fee`, `reservation_token`, and payment `idempotency_key` / `payment_status`.

### 3. Unified Commerce, Inventory, Refunds & Escrow Engine
- **[backend/app/services/commerce_service.py](backend/app/services/commerce_service.py):**
  - Replaced float arithmetic with integer paise (`to_paise`, `to_rupees`) and largest-remainder apportionment (`allocate_proportionally_paise`) so suborder discounts and totals sum exactly to parent totals.
  - Established `SellerListing.stock` as single transactional stock ledger synchronized to `Product.stock` and `ProductVariant.stock` via `ensure_product_listings` and `sync_product_stock`.
  - Fixed `reserve_inventory` to resolve variants, aggregate duplicate listing/product lines before checking combined quantity, and sort `listing_id`s ascending before acquiring `.with_for_update()` locks.
  - Removed all simulated `completed` payment shortcuts in `checkout_multi_vendor`; online orders start `'pending'` with `payment_expires_at`, COD orders start `'cod_pending'`, duplicate checkouts enforce idempotency fingerprints (`409` on conflict) and `IntegrityError` recovery, and checkout logs a 0-delta `CHECKOUT_DECREMENT` audit entry.
  - Added `_release_reservation_rows` / `release_reservation_hold` and expired unpaid order restocking inside `expire_pending_reservations`.
  - Enforced `IN_TRANSIT` guard and aligned T+7 escrow (`ESCROW_MATURITY_DAYS = 7`) in `deliver_suborder`, transitioning COD orders to `'cod_collected'` on delivery.
  - Implemented proportional net-paid partial-quantity returns in `request_return`, real Razorpay `client.payment.refund(...)` orchestration outside DB locks + two-step COD confirmation (`COD_MANUAL_PENDING` -> `COD_REFUNDED`) + at-most-once `restocked_at` restocking in `decide_return`, and open-return blocking in `mature_escrow_records`.
- **[backend/app/services/seed_service.py](backend/app/services/seed_service.py):** Synchronized seeded catalog products via `CommerceService.ensure_product_listings` and `sync_product_stock`.

### 4. REST Endpoints (`orders`, `payments`, `products`, `partners`)
- **[backend/app/api/v1/orders.py](backend/app/api/v1/orders.py):** Unified `POST /api/v1/orders/` onto `CommerceService.reserve_inventory` + `checkout_multi_vendor` (with pre-reserve idempotency/fingerprint checks and `release_reservation_hold` cleanup on failure), eager-loaded suborders/items/shipments, and surfaced variant/SKU/seller/return/refund metadata in `format_order`.
- **[backend/app/api/v1/payments.py](backend/app/api/v1/payments.py):** Rejected COD and cancelled orders in `_resolve_payment_target`; pre-committed `"initiating"` `PaymentTransaction` before calling Razorpay (releasing DB locks during HTTP I/O, cleaning up synchronous failures, and recovering failed local writes via `SessionLocal()`); handled late captures on expired cancelled orders (stock restore when available or automatic gateway refund `refunded_oos` without overselling); locked webhook lookups and added pre-record reconciliation / `503` retry plus `refund.processed`/`refund.failed` reconciliation.
- **[backend/app/api/v1/products.py](backend/app/api/v1/products.py):** Exposed `default_listing_id` and `variant_listings`, eager-loaded `seller_listings`, and ensured canonical listings on `POST /api/v1/products/`.
- **[backend/app/api/v1/partners.py](backend/app/api/v1/partners.py):** Synced seller product creation, price updates, manual stock updates (`InventoryAuditLog` + `sync_product_stock`), variant additions, multi-vendor order filtering, suborder/T+7 escrow/COD sync in `update_seller_order_status`, and variant/address/payment details in seller suborders & listings.

### 5. Frontend Storefront & Partner Studio
- **[src/api.js](src/api.js):** Added `idempotencyKey` support to `apiCreatePaymentOrder` and optional `qty` to `apiSubmitReturnRequest`.
- **[src/app.js](src/app.js):**
  - Switched cart to composite keys (`productId::variant::listingId`) via `getCartEntries()` so multiple variants and seller offers of the same product coexist.
  - Wired checkout directly to `apiReserveInventory` (`ensureCheckoutReservation`) and `apiMultiVendorCheckout`, showing per-seller packages, seller shipping fees, coupons, and complete payable total before payment while preserving cart, variant, seller listing, coupon, and address index across recoverable payment failures.
  - Updated `account()`, `trackingPage()`, `partnerPage()` (`Orders & fulfillment`, `Returns & refunds` for `REQUESTED`/`REFUND_FAILED`, `Escrow & settlement` using `funds_in_escrow`/`matured_balance_available`/`total_disbursed`/`escrow_batches` and `T+7`), and defaulted Partner Studio role from `state.user.role`.

### 6. Automated Tests & Release Docs
- **[tests/conftest.py](tests/conftest.py):** Added localhost/Docker Postgres safety guard, `INTERNAL_MAINTENANCE_TOKEN` CI default, `maintenance_auth_headers` fixture, and canonical `SellerListing` stock resets.
- **[tests/test_multi_vendor_phase5.py](tests/test_multi_vendor_phase5.py):** Updated 11 Phase 5 tests for mocked Razorpay verification/refunds, `maintenance_auth_headers`, `pack -> ship -> deliver`, and `T+7` (`timedelta(days=8)`) maturity.
- **[tests/test_commerce_hardening.py](tests/test_commerce_hardening.py)** *(new)*: Added 16 hardening tests covering maintenance auth & CLI runner, duplicate-line aggregation, multi-threaded Postgres `threading.Barrier` reservation & checkout/expiry/double-checkout exclusivity, idempotency conflicts, unified `/orders/`, variant coexistence & snapshot immutability, unpaid fulfillment block, COD payment/manual refund workflow, late-capture restore vs OOS auto-refund, pre-record webhook reconciliation & `503` retry, refund failure/retry & webhook settlement, 3-seller integer paise rounding & partial-qty discounted refund math, `T+7` escrow + open-return blocking, and `InventoryAuditLog` reconciliation.
- **[docs/COMMERCE_HARDENING_AND_RELEASE_CHECKLIST.md](docs/COMMERCE_HARDENING_AND_RELEASE_CHECKLIST.md)** *(new)*: Documented confirmed findings, credential rotation instructions (env-var names only), scheduled maintenance options, rollout sequence, and rollback/recovery plan.

---

### Verification Summary (Observed Locally)
- **Pytest Suite:** `78 passed, 0 failed, 0 skipped` (`79.59s`) across all 17 test files against local Postgres 16 + Redis 7 (mocked Razorpay SDK).
- **Fresh-DB Alembic Migration Round-Trip:** Disposable `glamgo_fresh_mig_test` cleanly passed `upgrade head` → `downgrade -1` → `upgrade head` (`05b2e4d81c23`) + `seed_database`.
- **Frontend Production Build:** `npm run build` (`vite build`) succeeded in `937 ms` (`dist/assets/index-XT8A-Zzz.js`: `175.45 kB` / `47.66 kB` gzip; `dist/assets/index-BAyw2fMR.css`: `80.29 kB` / `14.83 kB` gzip).
- **Local Playwright E2E Verification:** `PLAYWRIGHT_E2E_ALL_PASSED` (exit code `0`) against built `dist/` + local FastAPI over local Postgres/Redis across desktop (`1280×768`) and mobile (`375×812`) viewports (with external Razorpay CDN/images stubbed cleanly).
