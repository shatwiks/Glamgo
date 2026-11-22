# GlamGo Commerce Hardening & Production Release Checklist

**Target Branch:** `fix/commerce-review-remediation` (derived from `54ba3db64fcb87f6c45ad2b3b848357cc91fbb83`, hardening `fix/commerce-hardening`)  
**Production Deployment Policy:** `main`, `master`, and live Render/Vercel deployments remain **untouched** on this branch until an operator completes the preflight checks, migration, canonical inventory backfill, and verification gates below.

---

## 1. Confirmed Findings & Remediation Checklist

### Phase A — Core Commerce Hardening (`fix/commerce-hardening` @ `54ba3db`)

| # | Area | Confirmed Finding | Flow Affected | Remediation Implemented |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Credentials & Config** | `render.yaml` contained committed `DATABASE_URL`, `RAZORPAY_KEY_ID`, and `RAZORPAY_WEBHOOK_SECRET` literals; `.env.*.example` contained weak placeholder patterns. | Deployment config & repo hygiene | Replaced committed credentials in `render.yaml` with `sync: false`; added `INTERNAL_MAINTENANCE_TOKEN` (`generateValue: true`); hardened `.env.staging.example` and `.env.production.example` to nonfunctional placeholders. |
| 2 | **Internal Endpoints Auth** | `/api/v1/internal/inventory/expire-reservations` and `/api/v1/internal/escrow/mature` were unauthenticated. | Background inventory & settlement | Added `require_maintenance_auth` (`X-Maintenance-Token` via `hmac.compare_digest` or Admin Bearer JWT), log redaction, and `backend/app/services/maintenance_runner.py`. |
| 3 | **Split Checkout Paths & Stock Ledger** | Storefront called legacy `POST /api/v1/orders/` while ignoring `/orders/reserve` & `/orders/checkout`. | Cart -> Reservation -> Checkout | Unified `POST /orders/` and `POST /orders/checkout` onto `CommerceService.reserve_inventory` + `checkout_multi_vendor`; made `SellerListing.stock` the canonical transactional ledger. |
| 4 | **Simulated Payments & Gateway Boundaries** | `checkout_multi_vendor` previously marked payments `completed` with synthetic IDs/keys. | Online & COD Checkout, Verify, Webhook | Removed synthetic completion; online orders start `'pending'`, COD starts `'cod_pending'`; gateway calls occur outside DB locks with `SessionLocal()` recovery fallback. |
| 5 | **Inventory Concurrency & Duplicate Lines** | `reserve_inventory` allowed duplicate lines, negative stock, and expiry/checkout races. | Reservation, Checkout, Expiry | Aggregated duplicate lines before lock acquisition, sorted `listing_id`s ascending, added `CHECK` constraints (`stock >= 0`, `price > 0`, `qty > 0`), and `CHECKOUT_DECREMENT` audit entries. |
| 6 | **Variant & Offer Identity** | Cart & standard orders keyed solely by `product.id`, overwriting shades/sizes. | PDP -> Cart -> Tracking -> Return | Switched cart keys to `productId::variant::listingId` and snapshotted `variant_name`, `sku`, `seller_name`, `price`, and `allocated_discount` on `order_items`. |
| 7 | **Integer Accounting & T+7 Escrow** | Return math & suborder apportionment used floats; escrow matured at T+3 before 7-day return window. | Returns, Refunds, Escrow Maturity | Implemented integer paise math (`to_paise`, `allocate_proportionally_paise`), proportional partial-qty returns, `ESCROW_MATURITY_DAYS = 7`, and open-return settlement blocking. |

### Phase B — Review Remediation & Landing Polish (`fix/commerce-review-remediation`)

