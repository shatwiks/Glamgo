# Graph Report - Glamgo 4  (2026-11-21)

## Corpus Check
- 190 files · ~180,587 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: (none) 6, .example 2, .ini 2)

## Summary
- 1783 nodes · 4439 edges · 144 communities (97 shown, 47 thin omitted)
- Extraction: 84% EXTRACTED · 16% INFERRED · 0% AMBIGUOUS · INFERRED: 699 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Admin Role & Governance
- Admin Role & Governance
- Client API Layer
- Multi-Vendor Commerce & Escrow
- Frontend SPA UI Components
- Multi-Vendor Commerce & Escrow
- Admin Role & Governance
- Razorpay Payments & Settlement
- Docker & Local Containers
- Multi-Vendor Commerce & Escrow
- GitHub CI/CD Automation Workflows
- Razorpay Payments & Settlement
- Automated Refund & Idempotency
- Admin Role & Governance
- Multi-Vendor Commerce & Escrow
- Frontend SPA UI Components
- FastAPI Authentication Dependencies
- Multi-Vendor Commerce & Escrow
- Admin Executive Dashboard Metrics
- Frontend Maps & Location Picker
- User Profile & Address API
- Services Catalog API
- Health Checks & Redis Cache
- Razorpay Payments & Settlement
- Health Checks & Redis Cache
- Razorpay Payments & Settlement
- Render Cloud Infrastructure
- Client API Layer
- Canonical Inventory CLI Backfill
- Multi-Vendor Commerce & Escrow
- Phase 4 Partner Ecosyste
- Salon Card: Atelier Beau
- User Identity & Authentication API
- Env
- Dashboards.Yml
- Multi-Vendor Commerce & Escrow
- Railway.Json
- Logging Config
- Razorpay Payments & Settlement
- Docker & Local Containers
- Docker & Local Containers
- Razorpay Payments & Settlement
- Razorpay Payments & Settlement
- Phase 1 Critical Gap: Ad
- Products
- Docker & Local Containers
- Deploy
- Docker & Local Containers
- Phase 6 Deployment Archi
- Before Vs. After Product
- Database Migrations & Alembic
- Top Announcement Bar
- 01 / At-Home Beauty Expe
- Category Sub-Navigation 
- Multi-Vendor Commerce & Escrow
- Docker & Local Containers
- Docker & Local Containers
- Docker & Local Containers
- Docker & Local Containers
- Docker & Local Containers
- Health Checks & Redis Cache
- Docker & Local Containers
- Appointment Lifecycle St
- Booking Modal Screen (Bo
- Editorial Luxury Visual 
- Client
- Create Salon
- Correlationidmiddleware
- Health Checks & Redis Cache
- Healthcheck
- Healthcheck
- Multi-Vendor Commerce & Escrow
- Razorpay Payments & Settlement
- Glamgo Shop Page (The Be
- Vercel.Json
- Metrics
- Razorpay Payments & Settlement
- Partner Onboarding & Kyc
- Razorpay Payments & Settlement
- Salon Editorial Storefro
- Shop Editorial Image (Sh
- Automated Refund & Idempotency
- Get Professional
- Field Validator
- Multi-Vendor Commerce & Escrow
- Multi-Vendor Commerce & Escrow
- Seller Suborder Queue & 
- Platform Audit & Activity Trail
- Database Migrations & Alembic
- Database Migrations & Alembic
- Health Checks & Redis Cache
- Fragrance Category Edito
- Minimalist Amber Glass B
- Lipstick Product Image (
- Moisturiser Product Phot
- Amber Glass Serum Droppe
- Build
- Build
- Frontend NPM Build Tooling
- Admin Role & Governance
- Post /Api/V1/Orders/Rese
- Visual Subject: Five Gra
- Visual Subject: Smiling 
- Admin Command Centre Das
- Canonical Variant Invent
- Admin Executive Dashboard Metrics
- Health Checks & Redis Cache
- Health Checks & Redis Cache
- Cold-Standby Restoration
- Multi-Vendor Commerce & Escrow
- Phase 6 Pre-Launch Audit
- Entrypoint.Sh
- Tri-Engine Commercial Ec
- Commerce Hardening & Pro
- Database Migrations & Alembic
- Architectural God Nodes 
- Reverse Logistics & Item
- X-Request-Id Structured 
- Health Checks & Redis Cache
- Backend Integration Test Suite
- Planning Comprehensive V
- Deploy.Sh Script
- Database Migrations & Alembic
- Fastapi Web Application 
- Backend Python Minimum D
- Health Checks & Redis Cache
- Glamgo Change Report Led
- Ai Concierge & Whatsapp 
- Interactive Openstreetma
- Feature Gap Analysis & M
- Phase 5 Multi-Vendor Api
- Phase 5 Database Design 
- Sec-Crit-01 Hardcoded Se
- Sec-04 Cryptographic Ids
- Graphify Memory: Header,

## God Nodes (most connected - your core abstractions)
1. `User` - 103 edges
2. `CommerceService` - 102 edges
3. `apiRequest()` - 79 edges
4. `UserRole` - 78 edges
5. `action()` - 50 edges
6. `Order` - 43 edges
7. `Product` - 40 edges
8. `render()` - 36 edges
9. `RefundService` - 35 edges
10. `icon()` - 35 edges

## Surprising Connections (you probably didn't know these)
- `Root Comprehensive Verification Report (2026-11-10)` --semantically_similar_to--> `Planning Comprehensive Verification Report (2026-11-10)`  [INFERRED] [semantically similar]
  VERIFICATION.md → .planning/VERIFICATION.md
- `test_exactly_once_refund_accounting_interleaving_concurrency_and_validation()` --indirect_call--> `get_db()`  [INFERRED]
  tests/test_commerce_review_remediation.py → backend/app/core/database.py
- `test_oos_payment_verify_accuracy_durable_recovery_and_concurrent_callbacks()` --indirect_call--> `get_db()`  [INFERRED]
  tests/test_commerce_review_remediation.py → backend/app/core/database.py
- `test_admin_audit_logs_immutability_trigger()` --uses--> `AdminAuditLog`  [INFERRED]
  tests/test_admin_phase2.py → backend/app/models/admin.py
- `test_payment_order_requires_target_and_ignores_tampered_amount()` --uses--> `Product`  [INFERRED]
  tests/test_payments.py → backend/app/models/catalog.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Milestone v2.0 Live Operations Phases** — planning_project_phase_8_real_time_event_bus, planning_project_phase_9_doorstep_workflow, planning_project_phase_10_salon_chair_engine, planning_project_phase_11_split_fulfillment, planning_project_phase_12_escrow_settlement [EXTRACTED 1.00]
- **Phase 8 Real-Time Event Dispatch Pipeline** — planning_phases_08_real_time_event_bus_websocket_dispatch_gateway_08_01_plan_event_bus, planning_phases_08_real_time_event_bus_websocket_dispatch_gateway_08_01_plan_notifications_gateway, planning_phases_08_real_time_event_bus_websocket_dispatch_gateway_08_01_plan_dispatch_service [EXTRACTED 1.00]
- **GlamGo Transactional Concurrency & Financial Integrity Pillars** — docs_implementation_architecture_overview_booking_row_locking, docs_implementation_database_audit_inventory_row_locking, docs_implementation_phase_3_architecture_financial_calculation_authority, docs_implementation_architecture_overview_razorpay_hmac_verification [INFERRED 0.95]
- **Phase 2 Administrator Command Centre & Governance System** — docs_implementation_phase_2_admin_implementation_plan_admin_route_decoupling, docs_implementation_phase_2_admin_implementation_plan_admin_audit_logs_migration, docs_implementation_phase_2_admin_implementation_plan_log_admin_action, docs_implementation_phase_2_prd_partner_moderation_workflow [INFERRED 0.95]
- **Phase 4 Multi-Tenant Partner Operations & Financial Accounting** — docs_implementation_phase_4_api_changes_professional_ops_endpoints, docs_implementation_phase_4_api_changes_salon_ops_endpoints, docs_implementation_phase_4_api_changes_seller_ops_endpoints, docs_implementation_phase_4_architecture_multi_tenant_ownership_matrix, docs_implementation_phase_4_architecture_commission_engine [INFERRED 0.95]
- **Phase 5 Multi-Vendor Checkout, Locking & Escrow Flow** — docs_implementation_phase_5_api_changes_reserve_endpoint, docs_implementation_phase_5_api_changes_split_checkout_endpoint, docs_implementation_phase_5_database_design_inventory_reservations, docs_implementation_phase_5_database_design_suborders, docs_implementation_phase_5_database_design_seller_escrow_records [EXTRACTED 1.00]
- **Phase 6 Production Launch Readiness Architecture** — docs_implementation_phase_6_prd_launch_readiness_prd, docs_implementation_phase_6_deployment_architecture_spec, docs_implementation_phase_6_disaster_recovery_plan, docs_implementation_phase_6_monitoring_plan_spec, docs_implementation_phase_6_payment_readiness_runbook, docs_implementation_phase_6_performance_plan_spec, docs_implementation_phase_6_security_plan_spec [EXTRACTED 1.00]
- **GlamGo Concurrency & Security Verification Baseline** — docs_implementation_security_findings_sec_02_hmac_bypass, docs_implementation_security_findings_sec_03_booking_race, docs_implementation_testing_baseline_pytest_12_suite, docs_implementation_phase_5_test_plan_concurrency_test [INFERRED 0.85]
- **Phase 6 Production Launch Sign-Off & Runbook Suite** — docs_reports_final_production_go_no_go_go_no_go_final, docs_reports_phase_6_final_report_report, docs_reports_production_security_signoff_security_signoff_01, docs_reports_production_performance_report_perf_report_01, docs_reports_production_payment_verification_payment_verify_01, docs_reports_disaster_recovery_runbook_runbook_dr_01, docs_reports_production_deployment_runbook_runbook_deploy_01 [INFERRED 0.95]
- **Phase 2.1 Independent Audit & Hardening Cycle** — docs_reports_phase_2_1_final_report_report, docs_reports_phase_2_1_full_report_report, docs_reports_phase_2_1_security_audit_report, docs_reports_phase_2_1_database_audit_report, docs_reports_phase_2_1_financial_validation_report, docs_reports_phase_2_1_browser_regression_report [EXTRACTED 1.00]
- **GlamGo Alembic Schema Evolution Chain (542add54006c -> 0395cd015fed)** — docs_reports_phase_2_1_database_audit_migration_542add54006c, docs_reports_phase_2_1_final_report_migration_0194ac893adb, docs_reports_phase_5_final_report_migration_0294bc904efc, docs_reports_phase_6_final_report_migration_0395cd015fed [INFERRED 0.95]
- **GlamGo Three Experience Verticals** — docs_media_glamgo_tour_experience_gateway_screen, docs_media_glamgo_tour_at_home_beauty_screen, docs_media_glamgo_tour_salon_discovery_screen, docs_media_glamgo_tour_beauty_shelf_store_screen [EXTRACTED 1.00]
- **Consumer Booking and Checkout Flow** — docs_media_glamgo_tour_at_home_beauty_screen, docs_media_glamgo_tour_at_home_booking_modal, docs_media_glamgo_tour_beauty_shelf_store_screen, docs_media_glamgo_tour_product_detail_screen, docs_media_glamgo_tour_razorpay_checkout_modal [INFERRED 0.85]
- **Multi-Role Partner and Admin Governance** — docs_media_glamgo_tour_partner_studio_dashboard, docs_media_glamgo_tour_admin_command_centre, docs_media_glamgo_tour_shared_navigation_chrome [EXTRACTED 1.00]
- **GlamGo Three Experiences & Portals** — docs_media_hero_banner_pill_beauty_ecommerce, docs_media_hero_banner_pill_athome_specialists, docs_media_hero_banner_pill_salon_reservations, docs_media_hero_banner_pill_partner_admin_portals [EXTRACTED 1.00]
- **Production Speed, Scale & Security Proof Points** — docs_media_hero_banner_metric_live_deployment, docs_media_hero_banner_metric_catalog_apis, docs_media_hero_banner_metric_page_render, docs_media_hero_banner_metric_pytest_checks, docs_media_hero_banner_metric_payment_security [EXTRACTED 1.00]
- **Four Live Render API Endpoints Benchmarked Before and After Optimization** — docs_media_perf_chart_endpoint_products, docs_media_perf_chart_endpoint_salons, docs_media_perf_chart_endpoint_professionals, docs_media_perf_chart_endpoint_services [EXTRACTED 1.00]
- **GlamGo Three-Vertical Marketplace Revenue Breakdown** — docs_media_screen_admin_vertical_at_home_services, docs_media_screen_admin_vertical_salon_appointments, docs_media_screen_admin_vertical_beauty_ecommerce, docs_media_screen_admin_kpi_total_gmv [INFERRED 0.95]
- **Platform Governance Admin Navigation Suite** — docs_media_screen_admin_nav_executive_overview, docs_media_screen_admin_nav_partner_moderation, docs_media_screen_admin_nav_user_governance, docs_media_screen_admin_nav_global_bookings, docs_media_screen_admin_nav_global_orders, docs_media_screen_admin_nav_service_catalog, docs_media_screen_admin_nav_product_inventory, docs_media_screen_admin_nav_audit_trail [EXTRACTED 1.00]
- **Booking Step 4 Confirmation Flow** — docs_media_screen_booking_four_step_progress_stepper, docs_media_screen_booking_booking_review_summary, docs_media_screen_booking_deferred_payment_notice, docs_media_screen_booking_modal_action_bar [EXTRACTED 1.00]
- **Mobile Salon Discovery and Booking Flow** — docs_media_screen_mobile_subnav_tabs, docs_media_screen_mobile_editorial_hero, docs_media_screen_mobile_booking_search_widget, docs_media_screen_mobile_mobile_landing_screen [EXTRACTED 1.00]
- **GlamGo Three-Pillar Onboarding Gateway** — docs_media_screen_onboarding_three_column_card_grid, docs_media_screen_onboarding_card_at_home_beauty, docs_media_screen_onboarding_card_salon_parlour, docs_media_screen_onboarding_card_beauty_shopping [EXTRACTED 1.00]
- **Professional Dashboard Overview Workspace** — docs_media_screen_partner_role_persona_switcher, docs_media_screen_partner_professional_sidebar_nav, docs_media_screen_partner_kpi_metrics_strip, docs_media_screen_partner_operations_command_grid [EXTRACTED 1.00]
- **PDP Purchase & Conversion Funnel** — docs_media_screen_pdp_editorial_product_identity, docs_media_screen_pdp_pricing_and_promo_card, docs_media_screen_pdp_variant_and_purchase_controls [INFERRED 0.85]
- **GlamGo Embedded Razorpay Checkout Flow** — docs_media_screen_razorpay_razorpay_loading_modal, docs_media_screen_razorpay_test_mode_ribbon, docs_media_screen_razorpay_payment_method_selector, docs_media_screen_razorpay_checkout_background_layout [EXTRACTED 1.00]
- **Salon Discovery Browse, Filter, and Sort Interface** — docs_media_screen_salons_category_filter_bar, docs_media_screen_salons_sort_dropdown, docs_media_screen_salons_three_column_card_grid [EXTRACTED 1.00]
- **Curated Mumbai Salon Card Showcase** — docs_media_screen_salons_card_the_ivory_room, docs_media_screen_salons_card_atelier_beauty_house, docs_media_screen_salons_card_maison_de_glow [EXTRACTED 1.00]
- **GlamGo Catalog Discovery and Conversion Layout** — docs_media_screen_shop_category_navigation_strip, docs_media_screen_shop_multifaceted_filter_toolbar, docs_media_screen_shop_four_column_product_grid, docs_media_screen_shop_product_card_anatomy [EXTRACTED 1.00]
- **Warm Minimalist Apothecary Hair Oil Product Presentation** — public_assets_hair_oil_amber_glass_bottle, public_assets_hair_oil_hair_strand_accent, public_assets_hair_oil_travertine_linen_styling, public_assets_hair_oil_storefront_product_card [INFERRED 0.85]
- **Luxury Lipstick Storefront Visual Composition** — public_assets_lipstick_visual_subject, public_assets_lipstick_styling, public_assets_lipstick_storefront_role, public_assets_lipstick_purpose [INFERRED 0.85]
- **Editorial Skincare Moisturiser Product Showcase** — public_assets_moisturiser_visual_subject, public_assets_moisturiser_styling, public_assets_moisturiser_storefront_role, public_assets_moisturiser_purpose [INFERRED 0.85]
- **Editorial Luxury Salon Interior Composition** — public_assets_salon_editorial_styling_stations, public_assets_salon_editorial_lounge_area, public_assets_salon_editorial_shampoo_sanctuary, public_assets_salon_editorial_warm_minimalist_styling [EXTRACTED 1.00]
- **Serum Storefront Editorial Visual** — public_assets_serum_asset, public_assets_serum_amber_dropper_bottle, public_assets_serum_warm_editorial_styling, public_assets_serum_storefront_product_showcase [INFERRED 0.85]
- **Curated Skincare and Color Cosmetics Editorial Display** — public_assets_shop_editorial_skincare_lineup, public_assets_shop_editorial_color_cosmetics, public_assets_shop_editorial_natural_styling [EXTRACTED 1.00]
- **Commerce Hardening & Escrow Settlement Architecture** — docs_commerce_hardening_and_release_checklist_refund_service, docs_commerce_hardening_and_release_checklist_irreversibility_boundaries, product_t7_escrow_settlement, changereport_durable_refund_ledger [INFERRED 0.85]
- **Turnkey Multi-Role Marketplace Ecosystem** — changereport_turnkey_platform, changereport_tri_engine_ecosystem, product_glamgo_platform, product_user_roles [INFERRED 0.85]

## Communities (144 total, 47 thin omitted)

### Community 0 - "Admin Role & Governance"
Cohesion: 0.06
Nodes (96): RoleChecker, approve_partner_draft(), get_admin_stats(), create_booking(), get_booking(), get_my_bookings(), update_booking_status(), add_salon_staff() (+88 more)

### Community 1 - "Admin Role & Governance"
Cohesion: 0.03
Nodes (74): apiReserveInventory(), tokenStorage, activeLeafletMaps, addedCartTimers, addTileLayerWithFallback(), app, applyPostAuthNavigation(), AREA_COORDS (+66 more)

### Community 2 - "Client API Layer"
Cohesion: 0.07
Nodes (74): API_BASE, apiAddAddress(), apiAddSalonStaff(), apiAddSellerVariant(), apiApplyForPartner(), apiApprovePartnerDraft(), apiAssignProfessionalService(), apiCreateBooking() (+66 more)

### Community 3 - "Multi-Vendor Commerce & Escrow"
Cohesion: 0.08
Nodes (31): update_seller_order_status(), EscrowStatus, InventoryReservation, RefundAccountingEntry, ReservationStatus, ReturnRequest, ReturnStatus, SellerEscrowRecord (+23 more)

### Community 4 - "Frontend SPA UI Components"
Cohesion: 0.15
Nodes (55): account(), adminPage(), aiChatDrawer(), auth(), bookingModal(), bookingSuccess(), brandWordmark(), button() (+47 more)

### Community 5 - "Multi-Vendor Commerce & Escrow"
Cohesion: 0.09
Nodes (11): catalog_product_offers(), expire_reservations_task(), mature_escrow_task(), recover_refunds_task(), create_order(), InventoryAuditLog, allocate_proportionally_paise(), CommerceService (+3 more)

### Community 6 - "Admin Role & Governance"
Cohesion: 0.06
Nodes (30): admin_auth_headers(), client(), customer_auth_headers(), db(), maintenance_auth_headers(), pro_auth_headers(), test_admin_audit_logs_engine(), test_admin_audit_logs_immutability_trigger() (+22 more)

### Community 7 - "Razorpay Payments & Settlement"
Cohesion: 0.09
Nodes (26): _apply_capture_in_tx(), _build_verify_response_for_settled_tx(), create_razorpay_order(), get_razorpay_client(), _lookup_transaction_for_verify(), _raise_gateway_error(), razorpay_webhook(), _resolve_payment_target() (+18 more)

### Community 8 - "Docker & Local Containers"
Cohesion: 0.05
Nodes (48): build, container_name, depends_on, environment, ports, restart, context, dockerfile (+40 more)

### Community 9 - "Multi-Vendor Commerce & Escrow"
Cohesion: 0.09
Nodes (40): checkout_multi_vendor_endpoint(), format_order(), get_my_orders(), get_order(), _order_query(), request_return_endpoint(), reserve_inventory_endpoint(), validate_coupon() (+32 more)

### Community 10 - "GitHub CI/CD Automation Workflows"
Cohesion: 0.05
Nodes (44): name, runs-on, services, steps, name, needs, runs-on, steps (+36 more)

### Community 11 - "Razorpay Payments & Settlement"
Cohesion: 0.09
Nodes (10): _refund_oos_capture_outside_locks(), RefundRecord, to_paise(), _compute_next_retry(), RefundError, RefundGatewayError, RefundInFlightError, RefundService (+2 more)

### Community 12 - "Automated Refund & Idempotency"
Cohesion: 0.07
Nodes (13): ReturnDecisionRequest, _create_paid_delivered_order(), _create_user(), _sign_webhook(), test_canonical_backfill_preserves_stock_multiseller_history_reservations_and_interruptions(), _track_writes(), test_exactly_once_refund_accounting_interleaving_concurrency_and_validation(), sync_caller() (+5 more)

### Community 13 - "Admin Role & Governance"
Cohesion: 0.14
Nodes (15): get_admin_audit_logs(), get_admin_bookings(), get_admin_orders(), get_admin_partner_drafts(), get_admin_users(), reject_partner_draft(), toggle_user_status(), update_user_role() (+7 more)

### Community 14 - "Multi-Vendor Commerce & Escrow"
Cohesion: 0.17
Nodes (23): SellerListing, UserRole, client(), _create_user_headers(), db(), _install_mock_gateway(), _pay_and_verify(), _sign_webhook() (+15 more)

### Community 15 - "Frontend SPA UI Components"
Cohesion: 0.16
Nodes (10): get_current_user(), get_optional_current_user(), require_maintenance_auth(), create_review(), get_my_reviews(), get_reviews(), get_db(), Review (+2 more)

### Community 16 - "FastAPI Authentication Dependencies"
Cohesion: 0.19
Nodes (13): get_current_user_profile(), login(), refresh_token(), register(), create_access_token(), create_refresh_token(), decode_token(), hash_password() (+5 more)

### Community 17 - "Multi-Vendor Commerce & Escrow"
Cohesion: 0.11
Nodes (5): downgrade(), upgrade(), upgrade(), upgrade(), upgrade()

### Community 18 - "Admin Executive Dashboard Metrics"
Cohesion: 0.10
Nodes (25): GlamGo Admin Command Centre Dashboard, Admin Identity & Live System Status Header (GlamGo Admin, Operational, Platform Live Badge, Welcome Toast), Commission 15% Net Platform Revenue Card (INR 462), Executive KPI Summary 4-Card Grid, Total Bookings Metric Card (0, Avg INR 0/booking), Total GMV Metric Card (INR 3,080), Total Orders Metric Card (2, Avg INR 0/order), Luxury Editorial Admin Design System (Dark Sidebar + Warm Cream Canvas + Serif Headings + Gold Accents) (+17 more)

### Community 19 - "Frontend Maps & Location Picker"
Cohesion: 0.09
Nodes (19): dependencies, leaflet@^1.9.4, devDependencies, sharp@^0.35.5, vite@^7.1.12, name, private, scripts (+11 more)

### Community 20 - "User Profile & Address API"
Cohesion: 0.22
Nodes (12): add_address(), delete_address(), get_addresses(), get_notifications(), get_profile(), update_profile(), Address, AddressCreate (+4 more)

### Community 21 - "Services Catalog API"
Cohesion: 0.20
Nodes (13): create_service(), get_service(), get_service_categories(), get_services(), ProductCreate, ProductResponse, ProductVariantResponse, ProfessionalResponse (+5 more)

### Community 22 - "Health Checks & Redis Cache"
Cohesion: 0.18
Nodes (8): check_redis_health(), get_redis_status(), _check_db_ping(), health_check(), lifespan(), liveness_probe(), readiness_probe(), root()

### Community 23 - "Razorpay Payments & Settlement"
Cohesion: 0.11
Nodes (15): Platform Administrator Command Centre Critical Gap, Severed PartnerDraft-to-Admin Approval Bridge Path, Infrastructure Production Hardening Recommendations, End-to-End MVP Engineering Roadmap (Phases 1–8), Phase 5: Multi-Vendor Catalog & Inventory Fulfillment, Phase 6: Verified Reviews & Customer Support Engine, Phase 7: Razorpay Webhooks, Automated Refunds & Partner Payouts, Phase 8: DevOps Hardening, Observability & Production Launch (+7 more)

### Community 24 - "Health Checks & Redis Cache"
Cohesion: 0.19
Nodes (3): RateLimiter, get_redis(), test_rate_limiter_exceeded()

### Community 25 - "Razorpay Payments & Settlement"
Cohesion: 0.12
Nodes (12): Partner Portals Partial Implementation Gaps, Phase 3 Booking Engine API Contract, Phase 3 Checkout & Razorpay API Contract, Phase 3 API Contract & Endpoint Specification, Partner Onboarding Application Endpoint (POST /api/v1/partners/apply), Partner Financials & Statements Endpoint (GET /api/v1/partners/financials), Phase 4 API Changes Specification: Partner Ecosystem, Professional Operations Endpoints (/partners/professional/*) (+4 more)

### Community 26 - "Render Cloud Infrastructure"
Cohesion: 0.13
Nodes (14): generateValue, key, sync, value, services, dockerContext, dockerfilePath, envVars (+6 more)

### Community 27 - "Client API Layer"
Cohesion: 0.14
Nodes (15): apiGetMe(), apiGetMyBookings(), apiGetMyReviews(), apiGetNotifications(), apiGetProducts(), apiGetProfessionals(), apiGetSalons(), apiGetServices() (+7 more)

### Community 28 - "Canonical Inventory CLI Backfill"
Cohesion: 0.27
Nodes (4): main(), run_inventory_backfill(), _snapshot_totals(), main()

### Community 29 - "Multi-Vendor Commerce & Escrow"
Cohesion: 0.18
Nodes (14): Brand Header: GLAMGO · Three Experiences One Production Platform, Espresso & Champagne Gold Visual System (Gradients & CSS Keyframes), Feature Pills Strip (4 Platform Pillars), GlamGo Hero Banner SVG (1200x320), Metric: 2.6x - 7.3x FASTER CATALOG APIs, Metric: LIVE (VERCEL + RENDER), Metric: 346ms - 595ms RETURN PAGE RENDER, Metric: HMAC-SHA256 RAZORPAY + ESCROW LEDGER (+6 more)

### Community 30 - "Phase 4 Partner Ecosyste"
Cohesion: 0.15
Nodes (13): Phase 4 Partner Ecosystem & Business Operations PRD, Partner Financial Statements & 15% Commission, Multi-Persona Partner Onboarding & Governance, Independent Professional Dashboard, Salon Owner Dashboard & Staff Roster, Product Seller Catalog & Order Fulfillment, Partner BOLA/IDOR Security Test Suite, Phase 4 Partner Verification Test Plan (+5 more)

### Community 31 - "Salon Card: Atelier Beau"
Cohesion: 0.18
Nodes (13): Salon Card: Atelier Beauty House (Popular, 4.8, Juhu), Salon Card: Maison de Glow (New to GlamGo, 4.9, Khar West), Salon Card: The Ivory Room (Most loved, 4.9, Bandra West), Service Category Filter Chips (All, Hair, Skin, Nails, Makeup, Spa), Design Decision: Editorial Luxury Aesthetic (Warm Ivory Canvas, Serif Headings, High-Contrast Active State), Design Decision: Location-Aware Curation & Proximity Metadata (Mumbai Neighborhoods & Distance), Next Section Eyebrow Peek (A Little More Personal), Salon Listing Card Component Pattern (+5 more)

### Community 32 - "User Identity & Authentication API"
Cohesion: 0.19
Nodes (10): Phase 2.1 Frontend & Browser Regression Report, Finding UI-001: Admin Post-Login Routing Intent, Phase 2.1 Independent Audit & Reliability Final Report, Finding FIN-001: Average Booking Value Denominator Fix, Phase 2.1 Financial Analytics & Revenue Validation Report, Phase 2.1 7-Finding Remediation & Hardening Matrix, Phase 2.1 Full Audit & Hardening Report, 50-Check Admin RBAC Matrix Verification (+2 more)

### Community 34 - "Dashboards.Yml"
Cohesion: 0.17
Nodes (11): apiVersion, path, providers, allowUiUpdates, disableDeletion, folder, name, options (+3 more)

### Community 35 - "Multi-Vendor Commerce & Escrow"
Cohesion: 0.18
Nodes (11): At-Home Doorstep Beauty Service Lifecycle, Physical Salon & Studio Appointment Lifecycle, DispatchService 60s Countdown & Cascading Fallback Engine (Plan 08-01), EventBus Redis Pub/Sub Service (Plan 08-01), WebSocket & SSE Notification Streaming Gateway (Plan 08-01), Multi-Vendor Split Fulfillment & Return Requirements (COMM-01 to COMM-04), Real-Time Event Dispatch Requirements (DISP-01 to DISP-03), Doorstep Beauty Journey Requirements (DOOR-01 to DOOR-04) (+3 more)

### Community 36 - "Railway.Json"
Cohesion: 0.17
Nodes (11): build, builder, dockerfilePath, deploy, healthcheckPath, healthcheckTimeout, numReplicas, restartPolicyMaxRetries (+3 more)

### Community 37 - "Logging Config"
Cohesion: 0.22
Nodes (3): configure_structured_logging(), get_correlation_id(), JSONLogFormatter

### Community 38 - "Razorpay Payments & Settlement"
Cohesion: 0.18
Nodes (11): environment, ACCESS_TOKEN_EXPIRE_MINUTES, AUTO_MIGRATE, DATABASE_URL, ENABLE_DOCS, ENVIRONMENT, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET (+3 more)

### Community 39 - "Docker & Local Containers"
Cohesion: 0.18
Nodes (11): container_name, environment, expose, image, networks, restart, volumes, POSTGRES_DB (+3 more)

### Community 40 - "Docker & Local Containers"
Cohesion: 0.18
Nodes (11): container_name, environment, image, networks, ports, restart, volumes, POSTGRES_DB (+3 more)

### Community 41 - "Razorpay Payments & Settlement"
Cohesion: 0.20
Nodes (8): Administrator Router (/api/v1/admin), REST API Inventory & Endpoint Catalog (49 Operations / 42 Paths), Authentication & Identity Router (/api/v1/auth), Bookings & Appointments Router (/api/v1/bookings), Orders & Checkout Router (/api/v1/orders), Partner Portals Router (/api/v1/partners), Razorpay Payments Router (/api/v1/payments), Reviews & Ratings Router (/api/v1/reviews)

### Community 42 - "Razorpay Payments & Settlement"
Cohesion: 0.40
Nodes (11): Admin Command Centre (Platform Governance), At-Home Beauty Storefront Screen, At-Home Service Booking Modal, Beauty Store (The Beauty Shelf) Screen, Experience Selection Gateway Screen, GlamGo Partner Studio Dashboard, Product Detail Screen (The Daily Renewal Serum), GlamGo Product Tour Animated GIF (+3 more)

### Community 43 - "Phase 1 Critical Gap: Ad"
Cohesion: 0.18
Nodes (7): Phase 1 Critical Gap: Administrator Command Centre, Graphify Codebase Topology & 10 God Nodes, Phase 1 Completion & Architectural Audit Report, Dedicated Administrator Command Centre (/admin), Partner Financial Statements & 15% Commission Ledger, Three-Persona Partner Ecosystem (Pro, Salon Owner, Seller), Phase 4 Final Report: Partner Ecosystem & Business Operations

### Community 44 - "Products"
Cohesion: 0.42
Nodes (6): create_product(), format_product(), get_product(), get_product_categories(), get_product_offers_endpoint(), get_products()

### Community 45 - "Docker & Local Containers"
Cohesion: 0.20
Nodes (10): container_name, depends_on, expose, networks, restart, condition, db, redis (+2 more)

### Community 46 - "Deploy"
Cohesion: 0.20
Nodes (10): deploy, deploy, resources, deploy, cpus, memory, deploy, memory (+2 more)

### Community 47 - "Docker & Local Containers"
Cohesion: 0.20
Nodes (10): container_name, depends_on, networks, ports, restart, condition, db, redis (+2 more)

### Community 48 - "Phase 6 Deployment Archi"
Cohesion: 0.20
Nodes (9): Phase 6 Deployment Architecture & Infrastructure Spec, Phase 6 Disaster Recovery & Backup Reliability Plan, PostgreSQL 16 WAL Archiving & Encrypted Backup Schedule, Phase 6 Observability, Logging & Alerting Spec, Phase 6 Payment & Financial Readiness Runbook, Phase 6 Performance, Indexing & Scalability Plan, Phase 6 Production Infrastructure & Launch Readiness PRD, Phase 6 Production Security Plan (+1 more)

### Community 49 - "Before Vs. After Product"
Cohesion: 0.36
Nodes (10): Before vs. After Production API Latency Benchmark Chart (Live Render Backend Speedup Visualization), Endpoint /api/v1/products/ Latency (2.20s Before -> 0.30s After, ~7.3x Faster), Endpoint /api/v1/professionals/ Latency (0.82s Before -> 0.26s After, ~3.1x Faster), Endpoint /api/v1/salons/ Latency (1.37s Before -> 0.27s After, ~5.1x Faster), Endpoint /api/v1/services/ Latency (0.81s Before -> 0.28s After, ~2.9x Faster), Insight: Warm Cache Hits (~0.26s-0.32s) Have Near-Zero DB Overhead; Floor Is India to US-West (Render Oregon) TLS/HTTPS RTT, Metric: Warm Persistent HTTPS Keep-Alive Request Latency (Seconds), Metric: GZip Response Wire Size Reduction (-58% to -64%) (+2 more)

### Community 50 - "Database Migrations & Alembic"
Cohesion: 0.24
Nodes (9): Final Production Go/No-Go Decision (GO-NO-GO-FINAL), 10-Gate Production Launch Evaluation Matrix, Hardened Multi-Stage Container & Nginx Edge Topology, Alembic Migration 0395cd015fed (12 Production Performance Indexes), Observability, Prometheus /metrics & Dual Health Probes, Phase 6 Final Report: Production Infrastructure & Launch Readiness, 6-Step Deployment & Forward-Only Migration Procedure, Production Snapshot Rollback Procedure (+1 more)

### Community 51 - "Top Announcement Bar"
Cohesion: 0.28
Nodes (9): Top Announcement Bar, Multi-Field Booking Search Widget, Dual-Audience Navigation Pattern, Editorial Hero Section, Luxury Editorial Design System, Mobile Header Navigation, GlamGo Mobile Landing Screen, Full-Bleed Salon Interior Photography (+1 more)

### Community 52 - "01 / At-Home Beauty Expe"
Cohesion: 0.28
Nodes (9): 01 / At-Home Beauty Experience Card, 03 / Beauty Shopping Experience Card, 02 / Salon & Parlour Experience Card, Editorial Hero Header (Beauty is yours to define.), Luxury Editorial Visual Design (Serif Typography & Warm Neutral Palette), GlamGo Onboarding Experience Screen, Three-Column Experience Selector Grid, Minimalist Top Navigation Bar (GLAMGO Logo & Sign In) (+1 more)

### Community 53 - "Category Sub-Navigation "
Cohesion: 0.36
Nodes (9): Category Sub-Navigation & Breadcrumb Trail, Editorial Product Header, Rating & Stock Status, Global Header & Experience Switcher Bar, INR Pricing Block & GLAM10 Promo Code Card, GlamGo Product Detail Page (PDP) UI, Product Media Showcase & Overlay Badges, Two-Column Editorial Split PDP Layout, Size Variant Selector & Primary Purchase CTAs (+1 more)

### Community 54 - "Multi-Vendor Commerce & Escrow"
Cohesion: 0.25
Nodes (9): Milestone v1.0 Production Launch Readiness & Multi-Cloud Infrastructure, Milestone v2.0 End-to-End System Integration & Live Operations, GlamGo Luxury Beauty Marketplace Master Plan, Phase 10: Salon Multi-Stylist Scheduling & Chair Capacity Engine, Phase 11: Multi-Vendor Split Fulfillment & Return Logistics Pipeline, Phase 12: Automated Financial Escrow, Payout Release & Platform Settlement, Phase 8: Real-Time Event Bus & WebSocket Dispatch Gateway, Phase 9: Doorstep Service Operational Workflow & Live Tracking (+1 more)

### Community 55 - "Docker & Local Containers"
Cohesion: 0.25
Nodes (7): driver, networks, glamgo_prod_net, services, volumes, glamgo_prod_pgdata, glamgo_prod_redisdata

### Community 56 - "Docker & Local Containers"
Cohesion: 0.25
Nodes (8): condition, backend, container_name, depends_on, networks, ports, restart, frontend

### Community 57 - "Docker & Local Containers"
Cohesion: 0.25
Nodes (8): command, container_name, expose, image, networks, restart, volumes, redis

### Community 58 - "Docker & Local Containers"
Cohesion: 0.25
Nodes (7): driver, networks, glamgo_staging_net, services, volumes, glamgo_staging_pgdata, glamgo_staging_redisdata

### Community 59 - "Docker & Local Containers"
Cohesion: 0.25
Nodes (8): condition, backend, container_name, depends_on, networks, ports, restart, frontend

### Community 60 - "Health Checks & Redis Cache"
Cohesion: 0.25
Nodes (8): environment, ACCESS_TOKEN_EXPIRE_MINUTES, AUTO_MIGRATE, DATABASE_URL, ENABLE_DOCS, ENVIRONMENT, REDIS_URL, SECRET_KEY

### Community 61 - "Docker & Local Containers"
Cohesion: 0.25
Nodes (8): command, container_name, image, networks, ports, restart, volumes, redis

### Community 62 - "Appointment Lifecycle St"
Cohesion: 0.25
Nodes (6): Appointment Lifecycle State Machine & RBAC Transitions, Phase 3 Architecture: Customer Experience & Core Booking Engine, Unified Order Tracking, Reviews & Notification Center (CUST-011, CUST-012), 4-Step Booking Wizard (CUST-007), Phase 3 PRD: Customer Experience & Core Booking Engine (CUST-001 to CUST-013), Phase 3 Test Plan & Verification Harness (TC-CUST-01 to TC-CUST-09)

### Community 63 - "Booking Modal Screen (Bo"
Cohesion: 0.36
Nodes (8): Booking Modal Screen (Book a beautiful moment.), Review Your Booking Key-Value Summary, Deferred Payment Appointment Notice, Editorial Luxury Design Language, Four-Step Booking Progress Stepper, Booking Confirmation Action Bar, Modal Overlay Over Service Catalog Pattern, Dimmed Service Catalog and Session Toast Backdrop

### Community 64 - "Editorial Luxury Visual "
Cohesion: 0.32
Nodes (8): Editorial Luxury Visual Design System, Global Storefront Header and Portal Navigation Shell, Professional Overview KPI Metrics Strip, Professional Operations Command Quick-Launch Grid, GlamGo Partner Studio Screen (Operational Command), Professional Workflow Sidebar Navigation, Partner Role Persona Switcher (Professional, Salon Owner, Product Seller), Two-Column Partner Dashboard Layout Pattern

### Community 65 - "Client"
Cohesion: 0.32
Nodes (6): client(), customer_headers(), db_session(), get_token(), seller_a_headers(), seller_b_headers()

### Community 66 - "Create Salon"
Cohesion: 0.43
Nodes (4): create_salon(), format_salon(), get_salon(), get_salons()

### Community 69 - "Healthcheck"
Cohesion: 0.57
Nodes (7): healthcheck, healthcheck, interval, retries, test, timeout, healthcheck

### Community 70 - "Healthcheck"
Cohesion: 0.57
Nodes (7): healthcheck, healthcheck, interval, retries, test, timeout, healthcheck

### Community 71 - "Multi-Vendor Commerce & Escrow"
Cohesion: 0.29
Nodes (3): Multi-Vendor Split Cart & Escrow Lifecycle, GitHub Actions 3-Stage CI/CD Pipeline, GlamGo Platform Architecture & Multi-Persona Overview

### Community 72 - "Razorpay Payments & Settlement"
Cohesion: 0.33
Nodes (7): Dimmed Two-Column Checkout Backdrop, Editorial Dimmed-Backdrop Modal Pattern, GlamGo Storefront Navigation Header, Checkout Payment Method Selector, Razorpay Payment Modal Screen, Razorpay Security Shield Loading Modal, Razorpay Test Mode Corner Ribbon

### Community 73 - "Glamgo Shop Page (The Be"
Cohesion: 0.43
Nodes (7): GlamGo Shop Page (The Beauty Shelf), Six-Column Category Navigation Strip, Featured Catalog Products (Parfum, Brush Set, Moisturiser, Lipstick), Four-Column Product Card Grid, Multi-Faceted Filter and Sort Toolbar, Editorial Product Card Component, Warm Minimalist Editorial Design System

### Community 74 - "Vercel.Json"
Cohesion: 0.29
Nodes (6): buildCommand, framework, headers, outputDirectory, rewrites, $schema

### Community 76 - "Razorpay Payments & Settlement"
Cohesion: 0.33
Nodes (6): Razorpay Python SDK, Client Backend API URL Configuration, Cormorant Garamond & Manrope Google Fonts, Single Page Application Entrypoint (index.html), Razorpay Checkout Client Script, Warm Editorial Brand System

### Community 77 - "Partner Onboarding & Kyc"
Cohesion: 0.33
Nodes (6): Partner Onboarding & KYC Governance Lifecycle, Phase 1 Critical Gap: Dedicated Administrator Command Centre, Phase 1 Architectural Audit & Baseline Report, Phase 1 Topological God Nodes (User, apiRequest, UserRole, get_db), Phase 1 Security Vulnerabilities & Fixes (SEC-01 to SEC-06), Phase 2 Report: Dedicated Administrator Command Centre & Governance

### Community 78 - "Razorpay Payments & Settlement"
Cohesion: 0.33
Nodes (3): Phase 1 Resolved Vulnerabilities (SEC-01 to SEC-06), Phase 3 Final Report: Customer Experience & Core Booking Engine, Production Payment Verification Report (PAYMENT-VERIFY-01)

### Community 79 - "Salon Editorial Storefro"
Cohesion: 0.60
Nodes (6): Salon Editorial Storefront Image (salon-editorial.webp), Sunlit Boucle Lounge, Travertine Table & Arched Windows, Arched Hair-Wash Sanctuary & Backlit Product Shelving, Storefront Editorial Hero & Luxury Salon Brand Positioning, Backlit Organic Mirror Styling Stations & Cream Boucle Chairs, Warm Minimalist Organic Luxury Interior Styling

### Community 80 - "Shop Editorial Image (Sh"
Cohesion: 0.47
Nodes (6): Shop Editorial Image (shop-editorial.webp), Quiet-Luxury Beauty Brand Positioning & Cross-Category Visual Cohesion, Color Cosmetics Duo (Champagne-Gold Mauve Lipstick & Black Mirrored Compact Powder), Tactile Editorial Styling (Travertine Stone Plinths, Cream Linen, Dried Gypsophila, Dappled Sunlight), Unbranded Skincare Vessels (Pump Bottle, Cream Jar, Golden Serum Dropper, Toner Bottle), Storefront Shop Editorial Banner & Catalog Header Visual

### Community 82 - "Get Professional"
Cohesion: 0.60
Nodes (3): get_professional(), get_professional_availability(), get_professionals()

### Community 84 - "Multi-Vendor Commerce & Escrow"
Cohesion: 0.40
Nodes (3): Durable Refund Ledger & Idempotency, Commerce Scheduled Maintenance Runner, Durable Refund Service Architecture

### Community 85 - "Multi-Vendor Commerce & Escrow"
Cohesion: 0.40
Nodes (4): Reservation Expiry & Escrow Maturity Internal Workers, seller_escrow_records Table, Razorpay Webhook HMAC & Idempotency Ledger, SEC-02 Razorpay Signature Bypass Remediation

### Community 86 - "Seller Suborder Queue & "
Cohesion: 0.40
Nodes (5): Seller Suborder Queue & Return APIs, POST /api/v1/orders/checkout, Split Parent/Child Order Orchestrator, shipments Table, suborders Table

### Community 87 - "Platform Audit & Activity Trail"
Cohesion: 0.40
Nodes (3): inventory_audit_logs Table, seller_listings Table, SEC-03 Booking Concurrency Row Lock Remediation

### Community 88 - "Database Migrations & Alembic"
Cohesion: 0.40
Nodes (5): Findings DB-001 & DB-002: Audit Log Immutability & Server Defaults, Alembic Migration 542add54006c (Audit Logs & Moderation), Phase 2.1 Database & Migration Audit Report, Alembic Migration 0194ac893adb (Audit Log Immutability Trigger), Phase 2 Full Report: Administrator Command Centre

### Community 89 - "Database Migrations & Alembic"
Cohesion: 0.40
Nodes (5): Alembic Migration 0294bc904efc (Multi-Vendor Schema), Phase 5 Final Completion Report: Multi-Vendor Commerce, Phase 5 Planning Artifacts (PRD, Arch, DB, API, Test Plan), Phase 4 to Multi-Vendor Gap Analysis, Phase 5 Pre-Implementation Review

### Community 90 - "Health Checks & Redis Cache"
Cohesion: 0.40
Nodes (4): Multi-Threaded Load Benchmarks (85.5 req/s Catalog, 69.96 req/s Health), Production Performance Report (PERF-REPORT-01), Production Security Sign-Off (SECURITY-SIGNOFF-01), 8-Vector Defense-in-Depth Threat Remediation Matrix

### Community 91 - "Fragrance Category Edito"
Cohesion: 0.50
Nodes (5): Fragrance Category Editorial Photograph (fragrance.webp), Purpose: Convey Warm Minimalist Luxury Aesthetic for Glamgo Fragrance Department, Storefront Role: Fragrance Category Card and Editorial Showcase Image, Warm Minimalist Styling: Travertine Stone Plinth, Draped Cream Linen, Golden-Hour Light, and Botanical Shadows, Unbranded Square Clear Glass Perfume Bottle with Brushed Gold Cylindrical Cap and Amber Liquid

### Community 92 - "Minimalist Amber Glass B"
Cohesion: 0.60
Nodes (5): Minimalist Amber Glass Bottle with Matte Black Cap, Glossy Dark Brown Wavy Hair Strands, Hair Oil Product Photography, Storefront Hair Care Catalog Product Visual, Sunlit Travertine Stone and Cream Linen Styling

### Community 93 - "Lipstick Product Image ("
Cohesion: 0.60
Nodes (5): Lipstick Product Image (public/assets/lipstick.webp), Purpose: Convey Warm Minimalist Luxury and Natural Elegance for Cosmetics Merchandising, Storefront Role: Lipstick Category and Product Detail Visual Asset, Editorial Styling: Warm Travertine Stone Ledge, Dappled Leaf Shadows, and Soft Natural Sunlight, Visual Subject: Uncapped Matte Terracotta Lipstick in Matte Black and Polished Gold Tube

### Community 94 - "Moisturiser Product Phot"
Cohesion: 0.60
Nodes (5): Moisturiser Product Photograph (moisturiser.webp), Showcase Cream Texture and Minimalist Natural Luxury Brand Aesthetic, Skincare Product Visual Asset for Glamgo Storefront, Warm Monochrome Ivory Palette on Travertine Stone Slab with Draped Linen and Sunlit Shadows, Open Glossy Cream Cosmetic Jar with Whipped Moisturiser Swirl and Leaning Lid

### Community 95 - "Amber Glass Serum Droppe"
Cohesion: 0.70
Nodes (5): Amber Glass Serum Dropper Bottle, Serum Product Image (serum.webp), Clean Luxury Skincare Brand Positioning, Storefront Skincare Product Showcase Role, Warm Minimalist Editorial Styling

### Community 97 - "Build"
Cohesion: 0.67
Nodes (4): build, context, dockerfile, build

### Community 98 - "Build"
Cohesion: 0.67
Nodes (4): build, context, dockerfile, build

### Community 101 - "Post /Api/V1/Orders/Rese"
Cohesion: 0.50
Nodes (3): POST /api/v1/orders/reserve, inventory_reservations Table, Concurrent Async Overselling Prevention Test

### Community 102 - "Visual Subject: Five Gra"
Cohesion: 0.83
Nodes (4): Visual Subject: Five Graduated Wooden Makeup Brushes (Powder, Angled Blush, Tapered Blending, Eyeshadow, Angled Liner) with Cream Bristles and Champagne-Gold Ferrules, brushes.webp: Five-Piece Luxury Makeup Brush Set Product Photo, Storefront Role & Purpose: E-Commerce Product and Category Showcase Asset for Makeup Brushes and Beauty Tools, Visual Styling: Organic Minimalist Flat-Lay on Porous Beige Travertine Stone and Draped Cream Linen with Warm Natural Lighting

### Community 103 - "Visual Subject: Smiling "
Cohesion: 0.83
Nodes (4): Visual Subject: Smiling aesthetician in beige linen tunic applying facial cleanser to reclined client in spa headband and robe, Home Editorial Asset (home-editorial.webp): 16:9 sunlit luxury at-home spa facial photograph, Storefront Role & Purpose: Homepage editorial lifestyle banner communicating serene, trustworthy luxury at-home salon and skincare service, Visual Styling: Warm cream and sand palette, dappled golden-hour wall shadows, travertine table with towels, pump bottle, and olive-branch vase, left-side negative space

### Community 104 - "Admin Command Centre Das"
Cohesion: 0.67
Nodes (3): Admin Command Centre Dashboard, Multi-Role Partner Studio, GlamGo Platform User Roles

### Community 105 - "Canonical Variant Invent"
Cohesion: 0.67
Nodes (3): Canonical Variant Inventory Backfill, Inventory Backfill CLI Tool, Cart Composite Key Model

## Knowledge Gaps
- **151 isolated node(s):** `Phase 9: Doorstep Service Operational Workflow & Live Tracking`, `Phase 10: Salon Multi-Stylist Scheduling & Chair Capacity Engine`, `Phase 11: Multi-Vendor Split Fulfillment & Return Logistics Pipeline`, `Phase 12: Automated Financial Escrow, Payout Release & Platform Settlement`, `Multi-Vendor Split Fulfillment & Return Requirements (COMM-01 to COMM-04)` (+146 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 605 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **47 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `Admin Role & Governance` to `Client`, `Multi-Vendor Commerce & Escrow`, `Multi-Vendor Commerce & Escrow`, `Razorpay Payments & Settlement`, `Multi-Vendor Commerce & Escrow`, `Automated Refund & Idempotency`, `Admin Role & Governance`, `Multi-Vendor Commerce & Escrow`, `Frontend SPA UI Components`, `FastAPI Authentication Dependencies`, `User Profile & Address API`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Are the 81 inferred relationships involving `User` (e.g. with `get_current_user()` and `get_optional_current_user()`) actually correct?**
  _`User` has 81 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Phase 9: Doorstep Service Operational Workflow & Live Tracking`, `Phase 10: Salon Multi-Stylist Scheduling & Chair Capacity Engine`, `Phase 11: Multi-Vendor Split Fulfillment & Return Logistics Pipeline` to the rest of the system?**
  _151 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin Role & Governance` be split into smaller, more focused modules?**
  _Cohesion score 0.05674290713660792 - nodes in this community are weakly interconnected._
- **Why does `UserRole` connect `Multi-Vendor Commerce & Escrow` to `Admin Role & Governance`, `Client`, `Multi-Vendor Commerce & Escrow`, `Admin Role & Governance`, `Razorpay Payments & Settlement`, `Multi-Vendor Commerce & Escrow`, `Automated Refund & Idempotency`, `Admin Role & Governance`, `Frontend SPA UI Components`, `FastAPI Authentication Dependencies`, `User Profile & Address API`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 64 inferred relationships involving `CommerceService` (e.g. with `catalog_product_offers()` and `expire_reservations_task()`) actually correct?**
  _`CommerceService` has 64 INFERRED edges - model-reasoned connections that need verification._
- **Should `Admin Role & Governance` be split into smaller, more focused modules?**
  _Cohesion score 0.030969030969030968 - nodes in this community are weakly interconnected._