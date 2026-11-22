---
phase: 13-dual-track-consumer-and-turnkey-upgrades
plan: 02
subsystem: bookings, commerce, search, seo, ui, code-splitting, testing
tags: [fastapi, sqlalchemy, bookings, otp, wallet-credits, referrals, json-ld, vite, code-splitting, playwright]

requires:
  - phase: 13-01
    provides: Pre-migrated `bookings.arrival_otp`, `bookings.addons_json`, `orders.wallet_credit_applied`, `users.referral_code`, and `users.wallet_credits` columns + multi-city Haversine catalog engine
provides:
  - 1-tap booking reschedule (`PUT /api/v1/bookings/{id}/reschedule`), strict 4-digit doorstep arrival OTP verification (`POST /api/v1/bookings/{id}/verify-arrival-otp`), and server-priced optional booking add-ons (`MAIN-03`)
  - City-scoped Global Search (`⌘K`) with `Outside <City>` pills, deterministic location autocomplete dismissal, and dynamic `import('./dashboards-suite.js')` + `import('leaflet')` code splitting under 500 kB per chunk (`MAIN-04`)
  - Editorial Legal/Policy modal drawers (`src/consumer-trust.js`), OpenGraph + `BeautySalon` JSON-LD metadata in `index.html`, and end-to-end Referral / Gift Card wallet credit accrual & atomic server-side checkout deduction (`MAIN-05`)
affects:
  - 13-03-PLAN.md / 13-04-PLAN.md (turnkey showcase track on `feat/turnkey-platform` inherits multi-city catalog parity while `main` remains strictly production RBAC)

actuals:
  tokens: 18450
  tasks: 3
  commits: 3
  plan_head_before: df5c6e51d8cb6a980ef21911140ef4ca6164ee8b
  plan_head_after: b58f28d39d2d37c3546fb3552081f7ee6517e098

tech-stack:
  added: []
  patterns:
    - "Consistent ORM property serialization (`@property def addons` on `Booking`) across all `BookingResponse` endpoints including idempotent replay paths"
    - "Pre-compare NULL and terminal-status guards before `hmac.compare_digest` in `verify_arrival_otp`, paired with strict Pydantic regex `^\\d{4}$`"
    - "Row-locked `with_for_update()` atomic customer `wallet_credits` deduction inside `CommerceService.checkout_multi_vendor` with idempotency fingerprint binding"
    - "Lazy dynamic `import('./dashboards-suite.js')` and `import('leaflet')` with Vite `manualChunks` keeping all bundles well below 500 kB"

key-files:
  created:
    - src/consumer-trust.js
  modified:
    - backend/app/models/booking.py
    - backend/app/schemas/booking.py
    - backend/app/api/v1/bookings.py
    - backend/app/models/order.py
    - backend/app/schemas/commerce.py
    - backend/app/services/commerce_service.py
    - backend/app/api/v1/users.py
    - src/api.js
    - src/app.js
    - vite.config.js
    - index.html
    - styles.css
    - tests/test_phase13_consumer.py

key-decisions:
  - "Resolved booking add-on prices exclusively from server-side `BOOKING_ADDONS_CATALOG` so forged client add-on IDs or prices cannot alter booking totals."
  - "Preserved explicit safe response dictionaries in `backend/app/api/v1/partners.py` (`get_professional_bookings`, `get_salon_bookings`) omitting `arrival_otp` so the 4-digit doorstep PIN remains confidential to the customer (`T-13-06`)."
  - "Included `apply_wallet_credit` in both client `place-order` and server `CommerceService.checkout_multi_vendor` idempotency fingerprints, and branched directly to `order-success` when `isCod || order.payment_status === 'completed' || Number(order.total) <= 0`."

patterns-established:
  - "Lazy dashboard and map hydration (`loadDashboardsSuite()`, `loadLeaflet()`) so anonymous consumer storefront loads zero partner/admin ops or map vendor chunks on initial paint."

requirements-completed:
  - MAIN-03
  - MAIN-04
  - MAIN-05