| # | Area | Review Finding Remediated | Flow Affected | Remediation Implemented |
| :--- | :--- | :--- | :--- | :--- |
| 8 | **Canonical Inventory Backfill Duplication** | `ensure_product_listings` created per-variant `SellerListing` rows alongside an active unscoped `variant_name == ""` listing, doubling reported catalog stock and risking seller/reservation corruption. | Catalog Sync & Migration Backfill | Added variant-aware reconciliation inside `CommerceService.ensure_product_listings` and `sync_product_stock` (deactivating superseded unscoped listings when covered cleanly, deferring listings with open `PENDING` reservations, never inventing fallback stock or reassigning across sellers, and reporting ambiguous allocations explicitly); added runnable CLI `backend/app/services/inventory_backfill.py` (`--dry-run`, `--product-id`, exit codes `0/2/1`). |
| 9 | **Idempotent Refunds & Lost Gateway Responses** | Lost response after gateway refund acceptance marked `REFUND_FAILED`, letting retries submit duplicate refunds; lacked durable intent, `X-Refund-Idempotency`, lease locking, or OOS refund recovery. | Returns (`RETURN`) & Late-Capture (`OOS_AUTO`) Refunds | Added migration `06c3f5e92d34` (`refund_records`, `refund_accounting_entries`, `return_requests.refunded_at`, partial unique indexes) and `RefundService` (`backend/app/services/refund_service.py`): durable pre-gateway intent, `X-Refund-Idempotency` header + unique `receipt`, `SUBMITTED_UNKNOWN` provider reconciliation before retry, `120s` `IN_FLIGHT` lease, DB-free HTTP I/O, atomic `apply_provider_refund_outcome` + cumulative refund cap, and lock-free `OOS_AUTO` recovery via `maintenance_runner --task recover-refunds` and `POST /api/v1/internal/refunds/recover`. |
| 10 | **Maintenance Dry-Run & Recovery + `/health/ready` Policy** | `maintenance_runner` lacked `--dry-run` and refund recovery; `/health/ready` returned HTTP `503` (`cache: unhealthy`) on single-instance deployments with blank `REDIS_URL`. | Maintenance Ops & Render Health Probes | Added `--dry-run` (strictly read-only, 0 DB writes, 0 gateway calls) and `--task recover-refunds` (`0` clean / `2` `REQUIRES_OPERATOR` / `1` fatal) to `maintenance_runner.py` plus `POST /api/v1/internal/refunds/recover`; added explicit `REDIS_REQUIRED` flag (`False` default -> `'fallback_memory'` healthy for `WEB_CONCURRENCY=1`; `True` -> `'unhealthy'` `503` when `REDIS_URL` missing or unreachable). |
| 11 | **Frontend Landing & Commerce Alignment** | Landing views needed sharper editorial hierarchy, mobile/tablet responsiveness, eager `#how` visual rendering, and route scroll reset (`/#salons`). | Onboarding, Home, Salons, Shop & Checkout UI | Upgraded `index.html`, `styles.css`, and `src/app.js` with viewport-filling split heroes, interactive `#how` `pinned-chapters`, clean copy, 0 horizontal overflow across `320px–1440px`, scroll-to-top on experience routes, and preserved variant/address/OOS/partner fulfillment gating. |

---

## 2. Credential Rotation & Secret Management Runbook

> **CRITICAL NOTE:** Removing literal secrets from `render.yaml` prevents exposure in future checkouts of `HEAD`, but **does NOT rotate active credentials** and **does NOT purge historical Git commits** prior to `54ba3db`. Because credentials were previously committed in tracked history, rotate all of them before promoting this release.

### Required Rotations (Environment-Variable Names Only)

Configure every secret in the Render Dashboard (**Environment** tab on the web service and cron services) and Vercel Dashboard — never in committed YAML or `.env` files:

1. **`DATABASE_URL`** — Rotate the managed PostgreSQL role password, update **`DATABASE_URL`** on all web and cron services, and revoke the old password after rollout verification.
2. **`RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`** — Regenerate the API key pair in Razorpay (**Account & Settings → API Keys**), update **`RAZORPAY_KEY_ID`** and **`RAZORPAY_KEY_SECRET`** in Render (and **`VITE_RAZORPAY_KEY_ID`** in Vercel if set), then deactivate the old key pair.
3. **`RAZORPAY_WEBHOOK_SECRET`** — `backend/app/api/v1/payments.py` validates incoming webhooks against the single configured runtime **`RAZORPAY_WEBHOOK_SECRET`**. Because dual-secret overlap is not active in code, schedule webhook rotation during a low-traffic window, update the secret simultaneously in Razorpay (**Webhooks**) and Render, restart/deploy immediately, and rely on Razorpay webhook retries + `maintenance_runner --task recover-refunds` to reconcile any webhook dropped during the brief secret-swap window.
4. **`INTERNAL_MAINTENANCE_TOKEN`** — Provision a 32+ byte high-entropy random string and configure **`INTERNAL_MAINTENANCE_TOKEN`** identically on the API service and any HTTP cron caller.
5. **`SECRET_KEY`** — Provision a 32+ character cryptographically random JWT signing key (**note:** rotating `SECRET_KEY` invalidates existing JWT sessions).
6. **Cache Policy (`REDIS_URL` & `REDIS_REQUIRED`)** — Keep `WEB_CONCURRENCY="1"`, `REDIS_URL=""`, and `REDIS_REQUIRED="false"` for intentional single-instance in-memory fallback, **or** attach a managed Redis **`REDIS_URL`** and set `REDIS_REQUIRED="true"` if scaling `WEB_CONCURRENCY > 1`.

