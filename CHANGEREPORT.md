# Change Report

## Prompt Entry #24 — 2026-11-22 11:06 IST — Force Same-Origin `/api/v1` Proxy Before `VITE_API_BASE_URL` on `*.vercel.app` (`feat/turnkey-platform`)
**Objective:** Ensure Vercel deployments of `feat/turnkey-platform` do not hit `"Failed to fetch"` on API calls when `VITE_API_BASE_URL` points directly to Render (`OPTIONS` CORS preflight `400`).
- **Modified Files:**
  - `src/api.js`: Moved the `window.location.hostname.endsWith('vercel.app')` check above `import.meta.env.VITE_API_BASE_URL` in `resolveApiBase()` so `*.vercel.app` deployments always route via the same-origin `/api/v1` rewrite proxy in `vercel.json`.
- **Verification:** `node -c src/api.js` and `npm run build` passed.

## Prompt Entry #23 — 2026-11-22 09:15 IST — Phase 13 Waves 3 & 4: Turnkey Interactive Sales Engine, Multi-City GPS Parity, White-Label Live Customizer, Dual-Mode ROI Calculator & Proposal Lead Capture (`feat/turnkey-platform`)
**Objective:** Execute Waves 3 & 4 (`13-03-PLAN.md` and `13-04-PLAN.md`, requirements `TURN-01..05`) on `feat/turnkey-platform`, transforming the turnkey showcase into an interactive white-label sales and partner acquisition engine while syncing multi-city GPS persistence and Haversine salon distance parity from `main` without breaking 1-click access to all 4 operational dashboards.
- **Created Files:**
  - `src/turnkey-showcase.js`:
    - `TURN-02`: Live White-Label Brand Customizer Drawer (`WHITE_LABEL_STORAGE_KEY`, `WHITE_LABEL_DEFAULTS`, `CURRENCY_CONFIG` for `₹ INR`, `$ USD`, `£ GBP`, `AED`, `ACCENT_PRESETS` for Champagne Gold, Velvet Rose, Botanical Emerald, Obsidian Amber, `loadWhiteLabelConfig`, `saveWhiteLabelConfig`, `applyWhiteLabelTheme`, `formatWhiteLabelMoney`, `renderWhiteLabelWordmark`, `renderWhiteLabelCustomizerDrawer`).
    - `TURN-03`: Interactive Dual-Mode Revenue & Commission ROI Calculator (`DEFAULT_ROI_STATE`, `computePlatformRoi`, `computePartnerRoi`, `renderTurnkeyRoiSection`, `updateRoiOutputsInPlace`) with Tab A (*Platform Buyer ROI*) and Tab B (*Salon / Brand Partner Earnings*).
    - `TURN-04`: 3-Tier Commercial & Feature Comparison Matrix (`COMPARISON_TIERS`, `renderComparisonMatrixSection`) + Technical Architecture & Deliverables Spec (`DELIVERABLES_SPEC`, `renderArchitectureDeliverablesSection`).
    - `TURN-05`: Embedded Proposal & Lead Capture Modal + Admin Command Centre Buyer & Partner Leads Panel (`TURNKEY_LEADS_STORAGE_KEY`, `DEFAULT_TURNKEY_LEADS`, `loadTurnkeyLeads`, `saveTurnkeyLeads`, `renderProposalModalContent`, `renderAdminTurnkeyLeadsPanel`).
  - `.planning/phases/13-dual-track-consumer-and-turnkey-upgrades/13-CONTEXT.md`, `13-03-PLAN.md`, `13-04-PLAN.md`, `13-03-SUMMARY.md`, `13-04-SUMMARY.md`.
- **Modified Files:**
  - `backend/app/models/salon.py`, `backend/app/models/professional.py`, `backend/app/models/service.py`, `backend/app/schemas/catalog.py`, `backend/app/db/session.py`, `backend/app/services/seed_service.py`, `backend/app/api/v1/endpoints/salons.py`, `backend/app/api/v1/api.py`: Synced multi-city (`city`, `lat`, `lng`) persistence, `ensure_phase13_schema_columns` auto-migration, 9 multi-city salons across Mumbai/Bengaluru/Delhi NCR, server-side Haversine distance enrichment, and `/api/v1/catalog/*` routes.
  - `src/api.js` & `vite.config.js`: Synced `/catalog/*` routes with `city`/`lat`/`lng` query filters and configured `manualChunks` (`vendor-leaflet`, `dashboards-suite`).
  - `src/dashboards-suite.js`: Hardened `exportCsvFile()` with `sanitizeCsvCell()` neutralizing leading `=`, `+`, `-`, `@`, `\t`, and `\r` characters (`T-13-13`).
  - `src/app.js`:
    - Lazy-loaded `./dashboards-suite.js` (`loadDashboardsSuite()`) and `leaflet` (`loadLeaflet()`), keeping all production chunks well under 500 kB.
    - Integrated 9 multi-city `DEFAULT_SALONS`, 8 `DEFAULT_SERVICES`, and 7 `DEFAULT_PROFESSIONALS` with Haversine distance calculation (`Near you · X.X km` vs `Far from you · X.X km`), distance filter pills (`All in <City>`, `Within 5 km`, `Within 10 km`, `Nearest first`), and city-scoped `⌘K` search (`Outside <City>` badge).
    - Upgraded `turnkeyDemoBar()` with `Rebrand Live`, `Request Proposal`, and `Reset Sandbox` pills alongside 1-click buttons for all 4 operational dashboards (`Specialist Studio`, `Salon Hub`, `Seller Hub`, `Admin Command`).
    - Added `leads` (*Buyer & Partner Leads*) tab to `adminPage()` and wired all `tk-*` customizer, ROI, proposal submission, CSV export, and sandbox reset handlers.
  - `styles.css`: Added `.salon-proximity-*`, `.salon-distance-*`, `.city-unavailable-box`, `.search-outside-pill`, `.turnkey-reset-pill`, and `.tk-*` responsive styles.
- **Verification:**
  - Backend tests: `.\.venv\Scripts\python.exe -m pytest tests/test_catalog.py -v` -> `4 passed in 3.75s`.
  - Frontend syntax & build: `node -c src/api.js; node -c src/dashboards-suite.js; node -c src/turnkey-showcase.js; node -c src/app.js; npm run build` -> exit `0` (`index`: `348.22 kB`, `vendor-leaflet`: `150.07 kB`, `dashboards-suite`: `54.18 kB`, zero chunks > 500 kB).
  - Playwright E2E verification (`verify_phase13_turnkey.png`): verified `Velvet Aura` live rebranding, `$ USD` currency conversion (`$73,800`), `Botanical Emerald` theme, Dual-Mode ROI tabs, 3-Tier Matrix & Deliverables Spec, Indiranagar Bengaluru switch (`Saffron & Silk Atelier`, `Near you` / `Far from you` + `Within 5 km` filter), Proposal Form submission appearing in `Admin Command -> Buyer & Partner Leads`, 1-click access across all 4 dashboards, `Reset Sandbox` restoring `GLAMGO`, `0` page errors, and `0px` horizontal overflow at `1440px` and `375px`.

