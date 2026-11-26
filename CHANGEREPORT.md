# GlamGo Change Report (`CHANGEREPORT.md`)

> **Standing Workflow Policy:** Every prompt that modifies the repository appends a structured entry to `CHANGEREPORT.md` detailing every modified/added file, why it changed, and verified checks before pushing changes to GitHub.

---

## Prompt Entry — `2026-11-26`: Show Bengaluru-Only Availability Notice & One-Click Switch in Services

**Objective:** When a user's active location is outside Bengaluru, clearly inform them in Services that at-home services are currently available in Bengaluru and provide a one-click `Switch to Bengaluru` button (plus in empty-city states across Professionals and Salons).

**Modified Files (`branch-release-54ba3db`):**
- `src/app.js`: Added `.city-availability-banner` with `Switch to Bengaluru` (`data-action="location-set" data-id="Indiranagar, Bengaluru"`) when `userCity` is not Bengaluru in `homePage()`, and updated empty states in `homePage()` (`servicesResultsHtml`, `prosSection`) and `salonPage()` to offer one-click `Switch to Bengaluru`.
- `styles.css`: Added `.city-availability-banner` styling.

**Verification Results:**
- `npm run build`: Built cleanly (`vite v7.3.7`, `15 modules transformed`, `3.68s`).
- `node --test tests/*.test.mjs`: `7/7` tests passed (`0` failed).

---

## Prompt Entry — `2026-11-26`: Live Location Prompt, Strict City Filtering, Salon Distance (km) & Near-to-Far Filter Inside Filters

**Objective:** Immediately request live browser geolocation on startup so services/salons/professionals load for the user's location only; ensure all dynamic city headings (`Discover salons in {City}.`, `Services in {City}.`, `Professionals in {City}.`, `Salons in {City}.`) always reflect the exact selected/live city; keep salon location & distance (`km`) filtering strictly inside `Show filters` (no outside bar) with `Distance: Near to far` only (no `Far to near`); restrict At-Home professionals strictly to the active city with no distance shown.

**Created & Modified Files (`branch-release-54ba3db`):**
- `src/app.js`:
  - Added `requestLiveLocation()` called on initial boot in `init()` (once per browser session via `sessionStorage`) and wired `live-location` action inside the salon filter panel.
  - Updated `normalizeCity()` to strip Indian state/country/PIN tokens (`INDIAN_STATES_OR_COUNTRY`) so non-metro cities (e.g. `Pune, Maharashtra, India` → `Pune`, `Manipal, Karnataka, India` → `Manipal`) update all dynamic city headings accurately; explicitly synced `state.locationCity` on `location-set` and updated Men's salon hero heading to display `userCity` too.
  - Updated `resolveUserCoords()`, `resolveSalonCoords()`, and `enrichSalonWithDistance()` to compute accurate `km` from live GPS or selected area/city coordinates without falsely falling back to Mumbai for unknown cities, displaying `.salon-km-pill` (`X.X km away`) on salon cards.
  - Kept `SALON_SORT_OPTIONS` to `Distance: Near to far` (`distance-asc`, default) alongside standard sort options (removed `Far to near`), removed outside `.salon-location-bar`, and placed `Location & distance` (`Use live location`, `Change city`, `All in <City>`, `Within 3/5/8/15 km`) cleanly inside the `Show filters` panel/drawer.
  - Tightened `isProAvailableInCity()` and `isServiceAvailableInCity()` to enforce strict normalized city matching (returning `false` when missing/mismatched), keeping At-Home professional cards free of distance labels.
- `styles.css`: Styled `.filter-location-box`, `.filter-location-current`, `.filter-location-actions`, and `.salon-km-pill`.
- `tests/location-filtering.test.mjs`: Added unit tests for salon km computation, near-to-far sorting, radius filtering, non-metro city normalization, and strict city-only At-Home professional matching.

**Verification Results:**
- `npm run build`: Built cleanly (`vite v7.3.7`, `15 modules transformed`, `3.31s`).
- `node --test tests/*.test.mjs`: `7/7` tests passed (`0` failed).

---

## Prompt Entry — `2026-11-25`: Custom Service Creation & Pricing for Salon Owners & Professionals

**Objective:** Allow both **Salon Owners** (`Service catalogue`) and **Professionals** (`Services & pricing`) to create, edit, price, and remove their own custom services, and expose those custom services cleanly in public Salon Detail menus, At-Home catalogs, and the Customer Booking flow.

**Created & Modified Files (`branch-release-54ba3db`):**
- `backend/app/models/catalog.py`: Added nullable `salon_id` and `professional_id` foreign keys on `Service`, `Salon.menu_services`, `ProfessionalProfile.custom_services`, and `Service.professional_name`.
- `backend/app/core/database.py`: Added idempotent `services.salon_id` and `services.professional_id` column migrations in `ensure_phase13_schema_columns()`.
- `backend/app/schemas/catalog.py`: Extended `ServiceResponse` (`salon_id`, `professional_id`, `professional_name`) and `SalonResponse` (`menu_services`).
- `backend/app/schemas/partner.py`: Added `PartnerCustomServiceCreate` and `PartnerCustomServiceUpdate`.
- `backend/app/api/v1/services.py`, `backend/app/api/v1/api.py`, `backend/app/api/v1/concierge.py`: Filtered `Service.salon_id.is_(None)` on public At-Home queries so salon-only menu items stay scoped to their salon while custom Professional services appear in At-Home discovery.
- `backend/app/api/v1/salons.py`: Preloaded `Salon.menu_services` and serialized active `menu_services` in `format_salon()`.
- `backend/app/api/v1/bookings.py`: Verified selected `Service` is active and validated cross-salon `service.salon_id` ownership during booking creation.
- `backend/app/api/v1/partners.py`: Added `GET/POST/PUT/DELETE /partners/salon/services*` with automatic category sync (`_sync_salon_categories`), and added `POST/PUT /partners/professional/services/custom*` alongside catalog assignment/unlinking.
- `src/api.js`: Added partner custom-service API helpers (`apiCreateProfessionalCustomService`, `apiUpdateProfessionalCustomService`, `apiGetSalonServices`, `apiCreateSalonService`, `apiUpdateSalonService`, `apiDeleteSalonService`).
- `src/app.js`: Added shared `partnerCustomServiceForm()` in both `Salon Owner -> Service catalogue` and `Professional -> Services & pricing`, rendered custom salon menus with direct `Book` buttons in `salonDetail()`, displayed `professional_name` in `serviceDetail()`, and resolved custom services & owning specialists in `bookingModal()` / `booking-confirm`.
- `styles.css`: Styled `.service-line b`, `.partner-service-form`, and `.partner-row-actions`; wrapped `.dash-row` to prevent narrower-viewport action clipping and hid `.floating-concierge-dock` under `body.modal-open` so drawers and modals are never overlapped.
- `backend/tests/test_partner_custom_services.py`: Added CRUD, authorization (`403`/`400`), catalog isolation, and customer booking tests.

**Verification Results:**
- `pytest backend/tests/test_partner_custom_services.py backend/tests/test_audience_catalog.py backend/tests/test_concierge.py -v`: `10 passed in 8.59s`.
- `npm run build`: Built cleanly (`vite v7.3.7`, `15 modules transformed`, `3.10s`).
- `node --test tests/*.test.mjs`: `5/5` tests passed.

---

## Prompt Entry — `2026-11-25`: Rename Experience Switcher Pill Label from `Home` to `At Home`

**Objective:** Replace the `Home` tab label with `At Home` in the header experience switcher (`expTabs`).

**Modified Files (`branch-release-54ba3db`):**
- `src/app.js`: Updated `expTabs` first entry label from `'Home'` to `'At Home'`.

**Verification Results:**
- `npm run build`: Built cleanly (`vite v7.3.7`, `15 modules transformed`, `3.77s`).
- `node --test tests/*.test.mjs`: `5/5` tests passed.

---

## Prompt Entry — `2026-11-25`: Add Free Brevo HTTPS Transactional Email Provider (No Domain Required)

**Objective:** Allow Email OTPs to be sent from Render Free tier to any customer email address (for free, without purchasing or verifying a custom domain) via Brevo's HTTPS transactional email API (`https://api.brevo.com/v3/smtp/email`).

**Modified Files (`branch-release-54ba3db`):**
- `backend/app/core/config.py`: Added `BREVO_API_KEY` and `BREVO_FROM_EMAIL` settings.
- `backend/app/services/email_service.py`: Added `_resolve_brevo_sender()` and `_send_via_brevo()`, prioritizing Brevo HTTPS API → Resend → SMTP in production.
- `render.yaml`: Added `BREVO_API_KEY` and `BREVO_FROM_EMAIL` (`sync: false`).
- `backend/tests/test_email_service.py`: Added tests for Brevo sender resolution, HTTPS payload structure, and production provider priority (`5 passed in 1.45s`).

**Verification Results:**
- `pytest backend/tests/test_email_service.py -v`: `5 passed in 1.45s`.

---

## Prompt Entry — `2026-11-25`: Fix Production Email OTP Delivery via Resend HTTPS API on Render