---

## 3. Scheduled Maintenance Automation

Create Render Cron Jobs (or authenticated HTTPS cron triggers) using the same container image and **`DATABASE_URL`**, **`REDIS_URL`**, **`REDIS_REQUIRED`**, **`RAZORPAY_KEY_ID`**, **`RAZORPAY_KEY_SECRET`**, and **`ENVIRONMENT`**:

1. **Inventory Reservation & Unpaid Order Expiry (`*/5 * * * *`):**
   ```bash
   python -m backend.app.services.maintenance_runner --task expire-reservations
   ```
   *(HTTP equivalent: `POST /api/v1/internal/inventory/expire-reservations` with `X-Maintenance-Token`)*
2. **Online Refund Reconciliation & Retry (`*/10 * * * *`):**
   ```bash
   python -m backend.app.services.maintenance_runner --task recover-refunds
   ```
   *(HTTP equivalent: `POST /api/v1/internal/refunds/recover` with `X-Maintenance-Token`; supports `?dry_run=true`)*
3. **T+7 Escrow Maturity & Clawback (`0 * * * *`):**
   ```bash
   python -m backend.app.services.maintenance_runner --task mature-escrow
   ```
   *(HTTP equivalent: `POST /api/v1/internal/escrow/mature` with `X-Maintenance-Token`)*

**CLI Flags & Exit Codes:**
- `--dry-run`: Strictly read-only preview (`0` persistent DB writes, `0` external gateway calls).
- Exit `0`: Clean completion with zero unresolved escalations.
- Exit `2`: Completed cycle, but >=1 record escalated to `REQUIRES_OPERATOR` (alert on exit code `2`!).
- Exit `1`: Fatal runtime/database exception.

---

## 4. Preflight SQL Checks, Migration & Backfill Rollout Order

Execute in strict order before routing production traffic to this revision:

1. **Database Backup Snapshot:** Take a full PostgreSQL backup (`pg_dump -Fc`) before any DDL/DML changes.
2. **Preflight Existing-Data Uniqueness & Constraint Audit (Read-Only):** Verify production rows satisfy constraints added across `05b2e4d81c23` and `06c3f5e92d34`:
   ```sql
   -- Must return 0 rows before upgrading:
   SELECT id FROM seller_listings WHERE stock < 0 OR price <= 0;
   SELECT id FROM inventory_reservations WHERE qty <= 0;
   SELECT id FROM return_requests WHERE return_qty <= 0;
   SELECT refund_id, COUNT(*) FROM payment_transactions WHERE refund_id IS NOT NULL GROUP BY refund_id HAVING COUNT(*) > 1;
   SELECT reservation_token, COUNT(*) FROM orders WHERE reservation_token IS NOT NULL GROUP BY reservation_token HAVING COUNT(*) > 1;
   SELECT user_id, idempotency_key, COUNT(*) FROM payment_transactions WHERE idempotency_key IS NOT NULL GROUP BY user_id, idempotency_key HAVING COUNT(*) > 1;
   ```
3. **Controlled Deployment Env Policy:** Set `AUTO_MIGRATE="false"` during controlled rollout if running migrations manually ahead of container swap so multiple boot workers never race DDL. (Do not enable sample seed routines in production databases.)
4. **Rotate & Inject Secrets:** Update **`DATABASE_URL`**, **`RAZORPAY_KEY_ID`**, **`RAZORPAY_KEY_SECRET`**, **`RAZORPAY_WEBHOOK_SECRET`**, **`INTERNAL_MAINTENANCE_TOKEN`**, **`SECRET_KEY`**, and **`REDIS_REQUIRED`** / **`REDIS_URL`**.
5. **Apply Migrations Through `06c3f5e92d34` (`head`):**
   ```bash
   python -m alembic -c alembic.ini upgrade head
   ```