## Prompt Entry #22 — 2026-11-22 00:30 IST — Refine Turnkey Buyer Acquisition & Partner Listing Showcase (`feat/turnkey-platform`)
**Objective:** Position `feat/turnkey-platform` cleanly for prospective white-label platform buyers and beauty businesses looking to list their salons, skincare brands, or specialist practices, alongside instant 1-click access to all 4 operational dashboards (`src/dashboards-suite.js`).
- **Modified Files:**
  - `src/app.js`:
    - Upgraded `turnkeyDemoBar()` with crisp SVG `icon()` buttons (removing raw emojis), `TURNKEY SHOWCASE · Buy or List Business` framing, an 8-pill bar including `Specialist Studio` (`demo-specialist`) and `Acquire / List` CTA scrolling cleanly to `#acquire-partner` from any view or experience.
    - Added `homeAcquirePartnerSection()` (`#acquire-partner`) inside `homePage()` with a two-column dual-track editorial showcase: Dark White-Label & Turnkey Acquisition card (`Explore Admin Command Centre` + pre-filled WhatsApp buyer inquiry link) and Ivory Salon/Brand/Specialist Onboarding card (`Apply to List Now` opening Registration, `Try Salon Studio`, and `Try Seller Hub`).
    - Added `openDemoPartner(role, tab, hash)` helper and updated `applyRouteFromLocation()` to support `#specialist-partner`, `#salon-partner`, and `#apply-partner` routes cleanly without async `hashchange` overwrites, plus `demo-specialist` and `demo-apply-partner` handlers in `action(el)`.
  - `styles.css`:
    - Added `.turnkey-cta-pill`, `.btn-outline-light`, `.acquire-*` responsive card grid/badge/action styles (`min-height: 44px` action buttons, focus-visible gold outlines, mobile single-column stack at `<=900px`, `prefers-reduced-motion` support).
    - Tightened `.turnkey-demo-links` flex bounds (`min-width: 0`, `flex: 1`) and restricted `.mobile-menu-button` visibility to `@media(max-width:700px)` to eliminate desktop horizontal overflow.
- **Verification:**
  - Syntax checks: `node -c src/dashboards-suite.js` and `node -c src/app.js` passed (exit `0`).
  - Production build: `npm run build` passed (`✓ built in 1.90s`; `dist/assets/index-D0r6qDrD.js` 502.64 kB, `dist/assets/index-CuxqFj8-.css` 179.38 kB).
  - Playwright E2E check against `http://127.0.0.1:5173/`: verified 8 SVG pills in `.turnkey-demo-bar`, 2 editorial cards in `#acquire-partner`, `Specialist Studio` toggle rendering `Specialist Overview` with duty status controls, `Apply to List Now` opening `Partner Application & Onboarding`, `0` page errors, and `0px` horizontal overflow on both desktop (`1440px`) and mobile (`375px`).

## Prompt Entry #21 — 2026-11-22 00:05 IST — Sync Full 4-Dashboard Operational Suite to Turnkey Branch (`feat/turnkey-platform`)
**Objective:** Merge `main`'s complete 4-dashboard operational suite (`30567de`, `e2ade67`) into `feat/turnkey-platform` so the turnkey evaluation link exposes the exact same full-featured Admin, Specialist, Salon Owner, and Product Seller dashboards alongside the turnkey preview bar and landing ecosystem.
- **Files Synced:** `src/dashboards-suite.js`, `src/app.js`, `styles.css`, `backend/app/services/seed_service.py`.
- **Verification:** Clean syntax (`node -c`), production bundle build (`npm run build`), and push to `origin/feat/turnkey-platform`.

## Prompt Entry #19b — 2026-11-21 17:00 IST — Deployment-Ready Resiliency Hardening for Standalone Turnkey Link
**Objective:** Guarantee 100% turnkey deployment readiness when deployed as a standalone link or preview URL on Vercel:
1. **Catalog Fallback Safeguards:**
   - In `src/app.js` (`loadCatalogFeeds()`), hardened API response handling so if the remote backend database is unseeded, empty (`[]`), or asleep, catalog feeds automatically preserve `DEFAULT_SERVICES`, `DEFAULT_PROFESSIONALS`, `DEFAULT_SALONS`, and `DEFAULT_PRODUCTS`.
   - Prevents empty marketplace grids on freshly spun up environments.
2. **Build & Bundle Verification:**
   - Production Vite bundle verified cleanly in 2.62s (`dist/assets/index-n5NOHq0z.js` 432.94 kB, `index-Dg5sxKa_.css` 167.93 kB).

## Prompt Entry #18 — 2026-11-21 15:45 IST — Turnkey Platform Architecture & Deep Ecosystem Landing Page (/ui-ux-pro-max & Platform Sale Readiness)
**Objective:** Prepare GlamGo for sale to prospective buyers/investors by removing all sign-in friction across all portals, adding a persistent 1-click Turnkey Tour Switcher, and expanding the landing page with comprehensive marketplace telemetry, partner studio showcases, clinical formulation store, hygiene protocols, testimonials, and interactive FAQ:
1. **Turnkey Unrestricted Platform Access (Zero Sign-In Friction for Buyers & Investors):**
   - **Persistent Turnkey Preview Bar (`.turnkey-demo-bar`):** Added a top-bar preview ribbon at the very top of every page allowing instant 1-click navigation between:
     - `[ 🛍️ Marketplace ]` (Home consumer view)
     - `[ ✂️ Salon Partner Hub ]` (Salon Owner Studio with live staff rosters, chair bookings, and revenue metrics)
     - `[ 📦 Vendor Hub ]` (Product Seller Studio with inventory SKUs, fulfillment orders, and catalogue management)
     - `[ ⚡ Admin Command Centre ]` (Executive command desk with GMV metrics, user databases, moderation queues, and audit logs)
     - `[ 👤 Client Account ]` (Customer account dashboard with active bookings, order history, and preferences)
     - `[ ✦ AI Concierge ]` (Interactive AI beauty advisor & WhatsApp booking desk)
   - **Unrestricted Authentication & Fallback Data:**
     - Cleared `PROTECTED_VIEWS = new Set([])` to eliminate any redirect to login gates.
     - Auto-initialized demo administrator session (`role: 'admin'`) so evaluators have unrestricted access to all admin tools, partner suites, and customer accounts.
     - Provided turnkey datasets (`DEFAULT_SALONS`, `DEFAULT_PRODUCTS`, `DEFAULT_ADMIN_STATS`, `DEFAULT_SALON_BOOKINGS`, `DEFAULT_SELLER_PRODUCTS`, etc.) ensuring rich, realistic metrics (₹18,42,600 GMV, 14,200+ visits, 98.4% satisfaction) even when the remote database is cold or offline.
2. **Deeply Detailed Landing Page Ecosystem (`#home` / `homePage()`):**
   - **Tri-Engine Ecosystem Overview (`#ecosystem`):** Interactive cards displaying the 3 commercial revenue engines: Doorstep Specialist Visits, Partner Salon & Parlour Studios, and Clinical Formulations Store.
   - **Featured Partner Studios Showcase (`#salons-preview`):** Editorial salon showcase featuring Premier Partner studios (The Glasshouse, Maison de Beauté, Aura Wellness) with live booking buttons.
   - **Clinical Formulations Showcase (`#skincare-preview`):** Direct-to-consumer store preview featuring medical-grade formulations (Augustinus Bader, SkinCeuticals, Biologique Recherche, Olaplex) with ratings, prices, and 1-click "Add to Bag".
   - **Hospital-Grade Hygiene & Safety Protocol (`#hygiene`):** 4 safety pillars highlighting single-use sealed kits, certified & background-checked specialists, 100% upfront pricing, and 7-day partner escrow guarantee.
   - **Verified Client Testimonials & Social Proof (`#reviews`):** 5.0★ verified reviews highlighting client satisfaction, punctuality, and salon-grade results.
   - **Marketplace Scale Telemetry Strip (`#metrics`):** Key buyer-facing metrics (₹1.84M+ GMV, 14,200+ completed visits, 120+ partner studios & specialists, 98.4% retention rate).
   - **Interactive FAQ Accordion (`#faq`):** 6 key client and partner questions with smooth toggle interactions.
