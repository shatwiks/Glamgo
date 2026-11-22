---
phase: 13-dual-track-consumer-and-turnkey-upgrades
plan: 01
subsystem: api, auth, database, ui, testing
tags: [fastapi, sqlalchemy, sqlite, postgresql, haversine, otp, rate-limit, rbac, vite]

requires:
  - phase: milestone-v1.0
    provides: Core FastAPI marketplace API, SQLAlchemy ORM catalog/user/admin models, Vite vanilla-JS storefront
provides:
  - SQLite-safe engine pool guards and idempotent `ensure_phase13_schema_columns` startup & seed migration
  - Multi-city (`Mumbai`, `Bengaluru`, `Delhi`) & Haversine radius filtering on `/api/v1/catalog/salons`, `/api/v1/catalog/services`, `/api/v1/catalog/professionals`, and `/api/v1/salons/`
  - Hardened self-service Password Reset and Mobile OTP sign-in with Admin 403 exclusion, 5-attempt lockout, multi-account phone ambiguity 409, dev-echo gating, and thread-safe in-memory `RateLimiter` fallback
  - Fixed Admin partner draft approval creating valid `Salon`/`ProfessionalProfile` rows with city/coords and studio activation notifications
  - Frontend catalog distance hydration (`src/api.js`, `src/app.js`) and non-admin Email/OTP/Reset auth UI
affects:
  - 13-02-PLAN.md (uses pre-migrated `bookings.arrival_otp`, `bookings.addons_json`, `orders.wallet_credit_applied`, `users.referral_code`, `users.wallet_credits`)
  - 13-03-PLAN.md / 13-04-PLAN.md (turnkey showcase track ports multi-city catalog parity)

actuals:
  tokens: 24690
  tasks: 3
  commits: 4
  plan_head_before: ec097dbb8b1453a83466c7974bcaff1af073655e
  plan_head_after: 55541cbbbc3eeebc3819310efd7aee1f1a742401

tech-stack:
  added: []
  patterns:
    - "Idempotent cross-dialect schema inspector migration (`ensure_phase13_schema_columns`) invoked in FastAPI lifespan and `seed_database(db)`"
    - "Thread-safe `_in_memory_windows` sliding-window fallback in `RateLimiter` when Redis is unreachable"
    - "HMAC-SHA256 code hashing with `hmac.compare_digest`, 5-attempt lockout invalidation, and strict Admin RBAC exclusion"

key-files:
  created:
    - tests/test_phase13_consumer.py
  modified:
    - backend/app/models/catalog.py
    - backend/app/models/user.py
    - backend/app/core/database.py
    - backend/app/core/rate_limit.py
    - backend/app/main.py
    - backend/app/schemas/catalog.py
    - backend/app/services/seed_service.py
    - backend/app/api/v1/salons.py
    - backend/app/api/v1/api.py
    - backend/app/api/v1/auth.py
    - backend/app/api/v1/admin.py
    - src/api.js
    - src/app.js

key-decisions:
  - "Preserved backward-compatible duplicate phone allowances on `/api/v1/auth/register` while enforcing strict multi-account ambiguity rejection (generic 200 without OTP on `/otp/request`, HTTP 409 on `/otp/verify`)."
  - "Pre-created `bookings.arrival_otp`, `bookings.addons_json`, and `orders.wallet_credit_applied` in `ensure_phase13_schema_columns` so Wave 2 (`13-02`) migrates cleanly on startup."
  - "Normalized naive UTC timestamps via `_utc_now_naive()` / `_is_expired()` so expiry checks work identically on PostgreSQL `TIMESTAMP WITHOUT TIME ZONE` and SQLite `DATETIME`."

patterns-established:
  - "Dual-track RBAC isolation on `main`: Admin auth form excludes OTP/reset toggles and backend rejects `UserRole.ADMIN` self-service codes with HTTP 403."

requirements-completed:
  - MAIN-01
  - MAIN-02

