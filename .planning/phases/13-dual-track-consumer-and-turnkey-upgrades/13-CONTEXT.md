# Phase 13 Context: Dual-Track Consumer (`main`) & Turnkey Showcase (`feat/turnkey-platform`) Product Upgrades

**Phase:** 13  
**Milestone:** v2.0  
**Created:** 2026-11-22  
**Status:** Locked Decisions for Planning  

## Locked Architectural Decisions

### 1. Strict Dual-Branch Identity
- **`main` (Flagship Production Consumer Website):**
  - Strictly production customer experience with zero turnkey demo bar.
  - Strict Role-Based Access Control (ID & password login via `apiLogin` / FastAPI JWT; `Admin Command Centre` visible and accessible only to `admin` accounts; verified partners locked to their own assigned workspace; regular customers restricted to `Registration` inside Partner Portal).
  - Real multi-city availability (`Bengaluru`, `Mumbai`, `Delhi`) and Haversine distance sorting/filtering (`Near you` <= 8 km vs `Far from you` > 8 km).
- **`feat/turnkey-platform` (Turnkey Platform Buyer & Partner Listing Showcase):**
  - Dedicated sales and partner-onboarding showcase for prospective white-label platform buyers AND salons, skincare brands, and specialists applying to list on GlamGo.
  - Preserves 1-click no-login access across all 4 operational dashboards (`Specialist Studio`, `Salon Hub`, `Seller Hub`, `Admin Command`) via `turnkeyDemoBar()`.
  - Must NEVER weaken `main`'s authentication guards; Plan `13-01` targets `main` first, and Plan `13-02` executes on `feat/turnkey-platform`.

### 2. UI/UX & Engineering Guardrails
- Editorial luxury aesthetic: warm ivory (`#FAF8F5` / `var(--ivory)`), cream (`var(--cream)`), obsidian charcoal (`#181614` / `var(--ink)`), brushed champagne (`#C5A059` / `var(--champagne)`), Playfair Display serif + Inter/DM Sans sans-serif with `tabular-nums`.
- Zero raw Unicode emojis used as UI icons — always use the `icon(name, size)` SVG helper in `src/app.js`.
- Accessible touch targets (`>= 36px` chips, `>= 44px` primary buttons), visible champagne focus rings (`:focus-visible`), `prefers-reduced-motion` compliance, and `0px` horizontal overflow across `375px` mobile and `1440px` desktop viewports.
- Windows PowerShell compatibility (`;` instead of `&&`), Vite 7 ES module build (`npm run build`), Python FastAPI + SQLAlchemy 2.0 backend (`backend/app/`), and backward-compatible schema additions (SQLite + PostgreSQL safe).
- Never store plaintext credentials or secrets in client source code or `CHANGEREPORT.md`.

### 3. Scope Breakdown
- **Plan 13-01 (`main` — Consumer Website Upgrades):** `MAIN-01`, `MAIN-02`, `MAIN-03`, `MAIN-04`, `MAIN-05`
  1. Backend `city`, `lat`, `lng`, `service_cities` columns & `/api/v1/catalog/salons` city/radius filters (`backend/app/models/catalog.py`, `backend/app/schemas/catalog.py`, `backend/app/api/v1/catalog.py`, `backend/app/services/seed_service.py`, `backend/app/core/database.py` safe auto-column migration).
  2. Auth & Partner Credential Lifecycle: Forgot Password / Reset flow + Mobile OTP sign-in endpoints (`backend/app/api/v1/auth.py`, `src/api.js`, `src/app.js`), plus Admin Partner Approval role-upgrade & activation notification (`backend/app/api/v1/admin.py`).
  3. Booking Experience: 1-tap reschedule (`PUT /api/v1/bookings/{id}/reschedule`), customer 4-digit arrival OTP display in *My bookings* synced with Specialist Studio arrival step, and optional service add-ons in `bookingModal()`.
  4. Search, Autocomplete & Performance: City-scoped global search (`⌘K`) with *"Outside `<City>`"* pills, blur/outside-click dismiss on `#location-autocomplete-list`, and lazy dynamic `import('./dashboards-suite.js')` code splitting in `src/app.js` + `vite.config.js` manual chunks so consumer storefront bundle drops below Vite's 500 kB warning.
  5. Trust, SEO & Retention: Legal/Policy modal drawers (Hygiene Guarantee, Cancellation & Refund, Privacy Policy, Terms of Service), OpenGraph + `BeautySalon` JSON-LD metadata in `index.html`, and Referral Code / Gift Card credit balance & redemption in Account & Checkout.
- **Plan 13-02 (`feat/turnkey-platform` — Turnkey Buyer & Partner Showcase Upgrades):** `TURN-01`, `TURN-02`, `TURN-03`, `TURN-04`, `TURN-05`
  1. Port the Bengaluru/Mumbai/Delhi multi-city catalog, Haversine distance engine, `Near you` / `Far from you` badges, and distance filter bar from `main` onto `feat/turnkey-platform` while retaining 1-click access to all 4 operational dashboards.
  2. Live White-Label Brand Customizer drawer/toolbar (`src/turnkey-showcase.js` + `src/app.js` + `styles.css`): live Brand Name override, Currency switcher (`₹ INR`, `$ USD`, `AED`, `£ GBP` with live `money()` conversion), and Accent Palette selector updating CSS variables & wordmark across storefront and all 4 dashboards in real time.
  3. Interactive Dual-Mode ROI & Partner Earnings Calculator section (Tab A: Platform Buyer monthly GMV/commission estimator; Tab B: Salon/Brand Partner incremental monthly revenue estimator).
  4. Structured 3-Tier Comparison Matrix (List Salon/Brand on GlamGo vs. Turnkey White-Label License vs. Enterprise Multi-City Rollout) + Platform Tech Stack & Deliverables Spec.
  5. Embedded "Request Proposal / Book Live Walkthrough" lead-capture modal logging inquiries to Admin Command Centre notifications/leads alongside WhatsApp CTA, plus a "Reset Sandbox Data" button in `turnkeyDemoBar()`.

## Proven Verify Commands (from prior runs on this repo)
- `node -c src/api.js; node -c src/dashboards-suite.js; node -c src/app.js`
- `python -m py_compile backend/app/services/seed_service.py`
- `npm run build`
- `pytest tests/` (backend test suite)
- Playwright headless verification against `http://127.0.0.1:5173/` checking desktop `1440px` and mobile `375px` (`0px` overflow, `0` page errors)