3. **Mobile & Viewport Optimization:**
   - Enforced 0 horizontal overflow across all mobile viewports (`320px`, `390px`, `768px`) with scrollable turnkey ribbons and hidden desktop portal buttons on narrow screens.

### Files changed
- `src/app.js`: Added turnkey mock datasets, unrestricted auth routing, turnkey demo bar component, rich landing sections (`#ecosystem`, `#salons-preview`, `#skincare-preview`, `#hygiene`, `#reviews`, `#metrics`, `#faq`), and action handlers.
- `styles.css`: Added styles for turnkey demo bar, ecosystem grid, salon preview, skincare preview, hygiene grid, testimonials, metrics strip, faq accordion, and mobile overflow guards.
- `CHANGEREPORT.md`: Documented changes, verified commands, and platform sale readiness.

### Verification
- `npm run build`: Production build succeeded in 3.79s (`dist/assets/index-cyB4iERo.js` 432.93 kB, `dist/assets/index-Dg5sxKa_.css` 167.93 kB).
- Playwright End-to-End Automated Verification:
  - Turnkey Demo Bar: Rendered and active across all views.
  - Landing page sections found: `#ecosystem`, `#categories`, `#popular`, `#salons-preview`, `#professionals`, `#how`, `#ritual`, `#skincare-preview`, `#hygiene`, `#concierge`, `#reviews`, `#metrics`, `#faq`.
  - FAQ accordion toggle: Passed (`active: true`).
  - Admin Command Centre (`#admin`): Loaded with ₹18,42,600 GMV, 5 moderation drafts, 5 bookings, 4 orders, 6 users, 4 audit logs.
  - Partner Studio (`#partner`): Loaded with Salon Owner Studio and Product Seller Studio without login requirement.
  - Customer Account (`#account`): Loaded without login prompt.
  - Mobile 390px Viewport: `Doc: 390 x 390 (overflow: false)`, `Body: 390 x 390 (overflow: false)`.
  - Desktop 1440px Viewport: Location picker map verified and functional (`Leaflet tiles count: 6`).
- Visual Artifacts Generated:
  - `turnkey_landing_top.png`
  - `turnkey_landing_salons_skincare.png`
  - `turnkey_landing_metrics_faq.png`
  - `turnkey_admin_overview.png`
  - `turnkey_partner_salon.png`
  - `turnkey_partner_vendor.png`
  - `turnkey_client_account.png`
  - `turnkey_mobile_home_top.png`
  - `test_local_location_modal.png`
  - `verify_local_ritual.png`

## Prompt Entry #20 — 2026-11-21 23:59 IST — Full 4-Dashboard Operational Suite (Admin, Specialist, Salon Owner, Product Seller)
**Objective:** Plan (`/gsd-plan-phase`, `/graphify`, `/ui-ux-pro-max`) and implement the full industry-standard feature set across all 4 operational GlamGo dashboards while preserving the warm ivory/champagne aesthetic and `localStorage` + API compatibility:
1. **Admin Command Centre:**
   - **Promos & Commissions (`promotions`):** Platform commission rules (`homePct`, `salonPct`, `retailPct`, `escrowDays`, `noShowFeePct`), promo coupon creation (`#ops-coupon-form`), and active/paused toggle + delete controls.
   - **Disputes & Review Moderation (`disputes`):** 4-card KPI strip, ticket resolution desk (Full Refund / 50% Split / Reject), and flagged review moderation queue (Approve / Hide).
   - **Escrow & Partner Payouts (`payouts`):** Held/Matured/Disbursed KPI cards, batch payout disbursement actions, and RFC-4180 CSV payout ledger export.
2. **At-Home Specialist (Professional) Studio:**
   - **Topbar Status & Safety:** Live `Online / On Break / Offline` segmented toggle and red `Emergency SOS` panic button dispatching timestamped GPS check-in alerts.
   - **Job Lifecycle & Territory:** 5-step job progress bar (`Accepted → En Route → Arrived (OTP) → In Progress → Done`) on confirmed bookings and inter-visit travel buffer + pin-code territory settings under Availability.
   - **Client CRM & Portfolio:** Dedicated `Client CRM & Safety` tab (allergy alerts, skin/hair profile notes, SOS incident ledger) and `Lookbook Portfolio` tab (before/after gallery + uploader).
3. **Salon Owner Studio:**
   - **Multi-Stylist Chair Calendar (`Chair Calendar`):** Visual time × stylist schedule matrix with 1-tap chair status cycling (`Booked → Checked-In → In-Chair → Completed`) and walk-in assignment form.
   - **Front-Desk POS (`Front-Desk POS`):** Today Z-Report strip (UPI / Card / Cash totals), combined service + retail checkout form, and live receipt feed.
   - **Inventory, Formulas, Multi-Branch & Payroll:** Dual `Backbar & Retail Stock` tracker (`Use -1` / `Restock +5` + reorder alerts), `Client Formulas & CRM` (color formulas, allergies, LTV), multi-branch management in `Branches`, and `Staff Commission & Monthly Payroll Summary` in `Staff management`.
4. **Product Seller Studio:**
   - **Batch & Expiry FIFO (`Batch & Expiry`):** Earliest-expiry-first (FIFO) cosmetic lot ledger with color-coded shelf-life health pills (`Green >90d`, `Yellow ≤90d` with 1-click `20% Clearance`, `Red Expired` auto-delisted) and lot registration form.
   - **Fulfillment Handling & Returns Hygiene QC:** Dispatch SLA timers + Fragile/Liquid/Cold-Chain badges on order cards, plus interactive Hygiene & Safety Seal QC checklist (`Restockable` vs `Write-Off`) inside `Returns & refunds`.
   - **Compliance Vault (`Compliance Vault`):** CDSCO/INCI/cruelty-free regulatory vault, HSN/GST schedule table, and downloadable GST/HSN CSV ledger export.

### Files changed
- `src/dashboards-suite.js` *(created)*: Modular `DEFAULT_DASHBOARD_OPS`, 18 UI renderers, RFC-4180 CSV exporter, and `handleDashboardOpsAction` / `handleDashboardOpsSubmit` state handlers.
- `src/app.js`: Wired `dashboards-suite.js` imports, extended `roleSections` and persisted `defaults`, integrated new sidebar nav items and tab renderers in `adminPage()` and `partnerPage()`, and connected early `ops-*` click/submit delegation.
- `styles.css`: Added `.ops-*` styles (status segmented toggle, SOS button, lifecycle stepper, chair calendar grid, shelf-life pills, hygiene QC card, portfolio grid) plus `@media (max-width:960px)`, `@media (max-width:640px)` (mobile header/grid overflow fixes), and `prefers-reduced-motion` support.