coverage:
  - id: D1
    description: "Multi-city GPS persistence, SQLite/PG auto-migration, and `/api/v1/catalog/salons` radius filtering across Mumbai, Bengaluru, and Delhi"
    requirement: MAIN-01
    verification:
      - kind: integration
        ref: "tests/test_phase13_consumer.py#test_ensure_phase13_schema_columns_idempotent_sqlite_and_pg"
        status: pass
      - kind: integration
        ref: "tests/test_phase13_consumer.py#test_catalog_salons_city_and_radius_filtering"
        status: pass
      - kind: integration
        ref: "tests/test_phase13_consumer.py#test_catalog_services_and_professionals_city_filtering"
        status: pass
      - kind: integration
        ref: "tests/test_phase13_consumer.py#test_catalog_salons_sort_nearest_and_invalid_coords_rejected"
        status: pass
    human_judgment: false
  - id: D2
    description: "Hardened Password Reset, Mobile OTP sign-in with 5-attempt lockout, Admin exclusion, ambiguity guard, dev-echo suppression, in-memory rate-limit fallback, and fixed Partner Draft approval"
    requirement: MAIN-02
    verification:
      - kind: integration
        ref: "tests/test_phase13_consumer.py#test_password_reset_happy_path_replay_and_lockout"
        status: pass
      - kind: integration
        ref: "tests/test_phase13_consumer.py#test_mobile_otp_happy_path_replay_and_lockout"
        status: pass
      - kind: integration
        ref: "tests/test_phase13_consumer.py#test_admin_excluded_from_password_reset_and_mobile_otp"
        status: pass
      - kind: integration
        ref: "tests/test_phase13_consumer.py#test_duplicate_phone_register_compat_and_otp_ambiguity_rejection"
        status: pass
      - kind: integration
        ref: "tests/test_phase13_consumer.py#test_rate_limiter_in_memory_fallback_without_redis"
        status: pass
      - kind: integration
        ref: "tests/test_phase13_consumer.py#test_dev_codes_suppressed_in_staging_and_production"
        status: pass
      - kind: integration
        ref: "tests/test_phase13_consumer.py#test_admin_approve_salon_owner_draft_activates_role_and_creates_salon"
        status: pass
      - kind: unit
        ref: "tests/test_auth.py & tests/test_admin_phase2.py (9 tests)"
        status: pass
    human_judgment: false

duration: 14min
completed: 2026-11-22
status: complete
---

# Phase 13 Plan 01: Consumer Multi-City GPS, Hardened Auth & Partner Activation Summary

**Persisted multi-city (`Mumbai`, `Bengaluru`, `Delhi`) GPS catalog filtering with idempotent SQLite/PostgreSQL auto-migration (`MAIN-01`), hardened Password Reset & Mobile OTP sign-in with Admin RBAC exclusion and in-memory rate-limit fallback, and fixed Admin partner draft approval (`MAIN-02`) on `main`.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-11-22T02:06:52Z
- **Completed:** 2026-11-22T02:20:30Z
- **Tasks:** 3
- **Files modified:** 14 (1 created, 13 modified)

## Accomplishments

- **Multi-City & GPS Persistence (`MAIN-01`):** Added `city`, `lat`, `lng` on `Salon` and `ProfessionalProfile` (plus `area`), and `service_cities` + `@property def cities` on `Service`. Guarded PostgreSQL-only pool kwargs in `backend/app/core/database.py` on SQLite URLs, implemented `ensure_phase13_schema_columns`, and wired it into `backend/app/main.py` lifespan and `seed_database(db)` alongside Bengaluru (`l5`–`l8`, `101`–`103`, `s9`), Mumbai (`l1`–`l4`, `1`–`3`), and Delhi (`l9`, `104`) seed & backfill logic.
- **Haversine Distance Engine & Storefront Sync (`MAIN-01`):** Implemented `_haversine_km`, `NEAR_SALON_RADIUS_KM = 8.0`, `city`/`lat`/`lng`/`max_distance_km`/`sort=nearest` filtering in `backend/app/api/v1/salons.py`, mounted `/api/v1/catalog/salons`, `/api/v1/catalog/services`, and `/api/v1/catalog/professionals` in `backend/app/api/v1/api.py`, exported `apiGetCatalogSalons` in `src/api.js`, and wired `loadCatalogFeeds()` and location-change distance sync in `src/app.js`.
- **Hardened Password Reset, Mobile OTP & Partner Approval (`MAIN-02`):** Added additive reset/OTP/referral/wallet columns on `User`, implemented thread-safe `_in_memory_windows` fallback in `RateLimiter`, shipped `/api/v1/auth/password-reset/{request,confirm}` and `/api/v1/auth/otp/{request,verify}` with Admin 403 exclusion, 5-attempt lockout, multi-account phone ambiguity 409, and strict `dev_code`/`dev_otp` gating, fixed `Salon(...)` constructor kwargs in `approve_partner_draft` with city/coord mapping and studio activation notifications, and wired customer OTP/reset UI and activation toasts in `src/app.js`.

