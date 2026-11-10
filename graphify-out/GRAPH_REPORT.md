# Graph Report - Glamgo 4  (2026-11-10)

## Corpus Check
- Corpus is ~21,267 words - fits in a single context window. You may not need a graph.

## Summary
- 448 nodes · 1310 edges · 22 communities (14 shown, 8 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 145 edges (avg confidence: 0.95)
- Token cost: 1,200 input · 450 output

## Community Hubs (Navigation)
- Frontend API Client & Services
- FastAPI REST Endpoints & RBAC
- Database Migrations & Schemas
- Docker Infrastructure & Orchestration
- Auth Dependencies & Token Security
- Reviews & Rating Endpoints
- Alembic Database Environment
- Frontend Package Dependencies
- Razorpay Payments & Transactions
- User Profile & Address Management
- Pytest Fixtures & Test Client
- GlamGo Architectural Pillars
- Community 12
- Community 14
- Community 16
- Community 21

## God Nodes (most connected - your core abstractions)
1. `User` - 47 edges
2. `apiRequest()` - 35 edges
3. `icon()` - 26 edges
4. `UserRole` - 24 edges
5. `render()` - 24 edges
6. `get_db()` - 17 edges
7. `Salon` - 17 edges
8. `Product` - 17 edges
9. `action()` - 17 edges
10. `Booking` - 16 edges

## Surprising Connections (you probably didn't know these)
- `setup_test_db()` --calls--> `seed_database()`  [EXTRACTED]
  tests/conftest.py → backend/app/services/seed_service.py
- `get_current_user()` --uses--> `User`  [INFERRED]
  backend/app/api/deps.py → backend/app/models/user.py
- `get_optional_current_user()` --uses--> `User`  [INFERRED]
  backend/app/api/deps.py → backend/app/models/user.py
- `RoleChecker` --uses--> `User`  [INFERRED]
  backend/app/api/deps.py → backend/app/models/user.py
- `get_admin_stats()` --uses--> `UserRole`  [INFERRED]
  backend/app/api/v1/admin.py → backend/app/models/user.py

## Import Cycles
- None detected.

## Communities (22 total, 8 thin omitted)

### Community 0 - "Frontend API Client & Services"
Cohesion: 0.07
Nodes (93): apiAddAddress(), apiCreateBooking(), apiCreateOrder(), apiCreatePartnerDraft(), apiCreatePaymentOrder(), apiCreateReview(), apiDeleteAddress(), apiGetAddresses() (+85 more)

### Community 1 - "FastAPI REST Endpoints & RBAC"
Cohesion: 0.08
Nodes (46): upgrade(), get_admin_bookings(), get_admin_orders(), get_admin_stats(), get_admin_users(), toggle_user_status(), create_booking(), get_booking() (+38 more)

### Community 2 - "Database Migrations & Schemas"
Cohesion: 0.05
Nodes (48): build, container_name, depends_on, environment, ports, restart, context, dockerfile (+40 more)

### Community 3 - "Docker Infrastructure & Orchestration"
Cohesion: 0.13
Nodes (19): Role-Based Access Control, get_current_user(), get_optional_current_user(), RoleChecker, get_current_user_profile(), login(), refresh_token(), register() (+11 more)

### Community 4 - "Auth Dependencies & Token Security"
Cohesion: 0.11
Nodes (22): create_product(), format_product(), get_product(), get_product_categories(), get_products(), create_salon(), format_salon(), get_salon() (+14 more)

### Community 5 - "Reviews & Rating Endpoints"
Cohesion: 0.10
Nodes (16): devDependencies, sharp@^0.35.5, vite@^7.1.12, name, private, scripts, build, dev (+8 more)

### Community 6 - "Alembic Database Environment"
Cohesion: 0.24
Nodes (8): create_razorpay_order(), verify_razorpay_payment(), PaymentTransaction, PaymentOrderCreate, PaymentOrderResponse, PaymentVerifyRequest, PaymentVerifyResponse, test_payment_order_and_hmac_verification()

### Community 7 - "Frontend Package Dependencies"
Cohesion: 0.25
Nodes (10): add_address(), get_addresses(), get_notifications(), get_profile(), update_profile(), AddressCreate, AddressResponse, NotificationResponse (+2 more)

### Community 8 - "Razorpay Payments & Transactions"
Cohesion: 0.32
Nodes (6): create_review(), get_my_reviews(), get_reviews(), Review, ReviewCreate, ReviewResponse

### Community 9 - "User Profile & Address Management"
Cohesion: 0.27
Nodes (6): admin_auth_headers(), client(), customer_auth_headers(), db(), pro_auth_headers(), setup_test_db()

### Community 10 - "Pytest Fixtures & Test Client"
Cohesion: 0.33
Nodes (7): validate_coupon(), CouponValidateRequest, CouponValidateResponse, OrderCreate, OrderItemCreate, OrderItemResponse, OrderResponse

### Community 11 - "GlamGo Architectural Pillars"
Cohesion: 0.48
Nodes (5): AvailabilityResponse, AvailabilityToggle, PartnerDraftCreate, PartnerDraftResponse, PartnerProfileUpdate

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (6): Admin Command Center, At-Home Beauty Services, The Beauty Store, GlamGo Platform, Partner Portals, Salons & Parlours

### Community 14 - "Community 14"
Cohesion: 0.53
Nodes (3): test_admin_self_registration_forbidden(), test_register_and_login_flow(), test_booking_workflow_and_conflict_prevention()

## Knowledge Gaps
- **7 isolated node(s):** `At-Home Beauty Services`, `Salons & Parlours`, `The Beauty Store`, `Partner Portals`, `Admin Command Center` (+2 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 108 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `FastAPI REST Endpoints & RBAC` to `Razorpay Payments & Transactions`, `Docker Infrastructure & Orchestration`, `Alembic Database Environment`, `Frontend Package Dependencies`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Are the 32 inferred relationships involving `User` (e.g. with `get_current_user()` and `get_optional_current_user()`) actually correct?**
  _`User` has 32 INFERRED edges - model-reasoned connections that need verification._
- **What connects `At-Home Beauty Services`, `Salons & Parlours`, `The Beauty Store` to the rest of the system?**
  _7 weakly-connected nodes found - possible missing edges._
- **Should `Frontend API Client & Services` be split into smaller, more focused modules?**
  _Cohesion score 0.07149122807017544 - nodes in this community are weakly interconnected._
- **Why does `UserRole` connect `Docker Infrastructure & Orchestration` to `FastAPI REST Endpoints & RBAC`, `Alembic Database Environment`, `Frontend Package Dependencies`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `UserRole` (e.g. with `RoleChecker` and `get_admin_stats()`) actually correct?**
  _`UserRole` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Should `FastAPI REST Endpoints & RBAC` be split into smaller, more focused modules?**
  _Cohesion score 0.07973124300111982 - nodes in this community are weakly interconnected._