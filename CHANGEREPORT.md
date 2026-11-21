# Change Report

## Prompt Entry #8 � 2026-11-21 09:34 IST � Dashboard & Analytics Numerals in Clean Sans-Serif
**Objective:** Replace old-style serif KPI/metric numerals across Admin Command Centre & Partner Portal with crisp standard sans-serif numerals (Manrope, 	abular-nums), update CHANGEREPORT.md, and push to origin/main.

### Files changed
- `styles.css`
  - Changed `.admin-kpi-card strong`, `.admin-vertical-card strong`, `.analytics-summary strong`, and `.admin-num` to use `var(--sans)` (Manrope) bold tabular numerals instead of `Cormorant Garamond` old-style figures.

### Verification
- `npm run build` ? passed (vite 7.3.7).
- Playwright verification on `http://127.0.0.1:5173/#admin` confirmed clean rendering with `0` console errors, `0` page errors, and `0` failed requests; visually inspected rendered Admin overview screenshot.
## Prompt Entry #7 � 2026-11-21 09:30 IST � Treatment Category Photos & Main Branch Sync
**Objective:** Replace placeholder icon boxes in the Home "Treatment categories" grid with curated beauty photography, update `CHANGEREPORT.md`, merge verified branch work into `main`, and push to GitHub `origin/main`.

### Files changed
- `src/app.js`
  - Added `homeCategoryImages` mapping all 8 treatment categories (`Hair`, `Skin`, `Waxing`, `Threading`, `Nails`, `Makeup`, `Spa`, `Packages`) to verified curated photographs and local `./assets/home-editorial.webp`.
  - Updated `homeLanding()` `#categories` cards to render full-bleed `image()` photos inside `.category-art` instead of placeholder icons.
- `styles.css`
  - Updated `.category-art` (`height: 118px`, `overflow: hidden`, `padding: 0`), added smooth hover zoom (`scale(1.06)`), and active ring state on `.category-tile.active`.

### Verification
- `npm run build` ? passed (vite 7.3.7, `dist/assets/index-ColD8ze5.js` + `index-AOSmRoHB.css`).
- Playwright check (`verify_categories_photos.mjs`) on `http://127.0.0.1:5173/#home` confirmed all 8 category card images loaded with `complete: true` and non-zero `naturalWidth` (`900px` / `1600px`), `mobileNoOverflow: true`, `0` console errors, and `0` page errors at both `1440px` and `390px`.
## Prompt Entry #6 � 2026-11-21 09:22 IST � Partner Portal Multi-Role Redesign (Salon Owner, Product Seller, Specialist)
**Objective:** Study and redesign the multi-role Partner Portal (`Salon Owner`, `Product Seller`, and `Specialist`) using `ui-ux-pro-max` design intelligence while preserving GlamGo's ivory/cream/espresso/champagne/terracotta palette, backend API contracts, forms, and `data-action` workflows.

### Files changed
- `src/app.js`
  - Rewrote `partnerPage()` with a unified 2-column workspace layout matching the Command Centre design system: sticky dark sidebar (`.partner-nav-sidebar`) with role switcher (`Specialist | Salon | Seller`), grouped section links, live counts, and alert badges (pending orders, open returns, low stock =5 units, upcoming visits).
  - Added sticky workspace topbar (`.partner-topbar`) showing dynamic role/tab title, subtitle, last synced timestamp (`partnerLastSynced` updated by `loadPartnerData()`), manual `Refresh` button (`partner-refresh`), and `Live Studio` / `Preview Mode` badge.
  - Upgraded each role's `Overview` tab with 4 `tabular-nums` KPI cards + a 2-column actionable workspace feed:
    - **Salon Owner:** Upcoming studio appointments with 1-click Complete/Cancel actions + stylist roster preview and quick setup controls; honest primary-branch info panel on `Branches` noting multi-branch expansion as upcoming.
    - **Product Seller:** Recent suborders + low-stock alert feed (=5 units) and quick catalog/escrow actions; searchable inventory tables, status-filtered & searchable suborder cards (without raw `?` glyph clutter), clean return decision cards, and T+7 escrow ledger tables.
    - **Specialist (`Professional`):** Next confirmed doorstep visits + interactive 7-day availability mini-grid right on Overview; separate status filtering for `Upcoming appointments`, `Booking requests`, and `Booking history`; honest credential verification summary on `Identity verification`.
  - Added state & caret-preserving search/filter handlers (`partnerBookingFilter`, `partnerBookingSearch`, `partnerOrderFilter`, `partnerOrderSearch`, `partnerCatalogSearch`). Preserved every existing form ID and `data-action` handler.