## Task Commits

Each task was committed atomically on `main`:

1. **Task 1 (Tracer): Backend Multi-City GPS Persistence, SQLite/PG Auto-Migration & `/api/v1/catalog/salons` Filtering** — `1b14032` (`feat`)
2. **Task 2: Frontend Multi-City Catalog API Integration & Distance Sync** — `fd698d8` (`feat`)
3. **Task 3: Hardened Auth Lifecycle (Password Reset & Mobile OTP with Lockout/Fallback) + Admin Partner Role Activation** — `9e0d906` (`feat`)
4. **Test Isolation Follow-up:** Isolated test-created Bengaluru salon cleanup in `tests/test_phase13_consumer.py` — `55541cb` (`test`)

## Files Created/Modified

- `tests/test_phase13_consumer.py` (created) — 11 automated tests covering SQLite/PG idempotent column migration, Bengaluru/Delhi/Mumbai catalog & Haversine filtering, `sort=nearest` + 422 coordinate validation, password reset & OTP replay/5-attempt lockout, Admin 403 exclusion, ambiguous phone 409, in-memory `RateLimiter` 429 fallback, staging/production dev-code suppression, and Salon Owner draft approval.
- `backend/app/models/catalog.py` — Added `Service.service_cities`, `Service.cities` property, `ProfessionalProfile.{city, area, lat, lng}`, and `Salon.{city, lat, lng}`.
- `backend/app/models/user.py` — Added `User.{reset_token_hash, reset_token_expires_at, reset_attempts, otp_code_hash, otp_expires_at, otp_attempts, referral_code, wallet_credits}`.
- `backend/app/core/database.py` — Guarded PG pool kwargs on SQLite URLs and added `ensure_phase13_schema_columns(bind_engine)`.
- `backend/app/core/rate_limit.py` — Added `_in_memory_windows` sliding-window fallback under `threading.Lock()` when Redis is unavailable or errors.
- `backend/app/main.py` — Invoked `ensure_phase13_schema_columns(engine)` during FastAPI `lifespan` startup.
- `backend/app/schemas/catalog.py` — Extended `ServiceResponse`, `ServiceCreate`, `ProfessionalResponse`, `SalonResponse`, and `SalonCreate` with Phase 13 city/GPS/distance fields.
- `backend/app/services/seed_service.py` — Invoked `ensure_phase13_schema_columns(db.get_bind())` at start of `seed_database`, added multi-city seed records (`l5`–`l9`, `101`–`104`, `s9`) and backfill updates.
- `backend/app/api/v1/salons.py` — Added `_haversine_km`, `NEAR_SALON_RADIUS_KM`, `format_salon(..., user_lat, user_lng)`, and `city`/`lat`/`lng`/`max_distance_km`/`sort=nearest` filtering + v2 cache keys.
- `backend/app/api/v1/api.py` — Added `@catalog_router.get("/salons")`, `@catalog_router.get("/services")`, and `@catalog_router.get("/professionals")`.
- `backend/app/api/v1/auth.py` — Added `PasswordResetRequest`, `PasswordResetConfirm`, `MobileOtpRequest`, `MobileOtpVerify`, `_hash_code`, `_normalize_phone_digits`, `_allow_dev_code_echo`, and the 4 rate-limited reset/OTP endpoints.
- `backend/app/api/v1/admin.py` — Fixed `Salon(...)` constructor kwargs in `approve_partner_draft`, parsed `[City: ...]` coordinates, prevented downgrading admins, and emitted workspace-specific activation notifications.
- `src/api.js` — Added `apiGetCatalogSalons`, `apiRequestPasswordReset`, `apiConfirmPasswordReset`, `apiRequestMobileOtp`, `apiVerifyMobileOtp`, and extended `apiGetServices`, `apiGetProfessionals`, and `apiGetSalons`.
- `src/app.js` — Wired `apiGetCatalogSalons` hydration & location-switch sync, non-admin Email/OTP/Reset auth UI (`auth()`), and partner workspace activation toast.

