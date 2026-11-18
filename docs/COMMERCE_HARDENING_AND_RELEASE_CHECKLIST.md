# GlamGo Commerce Hardening & Production Release Checklist

**Target Branch:** `fix/commerce-hardening` (derived from `7e0e8e347e09f28a727131473454d2b37d3ee732`)  
**Status:** Verified locally on disposable Postgres 16 + Redis 7 (`78 passed` pytest tests, fresh-DB Alembic `upgrade -> downgrade -1 -> upgrade`, `npm run build`, local Playwright E2E verification passed with exit code `0`). Production deployments on Render/Vercel remain untouched until operator executes this release checklist.

---

## 1. Confirmed Findings & Remediation Checklist

| # | Area | Confirmed Finding | Flow Affected | Remediation Implemented | Verification Criteria & Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Credentials & Config** | `render.yaml` contained committed `DATABASE_URL`, `RAZORPAY_KEY_ID`, and `RAZORPAY_WEBHOOK_SECRET` literals; `.env.*.example` contained weak placeholder patterns. | Deployment config & repo hygiene | Replaced committed credentials in `render.yaml` with `sync: false`; added `INTERNAL_MAINTENANCE_TOKEN` (`generateValue: true`); hardened `.env.staging.example` and `.env.production.example` to unmistakably nonfunctional placeholders. | Secret scan across tracked config clean; rotation runbook uses env-var names only. |
| 2 | **Internal Endpoints Auth** | `/api/v1/internal/inventory/expire-reservations` and `/api/v1/internal/escrow/mature` were unauthenticated. | Background inventory & settlement | Added `require_maintenance_auth` requiring `X-Maintenance-Token` (`hmac.compare_digest`) or Admin Bearer JWT; redacts maintenance headers/tokens in JSON logs; added runnable CLI `backend/app/services/maintenance_runner.py`. | Unauthenticated (`401`), wrong token (`401`), and customer JWT (`403`) rejected; valid service token (`200`), Admin JWT (`200`), and `run_maintenance_cycle` pass (`test_internal_maintenance_auth_and_runner`). |
| 3 | **Split Checkout Paths & Stock Source of Truth** | Storefront called legacy `POST /api/v1/orders/` while ignoring `/orders/reserve` & `/orders/checkout`; `Product.stock`, `ProductVariant.stock`, and `SellerListing.stock` could diverge. | Cart -> Reservation -> Checkout -> Suborders | Unified `POST /orders/` and `POST /orders/checkout` through `CommerceService.reserve_inventory` + `checkout_multi_vendor`; established `SellerListing.stock` as canonical transactional ledger synced to read models via `sync_product_stock` & `ensure_product_listings`; wired frontend to `/orders/reserve` & `/orders/checkout`. | `POST /orders/` creates parent `Order`, `SubOrder`, `SellerEscrowRecord`, confirmed reservation, and syncs stock (`test_unified_standard_orders_endpoint_architecture_and_payment_defaults`). |
| 4 | **Simulated Payments & Gateway Boundaries** | `checkout_multi_vendor` previously marked payments `completed` with synthetic IDs/keys; Razorpay order creation lacked explicit pre-gateway initiating state & COD rejection. | Online & COD Checkout, Verify, Webhook | Removed all synthetic payment completion & mock keys; online orders start `pending`, COD starts `cod_pending` and transitions to `cod_collected` on delivery; `create_razorpay_order` commits an `initiating` tx before gateway I/O, passes `notes` (`tx_id`, `target_id`), and provides `SessionLocal()` recovery write; late capture handles stock restoration or lock-free OOS automatic refund (`refunded_oos`). | Unpaid fulfillment returns `400`; COD create-order returns `400`; `threading` & gateway failure/recovery/webhook `503` retry tests pass. |
| 5 | **Inventory Concurrency & Duplicate Lines** | `reserve_inventory` validated duplicate listing lines individually and allowed checkout/expiry races or negative stock. | Reservation, Checkout, Expiry, Restock | Aggregated duplicate listing/product lines before validation; enforced ascending `listing_id` lock acquisition across reserve, checkout, release, late capture, and restocking; added `stock >= 0`, `price > 0`, `qty > 0` DB check constraints; recorded 0-delta `CHECKOUT_DECREMENT` so physical stock deducts once; expiry releases holds and abandoned unpaid orders safely at most once. | Multi-threaded `threading.Barrier` reserve contention (5 threads on stock=1 -> 1 succeeds, `stock == 0`), checkout vs expiry exclusivity, double-expiry, and audit delta reconciliation pass. |
| 6 | **Variant & Offer Identity Loss** | Cart & standard orders keyed solely by `product.id`, overwriting multiple shades/sizes and omitting immutable SKU/variant/seller snapshots. | Product Detail -> Cart -> Tracking -> Return | Used composite frontend cart keys (`productId::variant::listingId`); persisted immutable `variant_name`, `sku`, `seller_name`, `price`, `allocated_discount` on `order_items` and surfaced through API responses & seller/customer portals. | Dual variants of the same product coexist in one bag/order and survive catalog rename/reprice unchanged (`test_variant_coexistence_stock_sync_and_catalog_snapshot_immutability`). |
| 7 | **Refunds & Return-Aligned Escrow** | Return approval faked refunds locally; escrow matured at T+3 despite a 7-day return window and lacked open-return blocking & integer minor-unit rounding. | Returns, Refunds, Escrow Maturity | Implemented real Razorpay `client.payment.refund(...)` outside DB locks, `REQUESTED` -> `APPROVED`/`REFUND_PENDING` -> `REFUNDED` / `REFUND_FAILED` states, at-most-once `restocked_at` guard, explicit 2-step COD manual refund (`COD_MANUAL_PENDING` -> `COD_REFUNDED`), integer paise largest-remainder apportionment (`allocate_proportionally_paise`), proportional partial-qty net-paid refund calculation, aligned T+7 escrow (`ESCROW_MATURITY_DAYS = 7`), blocked settlement while any return is unresolved, and prevented repeated delivery actions. | All refund, webhook `refund.processed`, 3-seller paise rounding, partial-qty refund, and T+7 open-return escrow block tests pass. |