### Verification
- `node -c src/dashboards-suite.js` and `node -c src/app.js`: Clean JS syntax (exit code 0).
- `npm run build`: Clean Vite production bundle in `1.92s` (`dist/assets/index-DDHDNjtq.css` 165.65 kB, `dist/assets/index-BRgKxemi.js` 472.09 kB, 11 modules transformed, 0 errors).
- End-to-End Playwright Verification against `http://127.0.0.1:5173/`:
  - Verified Admin Overview (`3` Partner Salons), `FESTIVE25` coupon creation, dispute refund resolution, and `PAY-701` payout disbursement (`verify_4dash_admin.png`).
  - Verified Specialist `Online/On Break/Offline` toggle, `Emergency SOS` dispatch log, Travel Buffer settings, Portfolio, and Client CRM (`verify_4dash_pro.png`).
  - Verified Salon Chair Calendar status cycling, Front-Desk POS checkout (`Meera Test`), Backbar & Retail Stock, Client Formulas, and Staff Payroll (`verify_4dash_salon.png`).
  - Verified Seller Batch & Expiry FIFO health states (Green/Yellow/Red), Returns Hygiene QC (`RESTOCKED`), and Compliance Vault HSN table (`verify_4dash_seller.png`).
  - Verified `0` uncaught page errors and `0` horizontal overflow at both desktop (`1440 <= 1440`) and mobile (`375 <= 375`).


## Prompt Entry #19 — 2026-11-21 18:10 IST — Partner Salons Catalog Tab & Product Inventory Stock Telemetry in Admin Panel
**Objective:** Address user feedback regarding salon visibility ("why is only ivory room in the admin panel..why not these two") and product stock visibility ("wht abt how many products are available for an item..admin shd see all these things na"):
1. **Partner Salons Catalog in Admin Command Centre:**
   - Added dedicated **"Partner Salons"** (`salons`) navigation tab under `Catalog` in the Admin sidebar alongside `Service Catalog` and `Product Inventory`.
   - Populated with all 3 verified partner salons:
     1. **The Ivory Room** (`#l1`, Bandra West, Mumbai, 10:00 AM – 8:00 PM, Most Loved, From ₹800)
     2. **Atelier Beauty House** (`#l2`, Juhu, Mumbai, 9:30 AM – 8:30 PM, Popular, From ₹650)
     3. **Maison de Glow** (`#l3`, Khar West, Mumbai, 10:00 AM – 7:30 PM, New to GlamGo, From ₹900)
   - Built rich studio table displaying studio thumbnail, neighborhood area, operating hours, service disciplines (`Hair`, `Skin`, `Nails`, `Makeup`, `Spa`), specialist staff roster, base prices, ratings, and a direct "View Studio" action button.
   - Built top 4-card salon summary strip: Total Partner Studios (3), Specialist Roster count, Average Salon Rating (4.9 ★), and Coverage Zones (Bandra, Juhu, Khar).
   - Added instant search input (`#admin-salon-search`) and discipline filter pills (`ALL`, `Hair`, `Skin`, `Nails`, `Makeup`, `Spa`).
   - In Executive Overview (`tab === 'overview'`), updated Partner Salons counter in `admin-roster-strip` to reflect all 3 salons and navigate directly to the salons tab on click.
2. **User Governance Salon Owners Roster:**
   - In User Governance (`tab === 'users'`), ensured all 3 partner salon owners are registered and displayed under the `SALON_OWNER` filter:
     - The Ivory Room Owner (`salon@glamgo.com`, `salon_owner`)
     - Atelier Beauty House Owner (`atelier@glamgo.com`, `salon_owner`)
     - Maison de Glow Owner (`maison@glamgo.com`, `salon_owner`)
   - Updated backend database seeder (`backend/app/services/seed_service.py`) to seed `atelier@glamgo.com` and `maison@glamgo.com`, linking `owner_id` for salons `l2` and `l3`.
3. **Comprehensive Product Inventory Stock & Variant Telemetry:**
   - Upgraded Product Inventory (`tab === 'products'`) from a basic list (which previously lacked stock counts) to full warehouse stock telemetry:
   - **4-Card KPI Summary Strip:**
     - **Total SKUs**: 7 Active SKUs across all beauty retail categories.
     - **Stock on Hand**: Real-time count of total available units across warehouse inventory (684+ units).
     - **Inventory Asset Valuation**: Asset valuation in ₹ (`sum(price * stock)`).
     - **Stock Health**: Real-time counter of Healthy vs Low Stock (1–25 units) vs Out of Stock items.
   - **Stock Filter Pills & Live Search:**
     - Filters: `All Items`, `In Stock (>25)`, `Low Stock (1-25)`, and `Out of Stock`.
     - Live search input (`#admin-catalog-search`) filtering by brand, title, category, and tag.
   - **Enhanced Data Table Columns:**
     - Image thumbnail + Brand title + Product Name + SKU ID.
     - Category badge (`Skincare`, `Makeup`, `Haircare`, `Body Care`, `Fragrance`, `Beauty Tools`).
     - Unit Price & MRP strikethrough.
     - **Total Stock Available**: Large bold unit count + color-coded health badge (`In Stock`, `Low Stock (X left)`, or `Out of Stock`).
     - **Variant Inventory Breakdown**: Exact unit count chips per variant (e.g., `50 ml: 50 units · 30 ml: 48 units` for Serum; `Rosewood: 50 units · Soft Nude: 50 units · Deep Berry: 50 units` for Lipstick).
     - Status tag badge (`BESTSELLER`, `NEW`, `TRENDING`).
     - "View Item" action button opening product detail.

### Files changed
- `src/app.js`:
  - Added `DEFAULT_SALONS` (all 3 partner studios with hours, coordinates, staff, and pricing).
  - Added `DEFAULT_PRODUCTS` (all 7 skincare and beauty products with stock and `variant_stocks`).
  - Added `DEFAULT_ADMIN_USERS` (including all 3 salon owners: `salon@glamgo.com`, `atelier@glamgo.com`, `maison@glamgo.com`).
  - Added fallback defaults to `loadCatalogFeeds()`, `loadAdminData()`, and user governance.
  - Added `salons` tab to `TAB_META` and Catalog sidebar navigation.
  - Implemented `tab === 'salons'` view with summary KPIs, filter pills, search, and full partner studio table.
  - Upgraded `tab === 'products'` view with 4-card inventory KPIs, stock filter pills, available stock units with health badge, and variant inventory breakdown chips.
  - Added `'admin-salon-search'` to `adminSearchMap`, and handlers for `admin-salon-filter` and `admin-product-filter`.
- `styles.css`:
  - Added `.admin-stock-kpi-grid`, `.admin-stock-kpi`, and `.admin-stock-kpi-top` for 4-card metric strips.
  - Added `.admin-table-thumb`, `.admin-prod-brand`, `.admin-prod-sku`, and `.admin-stock-num`.
  - Added `.variant-stock-grid`, `.variant-stock-chip`, and `.variant-stock-chip.low-stock` for variant unit chips.
  - Added `.salon-staff-list`, `.salon-service-tags`, and `.admin-tag-chip` for partner salon listings.
- `backend/app/services/seed_service.py`:
  - Added `atelier@glamgo.com` and `maison@glamgo.com` to `users_to_seed`.
  - Linked `owner_id` for salons `l2` and `l3`.