coverage:
  - id: D3
    description: "1-tap booking reschedule, strict 4-digit arrival OTP verification synced with Specialist Studio, and server-priced optional add-ons"
    requirement: MAIN-03
    verification:
      - kind: integration
        ref: "tests/test_phase13_consumer.py#test_booking_addons_server_pricing_and_consistent_serialization"
        status: pass
      - kind: integration
        ref: "tests/test_phase13_consumer.py#test_booking_reschedule_conflict_and_bola_protection"
        status: pass
      - kind: integration
        ref: "tests/test_phase13_consumer.py#test_arrival_otp_strict_validation_null_guard_and_partner_privacy"
        status: pass
    human_judgment: false
  - id: D4
    description: "City-scoped Global Search (Cmd+K) with Outside <City> pills, clean autocomplete dismissal, and lazy dynamic code splitting for dashboards-suite.js and Leaflet"
    requirement: MAIN-04
    verification:
      - kind: build
        ref: "npm run build (index 311.88 kB, vendor-leaflet 150.07 kB, dashboards-suite 54.09 kB — zero >500 kB warnings)"
        status: pass
      - kind: e2e
        ref: "Playwright headless verification at 1440x900 and 375x812 (Outside <City> tag, autocomplete outside-click dismiss, lazy Admin Promotions load, 0px overflow, 0 pageerrors)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Editorial Legal/Policy modal drawers, OpenGraph + BeautySalon JSON-LD metadata, and end-to-end Referral/Gift Card wallet credit accrual & atomic checkout deduction"
    requirement: MAIN-05
    verification:
      - kind: integration
        ref: "tests/test_phase13_consumer.py#test_rewards_gift_card_referral_and_replay_guards"
        status: pass
      - kind: integration
        ref: "tests/test_phase13_consumer.py#test_checkout_with_apply_wallet_credit_deducts_balance_atomically"
        status: pass
      - kind: e2e
        ref: "Playwright headless verification of footer Policy Drawer, Account Coupons & rewards wallet grid, and Checkout wallet credit toggle"
        status: pass
    human_judgment: false

duration: 28min
completed: 2026-11-22
status: complete
---

# Phase 13 Plan 02: Consumer Booking Lifecycle, City Search & Code Splitting, and Trust/Rewards Wallet Summary

**Delivered 1-tap booking reschedule, strict 4-digit arrival OTP verification & server-priced add-ons (`MAIN-03`), city-scoped `⌘K` search, clean autocomplete dismissal & lazy dashboard/Leaflet code splitting under 312 kB (`MAIN-04`), plus editorial policy drawers, `BeautySalon` JSON-LD SEO, and atomic server-enforced Referral/Gift Card wallet credit redemption at checkout (`MAIN-05`) on `main`.**

## Performance

- **Duration:** 28 min
- **Started:** 2026-11-22T02:29:35Z
- **Completed:** 2026-11-22T02:58:50Z
- **Tasks:** 3
- **Files modified:** 14 (1 created, 13 modified)

## Accomplishments

- **Consumer Booking Lifecycle Upgrades (`MAIN-03`):** Added `arrival_otp`, `addons_json`, and `@property def addons` on `Booking`, strict 4-digit regex `^\d{4}$` on `BookingOtpVerifyRequest`, canonical server-priced `BOOKING_ADDONS_CATALOG` (`addon-head-massage` ₹299, `addon-sheet-mask` ₹349, `addon-gel-removal` ₹249, `addon-serum-ampoule` ₹499), row-locked `PUT /api/v1/bookings/{id}/reschedule`, and `POST /api/v1/bookings/{id}/verify-arrival-otp` with NULL/cancelled/completed guards before `hmac.compare_digest`. Wired add-on chips in `bookingModal()`, Arrival PIN badge + 1-tap Reschedule modal in *My bookings*, and `#pro-arrival-otp-form` interception in Specialist Studio.
- **City-Scoped Search, Autocomplete Dismissal & Code Splitting (`MAIN-04`):** Added `In <City>` vs `All cities` scope pills in `⌘K` search sorting local matches first and badging out-of-city items `Outside <City>`, added `hideLocationAutocomplete()` on outside `pointerdown`, 160ms guarded `focusout`, `Escape`, and option pick, and replaced static top-level `dashboards-suite.js` and `leaflet` imports with cached lazy loaders `loadDashboardsSuite()` and `loadLeaflet()` plus Vite `manualChunks`. Main bundle dropped from `494.35 kB` to `311.88 kB` (`dashboards-suite` `54.09 kB`, `vendor-leaflet` `150.07 kB`) with zero >500 kB chunk warnings.
- **Policy Drawers, `BeautySalon` JSON-LD & End-to-End Wallet Credit Redemption (`MAIN-05`):** Created `src/consumer-trust.js` exporting `POLICY_DOCS` (`hygiene`, `cancellation`, `privacy`, `terms`), `GIFT_CARDS_CATALOG`, `renderPolicyModalContent`, and `renderRewardsWalletPanel`. Added `GET /api/v1/users/rewards` and `POST /api/v1/users/rewards/redeem` (supporting `GLAM500`, `LUXE1000`, `BRIDAL2500`, and bilateral ₹300 friend referrals with self-referral 400 and replay 409 guards). Implemented row-locked `with_for_update()` wallet credit deduction in `CommerceService.checkout_multi_vendor`, wired the Checkout wallet credit toggle, and enriched `index.html` with OpenGraph, Twitter Card, and Schema.org `BeautySalon` JSON-LD.