## Verification Results

Observed verbatim on `main` (Windows PowerShell, using `.venv\Scripts\python.exe`):

- **Python Bytecode Compile (`py_compile`):**
  ```powershell
  .venv\Scripts\python.exe -m py_compile backend/app/models/catalog.py backend/app/models/user.py backend/app/core/database.py backend/app/core/rate_limit.py backend/app/main.py backend/app/schemas/catalog.py backend/app/services/seed_service.py backend/app/api/v1/salons.py backend/app/api/v1/api.py backend/app/api/v1/auth.py backend/app/api/v1/admin.py
  ```
  Result: `Command exited with code 0.`

- **JavaScript Syntax & Vite Production Build:**
  - `node -c src/api.js` → exited `0`
  - `node -c src/app.js` → exited `0`
  - `npm run build` → `vite v7.3.7 building client environment for production... ✓ 11 modules transformed. dist/index.html 2.04 kB | dist/assets/index-VIkl_Tiw.css 168.39 kB | dist/assets/index-Biq227Gr.js 494.35 kB ✓ built in 2.17s` (exited `0`)

- **Combined Pytest Suite:**
  ```powershell
  .venv\Scripts\python.exe -m pytest tests/test_catalog.py tests/test_auth.py tests/test_admin_phase2.py tests/test_phase13_consumer.py -v
  ```
  Result: `24 passed, 1 warning in 18.43s` (exited `0`):
  - `tests/test_catalog.py`: `4/4 passed`
  - `tests/test_auth.py`: `2/2 passed`
  - `tests/test_admin_phase2.py`: `7/7 passed` (unfiltered)
  - `tests/test_phase13_consumer.py`: `11/11 passed`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Cross-run Bengaluru salon pollution in `tests/test_phase13_consumer.py`**
- **Found during:** Full verification gate run across all 4 test files
- **Issue:** `test_admin_approve_salon_owner_draft_activates_role_and_creates_salon` persisted a new Bengaluru `Salon` row (`Atelier Silk Bengaluru`) to the local PostgreSQL test DB without cleanup, causing subsequent runs of `test_catalog_salons_city_and_radius_filtering` and `test_catalog_salons_sort_nearest_and_invalid_coords_rejected` to observe 5 Bengaluru salons instead of the 4 seeded salons (`l5`–`l8`).
- **Fix:** Added cleanup of test-created `"Atelier Silk Bengaluru"` salon records + `cache_service.invalidate_catalog()` in a `finally:` block and before `test_catalog_salons_city_and_radius_filtering`.
- **Files modified:** `tests/test_phase13_consumer.py`
- **Verification:** Combined 24-test `pytest` suite passed `24/24` cleanly.
- **Committed in:** `55541cb`

## Threat Flags

None — all trust boundaries and mitigations match `<threat_model>` (`T-13-01`..`T-13-04`, `T-13-SC-01`).

## Known Stubs

None — zero placeholders, stubbed components, or mocked data sources introduced.

## Self-Check: PASSED

- All 14 created/modified source and test files verified present on disk and tracked in git (`ec097db..55541cb`).
- All 4 task/cleanup commits (`1b14032`, `fd698d8`, `9e0d906`, `55541cb`) verified on `main`.
- Combined `py_compile`, `node -c`, `npm run build`, and `pytest` (`24 passed`) exited `0`.

## Next Phase Readiness

- `main` is ready for Wave 2 (`13-02-PLAN.md`: booking reschedule, arrival OTP, add-ons, global search polish, dynamic `dashboards-suite.js` splitting, legal/SEO/referral retention).
- Note: Per Wave 1 handoff instructions, changes are committed locally on `main` and **not yet pushed** so Wave 2 (`13-02`) can update `CHANGEREPORT.md` and push `main` together.

---
*Phase: 13-dual-track-consumer-and-turnkey-upgrades*
*Completed: 2026-11-22*