- `styles.css`
  - Replaced legacy dense `.partner-*` / `.dashboard-*` rules with refined rounded cards (`12px`), legible `13px` body typography, accessible `:focus-visible` rings, `prefers-reduced-motion` support, responsive horizontal-scrolling navigation at `= 960px`, and single-column stacking for mobile viewports.

### Verification
- `npm run build` ? passed (vite 7.3.7, `dist/assets/index-D8txMheL.js` + `index-BpM-n3Jk.css`).
- Playwright verification (`verify_partner_redesign.mjs`) logged in via UI auth on `http://127.0.0.1:5173/#partner` connected to local backend `http://127.0.0.1:8000/api/v1`:
  - Verified all 3 roles (`Salon Owner`, `Product Seller`, `Professional`/Specialist) across 22 total tab switches: `0` console errors, `0` page errors, `0` failed HTTP requests.
  - Verified live search input `#partner-catalog-search` preserved focus and narrowed `Service Catalogue` to `1` row on `"Facial"`.
  - Verified zero horizontal overflow (`scrollWidth === innerWidth`) at desktop (`1440px`), tablet (`768px`), and mobile (`390px`) across tested roles and visually inspected rendered screenshots.
## Prompt Entry #5 � 2026-11-21 03:58 IST � Admin Panel Redesign
**Objective:** Redesign the full admin panel to look better and be easier to use while keeping the existing GlamGo colour theme. References: Stripe Dashboard, Linear, Shopify Admin.

### Files changed
- `src/app.js`
  - Rewrote `adminPage()`. The sidebar is now grouped into Overview, Operations, Catalog and Governance, with live counts, a pending badge, an admin profile card, and Partner Portal / Exit links.
  - Added a sticky top bar. Its title and subtitle change with the active tab, and it shows a "Synced" time, a Refresh button (`admin-refresh`), a "Review N Pending" button and an Operational status pill.
  - Overview: KPI cards now show the real take rate. **Bug fix:** the cards read `avg_booking_value`/`avg_order_value`, but the backend sends `average_booking_value`/`average_order_value`, so both averages always showed ?0. Also added a segmented GMV split bar with percentages per vertical, clickable roster pills (`admin-jump-users`) and redesigned Pending Applications / Recent Audit feeds.
  - Added instant search and filter pills to Moderation, Users, Bookings, Orders, Services, Products and Audit Trail, with counts on each pill. One shared input handler keeps the caret position. Status badges now get a colour from each row's status. Audit metadata shows as chips instead of raw JSON.
  - New state fields: `adminDraftSearch`, `adminBookingFilter/Search`, `adminOrderFilter/Search`, `adminCatalogSearch`, `adminAuditSearch`, `adminLastSynced`. `loadAdminData()` now records the sync time.
  - Fixed a leftover `apiGetAuditLogs(50, 0)` call in the approve-draft handler. It is now `apiGetAuditLogs(null, 50, 0)`.
- `styles.css`: replaced the `.admin-*` block. Same ivory/cream/espresso/champagne/terracotta palette and Cormorant + Manrope type. Added a sticky sidebar and top bar, rounded cards, tabular numbers, the GMV bar, pills and search boxes, and better tables, badges and empty states. Responsive breakpoints at 1180, 960 and 560px. Removed the 78px offset, because the admin view renders no site header.

### Verification
- `npm run build` ? passed (vite 7.3.7).
- `impeccable detect` ? 1 existing warning (`cream-palette` on the page background, which is the brand colour and was kept on purpose). No `dark-glow` warnings.
- Playwright run, logged in as the seeded local admin, against the Vite dev server and a local backend:
  - KPI cards: GMV ?34,504; commission ?5,175.6 (15.0%); 6 bookings, avg ?1,165.67; 10 orders, avg ?2,751.
  - All 8 tabs rendered with the correct top-bar title. Row counts: users 16, bookings 6, orders 10, services 8, products 7, audit 2, moderation 0 (queue empty).
  - User search "admin" ? 1 row, and the input kept focus. Refresh updated the "Synced" time.
  - No horizontal overflow at 1440, 768 and 390px. 0 console errors, 0 page errors, 0 failed requests.
# GlamGo Change Report (`CHANGEREPORT.md`)

> **Standing Workflow Policy:** Every prompt that modifies the repository appends a structured entry to `CHANGEREPORT.md` detailing every modified/added file, why it changed, and verified checks before pushing changes to GitHub.

---

## Prompt Entry #4 — `2026-11-21T03:30:00+05:30`: Full-Site Playwright Audit, Unified Customer + Business Landing & Cross-Portal Fixes