## Task Commits

Each task was committed atomically on `main`:

1. **Task 1: Consumer Booking Upgrades — 1-Tap Reschedule, Strict 4-Digit Arrival OTP Sync & Server-Priced Add-Ons (`MAIN-03`)** — `edc6dbd` (`feat`)
2. **Task 2: City-Scoped Global Search (Cmd+K), Clean Autocomplete Dismissal & Lazy Dashboard + Leaflet Code Splitting (`MAIN-04`)** — `0f99e2f` (`feat`)
3. **Task 3: Policy Drawers, OpenGraph + BeautySalon JSON-LD & End-to-End Referral/Gift Card Wallet Redemption in Account & Checkout (`MAIN-05`)** — `b58f28d` (`feat`)

## Files Created/Modified

- `src/consumer-trust.js` (created) — Editorial Legal/Policy drawers (`POLICY_DOCS`, `renderPolicyModalContent`) and Referral/Gift Card rewards wallet UI (`GIFT_CARDS_CATALOG`, `renderRewardsWalletPanel`) using `icon()` SVGs exclusively.
- `backend/app/models/booking.py` — Added `arrival_otp`, `addons_json`, and `@property def addons`.
- `backend/app/schemas/booking.py` — Added `BookingAddonItem`, `BookingRescheduleRequest`, `BookingOtpVerifyRequest` (`pattern=r"^\d{4}$"`), and extended `BookingCreate` / `BookingResponse`.
- `backend/app/api/v1/bookings.py` — Added `BOOKING_ADDONS_CATALOG`, server-priced add-on calculation + 4-digit `arrival_otp` generation in `create_booking`, `reschedule_booking`, and `verify_arrival_otp`.
- `backend/app/models/order.py` — Added `Order.wallet_credit_applied`.
- `backend/app/schemas/commerce.py` — Added `MultiVendorCheckoutRequest.apply_wallet_credit` and `MultiVendorCheckoutResponse.wallet_credit_applied`.
- `backend/app/services/commerce_service.py` — Added atomic `with_for_update()` customer `wallet_credits` deduction and idempotency fingerprint binding in `checkout_multi_vendor`.
- `backend/app/api/v1/users.py` — Added `RewardsSummaryResponse`, `RewardRedeemRequest`, `RewardRedeemResponse`, `get_my_rewards`, and `redeem_reward_code`.
- `src/api.js` — Added `apiRescheduleBooking`, `apiVerifyBookingArrivalOtp`, `apiGetMyRewards`, and `apiRedeemRewardCode`.
- `src/app.js` — Wired booking add-ons, 1-tap reschedule modal, Specialist Studio arrival OTP verification modal, city-scoped `⌘K` search, `hideLocationAutocomplete()`, `loadDashboardsSuite()`, `loadLeaflet()`, footer policy links, Account rewards wallet, and Checkout wallet credit toggle.
- `vite.config.js` — Added `build.rollupOptions.output.manualChunks` for `vendor-leaflet` and `dashboards-suite`.
- `index.html` — Added OpenGraph, Twitter Card, and Schema.org `BeautySalon` JSON-LD metadata.
- `styles.css` — Added responsive editorial CSS classes for booking add-ons, arrival OTP chip, search scope bar/outside pill, policy drawers, rewards wallet grid, and checkout credit toggle.
- `tests/test_phase13_consumer.py` — Added 5 comprehensive integration tests for booking add-ons, reschedule conflict/BOLA protection, arrival OTP 422/400/200 + partner privacy, gift card/referral redemption & replay guards, and atomic checkout wallet credit deduction (16 total tests in file).

