# GlamGo Change Report (`CHANGEREPORT.md`)

> **Standing Workflow Policy:** Every prompt that modifies the repository appends a structured entry to `CHANGEREPORT.md` detailing every modified/added file, why it changed, and verified checks before pushing changes to GitHub.

---

## Prompt Entry #3 — `2026-11-21T02:50:00+05:30`: Commerce Review Remediation, Release Hardening & Landing Experience Redesign

**Base Commit:** `54ba3db` (`fix/commerce-hardening` / `master`)  
**Branch:** `fix/commerce-review-remediation` *(pushed to `origin/fix/commerce-review-remediation` for review; `main` and `master` kept untouched at `54ba3db` so production Render/Vercel deployments remain unchanged)*  
**Objectives:**
1. Resolve independent code-review findings: eliminate inventory duplication during canonical listing backfill, guarantee idempotent/durable refunds across lost gateway responses and OOS late captures, add strictly read-only `--dry-run` + refund recovery to `maintenance_runner`, and make `/health/ready` honor `REDIS_REQUIRED`.
2. Upgrade GlamGo's customer landing experience (`onboarding`, `home`, `salon`, `shop`) using editorial layout discipline, viewport-filling split heroes, interactive `#how` step chapters, responsive breakpoint fixes (`320px–1440px`), and crisp non-slop copy while preserving all commerce, variant, partner, and admin workflows.

### 1. Database Migration, Models & Schemas
- **[backend/alembic/versions/06c3f5e92d34_durable_refund_ledger_and_constraints.py](backend/alembic/versions/06c3f5e92d34_durable_refund_ledger_and_constraints.py)** *(new)* — Added `refund_records` and `refund_accounting_entries` tables, `return_requests.refunded_at`, positive-amount `CHECK` constraints (`ck_refund_records_amount_positive`, `ck_refund_accounting_amount_positive`), and unique indexes (`uq_refund_records_logical_key`, `uq_refund_records_idempotency_key`, `uq_refund_records_receipt`, partial `uq_refund_records_return_request_id`, partial `uq_refund_records_provider_refund_id`, `uq_refund_accounting_refund_record_id`, partial `uq_refund_accounting_provider_refund_id`, and partial `uq_payment_tx_refund_id`).
- **[backend/app/models/commerce.py](backend/app/models/commerce.py)** — Added `RefundRecord` and `RefundAccountingEntry` ORM models plus `ReturnRequest.refunded_at`.
- **[backend/app/schemas/order.py](backend/app/schemas/order.py)** & **[backend/app/schemas/payment.py](backend/app/schemas/payment.py)** — Exposed OOS refund tracking identifiers and verification/payment payload fields cleanly.

### 2. Canonical Inventory Backfill, Refunds, Maintenance & Readiness
- **[backend/app/services/commerce_service.py](backend/app/services/commerce_service.py)** — Rebuilt canonical listing reconciliation inside `ensure_product_listings` and `sync_product_stock` so covered unscoped legacy listings (`variant_name == ""`) deactivate without doubling inventory, active `PENDING` reservation holds defer safely, stock is never invented or reassigned across sellers, ambiguous cases emit explicit discrepancy reports, and return/escrow paths delegate refund execution and settlement safely.
- **[backend/app/services/inventory_backfill.py](backend/app/services/inventory_backfill.py)** *(new)* — Added restartable, idempotent CLI (`python -m backend.app.services.inventory_backfill [--dry-run] [--product-id ...] [--batch-size ...]`) reporting before/after stock snapshots, per-product locked transactions, ambiguous/deferred discrepancy outputs, and `0/2/1` exit codes.
- **[backend/app/services/refund_service.py](backend/app/services/refund_service.py)** *(new)* — Implemented durable `RefundRecord` intents prior to Razorpay HTTP I/O, stable `X-Refund-Idempotency` header + unique `receipt`, `120s` `IN_FLIGHT` leases, `SUBMITTED_UNKNOWN` provider lookup reconciliation before re-issuing refunds, `SessionLocal()` fallback persistence on transient DB failure, cumulative refund capping, atomic `apply_provider_refund_outcome` (`accounting_applied_at` + unique ledger entries), and `recover_pending_refunds` for both `RETURN` and `OOS_AUTO` refunds.
- **[backend/app/api/v1/payments.py](backend/app/api/v1/payments.py)**, **[backend/app/api/v1/orders.py](backend/app/api/v1/orders.py)**, **[backend/app/api/v1/partners.py](backend/app/api/v1/partners.py)**, **[backend/app/api/v1/products.py](backend/app/api/v1/products.py)**, & **[backend/app/services/seed_service.py](backend/app/services/seed_service.py)** — Wired durable OOS auto-refunds on late capture, replaced `db.rollback()` prior to Razorpay fetch with explicit commit, reconciled refund webhooks via `RefundService`, ensured seller/product/seed flows maintain canonical variant listings, and surfaced refund/OOS order states consistently.
- **[backend/app/services/maintenance_runner.py](backend/app/services/maintenance_runner.py)** & **[backend/app/api/v1/api.py](backend/app/api/v1/api.py)** — Added `--dry-run` (strictly read-only, `0` DB writes, `0` gateway calls), `--task recover-refunds`, exit code `2` escalation for `REQUIRES_OPERATOR`, and authenticated `POST /api/v1/internal/refunds/recover`.
- **[backend/app/core/config.py](backend/app/core/config.py)**, **[backend/app/core/redis_client.py](backend/app/core/redis_client.py)**, **[backend/app/main.py](backend/app/main.py)**, **[render.yaml](render.yaml)**, **[.env.staging.example](.env.staging.example)**, & **[.env.production.example](.env.production.example)** — Added `REDIS_REQUIRED` (`False` default -> `'fallback_memory'` healthy for single-instance mode when `REDIS_URL` is blank; `True` -> `503` if Redis is unreachable/missing) using env-var names only (zero secrets stored).
- **[docs/COMMERCE_HARDENING_AND_RELEASE_CHECKLIST.md](docs/COMMERCE_HARDENING_AND_RELEASE_CHECKLIST.md)** — Updated production rollout runbook with preflight uniqueness SQL checks, `06c3f5e92d34` upgrade + `inventory_backfill --dry-run`/apply/re-run sequence, cron schedules (`expire-reservations`, `recover-refunds`, `mature-escrow`), exit codes (`0/2/1`), `REDIS_REQUIRED`, `RAZORPAY_WEBHOOK_SECRET` cutover notes, and irreversibility/rollback constraints.