**Objective:** Ensure Email OTP login works reliably on Render + Vercel by prioritizing the Resend HTTPS API in production (avoiding Render Free tier's blocked outbound SMTP port) and preventing public webmail `SMTP_FROM_EMAIL` addresses (such as `@gmail.com`) from breaking Resend's `from` validation.

**Created & Modified Files (`branch-release-54ba3db`):**
- `backend/app/core/config.py`: Added optional `RESEND_FROM_EMAIL` setting.
- `backend/app/services/email_service.py`: Added `_resolve_resend_from()` (skips `@gmail.com` / public webmail domains and defaults cleanly to `GlamGo <onboarding@resend.dev>` unless a verified domain or `RESEND_FROM_EMAIL` is supplied), extracted `_send_via_smtp()` and `_send_via_resend()` (with HTTP error body logging), and prioritized Resend HTTPS API before SMTP when `ENVIRONMENT=production`.
- `backend/tests/test_email_service.py`: Added 3 unit tests covering sender resolution, production Resend-first order, and development SMTP-first order.

**Verification Results:**
- `pytest backend/tests/test_email_service.py -v`: `3 passed in 1.27s`.

---

## Prompt Entry — `2026-11-25`: Declare `WHATSAPP_CONCIERGE_NUMBER` in `render.yaml`

**Objective:** Declare `WHATSAPP_CONCIERGE_NUMBER: "916360849512"` in `render.yaml` alongside `SEED_ON_STARTUP` so Render Blueprint manages all non-secret backend settings cleanly from `render.yaml`.

**Modified Files (`branch-release-54ba3db`):**
- `render.yaml`: Added `WHATSAPP_CONCIERGE_NUMBER` (`"916360849512"`) under `envVars`.

**Verification Results:**
- Verified YAML syntax matches existing `render.yaml` `envVars` schema.

---

## Prompt Entry — `2026-11-25`: Update WhatsApp Concierge Number to `916360849512`

**Objective:** Update the GlamGo WhatsApp Concierge phone number across backend config, router, and frontend to `916360849512` and restart the local FastAPI backend.

**Modified Files (`branch-release-54ba3db`):**
- `backend/app/core/config.py`: Updated `WHATSAPP_CONCIERGE_NUMBER` to `"916360849512"`.
- `backend/app/api/v1/concierge.py`: Updated fallback WhatsApp number inside `_wa_url()` to `"916360849512"`.
- `src/app.js`: Updated `CONCIERGE_WHATSAPP_NUMBER` to `'916360849512'`.

**Verification Results:**
- `pytest backend/tests/test_concierge.py -v`: `3 passed, 1 warning in 5.41s`.
- `npm run build`: Built cleanly (`vite v7.3.7`, `15 modules transformed`).

---

## Prompt Entry — `2026-11-25`: Port Floating AI Concierge, WhatsApp Capsule Dock & Backend Concierge API

**Objective:** Port only the floating bottom-right `AI Concierge [Ask AI] | [WhatsApp]` capsule dock, slide-up AI chat drawer, and WhatsApp links from `d:\PROJECTS\Glamgo 4` into `d:\PROJECTS\Glamgo 4\branch-release-54ba3db`, backed by a catalog-aware FastAPI concierge endpoint without copying unrelated header, hero, or homepage layout changes.

**Created & Modified Files (`branch-release-54ba3db`):**
- `backend/app/core/config.py`: Added `WHATSAPP_CONCIERGE_NUMBER` setting (`"919876543210"`).
- `backend/app/schemas/concierge.py`: Created Pydantic schemas `ConciergeChatRequest`, `ConciergeAction`, and `ConciergeChatResponse`.
- `backend/app/api/v1/concierge.py`: Created `GET /api/v1/concierge/config` and `POST /api/v1/concierge/chat` endpoints querying active `Service` and `Salon` catalog records by keyword, city/location, and audience (`women`/`men`/`unisex`), returning structured booking/navigation actions and WhatsApp deep links.
- `backend/app/api/v1/api.py`: Registered `concierge.router` at `/api/v1/concierge`.
- `backend/tests/test_concierge.py`: Added Pytest coverage for `/api/v1/concierge/config`, `/api/v1/concierge/chat` (facial, women/men hair, hygiene, WhatsApp, and empty-input 422 validation).
- `src/api.js`: Added `apiConciergeChat({ message, location, audience })`.
- `src/app.js`: Added `whatsapp`, `sparkle`, `bot`, and `send` SVG icons, `aiChatOpen` / `aiChatBusy` / `aiChatMessages` state, `floatingConciergeDock()`, `aiChatDrawer()`, `buildLocalAiReply()` fallback, `handleAiUserMessage()`, click handlers (`toggle-ai-chat`, `ai-prompt`, drawer auto-close on navigation/booking), `#ai-chat-form` submit handler, and mounted the dock & drawer in `render()`.
- `styles.css`: Appended scoped styles for `.floating-concierge-dock`, `.concierge-capsule-island`, `.capsule-ai-trigger`, `.capsule-wa-trigger`, `.ai-chat-drawer`, and mobile breakpoints (`<=700px` dock elevation above mobile nav, `<=600px` mobile bottom-sheet drawer).

**Verification Results:**
- `pytest backend/tests/test_concierge.py -v`: `3 passed, 1 warning in 6.29s`.
- `npm run build`: Built cleanly (`vite v7.3.7`, `15 modules transformed`).
- `node --test tests/*.test.mjs`: `5/5` tests passed.

---

## Prompt Entry — `2026-11-25`: Sync PostgreSQL Sequences Before Seeding Products in Neon

**Objective:** Prevent `salon_staff_pkey` / sequence collisions on PostgreSQL from aborting `seed_database()` before `# 5. Seed Products & Variants` executes, ensuring Men (`mb1–mb4`), Women (`b3`, `b6`), and Unisex (`b1`, `b2`, `b4`, `b5`, `b7`) products sync into Neon PostgreSQL cleanly.

**Modified Files (`branch-release-54ba3db`):**
- `backend/app/services/seed_service.py`: Extracted `_sync_pg_sequences(db)` using `pg_get_serial_sequence` across `users`, `professional_profiles`, `salon_staff`, `product_variants`, `seller_listings`, and `availabilities`, invoking it both before and after seeding.

**Verification Results:**
- Executed `python -m backend.app.services.seed_service` locally against `sqlite:///./glamgo_dev.db`: Passed cleanly.
- `pytest backend/tests/test_audience_catalog.py`: Passed cleanly.

---

## Prompt Entry — `2026-11-25`: Full 6-Phase Salon Marketplace E2E QA & Bug Fixes

**Objective:** Execute a full 6-phase end-to-end live lifecycle test (Owner registration -> Admin approval -> Owner workspace management -> Customer booking -> Owner appointment management -> Admin governance) and fix all discovered bugs.

**Modified Files (`branch-release-54ba3db`):**
- `src/api.js`: Exempted `/payments/` endpoints from the HTTP `401` JWT refresh interceptor so gateway authentication failures never rotate/clear a signed-in user's session or double-fire `/payments/razorpay/create-order`.
- `backend/app/api/v1/payments.py`: Deleted `initiating` `PaymentTransaction` rows on deterministic `razorpay.errors.BadRequestError` failures (including `Authentication failed`) for both orders and bookings so failed gateway handshakes do not leave a booking stuck in `409 Conflict`.
- `backend/app/api/v1/admin.py`: Removed `'unspecified'` from `AudienceUpdate.audience` (`Literal["women", "men", "unisex"]`) and parsed matching service categories (`Hair`, `Skin`, `Nails`, `Makeup`, `Spa`, `Beard`) from `draft.description` during partner salon approval.
- `src/app.js`: Displayed the booked specialist (`b.professional`) inside Partner Workspace Appointments rows and added a `Cancel` action button on `pending` bookings alongside `confirmed` controls.
- `styles.css`: Added `min-width: 0; overflow: hidden;` on `.availability-grid button` and wrapped `.availability-grid` to 4 columns at `@media (max-width: 950px)` so Saturday/Sunday buttons stay cleanly within the viewport.

**Verification Results:**
- 6-Phase E2E Browser Walkthrough (`http://127.0.0.1:5173/`): Passed Owner sign-up (`200`), Partner draft submission (`200`), pre-approval isolation, Admin approval (`200` + role upgrade + Audit log), Owner profile/staff persistence across reload, Customer Women/Men salon discovery & detail view, Booking DB persistence (`200` + reload), Owner live appointment visibility & KPI metrics, and Admin governance view.
- Post-fix `pytest` (`test_razorpay_checkout.py`, `test_booking_payment_state.py`, `test_security_hardening.py`, `test_audience_catalog.py`), `npm run build`, & `node --test tests/*.test.mjs`: Passed cleanly.

---

## Prompt Entry — `2026-11-25`: Seed & Sync Men, Women & Unisex Catalog Listings on Startup

**Objective:** Ensure all existing Men (`ms1–ms8`, `201–203`, `ml1–ml4`, `mb1–mb4`), Women, and Unisex services, specialists, salons, and products in `seed_service.py` are seeded and properly categorized across both local SQLite and Neon PostgreSQL (Render).

**Modified Files (`branch-release-54ba3db`):**
- `backend/entrypoint.sh` & `render.yaml`: Enabled `SEED_ON_STARTUP` (`"true"`) by default so the idempotent `python -m backend.app.services.seed_service` runs on container startup and syncs missing/updated `men`, `women`, and `unisex` listings without touching existing customer orders, bookings, or accounts.

**Verification Results:**
- Executed `python -m backend.app.services.seed_service` locally against `sqlite:///./glamgo_dev.db`:
  - `services`: `men: 8`, `women: 8`, `unisex: 1`
  - `professional_profiles`: `men: 3`, `women: 5`, `unisex: 2`
  - `salons`: `men: 4`, `women: 5`, `unisex: 3`
  - `products`: `men: 4`, `unisex: 5`, `women: 2`

---

## Prompt Entry — `2026-11-24`: Razorpay Standard Web Checkout Completion & Verification

**Objective:** Complete and verify GlamGo's Razorpay Standard Web Checkout integration without duplicating existing routes, configure environment variables (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `VITE_RAZORPAY_KEY_ID`) in the gitignored `.env`, align error status codes (`401` auth failure, `500` gateway failure, `400` missing verification fields / signature mismatch), and verify end-to-end tests + live Razorpay order creation.

**Created & Modified Files (`branch-release-54ba3db`):**
- `.env` *(gitignored, untracked)*: Configured `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `VITE_RAZORPAY_KEY_ID` (`KEY_ID` only for Vite).
- `backend/app/schemas/payment.py`: Added `order_id` to `PaymentOrderResponse` alongside `razorpay_order_id`, and made `PaymentVerifyRequest` signature fields optional so missing/blank fields return HTTP `400`.
- `backend/app/api/v1/payments.py`: Populated `order_id` on `PaymentOrderResponse`, updated `_raise_gateway_error()` to return `401` on gateway auth failure and `500` on gateway API errors, and enforced an upfront `400` validation for missing fields in `verify_razorpay_payment()` before `HMAC-SHA256` signature verification.
- `src/app.js`: Supported `payOrder.razorpay_order_id || payOrder.order_id` in both Order Checkout and Booking Checkout.
- `backend/tests/test_razorpay_checkout.py`: Added automated tests covering `< 100` paise validation (`400`), auth failure (`401`), gateway error (`500`), missing verify fields (`400`), invalid `HMAC-SHA256` signature (`400` without marking paid), and valid `HMAC-SHA256` verification (`200`).

**Verification Results:**
- `pytest backend/tests/test_razorpay_checkout.py backend/tests/test_booking_payment_state.py backend/tests/test_security_hardening.py backend/tests/test_audience_catalog.py`: `19/19` passed in `11.58s`.
- Live Razorpay probe (`api.razorpay.com`): Returned `Authentication failed` (`401` via `_raise_gateway_error`), confirming auth-error handling works and indicating the test key pair should be refreshed in Razorpay Dashboard if rotated.
- `npm run build` (`2.02s`), `node --test tests/*.test.mjs` (`5/5`), `git check-ignore -v .env`, & tracked-file secret scan: Passed cleanly with zero credentials in source files.

---

## Prompt Entry — `2026-11-24`: Remove `"unspecified"` Audience State (Default to `"unisex"`)

**Objective:** Eliminate the `"unspecified"` audience state across frontend, backend models/schemas, database migrations, and tests, replacing it with `"unisex"` so all existing listings are visible in both **Women** and **Men**.

**Modified Files (`branch-release-54ba3db`):**
- `src/app.js`: Updated `matchesAudience()`, `isVisibleInAudience()`, `getRelatedProducts()`, search, booking modal, and `audienceOptions()` to treat missing/legacy `'unspecified'` values as `'unisex'`, removed `'unspecified'` dropdown option and `isUnclassified`.
- `backend/app/models/catalog.py`: Changed `Service`, `ProfessionalProfile`, `Salon`, and `Product` `audience` defaults from `'unspecified'` to `'unisex'`.
- `backend/app/schemas/catalog.py` & `backend/app/schemas/partner.py`: Restricted `Audience` to `Literal["women", "men", "unisex"]` with `"unisex"` default and added `_normalize_audience` response coercion for legacy `'unspecified'` values.
- `backend/app/core/database.py`: Updated `ensure_phase13_schema_columns()` defaults to `'unisex'` and added idempotent startup `UPDATE` statements converting `NULL`/empty/`'unspecified'` rows to `'unisex'` across `services`, `salons`, `products`, and `professional_profiles`.
- `backend/app/services/seed_service.py`: Updated fallback audience defaults from `'unspecified'` to `'unisex'`.
- `tests/audience-filter.test.mjs` & `backend/tests/test_audience_catalog.py`: Updated audience filtering and schema migration assertions for `'unisex'`.

**Verification Results:**
- `npm run build` (`vite build`): Passed cleanly.
- `node --test tests/*.test.mjs`: `5/5` passed.
- `pytest backend/tests/test_security_hardening.py backend/tests/test_audience_catalog.py`: `14/14` passed.

---

## Prompt Entry — `2026-11-24`: Auto-Normalize PostgreSQL `DATABASE_URL` Driver for Neon/Render

**Objective:** Automatically normalize `postgres://` and `postgresql://` connection strings in `Settings.DATABASE_URL` to `postgresql+psycopg://` so any raw Neon PostgreSQL URL works seamlessly with `psycopg` v3 across both FastAPI and Alembic.

**Modified Files (`branch-release-54ba3db`):**
- `backend/app/core/config.py`: Added `@field_validator("DATABASE_URL")` (`normalize_database_url`) converting `postgres://` and `postgresql://` prefixes to `postgresql+psycopg://`.

**Verification Results:**
- Live Render check (`https://glamgo-backend-lqn6.onrender.com/health/ready`): HTTP `200`, `{"status":"ready","database":"healthy","cache":"fallback_memory","redis_required":false}`.
- `pytest backend/tests/test_security_hardening.py backend/tests/test_audience_catalog.py`: Passed cleanly.

---

## Prompt Entry — `2026-11-24`: App Banner Luxury Monogram Logo (`/ui-ux-pro-max`)

**Objective:** Replace the `G✦` text badge inside the top `"Download the GlamGo App"` banner with the luxury GlamGo monogram emblem (`./favicon.svg`) and polish its responsive framing.

**Modified Files (`branch-release-54ba3db`):**
- `src/components/appDownload.js`: Replaced `<span class="app-banner-icon">G✦</span>` with `<img class="app-banner-icon-img" src="./favicon.svg" alt="" width="28" height="28" aria-hidden="true">`.
- `styles.css`: Added `.app-banner-icon-img` styling (`28×28` desktop, `24×24` mobile `<= 680px`, subtle champagne hairline border and shadow).

**Verification Results:**
- `npm run build` (`vite build`): Passed cleanly.
- `node --test tests/*.test.mjs`: `6/6` passed.

---

## Prompt Entry — `2026-11-24`: Treatment Category Image Framing & Distinct Men's Packages Photo

**Objective:** Ensure every category card under `#categories` ("Browse by treatment.") frames the treatment subject clearly at all responsive alignments without narrow horizontal clipping, and give Men's `Packages` a distinct photo from `Spa`.

**Modified Files (`branch-release-54ba3db`):**
- `styles.css`: Replaced fixed `128px` / `82px` heights on `.home-categories .category-art` with `height: auto; aspect-ratio: 4 / 3; overflow: hidden;`, and set `object-fit: cover; object-position: center 45%;` on `.home-categories .category-art img`.
- `src/app.js`: Updated `MEN_CATEGORY_IMAGES.Packages` from duplicate `./assets/men-massage.webp` to `./assets/men-beard.webp`.

**Verification Results:**
- `npm run build` (`vite build`): Passed cleanly.
- `node --test tests/*.test.mjs`: `6/6` passed.

---

## Prompt Entry — `2026-11-24`: Luxury Monogram Favicon Suite (`/ui-ux-pro-max`)

**Objective:** Design and implement a dedicated editorial **GlamGo** monogram favicon suite matching the platform's espresso-black, ivory, champagne, and terracotta palette.

**Created & Modified Files (`branch-release-54ba3db`):**
- `public/favicon.svg`: Vector `64×64` luxury squircle (`#1E1C1A`) with inner champagne hairline border (`#C8A878`), centered serif `G` monogram (`#FAF7F2` -> `#E5D5BE`), and 4-point terracotta-champagne star accent.
- `public/favicon-32x32.png` & `public/apple-touch-icon.png`: Supersampled `512×512` -> LANCZOS-downscaled `32×32` and `180×180` PNG fallbacks for legacy browsers and mobile home screens.
- `index.html`: Wired `favicon.svg`, `favicon-32x32.png`, and `apple-touch-icon.png` in `<head>`.

**Verification Results:**
- Visually inspected `public/apple-touch-icon.png`: Crisp centered serif monogram, clean squircle corners, and balanced star accent.
- `npm run build` (`vite build`): Passed cleanly.
- `node --test tests/*.test.mjs`: `6/6` passed.

---

## Prompt Entry — `2026-11-24`: Transparent GLAMGO Logo Assets (`glamgo-logo.png` & `glamgo-logo-light.png`)

**Objective:** Replace the rectangular JPEG GLAMGO logo with true alpha-transparent PNG variants for light and dark surfaces so the logo blends seamlessly into every background with zero box or edge halo.

**Created & Modified Files (`branch-release-54ba3db`):**
- `public/assets/glamgo-logo.png` & `public/assets/glamgo-logo-light.png`: Created alpha-transparent (`474×130` RGBA) PNG variants (`glamgo-logo.png` for ivory/light surfaces; `glamgo-logo-light.png` with warm terracotta `G` + ivory `LAMGO` for dark surfaces).
- `src/app.js` & `src/public-landing.js`: Switched light-surface wordmarks (`header()`, `onboarding()`, public header) to `./assets/glamgo-logo.png` and dark-surface wordmarks (`auth()`, `footer()`, `partnerPage()`, `adminPage()`, public footer) to `./assets/glamgo-logo-light.png`.
- `index.html`: Updated `<link rel="icon">` to `type="image/png" href="./assets/glamgo-logo.png"`.
- `styles.css`: Removed the ivory background sticker box and `mix-blend-mode: multiply` from `.brand-logo-img` and dark `.wordmark` selectors.

**Verification Results:**
- `Select-String` scan for `glamgo-logo.jpg`: Zero references remaining in `src/` or `index.html`.
- `npm run build` (`vite build`): Passed cleanly.
- `node --test tests/*.test.mjs`: `6/6` passed.

---

## Prompt Entry — `2026-11-24`: Compact 5-Column / 4-Column Cards Across Home, Salons & Shop

**Objective:** Reduce card sizes and proportionally scale padding, headings, and CTAs across all three main sections (Home `.card-grid`, Salons `.salon-grid`, and Shop `.product-grid`) so 1–2 more items fit per row cleanly on desktop and laptop viewports.

**Modified Files (`branch-release-54ba3db`):**
- `styles.css`:
  - Increased desktop columns to `5` (`.card-grid`, `.product-grid`) and `4` (`.salon-grid`), and `4`/`3` inside `.collection-layout.with-filters`, with tighter `14px` gaps.
  - Added proportional laptop (`<= 1200px`: `4`/`3` cols), tablet (`<= 860px`: `3`/`2` cols), and mobile (`<= 700px`: `2`/`1` cols) breakpoints.
  - Scaled `.card-body`, `.salon-body`, and `.product-body` padding (`12px`), heading/product title sizes (`21px`/`22px`/`13.5px`), pricing (`13.5px`/`14.5px`), and CTA buttons (`min-height: 36px`) proportionally.

**Verification Results:**
- `npm run build` (`vite build`): Passed cleanly.
- `node --test tests/*.test.mjs`: `6/6` passed.

---

## Prompt Entry — `2026-11-24`: Compact Shop Product Card Sizing

**Objective:** Make Shop section product cards cleaner, more uniform, and better proportioned across desktop, tablet, and mobile without altering Home services, Salons, header, footer, or functionality.

**Modified Files (`branch-release-54ba3db`):**
- `styles.css`:
  - Changed `.product-image` aspect ratio from `4 / 5` to `1 / 1` (`object-fit: cover`).
  - Set `.product-grid` and `.collection-layout.with-filters .product-grid` to `repeat(4, minmax(0, 1fr))` with `16px` gap on desktop (`3` on tablet, `2` with `12px` gap on mobile) and updated `.product-body` padding to `14px`.

**Verification Results:**
- `npm run build` (`vite build`): Passed cleanly.
- `node --test tests/*.test.mjs`: `6/6` passed.

---

## Prompt Entry — `2026-11-24`: Site-Wide GLAMGO Logo & Favicon Replacement

**Objective:** Replace every remaining `GLAMGO✦` text wordmark across all views with `./assets/glamgo-logo.jpg`, add it as the site favicon, and ensure crisp dark-surface contrast.

**Modified Files (`branch-release-54ba3db`):**
- `src/app.js`: Replaced all 5 remaining `GLAMGO<span>✦</span>` wordmarks (`onboarding()`, `auth()`, `footer()`, `partnerPage()`, `adminPage()`) with `<img src="./assets/glamgo-logo.jpg" alt="GLAMGO" class="brand-logo-img">`.
- `src/public-landing.js`: Replaced both `GLAMGO<span>✦</span>` wordmarks (header & footer) with the same `.brand-logo-img` mark.
- `index.html`: Added `<link rel="icon" type="image/jpeg" href="./assets/glamgo-logo.jpg" />`.
- `styles.css`: Added dark-surface ivory badge framing (`.footer .wordmark`, `.wordmark.light`, `.dash-sidebar .wordmark`, `.admin-sidebar .wordmark`, `.public-footer .wordmark`) with compact `32px` logo height so the serif wordmark stays crisp against dark backgrounds.

**Verification Results:**
- `Select-String` scan for `GLAMGO<span>`: Zero occurrences remaining in `src/`.
- `npm run build` (`vite build`): Passed cleanly.
- `node --test tests/*.test.mjs`: `6/6` passed.

---

## Prompt Entry — `2026-11-24`: Header GLAMGO Logo Prominence & Contrast Polish

**Objective:** Increase the header GLAMGO brand logo size, contrast/saturation blend, alignment padding, and hover polish without altering any other layout or functionality.

**Modified Files (`branch-release-54ba3db`):**
- `styles.css`:
  - Updated `.wordmark .brand-logo-img` to `40px` desktop height (`196px` max-width) and `32px` mobile height (`156px` max-width) with `filter: contrast(1.22) saturate(1.18) brightness(1.06)` and `mix-blend-mode: multiply`.
  - Added `.wordmark:hover .brand-logo-img` (`transform: scale(1.03); opacity: 0.92;`) and `display: inline-flex; align-items: center; padding-right: 6px;` on `.header .wordmark`.

**Verification Results:**
- `npm run build` (`vite build`): Passed cleanly.
- `node --test tests/*.test.mjs`: `6/6` passed.

---

## Prompt Entry — `2026-11-24`: Default Homepage Replacement & Header GLAMGO Logo

**Objective:** Replace the default `public` landing view on `/` with the split-screen `AT-HOME BEAUTY` (`landing`, `experience: 'home'`) homepage and integrate the uploaded GLAMGO serif logo into the header while keeping all backend APIs, routing, auth, and features intact.

**Modified & Added Files (`branch-release-54ba3db`):**
- `public/assets/glamgo-logo.jpg`: Added the uploaded GLAMGO serif brand logo asset.
- `src/app.js`:
  - Set `defaults.experience` to `'home'` and initial `state.view` to `'landing'` (with `experience: saved.experience || 'home'`) so `/` opens directly into the split-screen `AT-HOME BEAUTY` homepage (`Professional beauty care, at your doorstep.`, `Explore services` CTA, luxury editorial photo, horizontal `discovery-bar` with Location + `Search services, categories or specialists`, and `Women` / `Men` toggle).
  - Updated `header()` wordmark link to render `<img src="./assets/glamgo-logo.jpg" alt="GLAMGO" class="brand-logo-img">`.
  - Updated `public-home`, `guest-browse`, and `applyPostAuthNavigation()` so brand-logo clicks, guest browsing, and default post-auth navigation route directly to `view = 'landing'` (`experience = 'home'`) and persist state cleanly.
- `styles.css`: Added scoped `.wordmark .brand-logo-img` sizing and desktop/mobile responsive rules (`mix-blend-mode: multiply` + subtle brightness/contrast blend onto `--ivory`).

**Verification Results:**
- `npm run build` (`vite build`): Passed cleanly after final edit.
- `node --test tests/*.test.mjs`: `6/6` passed after final edit.
- Live browser check (`http://127.0.0.1:5173/`): Confirmed `/` opens into `AT-HOME BEAUTY`, header logo renders cleanly alongside `Home` / `Salons` / `Shop` tabs, Location + Search container, `Women` / `Men` toggle, and all icons with zero horizontal overflow on desktop (`1440×900`) and mobile (`390×844`).

---

## Prompt Entry — `2026-11-24`: Login Show/Hide Password Toggle

**Objective:** Add a Show/Hide Password eye-icon toggle inside the GlamGo login/auth password input fields without altering the existing login layout, theme, typography, buttons, or behavior.

**Modified Files (`branch-release-54ba3db`):**
- `src/app.js`:
  - Added `eyeOff` SVG path in the `icons` map right after `eye`.
  - Wrapped `input[name="password"]` (Sign In / Create Account) and `input[name="new_password"]` (Password Reset confirm) inside `<div class="password-field">` with a right-aligned `<button type="button" class="password-toggle" data-action="toggle-password" aria-label="Show password" aria-pressed="false">` showing `icon('eye', 18)` by default.
  - Added `toggle-password` handling in `action(el)` to toggle `input.type` (`password` ↔ `text`), swap between `eye` and `eyeOff` icons, and update `aria-label` / `aria-pressed` directly in-place without calling `render()` so typed input values stay intact.
- `styles.css`:
  - Added scoped `.password-field`, `.password-field input` (`padding-right: 44px`), and `.password-toggle` styles so the toggle sits centered vertically on the right edge without changing input height, spacing, colors, or buttons.

**Verification Results:**
- `npm run build` (`vite build`): Passed cleanly (`✓ built in 3.79s`).
- `node --test tests/*.test.mjs`: `6/6` passed.
- Live browser check (`http://127.0.0.1:5173/`): Confirmed masked default (`type="password"`), `type="text"` reveal with preserved input text, toggling back to masked `type="password"`, `aria-label`/`aria-pressed` updates, and crisp alignment with zero horizontal overflow on desktop (`1440×900`) and mobile (`390×844`).

---

## Prompt Entry — `2026-11-24`: App Download Banner/Modal (Kept) & Gender Hub Removed

**Objective:** Keep only the dismissible top App Download plugin bar & modal (`AppDownloadBanner` / `AppDownloadModal`), and remove the extra Men/Women `GenderServicesHub` / `servicesCatalog` section per user review.

**Modified & Deleted Files (`branch-release-54ba3db`):**
- `src/components/appDownload.js`: Kept `AppDownloadBanner` (`sessionStorage` key `glamgo_app_banner_dismissed=true`) and `AppDownloadModal` (store links, `+91` 10-digit Share App Link form with validation & feedback, desktop SVG QR preview).
- `src/components/genderServicesHub.js` & `src/data/servicesCatalog.js`: Deleted.
- `src/app.js`: Removed `GenderServicesHub`, `ServiceDetailDrawer`, `SERVICES_CATALOG`, `?section=` sync, and `hub*` state/handlers while keeping `AppDownloadBanner` and `AppDownloadModal`.
- `styles.css`: Removed `.gender-hub` / `.service-detail-drawer` / `[data-gender=...]` styles while keeping `.app-download-banner` and `.app-download-modal` responsive styles.

**Verification Results:**
- `npm --prefix "d:\PROJECTS\Glamgo 4\branch-release-54ba3db" run build`: Passed.
- `node --test tests/*.test.mjs`: `6/6` passed.

---

## Prompt Entry — `2026-11-24`: Full Security Audit, Vulnerability Remediation & `.gitignore` Hardening

**Objective:** Audit repository tracking/history, `.gitignore`, FastAPI backend endpoints, rate limiting, financial/rewards logic, and SPA frontend rendering for security vulnerabilities, then patch and verify every finding with automated tests.

**Modified & Created Files (`branch-release-54ba3db`):**
- `.gitignore`: Added `.env.*` (preserving `!.env.*.example` and public `!.env.production`), certificate/key exclusions (`*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.crt`), package credential exclusions (`.npmrc`, `.pypirc`), and log/coverage exclusions (`*.log`, `.coverage`, `coverage/`).
- `backend/app/api/v1/auth.py`:
  - Blocked anonymous self-registration to all non-customer roles (`admin`, `salon_owner`, `professional`, `seller`) with `403 Forbidden`.
  - Normalized emails to lowercase with `func.lower(User.email)` in `/register` and `/login` to eliminate case-variant duplicate accounts.
  - Added `Depends(auth_limiter)` to `POST /api/v1/auth/refresh` and capped `PasswordResetConfirm.new_password` at 72 characters.
- `backend/app/schemas/auth.py` & `backend/app/core/security.py`: Enforced `min_length=6, max_length=72` (and 72 UTF-8 byte checks) on passwords so empty passwords and >72-byte `bcrypt` `ValueError` HTTP 500 crashes are prevented.
- `backend/app/core/rate_limit.py`: Fixed `X-Forwarded-For` spoofing bypass (only reading the right-most proxy hop when the peer is loopback/private, never the client-controlled left-most hop) and bounded `_in_memory_windows` to `5000` keys to prevent memory DoS.
- `backend/app/api/v1/users.py` & `backend/app/core/config.py`:
  - Added `ALLOW_DEMO_GIFT_CARDS: bool = False` so hardcoded demo gift cards (`GLAM500`, `LUXE1000`, `BRIDAL2500`) are disabled in `ENVIRONMENT=production` by default.
  - Blocked multi-referrer farming so each account can redeem at most one referral welcome bonus ever, added `rewards_limiter` on `POST /api/v1/users/rewards/redeem`, and normalized `PUT /api/v1/users/profile` email uniqueness case-insensitively.
- `backend/app/api/v1/bookings.py`: Added `arrival_otp_limiter` (`8` attempts / `300s`) on `POST /api/v1/bookings/{booking_id}/verify-arrival-otp`.
- `backend/app/schemas/commerce.py`: Added strict `http`/`https` URL validators on `ShipmentCreate.tracking_url` and `ReturnRequestCreate.evidence_image_url` to block `javascript:` and `data:` XSS payloads.
- `backend/app/main.py` & `backend/app/core/logging_config.py`: Disabled `/openapi.json` when `ENABLE_DOCS=false`, sanitized `X-Request-ID` against `^[A-Za-z0-9._-]{1,64}$`, and expanded `JSONLogFormatter.SENSITIVE_KEYS` (`smtp_password`, `resend_api_key`, `fast2sms_api_key`, `otp`).
- `index.html`, `src/app.js`, & `vercel.json`: Removed inline `onload`/`onerror` handlers, added `safeHttpUrl()` + `rel="noopener noreferrer"` on courier tracking links, and added a production `Content-Security-Policy` header in `vercel.json`.
- `backend/tests/test_security_hardening.py`: Created 9 automated security regression tests covering all remediated vectors.

**Verification Results:**
- `pytest backend/tests/test_security_hardening.py backend/tests/test_audience_catalog.py`: `14 passed in 8.07s`.
- `node --test tests/*.test.mjs`: `6/6` passed.
- `npm --prefix "d:\PROJECTS\Glamgo 4\branch-release-54ba3db" run build`: Passed (`✓ built in 3.92s`).
- `git status` & `git diff` secret scan: Confirmed zero secrets tracked in working tree (advised rotation of historical `DATABASE_URL` exposed in past commit `54ed942`).

---

## Prompt Entry — `2026-11-24`: Render & Vercel Production Deployment Readiness

**Objective:** Prepare `release/54ba3db` for production Render + Vercel deployment without committing secrets.

**Modified Files (`branch-release-54ba3db`):**
- `render.yaml`: Added `branch: release/54ba3db`, `ALLOW_DEV_OTP_ECHO: "false"`, `SMTP_HOST: smtp.gmail.com`, `SMTP_PORT: "587"`, `SMTP_FROM_NAME: GlamGo`, and `sync: false` placeholders for `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`, and `RESEND_API_KEY`.
- `backend/requirements.txt`: Pinned `dnspython>=2.6.0` for live DNS MX real-email verification in Docker.
- `backend/app/core/config.py`: Added `https://glamgo-um5p.vercel.app` to `BACKEND_CORS_ORIGINS`.
- `CHANGEREPORT.md`: Prepended Prompt Entry.

**Verification Results:**
- `npm --prefix "d:\PROJECTS\Glamgo 4\branch-release-54ba3db" run build`: Passed.
- `pytest backend/tests/test_email_otp.py`: 5 passed in 23.75s.
- Secret scan on `git diff`: Verified zero literal credentials or secrets.

---

## Prompt Entry — `2026-11-24`: Remove "Audience not specified" Badge & Clean Catalogue Note

**Objective:** Remove the unnecessary `"Audience not specified"` badge on listing cards and simplify the Women/Men catalogue note.

**Modified Files (`branch-release-54ba3db`):**
- `src/app.js`: Updated `audienceBadge` to render only the `Unisex` badge (hiding `'Audience not specified'`) and simplified `generalCatalogueNote` to `'Showing Men and unisex listings.'` / `'Showing Women and unisex listings.'`.
- `CHANGEREPORT.md`: Prepended Prompt Entry.

**Verification Results:**
- `npm --prefix "d:\PROJECTS\Glamgo 4\branch-release-54ba3db" run build`: Passed.
- `node --test tests/*.test.mjs`: 6/6 passed.

---

## Prompt Entry — `2026-11-24`: Full Desktop & Mobile Role Audit Fixes (Customer, Admin & Salon Owner)

**Objective:** Run a full desktop (`1280x720`) and phone (`390x844`) browser audit across Customer, Admin, and Salon Owner roles, verify all backend/database connections, and fix every discovered UI/API bug.

**Modified Files (`branch-release-54ba3db`):**
- `backend/app/api/v1/partners.py`: Added `_ensure_default_availability()` so `GET /api/v1/partners/availability` and `POST /api/v1/partners/availability/toggle` persist default `Mon`–`Fri` rows before toggling weekend days, preventing rapid toggles of `Sat` from wiping `Mon`–`Fri`.
- `src/app.js`:
  - Fixed Shop `Add to Bag` / `Added` button `aria-label` so it uses plain text (`ariaBtnText`) instead of raw `<svg>` HTML.
  - Updated Admin Overview initial loading copy (`Loading applications...`) so it does not flash `Applications unavailable` before initial fetches resolve.
  - Fixed duplicate Admin Users heading (`Users & Role Management`).
  - Cleared stale `#admin` URL hash when non-admin roles sign in via `applyPostAuthNavigation()`.
- `styles.css`:
  - Shifted desktop `.toast` to `top: 84px` so notifications do not occlude top-right header action buttons.
  - Refined `.icon-button b` (`top: 6px; line-height: 1;`) to prevent top-edge badge clipping on `390x844` mobile header.
- `CHANGEREPORT.md`: Prepended Prompt Entry for the Desktop/Phone audit fixes.

**Verification Results:**
- Backend & DB health checks: HTTP `200 OK` across `/health/live` and all 8 `women`/`men` catalog APIs.
- Desktop (`1280x720`) & Phone (`390x844`) QA across Customer, Admin, and Salon Owner: 0 failed network requests, 0 JS console errors, 0 horizontal overflow.
- `npm --prefix "d:\PROJECTS\Glamgo 4\branch-release-54ba3db" run build`: Passed.
- `node --test tests/*.test.mjs`: 6/6 passed.

---

## Prompt Entry — `2026-11-24`: Auth Page Viewport Alignment & Bottom-Clipping Fix

**Objective:** Fix vertical overflow and bottom-edge clipping on the Auth page (`http://127.0.0.1:5173/`) so the left hero panel (`GLAMGO✦`, `Your beauty. Your way.`, `One account for every side of beauty.`) and right sign-in panel align cleanly within `100vh`.

**Modified Files (`branch-release-54ba3db`):**
- `styles.css`:
  - Updated `.auth-layout` with `align-items: stretch` and `.auth-image` with `position: sticky; top: 0; height: 100vh; min-height: 540px; overflow: hidden;`.
  - Added `.auth-image img` (`position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center;`) so the background image never stretches the container taller than the viewport.
  - Updated `.auth-image::after` to a subtle bottom-weighted gradient and refined `.auth-image-copy` (`inset: 36px 8% 48px 8%`), `h1` (`clamp(44px, 4.6vw, 76px)`), and `p`.
  - Updated `.auth-panel` (`display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 36px 32px;`) and tightened `.auth-box h2` / `> p` spacing.
  - Updated the mobile media query for `.auth-image` (`position: relative; top: auto; min-height: 230px; height: 230px;`) and `.auth-panel` (`min-height: auto; padding: 32px 20px;`).
- `CHANGEREPORT.md`: Prepended Prompt Entry for the Auth alignment fix.

**Verification Results:**
- `npm --prefix "d:\PROJECTS\Glamgo 4\branch-release-54ba3db" run build`: Vite production build succeeded in 2.04s.
- Browser verification (`http://127.0.0.1:5173/#home` at `1280x720`): Confirmed zero bottom clipping (`One account for every side of beauty.` ends at `645.60px` inside `720px` viewport) and centered right-hand sign-in form; screenshot saved to `auth_aligned.png`.

---

## Prompt Entry — `2026-11-23`: Production OTP Security Hardening (Removed On-Screen Code Display & Auto-Typing)

**Objective:** Secure the OTP login system for production by removing all dev-helper on-screen code displays, auto-typing, prefilled input values, and "Auto-fill" buttons, ensuring OTP codes are delivered exclusively to the user's physical inbox.

**Changes:**
1. **Frontend (`src/app.js`):**
   - Removed dev `hint` callout banner (`auth-otp-callout`) and `Auto-fill` button from the modal.
   - Removed OTP prefilling: input field is rendered completely blank (`value=""`) requiring manual entry.
   - Updated copy to instruct the user: *"Please check your email inbox and enter the 6-digit verification code below."*
   - Updated toast notifications to avoid leaking the code: *"Verification code sent to your email. Please check your inbox."*
2. **Backend (`backend/app/core/config.py` & `backend/app/api/v1/auth.py`):**
   - Changed `ALLOW_DEV_OTP_ECHO` default to `False`.
   - Hardened `_allow_dev_code_echo()`: strictly requires explicit environment flag.
   - Updated `/api/v1/auth/otp/email/request` and `/api/v1/auth/otp/request` to omit `otp` and `dev_otp` from API JSON responses in normal operation.
3. **Tests (`backend/tests/test_email_otp.py`):**
   - Updated test runner to explicitly enable dev echo via fixture monkeypatch for test assertions while keeping production and dev environments secure.

**Verification Results:**
- `python -m pytest backend/tests/test_email_otp.py`: 5 passed in 29.18s.
- `node --test tests/*.test.mjs`: 6 passed.
- `npm run build`: Vite production bundle generated cleanly in 2.35s.
- Live API response verified: `{"message": "Verification code sent to shatwik7@gmail.com. Please check your inbox.", "email": "shatwik7@gmail.com"}` (no OTP field).

---

## Prompt Entry #21 — `2026-11-23`: Port Interactive Leaflet Location Map & Search Autocomplete (`release/54ba3db`)

**Prompt Summary:** Bring back `main`'s interactive Leaflet map picker and live location search suggestions inside the Location modal (`#location-picker-map` and `#location-autocomplete-list`) into `release/54ba3db`.

**Modified Files (`branch-release-54ba3db`):**
- `package.json`, `package-lock.json`: Installed `leaflet` dependency.
- `src/app.js`: Added lazy `loadLeaflet()`, `destroyActiveMaps()`, `addTileLayerWithFallback()`, `searchLocationSuggestions()` (Photon + Nominatim fallback), `mountLocationPickerMap()` (with click-to-drop-pin reverse geocoding), `location-pick` handler, updated `map-locate`, `#location-search-input` debounced autocomplete + `pointerdown`/`focusout`/`Escape` handling, and updated `modal()`/`render()` lifecycle for `state.modal === 'location'`.
- `styles.css`: Added `.gg-map-pin-wrap`, `.gg-map-pin`, `.gg-map-pin-active`, `.gg-location-map-bar`, `.gg-map-modal`, `.gg-locate-btn`, `.gg-loc-field`, `.gg-loc-dropdown`, `.gg-loc-option`, `.gg-loc-status`, and responsive `<= 700px` map sizing.
- `CHANGEREPORT.md`: Prepended Prompt Entry #21.

**Checks Run & Observed Results (`branch-release-54ba3db`):**
- `node -c branch-release-54ba3db/src/app.js` -> exited `0`.
- `npm --prefix "branch-release-54ba3db" run build` -> exited `0` (`vite build` v7.3.7, `14 modules transformed`, lazy `leaflet` chunk built in `3.00s`).
- Live Browser Verification (`http://127.0.0.1:5173/#home` at `1280x800`) -> `#location-picker-map` mounted Leaflet (`.leaflet-container` + `.gg-map-pin-active`), typing `"Indiranagar"` rendered 5 `.gg-loc-option` suggestions in `#location-autocomplete-list`, selecting an option + submitting `#location-form` updated the header and discovery bar cleanly with `0` JS console errors and `0` failed network requests.

---

## Prompt Entry #20 — `2026-11-23`: Simplify Customer Experience Across Landing, Header, Discovery, Filters & Details (`release/54ba3db`, Local)

**Prompt Summary:** Simplify the GlamGo customer experience across desktop and mobile (`1440px`, `1280px`, `768px`, `390px`) using XtremeX-style layout clarity while strictly preserving GlamGo's ivory/cream/charcoal/champagne/terracotta palette, typography, marketplace framing, and API-driven functionality (local preview first, uncommitted/unpushed).

**Modified Files (`branch-release-54ba3db`):**
- `src/public-landing.js`, `public-landing.css`: Simplified public partner-first landing page to one clear main headline, concise marketplace copy, one primary partner CTA (`Apply as a Partner`), returning-visitor link (`Return to <experience>`), all 3 partner registration paths (`Salon Owner`, `Professional`, `Product Seller`), and visible customer paths to Home, Salons, and Shop; removed decorative captions, overlay image notes, number badges, and redundant sections.
- `src/app.js`: Removed generic announcement banner and decorative subnav tag; added direct desktop `.exp-switcher` and mobile `.mobile-exp-bar` (`Home`, `Salons`, `Shop`); compacted mobile header and moved secondary actions (including Partner Portal) into accessible `#mobile-menu-drawer` (`role="dialog"`, `aria-modal="true"`, Esc/Tab focus handling); harmonized desktop `.subnav` with mobile `.mobile-bottom`; streamlined discovery cards (real API data only, no fabricated ratings/distances/hours/availability); unified all 3 experiences (`Home`, `Salons`, `Shop`) with a collapsible `.filter-toggle-pill` (`Show filters` / `Hide filters`), left `.filter-sidebar` on desktop + `#exp-filter-drawer` on mobile (`Sort by` including A-Z/Z-A/price, `Category`, `Availability` checkboxes on Shop, `Collection`/`Brand` on Shop, `Distance` on Salons, `Price` From/To ₹ inputs across all 3), and visible `.active-filters` chips; added product-only Quick View eye button (`quick-view` modal) and `.product-quick-overlay` bottom hover quick-variant add card; added clear step icons (`spark`, `user`, `calendar`, `check`) and structured `.step-head` cards to `#how`; refined Service/Salon/Product detail views, step-by-step Booking flow (with availability disclaimer and distinct `pending`/`expired`/`cancelled`/`confirmed`/`completed` states), and Cart/Checkout states.
- `public/assets/home-editorial.webp`: Converted directly from native full-resolution `D:\DOWNLOADS!!!!\Calm Linen Spa Facial Scene.png` (`1536x1024` PNG, `2531.4 KB`) to WebP (`1536x1024`, `395.9 KB`, `quality=95`, zero upscaling/downscaling).
- `styles.css`: Styled compact desktop/mobile headers, experience switchers, mobile drawer, 2-column mobile grids, `.filter-toggle-pill`, sticky collapsible `.filter-sidebar` & `.collection-layout.with-filters`, `.price-range-inputs`, product-only `.product-quick-view-btn`, `.product-quick-overlay` (`@media (hover: hover)` desktop reveal), and `.quick-view-modal`, calm detail/booking/cart/checkout layouts, `.how-section` `.step-head`/`.step-icon` cards with minimal staggered `step-fade-up` + subtle hover lift/progress bar, matched `.home-hero` / `.salon-hero` / `.shop-hero` desktop proportions via absolute `inset: 0` hero image positioning (with `.hero-visual img` centered for the 3:2 hero photo), `:focus-visible` outlines, `overflow-x: clip` zero-overflow rules, and `prefers-reduced-motion` support across `1440px`, `1280px`, `768px`, and `390px`.
- `CHANGEREPORT.md`: Prepended Prompt Entry #20.

**Checks Run & Observed Results (`branch-release-54ba3db`):**
- `node -c src/app.js`, `node -c src/public-landing.js` -> exited `0`.
- `npm run build` (`vite build`) -> exited `0` (`dist/assets/index-CX15aJ0J.css` `108.53 kB`, `dist/assets/index-BQCPqAVN.js` `239.38 kB`).
- Browser QA at `1440px`, `1280px`, `768px`, and `390px` against `http://127.0.0.1:5173/` -> zero horizontal overflow (`scrollWidth <= innerWidth`), zero `pageerror`s/JS console errors (only 1 pre-existing 404 for `/favicon.ico`), reduced-motion verified, and all flows verified (landing, experience switchers, search/location, mobile menu drawer, mobile filter drawer keyboard/Esc/focus-return/Apply/Reset, product/service/salon details, wishlist, cart quantity updates, isolated booking review/statuses & checkout summary without live payments or real bookings).

---

## Prompt Entry #19 — `2026-11-23`: Commit & Push Booking Payment-State Lifecycle, Service Detail & Landing Updates (`release/54ba3db`)

**Prompt Summary:** Inspect, record, commit, and push the user's backend booking payment-state & expiry lifecycle changes, API-driven frontend/service-detail & public landing updates, and updated test suites on `release/54ba3db`.

**Added / Modified Files (`branch-release-54ba3db`):**
- `backend/app/api/v1/bookings.py`: Bookings start in `BookingStatus.PENDING` (`payment_status="pending"`, `arrival_otp=None`), invoke `expire_unpaid_bookings(db)` on create/list, lock booking rows with `.with_for_update().populate_existing()` on status updates, return `409` if cancelling a pending booking with an existing `PaymentTransaction`, and return `400` if confirming/completing an unpaid booking.
- `backend/app/api/v1/partners.py`: Added `.with_for_update().populate_existing()` row locking plus pending-payment cancellation (`409`) and unpaid confirmation/completion (`400`) guards on professional and salon booking status updates.
- `backend/app/api/v1/payments.py`: Locked target booking rows in `_resolve_payment_target`, promoted `PENDING -> CONFIRMED` and generated `arrival_otp` upon capture inside `_apply_capture_in_tx`, returned `409` on concurrent `initiating` booking payment attempts, and preserved `initiating` booking `PaymentTransaction` rows on gateway errors for reconciliation.
- `backend/app/services/booking_expiry.py`: *(new)* Added `expire_unpaid_bookings()` to expire unpaid `PENDING` holds older than `BOOKING_HOLD_MINUTES` that have no associated `PaymentTransaction`.
- `backend/app/core/config.py`: Added `BOOKING_HOLD_MINUTES = 15` and `BOOKING_EXPIRY_INTERVAL_SECONDS = 60`.
- `backend/app/main.py`: Added background `_booking_expiry_loop()` task in FastAPI `lifespan`.
- `backend/app/services/maintenance_runner.py`: Added `expire-bookings` maintenance task calling `expire_unpaid_bookings(db, dry_run=dry_run)`.
- `backend/tests/test_booking_payment_state.py`: *(new)* Added isolated SQLite tests for booking pending-until-capture state and expiry exclusion rules.
- `tests/test_bookings.py`, `tests/test_customer_phase3.py`, `tests/test_partner_phase4.py`, `tests/test_phase13_consumer.py`: Updated booking assertions/flows to reflect pending-until-paid booking states.
- `src/app.js`: Removed hardcoded `DEFAULT_SERVICES`/`DEFAULT_PROFESSIONALS`/`localStorage` catalog cache, added `service-detail` routing + listing review fetching, added unavailable-cart-item checkout guards, and updated booking creation/Razorpay verification state sync (`apiGetMyBookings()`).
- `src/public-landing.js`, `public-landing.css`: Added customer discovery goals grid (`.public-discovery`, `.public-goals`) and 3-step customer how-it-works section (`.public-customer-how`).
- `styles.css`: Added `.service-detail`, `.listing-image-button`, `.salon-profile-image`, `.unavailable-cart-items`, mobile `.subnav` horizontal scroll, and `prefers-reduced-motion` rules.
- `CHANGEREPORT.md`: Prepended Prompt Entry #19.

**Checks Run & Observed Results (`branch-release-54ba3db`):**
- `node -c src/api.js`, `node -c src/app.js`, `node -c src/public-landing.js` -> exited `0`.
- `.\.venv\Scripts\python.exe -m compileall -q backend tests` (with `branch-release-54ba3db` CWD) -> exited `0`.
- `npm run build` (`vite build` v7.3.7) -> `8 modules transformed`, built in `996ms`.
- `.\.venv\Scripts\python.exe -m pytest branch-release-54ba3db/backend/tests/test_booking_payment_state.py -q` -> `2 passed` (isolated SQLite; `tests/test_bookings.py` errored at setup because local PostgreSQL on `127.0.0.1:5439` was not running).

---

## Prompt Entry #18 — `2026-11-22`: Update Home Beauty Hero & Auth Sign-In Left Panel Imagery (`release/54ba3db`)

**Prompt Summary:** Convert and deploy the two custom realistic editorial photographs into `public/assets/auth-editorial.webp` (Auth left panel) and `public/assets/home-editorial.webp` (Home Beauty Hero) and wire `AUTH_IMG` in `src/app.js`.

**Added / Modified Files (`branch-release-54ba3db`):**
- `public/assets/auth-editorial.webp`: Created WebP (`width <= 1000`, `quality: 85`) from uploaded warm-taupe vanity photograph (`media_1795350209198_f08d23a5.jpg`) with calm negative space on the left for white editorial typography.
- `public/assets/home-editorial.webp`: Updated WebP (`width <= 1000`, `quality: 85`) from uploaded natural-daylight at-home facial mask photograph (`media_1795350218626_4ef9c83b.jpg`).
- `src/app.js`: Added `AUTH_IMG = './assets/auth-editorial.webp'` and updated `auth()` to render `AUTH_IMG`.
- `CHANGEREPORT.md`: Prepended Prompt Entry #18.

**Checks Run & Observed Results (`branch-release-54ba3db`):**
- `node -c src/app.js` -> exited `0`.
- `npm run build` (`vite build` v7.3.7) -> `8 modules transformed`, built in `1.26s` (`dist/index.html` `1.40 kB`, `dist/assets/index-D8631_dt.css` `108.70 kB`, `dist/assets/index-6yoqn67I.js` `232.90 kB`).

---

## Prompt Entry #17 — `2026-11-22`: Replace Nails Image with Custom AI-Generated Editorial Asset (`release/54ba3db`)

**Prompt Summary:** Convert and deploy the user's newly generated editorial almond-gel manicure image as `public/assets/cat-nails.webp`.

**Modified Files (`branch-release-54ba3db`):**
- `public/assets/cat-nails.webp`: Replaced with `640x480` WebP (`quality: 85`) converted from the custom editorial manicure image (`media_1795349293172_9d63ba74.jpg`).
- `CHANGEREPORT.md`: Prepended Prompt Entry #17.

**Checks Run & Observed Results (`branch-release-54ba3db`):**
- `npm run build` (`vite build` v7.3.7) -> `8 modules transformed`, built in `1.22s` (`dist/index.html` `1.40 kB`, `dist/assets/index-D8631_dt.css` `108.70 kB`, `dist/assets/index-K_iUKb2H.js` `232.87 kB`).

---

## Prompt Entry #16 — `2026-11-22`: Replace Nails Category Image with Centered Luxury Manicure Asset (`release/54ba3db`)

**Prompt Summary:** Replace the low-framing Nails photo with a clear, centered luxury nude gel manicure photograph across the `#categories` grid.

**Added / Modified Files (`branch-release-54ba3db`):**
- `public/assets/cat-nails.webp`: Added local optimized `640x480` WebP luxury gel manicure photograph (visually inspected centered framing).
- `src/app.js`: Pointed `homeCategoryImages.Nails` to `./assets/cat-nails.webp`.
- `styles.css`: Removed the temporary `cat-4` vertical `object-position` offset now that `cat-nails.webp` is naturally centered.
- `CHANGEREPORT.md`: Prepended Prompt Entry #16.

**Checks Run & Observed Results (`branch-release-54ba3db`):**
- `node -c src/app.js` -> exited `0`.
- `npm run build` (`vite build` v7.3.7) -> `8 modules transformed`, built in `949ms` (`dist/index.html` `1.40 kB`, `dist/assets/index-D8631_dt.css` `108.70 kB`, `dist/assets/index-K_iUKb2H.js` `232.87 kB`).

---

## Prompt Entry #15 — `2026-11-22`: Align Nails Photo, Bold Icon-Only Back Buttons, and Role-Specific Partner Registration (`release/54ba3db`)

**Prompt Summary:** Align the `Nails` category crop properly, convert verbose `← Back to ...` buttons across all views to a bold icon-only back button (desktop & phone), and tailor the `Registration` form individually for Professional, Salon Owner, and Product Seller (kept uncommitted locally for inspection).

**Modified Files (`branch-release-54ba3db`):**
- `styles.css`: Centered `Nails` (`cat-4`) crop (`object-position:center 82%`) so fingertips are framed properly; styled `.back-link` as a bold icon-only `40x40` control (`stroke-width:2.4`) on desktop and mobile.
- `src/app.js`: Added `backButton()` helper and replaced all `.back-link` text buttons (`salonDetail`, `productDetail`, `checkoutPage`, `trackingPage`); split `Registration` tab in `partnerPage()` into distinct role-specific forms (`regConfig`) for **Salon Owner**, **Product Seller**, and **Professional**.
- `CHANGEREPORT.md`: Prepended Prompt Entry #15.

**Checks Run & Observed Results (`branch-release-54ba3db`):**
- `node -c src/app.js` -> exited `0`.
- `npm run build` (`vite build` v7.3.7) -> `8 modules transformed`, built in `675ms` (`dist/index.html` `1.40 kB`, `dist/assets/index-COJ7ozaK.css` `108.77 kB`, `dist/assets/index-KAgxSWFe.js` `232.89 kB`).

---

## Prompt Entry #14 — `2026-11-22`: Add Editorial Category Photos to Home Beauty Category Cards (`release/54ba3db`)

**Prompt Summary:** Generate and add category-specific beauty photographs across all 8 Home Beauty `#categories` tiles (`Hair`, `Skin`, `Waxing`, `Threading`, `Nails`, `Makeup`, `Spa`, `Packages`) (kept uncommitted locally for inspection).

**Added / Modified Files (`branch-release-54ba3db`):**
- `public/assets/cat-hair.webp`, `public/assets/cat-waxing.webp`, `public/assets/cat-makeup.webp`: Converted & optimized freshly generated 4:3 luxury editorial photography (`640x480` WebP) via `sharp`.
- `src/app.js`: Added `homeCategoryImages` inside `homePage()` mapping all 8 Home Beauty categories (local `.webp` assets for `Hair`, `Waxing`, `Makeup`; curated editorial photography for `Skin`, `Threading`, `Nails`, `Spa`, `Packages`) and rendered `<img>` inside `.category-art`.
- `styles.css`: Added `.home-categories .category-art` (`132px` desktop / `96px` mobile) and `object-fit:cover` hover scale rules.
- `CHANGEREPORT.md`: Prepended Prompt Entry #14.

**Checks Run & Observed Results (`branch-release-54ba3db`):**
- `node -c src/app.js` -> exited `0`.
- `npm run build` (`vite build` v7.3.7) -> `8 modules transformed`, built in `699ms` (`dist/index.html` `1.40 kB`, `dist/assets/index-D1-hTmZn.css` `108.32 kB`, `dist/assets/index-BKbdnvdV.js` `230.33 kB`).

---

## Prompt Entry #13 — `2026-11-22`: Align Category Filter & Sort Toolbar Across All 3 Consumer Pages (`release/54ba3db`)

**Prompt Summary:** Prevent category chips (such as `Packages` on `#home`) from wrapping awkwardly onto a second row beside the Sort control, aligning `.listing-tools` cleanly on a single row across Home Beauty, Salons, and Beauty Store (kept uncommitted locally for inspection).

**Modified Files (`branch-release-54ba3db`):**
- `styles.css`: Appended unified `.listing-tools`, `.filter-row`, `.filter-chip`, and `.sort-label` alignment rules (single horizontally scrollable pill rail paired on baseline with Sort on desktop; stacked full-width baseline with horizontal chip scroll on mobile `<=700px`).
- `CHANGEREPORT.md`: Prepended Prompt Entry #13.

**Checks Run & Observed Results (`branch-release-54ba3db`):**
- `npm run build` (`vite build` v7.3.7) -> `8 modules transformed`, built in `698ms` (`dist/index.html` `1.40 kB`, `dist/assets/index-BuPmfBK4.css` `107.98 kB`, `dist/assets/index-DeK8HSfT.js` `230.03 kB`).

---

## Prompt Entry #12 — `2026-11-22`: Remove Unnecessary Decorative Stars Across Frontend (`release/54ba3db`)

**Prompt Summary:** Remove unnecessary decorative `✦` stars and emojis across frontend surfaces while retaining the `GLAMGO✦` brand wordmark and star ratings (`★`) (kept uncommitted locally for inspection).

**Modified Files (`branch-release-54ba3db`):**
- `src/app.js`: Removed decorative `✦` from header/mobile navigation buttons (`Command Centre`, `Salon & Partner Portal`, `Admin Command Centre`), Partner/Admin `.dash-intro` banners, and Seller Order item lines; replaced the 4-point star `icons.spark` SVG path with a minimalist beauty-droplet icon (`<path d="M12 2.7 6.3 8.4a8 8 0 1 0 11.4 0L12 2.7Z"/>`).
- `src/public-landing.js`: Replaced decorative `✦` separators in `.public-announcement` and `.public-intro-strip` with subtle `·` separators.
- `CHANGEREPORT.md`: Prepended Prompt Entry #12.

**Checks Run & Observed Results (`branch-release-54ba3db`):**
- `node -c src/app.js` and `node -c src/public-landing.js` -> exited `0`.
- `npm run build` (`vite build` v7.3.7) -> `8 modules transformed`, built in `701ms` (`dist/index.html` `1.40 kB`, `dist/assets/index-CnEjqyJa.css` `106.91 kB`, `dist/assets/index-DqVhkW5P.js` `230.03 kB`).

---

## Prompt Entry #11 — `2026-11-22`: Immediate UI Sync, State Persistence & Input Validation Across Partner Mutations (`release/54ba3db`)

**Prompt Summary:** Fix Professional `Services & pricing` UI refresh delay, Seller `Inventory & stock` persistence/UI sync & validation, and persist fetched partner workspace data to `localStorage` so reloads never flash stale state (kept uncommitted locally for inspection).

**Modified Files (`branch-release-54ba3db`):**
- `src/app.js`: Added `persist()` inside `loadPartnerData()` after loading live workspace feeds; updated `partner-pro-assign-service`, `partner-pro-unlink-service`, `partner-stock-update`, and `partner-listing-update` to validate inputs (`stock >= 0`, `price > 0`), update `state` & `localStorage` immediately, and `render()` before awaiting background refresh.
- `CHANGEREPORT.md`: Prepended Prompt Entry #11.

**Checks Run & Observed Results (`branch-release-54ba3db`):**
- `node -c src/app.js` -> exited `0`.
- `npm run build` (`vite build` v7.3.7) -> `8 modules transformed`, built in `681ms` (`dist/index.html` `1.40 kB`, `dist/assets/index-CnEjqyJa.css` `106.91 kB`, `dist/assets/index-DtgexQnE.js` `230.21 kB`).

---

## Prompt Entry #10 — `2026-11-22`: Partner KPI Rendering, Salon Owner Overview Hardening, Users Search & Mobile Select Polish (`release/54ba3db`)

**Prompt Summary:** Fix the 3 dashboard issues identified during the 4-dashboard QA audit across desktop and mobile (`390x844`) viewports (kept uncommitted locally for inspection).

**Modified Files (`branch-release-54ba3db`):**
- `src/app.js`: Updated `partnerPage()` to prefer `overview.metrics` and `overview.bookings`/`overview.orders` with safe fallbacks so live KPIs and recent activity render immediately across Professional, Salon Owner, and Product Seller dashboards instead of blanking to `—`; added `render()` immediately after `partner-seller-product-form` creation; added `data-dashboard-search="tbody tr"` to `#admin-user-search` in Admin `Users & accounts`.
- `backend/app/api/v1/partners.py`: Hardened Salon Owner `get_partner_overview` to sum `float(b.price or 0)`, query `SalonStaff` count directly instead of lazy-loading `salon.staff`, return `1 if salon else 0` branches, and serialize booking status safely.
- `dashboards.css`: Styled `.dash-mobile-nav select` inside `@media(max-width:700px)` with `appearance:none` and an inline SVG right-aligned chevron so the dropdown arrow never wraps onto a second line.
- `CHANGEREPORT.md`: Prepended Prompt Entry #10.

**Checks Run & Observed Results (`branch-release-54ba3db`):**
- `node -c src/app.js` and `..\.venv\Scripts\python.exe -m compileall -q backend` -> exited `0`.
- `npm run build` (`vite build` v7.3.7) -> `8 modules transformed`, built in `690ms` (`dist/index.html` `1.40 kB`, `dist/assets/index-CnEjqyJa.css` `106.91 kB`, `dist/assets/index-CpGf3tHU.js` `229.18 kB`).

---

## Prompt Entry #9 — `2026-11-22`: Mobile/Phone UI & Drawer Audit Fixes (`release/54ba3db`)

**Prompt Summary:** Audit all views and buttons on phone viewport (`390x844`) at `http://127.0.0.1:5173/` and fix mobile drawer positioning, modal/drawer dismissal, mobile toast placement, Auth brand contrast, and guest scroll reset (kept uncommitted locally for inspection).

**Modified Files (`branch-release-54ba3db`):**
- `styles.css`: Inside `@media(max-width:700px)`, updated `.mobile-menu` to `position:fixed;bottom:57px` above the mobile bottom nav (`max-height:calc(100dvh - 120px)`, `overflow-y:auto`), positioned `.toast` at `bottom:68px` so toasts do not cover the header or Auth `GLAMGO ✦` logo, and set white text with subtle shadow on `.auth-image-copy .wordmark.light`.
- `src/app.js`: Closed `state.mobileMenu` and `state.menu` when opening modals (`location`, `search-open`, `salon-date`, `notifications`) or navigating (`account*`, `guest-browse`), added `window.scrollTo({top:0,behavior:'instant'})` on `guest-browse`, and updated `keydown` `Escape` handling to dismiss `state.mobileMenu` and `state.menu` alongside `state.modal`.
- `CHANGEREPORT.md`: Prepended Prompt Entry #9.

**Checks Run & Observed Results (`branch-release-54ba3db`):**
- `node -c src/app.js` -> exited `0`.
- `npm run build` (`vite build` v7.3.7) -> `8 modules transformed`, built in `626ms` (`dist/index.html` `1.40 kB`, `dist/assets/index-D6rkC3na.css` `106.54 kB`, `dist/assets/index-BytCJ5zF.js` `228.78 kB`).

---

## Prompt Entry #8 — `2026-11-22`: Proxy Local Vite `/api` Dev Requests to Live Backend & Surface HTTP Error Statuses (`release/54ba3db`)

**Prompt Summary:** Fix `"An unexpected error occurred."` during sign-in on local Vite preview (`http://127.0.0.1:5173/`) caused by `/api` proxying to an unstarted local port `8000`.

**Modified Files (`branch-release-54ba3db`):**
- `vite.config.js`: Updated dev proxy target to `process.env.VITE_DEV_PROXY_TARGET || 'https://glamgo-backend-lqn6.onrender.com'` (`secure: true`, `changeOrigin: true`) so local `npm run dev` connects seamlessly to the live backend (overridable via `VITE_DEV_PROXY_TARGET` for local FastAPI testing).
- `src/api.js`: Improved non-JSON HTTP error fallback from generic `"An unexpected error occurred."` to `"Backend server unavailable right now. Please try again."` (`>=502`) or `"Request failed (HTTP <status>)"`.
- `CHANGEREPORT.md`: Prepended Prompt Entry #8.

**Checks Run & Observed Results (`branch-release-54ba3db`):**
- `node -c src/api.js` -> exited `0`.
- `npm run build` (`vite build` v7.3.7) -> `dist/index.html` (`1.40 kB`), `dist/assets/index-DUicoJ7f.css` (`95.49 kB`), `dist/assets/index-frQmjaXQ.js` (`218.86 kB`), `7 modules transformed`, built in `577ms`.

---

## Prompt Entry #7 — `2026-11-22`: Wire Backend-Driven Features in Frontend Logic Without Visual Redesign (`release/54ba3db`)

**Prompt Summary:** Expose the backend capabilities ported from `main` (multi-city catalog scoping & GPS/Haversine distance sorting, password reset & Mobile OTP auth flows, booking add-ons / arrival PIN / 1-tap reschedule, and referral/gift-card wallet credits) inside `branch-release-54ba3db`'s frontend logic while keeping all existing visual styles (`styles.css`), page layouts, and local WIP `public-landing` files intact. Commit and push skipped at user request for local inspection first.

**Modified Files (`branch-release-54ba3db`):**
- `src/api.js`: Added `apiRequestPasswordReset`, `apiConfirmPasswordReset`, `apiRequestMobileOtp`, `apiVerifyMobileOtp`, `apiGetCatalogSalons`, `apiGetMyRewards`, `apiRedeemRewardCode`, `apiRescheduleBooking`, `apiVerifyBookingArrivalOtp`; updated `apiGetServices`, `apiGetProfessionals`, and `apiGetSalons` to pass `city` and `lat`/`lng`/`max_distance_km` params to `/api/v1/catalog/*`.
- `src/app.js`:
  - **Multi-City & Geo Distance (`MAIN-01`, `MAIN-04`):** Added multi-city defaults (`Mumbai`, `Bengaluru`, `Delhi`), `mergeCatalogWithCityDefaults`, `AREA_COORDS`, `normalizeCity()`, `resolveUserCoords()`, `haversineKm()`, `NEAR_SALON_RADIUS_KM`, `enrichSalonWithDistance()`, `reverseGeocodeCoords()`, `isServiceAvailableInCity()`, `isProAvailableInCity()`; wired `loadCatalogFeeds()`, `homePage()`, `salonPage()`, `salonCard()`, `salonDetail()`, `search` modal (`(Outside <City>)`), and `location` modal (GPS `map-locate` + multi-city suggestions + `.filter-chip` distance filters & `Nearest first` sort) using existing styles.
  - **Auth Lifecycle (`MAIN-02`):** Added inline `Email & Password` | `Mobile OTP` mode pills (`.filter-chip`), `Forgot password?` action in `.auth-switch`, and `auth-otp-request-form`, `auth-otp-verify-form`, `auth-reset-request-form`, `auth-reset-confirm-form` handlers inside `.auth-box`.
  - **Booking Upgrades (`MAIN-03`):** Added `BOOKING_ADDONS` toggles in `bookingModal()` (passing `addons` in `apiCreateBooking`), `arrival_otp` display in `bookingSuccess()` & `My bookings`, `1-tap Reschedule` + `booking-reschedule` modal (`apiRescheduleBooking`), and `Verify Arrival PIN` + `pro-verify-otp` modal (`apiVerifyBookingArrivalOtp`) inside `partnerPage()`.
  - **Wallet Credits & Rewards (`MAIN-05`):** Hydrated `walletCredits` and `referralCode` via `apiGetMyRewards()` on login/init; added wallet balance, referral code display, and `reward-redeem-form` inside `Coupons & rewards`; added `Apply GlamGo Wallet Credit` toggle (`checkout-toggle-credit`) and `apply_wallet_credit` payload support in `checkoutPage()` / `place-order`.
- `CHANGEREPORT.md`: Prepended Prompt Entry #7.

**Checks Run & Observed Results (`branch-release-54ba3db`):**
- `node -c src/api.js`, `node -c src/app.js`, `node -c src/public-landing.js` -> exited `0` (all passed).
- `npm run build` (`vite build` v7.3.7) -> `dist/index.html` (`1.40 kB`), `dist/assets/index-DUicoJ7f.css` (`95.49 kB`), `dist/assets/index-CbNEGz52.js` (`218.78 kB`), `7 modules transformed`, built in `583ms`.

**Git Status / Push Status:**
- Intentionally uncommitted & not pushed per user selection (`Wait — do not commit or push yet; I want to inspect locally first`), preserving WIP `index.html`, `public-landing.css`, and `src/public-landing.js`.

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