---

## 2. Credential Rotation & Secret Management Runbook

> **CRITICAL NOTE:** Removing literal secrets from `render.yaml` prevents exposure in future checkouts of `HEAD`, but **does NOT rotate active credentials** and **does NOT purge historical Git commits** prior to `fix/commerce-hardening`. Because the previously committed credentials were present in tracked history, assume they were exposed and rotate all of them before promoting this branch.

### Required Rotations (Refer Strictly by Environment-Variable Names)

Set every secret in the Render Dashboard / secret manager (**Environment** tab on the API service and worker/cron services) and never in committed YAML or `.env` files:

1. **`DATABASE_URL`** — In Neon (or managed Postgres), rotate the database role password / provision a new role credential, update **`DATABASE_URL`** in Render Environment Variables across the web service and maintenance cron/worker services, and revoke the old database password after rollout verification.
2. **`RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`** — In the Razorpay Dashboard (**Account & Settings → API Keys**), regenerate the live/test API key pair, update **`RAZORPAY_KEY_ID`** and **`RAZORPAY_KEY_SECRET`** in Render, and deactivate the old key pair. If frontend builds also reference a public publishable key via **`VITE_RAZORPAY_KEY_ID`**, update Vercel Environment Variables accordingly (note `/payments/razorpay/create-order` returns server `key_id` directly).
3. **`RAZORPAY_WEBHOOK_SECRET`** — In Razorpay Dashboard (**Webhooks**), rotate the webhook signing secret on the `/api/v1/payments/razorpay/webhook` endpoint and update **`RAZORPAY_WEBHOOK_SECRET`** in Render simultaneously.
4. **`INTERNAL_MAINTENANCE_TOKEN`** — Generate a high-entropy 32+ byte random string (or let Render's `generateValue: true` provision it on fresh Blueprint sync) and configure **`INTERNAL_MAINTENANCE_TOKEN`** identically on the API service and any HTTP cron caller.
5. **`SECRET_KEY`** — Ensure a minimum 32-character cryptographically random value is set in Render (**note:** rotating `SECRET_KEY` invalidates active user JWT sessions, forcing re-login).

---

## 3. Scheduled Maintenance Automation

Exposing `/api/v1/internal/*` HTTP endpoints alone does not execute scheduled jobs automatically. Production must run one of the following reliable schedulers:

### Option A — Render Cron Job Services (Recommended on Render)

Create two Render Cron Job services sharing the same repository image and **`DATABASE_URL`**, **`REDIS_URL`**, and **`ENVIRONMENT`** environment variables:

1. **Inventory Reservation & Unpaid Order Expiry (`*/5 * * * *` — every 5 minutes):**
   ```bash
   python -m backend.app.services.maintenance_runner --task expire-reservations
   ```
2. **T+7 Escrow Maturity Evaluator (`0 * * * *` — hourly):**
   ```bash
   python -m backend.app.services.maintenance_runner --task mature-escrow
   ```
   *(Or run both cleanly on an hourly/5-min cadence using `--task all`.)*

### Option B — Authenticated HTTP Cron Caller (External Scheduler / GitHub Actions / Worker)

Invoke the authenticated endpoints over TLS with header **`X-Maintenance-Token`** set to the runtime **`INTERNAL_MAINTENANCE_TOKEN`** secret:
- `POST /api/v1/internal/inventory/expire-reservations` every 5 minutes
- `POST /api/v1/internal/escrow/mature` every 60 minutes

Both paths call `CommerceService.expire_pending_reservations(db)` and `CommerceService.mature_escrow_records(db)`, using `FOR UPDATE SKIP LOCKED` so overlapping scheduler invocations do not double-release or deadlock.

---

## 4. Safe Production Rollout Order & Verification

Execute in strict order before enabling live user traffic on this release:

1. **Database Backup Snapshot:** Take an on-demand snapshot/dump (`pg_dump -F c`) of the production PostgreSQL database before applying migrations.
2. **Verify Production Readiness & Constraints Query:** Confirm no existing rows violate new check constraints (`seller_listings.stock < 0`, `seller_listings.price <= 0`, `inventory_reservations.qty <= 0`, `return_requests.return_qty <= 0`).
3. **Rotate & Inject Secrets:** Update **`DATABASE_URL`**, **`RAZORPAY_KEY_ID`**, **`RAZORPAY_KEY_SECRET`**, **`RAZORPAY_WEBHOOK_SECRET`**, **`INTERNAL_MAINTENANCE_TOKEN`**, and **`SECRET_KEY`** in Render / Vercel secret stores.
4. **Apply Database Migration (`05b2e4d81c23`):**
   ```bash
   python -m alembic -c alembic.ini upgrade head
   ```
5. **Backfill Canonical Listings for Existing Catalog Products:** Run a one-time idempotent Python job calling `CommerceService.ensure_product_listings(db, product)` and `CommerceService.sync_product_stock(db, product.id)` for every active `Product` so legacy items have matching `SellerListing` inventory ledgers.
6. **Deploy Backend Service & Maintenance Cron:** Deploy FastAPI backend and activate the Render Cron / `maintenance_runner` jobs.
7. **Post-Deploy Health & Smoke Checks:**
   - `GET /health/live` -> `200 {"status": "alive"}`
   - `GET /health/ready` -> `200` (confirms database & Redis health)
   - Verify unauthenticated `POST /api/v1/internal/escrow/mature` -> `401`
   - Verify authenticated maintenance dry run (`--task all`) returns `200` / clean counts
8. **Deploy Frontend Bundle (`dist/`):** Build and deploy Vite SPA to Vercel after backend migration/backfill completes so checkout & tracking clients consume the unified API shapes cleanly.

---

## 5. Rollback & Forward-Recovery Plan

- **Application Code Rollback:** Re-deploy the previous application release build on Render/Vercel if a UI or API regression occurs. (Migration `05b2e4d81c23` only adds nullable/defaulted columns and enum labels, keeping backward read compatibility with prior ORM versions except for newly required payment transitions.)
- **Schema Rollback Caveat (`downgrade -1`):**
  - `alembic downgrade 04a1f8c29b10` cleanly drops added columns, unique constraints (`uq_orders_reservation_token`, `uq_payment_tx_user_idempotency`), and check constraints.
  - **PostgreSQL Enum Constraint:** PostgreSQL does not support dropping individual values (`REFUND_PENDING`, `REFUND_FAILED`) from `returnstatus` without recreating the type. If rolling back application code to a revision unfamiliar with those enum values, convert any rows in `REFUND_PENDING`/`REFUND_FAILED` back to `APPROVED` first (`UPDATE return_requests SET status = 'APPROVED' WHERE status IN ('REFUND_PENDING', 'REFUND_FAILED')`).
- **Discrepancy / Partial Failure Forward Recovery:**
  - If a gateway capture succeeds locally after expiry, inspect `payment_transactions` (`status = 'captured'`) and `orders` (`payment_status IN ('refund_pending_oos', 'refunded_oos')`); any `refund_pending_oos` or `REFUND_FAILED` return can be safely retried via the seller refund decision retry endpoint or reconciled asynchronously via Razorpay webhooks (`refund.processed` / `payment.captured`).