### 3. Frontend Landing Upgrade & Responsive Polish
- **[index.html](index.html)** — Added semantic page attributes (`data-type="service"`, `data-radius="soft"`, `data-buttons="arrow"`), `viewport-fit=cover`, SVG dot-mark favicon, and tightened meta description/title.
- **[src/app.js](src/app.js)** — Upgraded `experiences`, `heroChapters`, `onboarding()`, `header()`, `footer()`, `homePage()`, `salonPage()`, and `shopPage()` with grounded local pricing/count metrics, interactive `#how` pinned chapters (`setActiveChapter`, `chapter-select`, eager image loading, scroll lock), route scroll reset on `#home`/`#salons`/`#shop`, clean editorial headings/copy, and intact cart/variant/checkout/tracking/partner commerce state handling.
- **[styles.css](styles.css)** — Added `.gg-wrap` layout container, `.gg-mark`, `.skip-link`, viewport-filling `.hero-stage`, `[data-enter="1"]` hero entrance, `@media(hover:hover)` micro-interactions, dark `#how.dark-band` `pinned-chapters`, `.split-pair`, `.footer.closing` with `<details class="credits">`, mobile wrapped `.subnav` spacing fix (`390px`), and `768px` tablet `.pro-grid` overflow fix.

### 4. Tests & Verification Observed
- **[tests/test_commerce_review_remediation.py](tests/test_commerce_review_remediation.py)** *(new)*, **[tests/test_commerce_hardening.py](tests/test_commerce_hardening.py)**, & **[tests/test_multi_vendor_phase5.py](tests/test_multi_vendor_phase5.py)** — Added end-to-end populated-DB regression tests for inventory backfill (idempotency, multi-seller isolation, reservations, interruption), lost refund response reconciliation & concurrency, exactly-once `RefundAccountingEntry` settlement, `OOS_AUTO` recovery, and maintenance `--dry-run` / `REDIS_REQUIRED` readiness: **`32 passed, 0 failed`** (`96.65s`).
- **Full Pytest Suite (`.\.venv\Scripts\python.exe -m pytest -q`):** **`83 passed, 0 failed, 0 skipped`** (`118.92s`) on local PostgreSQL 16 + Redis 7 *(note: when previously executed on an empty seed-only DB without prior booking fixtures in the session, `tests/test_admin_phase2.py::test_admin_enhanced_stats_and_verticals` is order-dependent on existing bookings for `average_booking_value >= 1000.0`)*.
- **Alembic & Backfill Rehearsal (`rehearse_migrations_and_backfill.py`):** Passed cleanly (`MIGRATION_AND_BACKFILL_REHEARSAL_OK`) — fresh-DB `upgrade head -> downgrade -1 -> upgrade head -> seed_database` (`rc=0`), legacy `04a1f8c29b10 -> 06c3f5e92d34` upgrade (`rc=0`), `inventory_backfill --dry-run` (`rc=2`, `0` writes), apply (`rc=2`, total stock `33 == 33`), clean product re-run (`rc=0`, `17 == 17`, `already_canonical=1`, `order_items` history intact).
- **Frontend Production Build (`npm run build`):** Succeeded in `1.04s` (`dist/index.html` `2.01 kB`, `dist/assets/index-x6t5VdS2.css` `94.13 kB`, `dist/assets/index-Bd26z_MC.js` `184.56 kB`).
- **Headless Chrome E2E & Visual Audit (`verify_browser_full.mjs`):** Exited `0` against built `dist/` + live FastAPI (`uvicorn`): `0` console errors, `0` page errors, `0` failed requests, `0` broken images across `onboarding`/`home`/`salon`/`shop`, `0` horizontal overflow across `1440×900`, `1024×768`, `768×1024`, `390×844`, and `320×700`, `0` copy-lint FAILs across all 4 rendered pages, `#how` step-3 chapter switch verified with loaded photograph (`w=900`), PDP variant cart (`["b1::30 ml::1"]`), Cart-to-Checkout UI (`hasCheckoutHeading=true`, `hasVariantLabel=true`, `hasAddressSelect=true`, `hasPayButton=true`), and `GET /api/v1/orders/my` (`200`, `9` orders).

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