6. **Preview & Apply Canonical Inventory Backfill (Read-Only Dry Run First):**
   ```bash
   # Step A: Read-only preview (0 DB writes) — inspect before/after totals and ambiguities
   python -m backend.app.services.inventory_backfill --dry-run
   ```
   - Review `before_totals`, `projected_after_totals`, `ambiguous`, and `deferred` JSON output. Resolve any flagged multi-seller / mismatched variant discrepancies cleanly before proceeding if needed.
   ```bash
   # Step B: Apply idempotent backfill (per-product locked transactions)
   python -m backend.app.services.inventory_backfill

   # Step C: Re-run verification — clean canonical catalog returns exit code 0 with 0 changes
   python -m backend.app.services.inventory_backfill --dry-run
   ```
   *(Backfill exit codes: `0` = all clean / no discrepancies; `2` = completed safe changes, manual review required for flagged `ambiguous` or `deferred` products; `1` = fatal error.)*
7. **Preview Maintenance & Deploy Backend + Cron Services:**
   ```bash
   python -m backend.app.services.maintenance_runner --task all --dry-run
   ```
   Deploy FastAPI service and activate the 3 cron schedules above.
8. **Post-Deploy Smoke Checks:**
   - `GET /health/live` -> HTTP `200` (`{"status": "alive"}`)
   - `GET /health/ready` -> HTTP `200` (`status: "ready"`, `database: "healthy"`, `cache: "fallback_memory"` or `"healthy"`)
   - `POST /api/v1/internal/refunds/recover` without token -> HTTP `401`; with valid `X-Maintenance-Token` + `?dry_run=true` -> HTTP `200`
   - `GET /api/v1/catalog/products/{product_id}/offers` -> returns canonical variant listings matching live seller stock.
9. **Build & Deploy Frontend Bundle (`dist/`):** Deploy Vercel frontend build (`npm run build`) after backend migration + backfill are live.

---

## 5. Irreversibility Boundaries, Rollback & Forward Recovery

### Irreversible / Non-Idempotent State Boundaries
- **`refund_accounting_entries` & `refund_records.accounting_applied_at`:** Financial clawback/deduction entries are append-only once settled for a `refund_record_id` / `provider_refund_id` (`ON DELETE RESTRICT` FK on `refund_accounting_entries.refund_record_id`).
- **`return_requests.restocked_at` & `return_requests.refunded_at`:** Timestamp guards ensure a returned item is restocked and refunded **at most once**. Clearing these columns manually risks double restock or double refund!
- **PostgreSQL `returnstatus` Enum Values (`REFUND_PENDING`, `REFUND_FAILED`):** Added to PostgreSQL enum types in `05b2e4d81c23` (cannot be removed in-place without type recreation).
- **Gateway Side Effects (`provider_refund_id`):** Once Razorpay accepts a refund, that gateway transaction cannot be "rolled back" in SQL.

### Rollback Policy & Restrictions
- **DO NOT blindly run `alembic downgrade` below `06c3f5e92d34`** if any rows exist in `refund_records`, `refund_accounting_entries`, or `return_requests` (`REFUND_PENDING` / `REFUND_FAILED`), **unless traffic is drained, all in-flight `IN_FLIGHT` / `SUBMITTED_UNKNOWN` refund intents are reconciled via Razorpay first, and an explicit operator archival/export of `refund_records` & `refund_accounting_entries` has been taken.**
- **NEVER blindly run `UPDATE return_requests SET status = 'APPROVED'`** on `REFUND_PENDING` or `REFUND_FAILED` rows — doing so bypasses `refund_records` reconciliation and risks double refunding a customer!
- **Application Rollback vs Forward Recovery:** Prefer rolling application code forward (patching & running `maintenance_runner --task recover-refunds`) over schema downgrades. Inspect any `status = 'REQUIRES_OPERATOR'` row in `refund_records` alongside `payment_transactions` (`captured_payment_id`) and `orders` (`payment_status IN ('refund_pending_oos', 'refunded_oos')`) before manual resolution.
