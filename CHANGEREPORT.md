# GlamGo Change Report (`CHANGEREPORT.md`)

> **Standing Workflow Policy:** Every prompt that modifies the repository appends a structured entry to `CHANGEREPORT.md` detailing every modified/added file, why it changed, and verified checks before pushing changes to GitHub.

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