## Verification Results

Observed verbatim on `main` (Windows PowerShell):

- **Python `py_compile` & JS `node -c` Syntax Checks:**
  - `.venv\Scripts\python.exe -m py_compile backend/app/models/booking.py backend/app/schemas/booking.py backend/app/api/v1/bookings.py backend/app/models/order.py backend/app/schemas/commerce.py backend/app/services/commerce_service.py backend/app/api/v1/users.py` → exited `0`
  - `node -c src/api.js`, `node -c src/consumer-trust.js`, `node -c src/dashboards-suite.js`, `node -c src/app.js`, `node -c vite.config.js` → all exited `0`
- **PowerShell `index.html` SEO & JSON-LD Check:**
  - Verified `og:title` present and `<script type="application/ld+json">` parses cleanly via `ConvertFrom-Json` with `@type == "BeautySalon"`.
- **Vite Production Build (`npm run build`):**
  - `dist/index.html`: `4.18 kB` (`gzip: 1.52 kB`)
  - `dist/assets/vendor-leaflet-CIGW-MKW.css`: `15.61 kB` (`gzip: 6.46 kB`)
  - `dist/assets/index-DH429Lwz.css`: `158.00 kB` (`gzip: 28.03 kB`)
  - `dist/assets/dashboards-suite-C-WNDTEt.js`: `54.09 kB` (`gzip: 15.30 kB`)
  - `dist/assets/vendor-leaflet-CndcyxVL.js`: `150.07 kB` (`gzip: 43.55 kB`)
  - `dist/assets/index-DLEmAT5S.js`: `311.88 kB` (`gzip: 88.36 kB`)
  - Zero `"Some chunks are larger than 500 kB"` warnings.
- **Backend Pytest Regression Suite:**
  - `tests/test_bookings.py` + `tests/test_orders.py` + `tests/test_multi_vendor_phase5.py` + `tests/test_phase13_consumer.py`: `29/29 passed`
  - Full `tests/` suite (`99` tests across all 16 test files): `99/99 passed` (verified `tests/test_performance_load.py` `2/2 passed in 3.17s`).
- **Headless Playwright E2E Verification (`http://127.0.0.1:5173/`):**
  - `demoBarCount: 0` (`.turnkey-demo-bar` strictly absent on `main`)
  - `hasAdminSignIn: true` (logged-out `#admin` requires Administrator Sign In)
  - `outsideTagCount: 1` (city-scoped `⌘K` search tags out-of-city salons `Outside Mumbai`)
  - `autocompleteDismissed: true` (`#location-autocomplete-list` hides cleanly on outside click)
  - `policyTitle: "GlamGo Hygiene & Safety Guarantee"` (footer policy link opens Policy Drawer modal; screenshot saved at `verify_phase13_main.png`)
  - `walletGridCount: 1`, `creditToggleCount: 1` (Referral/Gift Card wallet renders in Account and credit toggle renders in Checkout)
  - `promoFormCount: 1` (lazy `import('./dashboards-suite.js')` loads seamlessly when signed in)
  - `desktopOverflow: 0` (`1440x900`), `mobileOverflow: 0` (`375x812`), `pageErrorsCount: 0`

## Deviations from Plan

None — plan executed exactly as written.

## Threat Flags

None — all trust boundaries and mitigations match `<threat_model>` (`T-13-05`..`T-13-08`, `T-13-SC-02`).

## Known Stubs

None — zero placeholders, hardcoded empty UI props, or un-wired components introduced.

## Self-Check: PASSED

- All 14 created/modified files verified present on disk and tracked in git (`df5c6e5..b58f28d`).
- All 3 task commits (`edc6dbd`, `0f99e2f`, `b58f28d`) verified on `main`.
- All `py_compile`, `node -c`, `index.html` JSON-LD, `npm run build`, `pytest`, and headless Playwright E2E checks passed with exit code `0`.

---
*Phase: 13-dual-track-consumer-and-turnkey-upgrades*
*Completed: 2026-11-22*