**Branch:** `fix/commerce-review-remediation` (`origin/fix/commerce-review-remediation`; `main` and `master` remain untouched at `54ba3db`)  
**Objectives:**
- Crawl the full live GlamGo application across customer, salon owner, product seller, and admin portals with Playwright, `/design-taste-frontend`, and `/impeccable`.
- Document product truth in `PRODUCT.md` and build an everything-in-one flagship landing gateway serving everyday consumers alongside Salon Owners, Product Sellers, and Independent Specialists, plus resolve bugs exposed during the crawl.

### Files Created / Modified
- **[PRODUCT.md](PRODUCT.md)** *(new)* — Captured confirmed platform scope, user roles, positioning, workflow facts (`T+7` settlement, multi-variant `SellerListing` stock ledgers, guest browsing), constraints, and warm editorial identity commitments (`#F7F4EF`, `#EFEAE1`, `#1E1C1A`, `#C5A059`, `#B86B52`).
- **[src/app.js](src/app.js):**
  - Rebuilt `onboarding()` into an everything-in-one flagship gateway fitting all 3 consumer cards and the `For Salon Owners & Product Sellers` jump bar cleanly inside Screen 1 (`1440×900`, `jumpBottom = 877px`), followed by grounded sections for Salon Owners (paired with live salon schedule data), Product Sellers (dark contrast band with live variant stock ledger & `T+7` escrow rows), and Independent Specialists with an interactive 3-role workflow explorer (`showcaseRolesData`, `showcase-partner-tab`).
  - Added `/partners` / `#partners` routing (`pendingOnboardingScroll`), `partners-apply` role pre-selection, and partner-aware `auth()` copy (`Open your <Role> studio`).
  - Fixed `init()` async session hydration for `#partner`, `#salon`, and `#admin` deep links, scoped `loadPartnerData()` requests by `partnerRoleFromUser(state.user?.role)` (eliminating `403` bursts when consumers open Partner Studio), replaced consumer subnav in Partner Studio with role workspace navigation, removed slop wording and the Product Seller `"schedule"` mismatch in `partnerPage()`, omitted section eyebrows cleanly per `craft-floor.md`, deduplicated `salonDetail()` gallery images, and fixed `apiGetAuditLogs(null, 50, 0)` (eliminating `422` errors on `#admin`).
- **[styles.css](styles.css):**
  - Added layout & component rules for the unified onboarding header nav, above-the-fold consumer grid + partner gateway bar, `.partner-band` (cream/dark/ivory sections), `.studio-card`, `.ledger-panel`, `.role-explorer`, `tabular-nums`, and mobile/tablet responsive breakpoints (`<= 1023px`, `<= 700px`).
  - Moved `.toast` notifications to bottom-right (`bottom: 24px`) on desktop and above mobile bottom nav (`bottom: 72px`) on narrow viewports so top header controls remain unobstructed.
  - Replaced zero-offset green `box-shadow` glow on `.admin-status-pulse i` with a crisp flat status ring.

### Verification Summary (Observed After Final Edit)
- **Production Bundle Build (`npm run build`):** Succeeded in `661ms` (`dist/index.html` `2.01 kB`, `dist/assets/index-BYPZZUDp.css` `100.10 kB`, `dist/assets/index-DHM5aYQj.js` `197.58 kB`).
- **Impeccable Detector (`impeccable.cmd detect --json index.html styles.css src/app.js`):** Zero `dark-glow` warnings; remaining notice is only the user-confirmed warm cream brand ground (`#F7F4EF`).
- **Playwright Multi-Role Verification (`crawl_roles.mjs`):** Exited `0` across unified landing (`cardsMaxBottom = 742.31px`, `jumpBottom = 877px`, `imgsBroken = 0`, mobile `390px` `scrollWidth = 390`), `salon@glamgo.com` `/#partner` reload (`Salon Owner Studio`), `seller@glamgo.com` `/#partner` reload (`Product Seller Studio`), `aanya@example.com` `/#partner` (`Registration`), `admin@glamgo.com` `/#admin` (`Command Centre.` with live audit logs), and signed-out Partner click — **zero** console errors across all checks.
- **Full Viewport & `copy-lint` Check (`verify_browser_full.mjs`):** Exited `0` with `0` console errors, `0` page errors, `0` failed requests, `0` broken images, `0` horizontal overflow across `1440×900`, `1024×768`, `768×1024`, `390×844`, and `320×700` on `onboarding`, `home`, `salon`, and `shop`, and `0` `copy-lint` `FAIL`s across all 4 rendered pages (`GET /api/v1/orders/my` `200`).

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