### Verification
- `node -c src/app.js`: Clean JavaScript syntax verification (exit code 0).
- `npm run build`: Production bundle built cleanly in 2.09s (`dist/assets/index-BJnqfdgj.css` 159.58 kB, `dist/assets/index-CXBD8e5V.js` 414.89 kB).
- Playwright End-to-End Verification (`scripts/verify_admin.cjs`):
  - Overview: Verified Partner Salons counter displays **3** (`verify_admin_overview.png`).
  - Partner Salons Tab: Verified all 3 studios displayed with hours, staff, services, and pricing (`verify_admin_salons_tab.png`).
  - Product Inventory Tab: Verified 4 KPI cards (7 SKUs, 684 Units, ₹11,87,860 valuation, 7 Healthy), Available Stock units with "IN STOCK" badges, and variant breakdown chips (`verify_admin_products_stock.png`).
  - User Governance: Filtered by `SALON_OWNER` and verified all 3 salon owners present and active (`verify_admin_salon_owners.png`).


## Prompt Entry #18 — 2026-11-21 16:42 IST — Isolate Turnkey Platform & Trigger Clean Production Deployment
**Objective:** Maintain `main` on the core luxury editorial release (Prompt Entry #17) and branch out experimental turnkey platform features to dedicated branch `feat/turnkey-platform`:
1. **Branch Architecture:**
   - Isolated turnkey evaluation suite, persistent preview ribbon, and mock metrics to branch `feat/turnkey-platform`.
   - Maintained clean, production-ready core codebase on `main` branch.
2. **Production Deployment Trigger:**
   - Triggered fresh Vercel production deployment of `main` to ensure live production URL (`glamgo-ricoz.vercel.app`) serves the clean editorial experience with zero turnkey preview bar.

## Prompt Entry #17 — 2026-11-21 14:35 IST — Container Edge Alignment & Concierge Suite Redesign (/design-taste-frontend)
**Objective:** Address the user's feedback ("fix this its not alligned nicely and use some nice place for whatsapp and ai coverage") adhering to `tasteskill 2.5` (Rule 4: Equal left and right content edges; anti-slop luxury UI):
1. **Container Alignment & Equal Margins (`#ritual.package-section`):**
   - **Root Cause:** In the previous update, `.package-section .split-pair` was styled with `width: 100% !important;`, which overrode `.gg-wrap`'s max-width constraint and margin centering (`margin-inline: auto`). This caused the package container to span `width: 1440px` with `left: 0px` (touching the literal screen bezel), while every other section on the page (such as `.closing-cta`) had `left: 80px` and `width: 1280px`.
   - **Fix:** Restored strict container parity: `.package-section .split-pair` now adheres to `width: min(100% - 2 * var(--gut, 24px), 1280px) !important; max-width: 1280px !important; margin-inline: auto !important;`. The package section now aligns with mathematical precision with the footer closing section and the rest of the site (`left: 80px`, `width: 1280px`, `right: 1360px`).
   - Refined heading from `"The Complete Glow 150-minute session"` to `"The Complete Glow Ritual"` with natural 2-line Cormorant Garamond typography to eliminate the awkward hyphen break (`150-` / `minute`).
2. **Prestigious, High-End Placement for WhatsApp & AI Concierge:**
   - **Header Navigation:** Added a luxury `.concierge-header-btn` (`✦ Concierge`) directly inside `.header-actions` in the top navigation bar, giving the AI Concierge top-tier visibility and instant 1-click access across all views.
   - **Dedicated Page Suite:** Created a dedicated luxury editorial section, `.concierge-suite-section` (`#concierge`), right after the Signature Ritual and before the closing footer:
     - Includes Cormorant Garamond title *"Personal Advisory & Instant WhatsApp Booking"*, brand badges, and two prominent buttons: `[ ✦ Consult AI Concierge ]` and `[ Chat on WhatsApp ↗ ]`.
     - Completely integrated into the page grid (`width: 1280px`, `left: 80px`, `right: 1360px`).
   - **Horizontal Luxury Capsule (Floating Dock Replacement):** Replaced the clunky, vertically stacked 110px-tall pills with an ultra-sleek, compact 45px horizontal capsule island (`.concierge-capsule-island`) featuring unified AI Concierge consultation trigger, vertical divider, and direct WhatsApp launcher with zero footer overlap.

### Files changed
- `src/app.js`
  - Added `.concierge-header-btn` inside `.header-actions` in `header()`.
  - Added `AI Concierge & WhatsApp` shortcut in `mobile-menu`.
  - Updated `#ritual` heading to `"The Complete Glow Ritual"`.
  - Added `#concierge` editorial suite section right after `#ritual` on `homePage()`.
  - Upgraded `floatingConciergeDock()` into a streamlined horizontal capsule island with `.capsule-ai-trigger` and `.capsule-wa-trigger`.
- `styles.css`
  - Fixed `.package-section .split-pair` alignment to match `.gg-wrap` (1280px width, centered).
  - Added styles for `.concierge-header-btn`.
  - Added complete luxury card styles for `.concierge-suite-section`, `.concierge-suite-card`, and badges.
  - Added styles for `.concierge-capsule-island`.

### Verification
- `npm run build`: built cleanly in 4.47s (`dist/assets/index-BBENOUc-.css` 157.77 kB, `index-OTibHNi4.js` 401.54 kB).
- Playwright Desktop Telemetry (1440×900):
  - `packageWrap`: `x = 80px`, `width = 1280px`, `right = 1360px`
  - `conciergeCard`: `x = 80px`, `width = 1280px`, `right = 1360px`
  - `closing`: `x = 80px`, `width = 1280px`, `right = 1360px`
  - **Verdict:** All three containers match identically with 80px left and right margins (100% equal edges).
  - `dockBox`: `width = 294px`, `height = 45px` (down from 110px height stack), `ctaOverlap = false`.
  - Header concierge button opens AI drawer: `true`.
  - Concierge suite card button opens AI drawer: `true`.
- Visual Artifacts Generated:
  - `verify_aligned_package_and_concierge.png`

## Prompt Entry #16 — 2026-11-21 13:57 IST — Package Section Full-Width Grid & Closing CTA Dock Clearance Fix
**Objective:** Resolve the visual bugs captured in the desktop user screenshot at `https://glamgo-ricoz.vercel.app/#home`:
1. **Package Section Whitespace & Layout Fix (`#ritual.package-section`):**
   - **Root Cause:** `.package-section` had a legacy style rule `display: grid; grid-template-columns: 1fr 1fr;`. Because `<div class="gg-wrap split-pair">` was its sole direct child, the entire container was forced into column 1 (left 50% of the screen), leaving the entire right 50% (850px) completely blank and squeezing the package copy into 217px width, causing unnatural 4-line title wrapping ("Complete Glow 150- minute session").
   - **Fix:** Set `.package-section` to `display: block !important; width: 100%;`. The inner `.split-pair` grid now spans the full 1440px / 1920px width (`grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr)`), allowing the package copy to expand to 611px–825px with balanced 2-line typography and rendering a full-bleed 460px high editorial image across the right half with 0 empty space.
2. **Closing CTA Button Collision with Floating Concierge Dock:**
   - **Root Cause:** In `.footer.closing .closing-cta`, the `Book a service →` CTA button was positioned on the far right edge of the footer container, directly underneath the fixed `.floating-concierge-dock` (WhatsApp and AI Concierge launcher).
   - **Fix:** Added `padding-right: 220px !important;` to `.footer.closing .closing-cta` on desktop screens (`> 960px`). This shifts the CTA button cleanly to the left, guaranteeing over 75px–315px of clearance with zero overlap.

### Files changed
- `styles.css`
  - Replaced legacy `.package-section { display: grid; grid-template-columns: 1fr 1fr; }` with `display: block`.
  - Upgraded `.package-section .split-pair` full-width 2-column layout with 460px image height and 20ch heading max-width.
  - Added `padding-right: 220px !important;` on `.footer.closing .closing-cta` on screens `> 960px`.

### Verification
- `npm run build`: built cleanly in 2.43s (`dist/assets/index-C7QPw-Vx.css` 152.82 kB, `index-B68oK_kv.js` 399.98 kB).
- Playwright Desktop Verification (1440×900 & 1920×1080):
  - `1440×900`:
    - `secDisplay` = `"block"`
    - `wrapWidth` = `1440px` (full width, up from 518px)
    - `copyWidth` = `611.5px` (up from 217px, natural 2-line title)
    - `imgWidth` = `764.5px` (up from 228px, fills right half cleanly)
    - `clearance` = `75.8px`, `overlap` = `false`
  - `1920×1080`:
    - `wrapWidth` = `1920px`
    - `copyWidth` = `824.9px`
    - `imgWidth` = `1031.1px`
    - `clearance` = `315.8px`, `overlap` = `false`
- Visual Artifacts Generated:
  - `verify_package_and_footer_desktop.png`
  - `verify_package_1920.png`

## Prompt Entry #15 — 2026-11-21 13:40 IST — Mobile Phone Experience Polish (/design-taste-frontend)
**Objective:** Optimize the complete GlamGo customer and salon experience specifically for mobile phones (iPhone/Android, 390×844 down to 320px) complying with `/design-taste-frontend` (`tasteskill 2.5` anti-slop standard):
1. **Collision Elimination (Floating Dock vs Fixed Mobile Bottom Navigation):**
   - Elevated `.floating-concierge-dock` on screens `<= 700px` to `bottom: calc(68px + env(safe-area-inset-bottom, 0px))` so the WhatsApp and AI Concierge buttons float cleanly above the 58px fixed `.mobile-bottom` bar with 0 overlap.
   - Added `body { padding-bottom: calc(76px + env(safe-area-inset-bottom, 0px)) !important; }` to guarantee page content, footers, and primary buttons never hide behind the bottom bar.
2. **Compact Floating FABs on Mobile:**
   - Transformed `.floating-wa-btn` into a sleek 48×48px circular floating action button with pulsing green glow ring and centered icon, keeping screen area unobstructed.
   - Streamlined `.floating-ai-btn` into a compact 44px luxury pill with micro-badge.
3. **AI Concierge Drawer Mobile Bottom Sheet:**
   - Converted `.ai-chat-drawer` on `<= 600px` from a floating card into a native full-width mobile bottom sheet (`height: 86vh; border-radius: 24px 24px 0 0; box-shadow: 0 -16px 50px rgba(30, 28, 26, 0.4); z-index: 120;`) with safe-area inset padding on the input bar.
4. **Single-Column Luxury Editorial Service Cards:**
   - Switched `.card-grid` on screens `<= 600px` from cramped 2 columns to a single column (`grid-template-columns: 1fr; gap: 20px;`) with 200px editorial photography, 24px serif titles, clear price/duration pills, and full-width thumb-friendly booking buttons (`min-height: 46px;`).
5. **Horizontal Subnav Scrolling Without Wrapping:**
   - Fixed `.subnav-links` wrapping on mobile screens: all navigation links ("Home", "Categories", "Treatments", "Specialists", "How it works") now sit on a smooth single-line horizontally scrollable track (`overflow-x: auto; flex-wrap: nowrap !important; scrollbar-width: none;`).
6. **1-Tap Mobile Location Access & Native Bottom Sheet Modal:**
   - Added a `.mobile-loc-chip` button directly beside the brand wordmark in the mobile header for immediate location visibility and 1-tap modal opening.
   - Converted `.subnav-tag` into an interactive `.subnav-loc-btn` location button.
   - Styled the location modal on mobile as an anchored bottom sheet (`border-radius: 24px 24px 0 0; max-height: 88vh; padding: 24px 18px;`) with Leaflet map optimized to 175px height.
7. **Small Viewport (320px) Verification:**
   - Verified zero horizontal page scroll (`hasHScroll: false`) and min 44px tap targets across iPhone SE / 320px screens.

### Files changed
- `src/app.js`
  - Rendered `.mobile-loc-chip` button beside the wordmark in `header()` for 1-tap mobile location access.
  - Converted `.subnav-tag` into an interactive `.subnav-loc-btn` button when not in shop experience.
- `styles.css`
  - Replaced `.subnav-links { flex-wrap: wrap; }` with `flex-wrap: nowrap;` and added smooth touch scrolling.
  - Added mobile styles for `.mobile-loc-chip` and `.subnav-loc-btn`.
  - Elevated `.floating-concierge-dock` above `.mobile-bottom` bar on `<= 700px`.
  - Added safe-area padding to `body` on `<= 700px`.
  - Converted `.floating-wa-btn` to 48×48px circular FAB on `<= 600px`.
  - Implemented mobile bottom sheet styles for `.ai-chat-drawer` and `.modal`.
  - Converted `.card-grid` to single-column luxury layout on `<= 600px`.

### Verification
- `npm run build`: built cleanly in 2.04s (`dist/assets/index-BHQlBff6.css` 151.94 kB, `index-Cb3dShKK.js` 399.98 kB).
- Playwright Mobile Phone Audits (iPhone 14/15/16 390×844 & iPhone SE 320×600):
  - Collision Check: `navTop = 838px`, `dockBottom = 828px`, `overlap = false` (clean 10px clearance above bottom bar).
  - Subnav Wrapping: `tops = [59.5, 59.5, 59.5, 59.5, 59.5]`, `wraps = false` (all links on single horizontal row).
  - Card Grid Columns: `gridTemplateColumns = "354px"`, single column full-width editorial cards.
  - Mobile Location Chip: 1-tap click opens location bottom sheet modal (`modalVisible = true`).
  - AI Concierge Drawer: 1-tap click opens native 86vh bottom sheet (`drawerOpen = true`).
  - Small Phone (320px): `hasHScroll = false`, zero horizontal overflow.
- Visual Artifacts Generated:
  - `mobile_phone_390_home.png`
  - `mobile_phone_390_location_sheet.png`
  - `mobile_phone_390_ai_sheet.png`
  - `mobile_phone_320_home.png`

## Prompt Entry #14 — 2026-11-21 13:08 IST — Client Feedback: Editorial Polish, AI Concierge, WhatsApp & Admin Panel Refinements
**Objective:** Implement client feedback from Meghana across the front page, concierge communication, and Admin Command Centre, and synchronize localhost (`127.0.0.1:5173`) and Vercel production:
1. **Space Elimination After Package:** Removed bottom padding and margins on `#ritual.package-section` and tightened `.footer.closing .closing-cta` to remove awkward whitespace.
2. **GlamGo Brand Highlight:** Highlighted GLAMGO wordmark and hero badge with luxury champagne gold accent (`.brand-gold` and `.hero-brand-pill`).
3. **Services on Front Page with Pictures:** Added high-definition Unsplash photography to all 8 core services with full-bleed media cards, category pills, descriptions, and direct booking buttons.
4. **Upgraded 'How It Works':** Enhanced the 4-step process with interactive step pills, guarantee overlays, safety standards, and instant booking shortcuts.
5. **AI Chatbot & WhatsApp Floating Dock:** Added a floating customer concierge launcher dock featuring a pulsing WhatsApp direct button and an interactive GlamGo AI Beauty Concierge drawer with consultation suggestions and direct booking flows.
6. **Admin Panel Refinements:**
   - Replaced text 'Exit to Store' / 'Back to GlamGo' with an icon-only button (`.admin-exit-icon-btn`) and tooltip.
   - Prominently highlighted 'GlamGo Partner Studio' (`.admin-partner-highlight-card`) with champagne gradient, badge, and arrow.
   - Fixed number font styling: strictly applied modern sans-serif lining figures (`Manrope`, tabular-nums) to all KPI metrics, GMV amounts, percentages, and table counters, while preserving luxury `Cormorant Garamond` serif headings.
7. **Location Modal Map Sync:** Ensured Leaflet OpenStreetMap interactive pin picker and free location autocomplete render tiles immediately on localhost and production.

### Files changed
- `src/app.js`
  - Added SVG icons for WhatsApp, sparkle, bot, and send.
  - Added `brandWordmark(isLight)` helper and applied across header, footer, and onboarding.
  - Injected `DEFAULT_SERVICES` and `DEFAULT_PROFESSIONALS` fallbacks to ensure rich media cards render immediately.
  - Upgraded `homeCard()` with photography, category pills, and book action.
  - Enhanced `homePage()`: added Hero brand pill, interactive 'How It Works' tabs, and tightened package section.
  - Added `floatingConciergeDock()` and `aiChatDrawer()` with consultation logic answering skin, hair, nails, bridal, massage, waxing, and WhatsApp handover.
  - Upgraded `adminPage()` sidebar: icon-only exit button and highlighted Partner Studio hub card.
  - Added `map.invalidateSize()` in `mountSalonMaps()` for instant Leaflet tile layout.
- `styles.css`
  - Zeroed padding and margin for `#ritual.package-section` and tightened `.footer.closing`.
  - Added `.wordmark`, `.wordmark-text`, `.brand-gold`, and `.hero-brand-pill` styles.
  - Styled `.service-card`, `.service-card-media`, `.service-cat-pill`, and `.service-book-btn`.
  - Styled `.floating-concierge-dock`, `.floating-wa-btn`, `.floating-ai-btn`, and complete `.ai-chat-drawer`.
  - Styled `.admin-partner-highlight-card` and `.admin-exit-icon-btn`.
  - Refined typography in `.admin-shell`: forced `Manrope` tabular lining figures on all numbers and metrics while preserving `Cormorant Garamond` on headings (`h1`, `h2`, `h3`, `.admin-brand-word`).

### Verification
- `npm run build`: passed cleanly in 2.62s (`dist/assets/index-BCe_zZ2c.css` 147.62 kB, `index-BrS9H8Ts.js` 399.63 kB).
- Playwright Headless Browser Verification:
  - Admin Panel (`#admin`):
    - `h1Font` = `"Cormorant Garamond", Georgia, serif`
    - `h2Font` = `"Cormorant Garamond", Georgia, serif`
    - `kpiFont` = `Manrope, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
    - `hasExitIcon` = `true` (icon-only home button, title: "Back to GlamGo Store", no text)
    - `hasPartnerCard` = `true` (text: "PARTNER HUB GlamGo Partner Studio ↗")
  - Location Modal (`#salons`):
    - Interactive Leaflet map container mounted with tiles rendered, pin set to Bandra West, Mumbai, and live autocomplete functional.
  - Home Page (`/`):
    - 8 service cards with photography rendered.
    - Floating concierge dock visible with pulsing WhatsApp button and AI Concierge button.
    - AI Chat drawer opened and interactive.

## Prompt Entry #13 — 2026-11-21 10:28 IST — Free Live Location Search Autocomplete
**Objective:** Add free real-time location search autocomplete inside the **Where should we find you?** modal so typing any area, road, or city suggests live place names and moves the map pin on selection.

### Files changed
- `src/app.js`
  - Added `searchLocationSuggestions(query)` querying free OpenStreetMap Photon geocoding (`photon.komoot.io/api` with location bias and Nominatim fallback).
  - Tracked `activeLocationMap` / `activeLocationMarker` across `mountSalonMaps()` and `destroyActiveMaps()`.
  - Upgraded the Location modal input to `#location-search-input` + live `#location-autocomplete-list` dropdown (`.gg-loc-dropdown`), debounced at `260ms` on input without destroying the active Leaflet map.
  - Added `location-pick` click action to select a suggested place, fill the input, save `state.userCoords`, and immediately pan + move the map marker.
- `styles.css`
  - Styled `.gg-loc-field`, `.gg-loc-dropdown`, `.gg-loc-option`, and `.gg-loc-status`.

### Verification
- `npm run build` ? passed (vite 7.3.7, `dist/assets/index-Crv_vPGS.js` + `index-D9mrywzU.css`).
- Playwright verification on `http://127.0.0.1:5173/#salons` ? Location modal:
  - Typed `Indiranagar` ? rendered 5 live Indian location suggestions inside `.gg-loc-dropdown`.
  - Clicked first suggestion ? filled `Indira Nagar, F/N Ward, Mumbai City District, Maharashtra, India`, moved map marker, hid dropdown.
  - `0` console errors, `0` page errors, `desktopNoOverflow: true`, `mobileNoOverflow: true`; visually inspected screenshot.
## Prompt Entry #12 — 2026-11-21 10:14 IST — Allow Browser Geolocation on Vercel Production
**Objective:** Fix `Use my location` auto-denying geolocation on Vercel (`glamgo-ricoz.vercel.app`) caused by a restrictive `Permissions-Policy` header.

### Files changed
- `vercel.json`
  - Updated `Permissions-Policy` header from `camera=(), microphone=(), geolocation=()` to `camera=(), microphone=(), geolocation=(self)` so same-origin browser location prompts work on Vercel.
- `src/app.js`
  - Passed explicit geolocation options (`enableHighAccuracy: true, timeout: 10000, maximumAge: 60000`) and clearer error messaging when blocked in browser settings vs GPS timeout.

### Verification
- `npm run build` ? passed (vite 7.3.7).
- Playwright geolocation verification on `http://127.0.0.1:5173/#salons` with granted coordinates (19.0607, 72.8362): clicking **Use my location** updated input to `Khar, Mumbai` and displayed `Pinned your current location on the map.`.
## Prompt Entry #11 — 2026-11-21 10:09 IST — Interactive Location Picker Map Moved Into Location Modal
**Objective:** Remove the map from the Salons Directory listing page (`#salons`) and move the interactive Leaflet + OpenStreetMap picker inside the **Where should we find you?** location modal (while keeping the interactive map on individual Salon Detail pages).

### Files changed
- `src/app.js`
  - Removed `.salon-map-card` / `#salon-directory-map` from `salonPage()` and removed directory map mounting from `mountSalonMaps()`.
  - Added `#location-picker-map` and a **Use my location** geolocation button inside `state.modal === 'location'` ("Where should we find you?").
  - Added `reverseGeocodeCoords(lat, lng)` using Nominatim so clicking anywhere on `#location-picker-map` (or using current GPS location) moves the marker and auto-fills `Enter area or city` in `#location-form` (e.g., `Bandra East, Mumbai`).
  - Kept `#salon-detail-map` interactive on individual Salon Detail views.
- `styles.css`
  - Added `.gg-location-map-bar`, `.gg-map-modal`, and `.gg-locate-btn` styles with warm neutral OSM tile tinting.

### Verification
- `npm run build` ? passed (vite 7.3.7, `dist/assets/index-1Ujv6Smw.js` + `index-C89aLsks.css`).
- Playwright verification on `http://127.0.0.1:5173/#salons` & Location modal:
  - Confirmed `hasDirMap: 0` (removed from `#salons` directory).
  - Opened **Where should we find you?** modal: `#location-picker-map` mounted cleanly with `6/6` loaded OpenStreetMap tiles.
  - Clicked inside the map canvas: `Enter area or city` auto-updated from `Bandra West, Mumbai` to `Bandra East, Mumbai`.
  - `0` console errors, `0` page errors, `noOverflowDesktop: true`, `noOverflowMobile: true`; visually inspected desktop & mobile screenshots.
## Prompt Entry #10 — 2026-11-21 10:03 IST — Real Interactive Salon Maps (Leaflet + OpenStreetMap)
**Objective:** Replace static location placeholders with real interactive Leaflet + OpenStreetMap maps across the Salons Directory and Salon Detail views, verify interactively at desktop & mobile sizes, update `CHANGEREPORT.md`, and push to `origin/main`.

### Files changed
- `package.json`, `package-lock.json`
  - Added `leaflet` dependency (
pm install leaflet).
- `src/app.js`
  - Imported `leaflet` and `leaflet/dist/leaflet.css`.
  - Added `resolveSalonCoords()`, `destroyActiveMaps()`, and `mountSalonMaps()` hooked into `render()` to render interactive keyless OpenStreetMap layers without zoom-cleanup race errors.
  - Added the interactive **Partner salons on the map** card (`#salon-directory-map`) in `salonPage()` with clickable espresso price pins (`?800`, `?650`, `?900`), interactive studio popups with **View salon ->** buttons, auto-fit bounds, and a **Use my location** geolocation action (`map-locate`).
  - Replaced `.map-placeholder` in `salonDetail()` with an interactive **#salon-detail-map** card pinned to the salon plus a **Get Directions** external Google Maps link.
- `styles.css`
  - Added styles for `.salon-map-card`, `.salon-map-head`, `.gg-map-canvas`, `.gg-map-detail`, `.gg-map-pin`, `.gg-map-popup`, and warm editorial OpenStreetMap tile tinting.

### Verification
- `npm run build` ? passed (vite 7.3.7, `dist/assets/index-DhrBx7Ta.js` + `index-BxEblzXP.css`).
- Playwright check (`verify_salon_maps.mjs`) on `http://127.0.0.1:5173/#salons` and Salon Detail:
  - `dirMapInfo`: `mounted: true`, `pinCount: 3` (`?800`, `?650`, `?900`), `12/12` map tiles loaded, clicking marker opened popup (`The Ivory Room`), clicking `View salon ->` navigated cleanly to Salon Detail.
  - `detailMapInfo`: `mounted: true`, `6/6` tiles loaded, `hasDirectionsLink: true`, `popupOpen: true`.
  - `0` console errors, `0` page errors, `0` failed requests, `scrollWidth <= innerWidth` at both `1440px` and `390px`. Visually inspected rendered map screenshots.
## Prompt Entry #9 — 2026-11-21 09:47 IST — Full-Site UI/UX Audit Remediation (ui-ux-pro-max)
**Objective:** Resolve all 4 findings from the full-site Playwright + ui-ux-pro-max UI/UX audit across consumer storefront, Partner Portal, and Admin Command Centre, verify on desktop & mobile, and push to origin/main.

### Files changed
- `src/app.js`
  - Removed the duplicate secondary role switcher bar (`<nav class="subnav">`) inside `header()` when `state.view === 'partner'` so Partner Portal uses a single unified `Specialist | Salon | Seller` sidebar switcher.
  - Standardized 'Professional' display label in `auth()` to 'Specialist' to match Partner Portal headings.
- `styles.css`
  - Raised storefront action & navigation touch targets (`.card-bottom button`, `.pro-book`, `.salon-bar button`, `.subnav-links button` = 36px; `.mobile-menu-button`, `.icon-button` = 40×40px; mobile `<= 960px` Admin/Partner nav items = 38px).
  - Enforced an `11px` minimum readable floor on micro-labels (`.eyebrow`, `.subnav-tag`, `.hero-proof`, `.card-body small`, `.product-brand`, `.product-old`, `.cat-count`, `.footer-bottom`, `.mobile-bar span`, `.badge`).
  - Applied `var(--sans)` (Manrope) with `tabular-nums` consistently to `.product-price`, `.product-bottom strong`, `.card-bottom strong`, `.package-price`, `.step > span`, `.chapter-btn > span`, and `.shelf-count strong`.

### Verification
- `npm run build` ? passed (vite 7.3.7, `dist/assets/index-DuYc9Y1J.js` + `index-C5yzVScA.css`).
- Full-site Playwright audit across Desktop (`1440px`) and Mobile (`390px`) routes (`Onboarding`, `Home`, `Salons`, `Shop`, `Partner`, `Admin`):
  - `0` horizontal overflow, `0` broken images, `0` missing `alt`, `0` console/page/HTTP errors.
  - Partner Portal confirmed `hasSubnav: false` (no duplicate switcher).
  - Mobile Admin small touch targets reduced from `10` ? `0`; Mobile Partner `30` ? `11`; Mobile Home `38` ? `20`; Desktop Home `23` ? `11`; Shop tiny text nodes cut `18` ? `9`.
## Prompt Entry #8 — 2026-11-21 09:34 IST — Dashboard & Analytics Numerals in Clean Sans-Serif
**Objective:** Replace old-style serif KPI/metric numerals across Admin Command Centre & Partner Portal with crisp standard sans-serif numerals (Manrope, 	abular-nums), update CHANGEREPORT.md, and push to origin/main.

### Files changed
- `styles.css`
  - Changed `.admin-kpi-card strong`, `.admin-vertical-card strong`, `.analytics-summary strong`, and `.admin-num` to use `var(--sans)` (Manrope) bold tabular numerals instead of `Cormorant Garamond` old-style figures.

### Verification
- `npm run build` ? passed (vite 7.3.7).
- Playwright verification on `http://127.0.0.1:5173/#admin` confirmed clean rendering with `0` console errors, `0` page errors, and `0` failed requests; visually inspected rendered Admin overview screenshot.
## Prompt Entry #7 — 2026-11-21 09:30 IST — Treatment Category Photos & Main Branch Sync
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
## Prompt Entry #6 — 2026-11-21 09:22 IST — Partner Portal Multi-Role Redesign (Salon Owner, Product Seller, Specialist)
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
## Prompt Entry #5 — 2026-11-21 03:58 IST — Admin Panel Redesign
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
2. Upgrade GlamGo's customer landing experience (`onboarding`, `home`, `salon`, `shop`) using editorial layout discipline, viewport-filling split heroes, interactive `#how` step chapters, responsive breakpoint fixes (`320pxâ€“1440px`), and crisp non-slop copy while preserving all commerce, variant, partner, and admin workflows.

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
