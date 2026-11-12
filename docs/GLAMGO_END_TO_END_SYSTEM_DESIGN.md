# GlamGo — End-to-End System Design & Architecture Specification

**Author:** Principal Software Architect  
**Platform:** GlamGo Luxury Beauty Marketplace  
**Tech Stack:** FastAPI, PostgreSQL 16, SQLAlchemy 2.0, Alembic, Redis 7, Vanilla JS (ES Modules), Vite 7, Nginx  

---

## Table of Contents
1. [Architecture Overview & System Topology](#1-architecture-overview--system-topology)
2. [Scenario 1: At-Home Doorstep Beauty Service Lifecycle](#2-scenario-1-at-home-doorstep-beauty-service-lifecycle)
3. [Scenario 2: Physical Salon & Studio Appointment Lifecycle](#3-scenario-2-physical-salon--studio-appointment-lifecycle)
4. [Scenario 3: Multi-Vendor E-Commerce Engine (Split Cart & Escrow)](#4-scenario-3-multi-vendor-e-commerce-engine-split-cart--escrow)
5. [Scenario 4: Partner Onboarding & KYC Governance Lifecycle](#5-scenario-4-partner-onboarding--kyc-governance-lifecycle)
6. [State Machine Reference & Data Model Dictionary](#6-state-machine-reference--data-model-dictionary)
7. [Resilience, Idempotency & Concurrency Strategy](#7-resilience-idempotency--concurrency-strategy)

---

## 1. Architecture Overview & System Topology

GlamGo unites three interconnected commercial verticals through a modular monolithic architecture with dedicated **BFF (Backend-for-Frontend)** route surfaces:

```mermaid
graph TD
    Client["Client Devices (Web & Mobile Browser)"] -->|HTTPS / WSS| Nginx["Nginx Reverse Proxy & Edge Defense<br>Rate Limiting: 30r/s | SSL Offloading | Gzip"]
    
    subgraph FastAPI App Runtime
        Nginx -->|Proxy Pass| Uvicorn["Gunicorn Multi-Worker (4 Uvicorn Workers)"]
        Uvicorn --> MW["Middleware Pipeline<br>(CorrelationId, SecurityHeaders, RateLimiter)"]
        
        MW --> Router_Cust["Customer API (/api/v1/...)"]
        MW --> Router_Pro["Pro API (/api/v1/partners/pro/...)"]
        MW --> Router_Salon["Salon API (/api/v1/partners/salon/...)"]
        MW --> Router_Seller["Seller API (/api/v1/partners/seller/...)"]
        MW --> Router_Admin["Admin Command Centre (/api/v1/admin/...)"]
    end
    
    subgraph Data & State Cluster
        Uvicorn -->|Read-Through Cache & Locks| Redis[("Redis 7<br>Session Store, Stock Locks & Event Pub/Sub")]
        Uvicorn -->|ACID Transactions & Pooling| PG[("PostgreSQL 16<br>Connection Pool: 20 base, 40 overflow")]
    end
    
    subgraph External Infrastructure
        Uvicorn -->|Payment API & Webhooks| Razorpay["Razorpay Payment Gateway"]
        Uvicorn -->|Telemetry Scraping| Prometheus["Prometheus Metrics /metrics"]
    end
```

---

## 2. Scenario 1: At-Home Doorstep Beauty Service Lifecycle

This workflow handles on-demand and scheduled beauty treatments delivered directly to the client's home by verified freelance professionals.

### End-to-End Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Frontend as Vite Frontend (Client)
    participant Backend as FastAPI Backend
    participant Redis as Redis Cache/Locks
    participant DB as PostgreSQL 16
    actor Pro as Beauty Professional
    participant Admin as Admin Command Centre

    Customer->>Frontend: Selects Treatment (e.g. 'Complete Glow Facial')
    Frontend->>Backend: GET /api/v1/services/{id}/availability?date=2026-11-15
    Backend->>DB: Query Pro shifts minus existing booked slots
    DB-->>Backend: Available slots ['10:00 AM', '02:00 PM', '04:30 PM']
    Backend-->>Frontend: Return slot options
    Customer->>Frontend: Chooses slot, enters home address & confirms
    Frontend->>Backend: POST /api/v1/bookings (treatment, pro_id, slot, address)
    Backend->>Redis: Acquire lock: `lock:pro_slot:{pro_id}:{date}:{time}` (TTL: 120s)
    Backend->>Backend: Initialize Razorpay Payment Order
    Backend-->>Frontend: Return Razorpay Order ID & Checkout modal config
    Customer->>Frontend: Completes UPI/Card payment
    Frontend->>Backend: POST /api/v1/payments/razorpay/verify (signature verification)
    Backend->>DB: Insert Booking (Status: CONFIRMED, Payment: COMPLETED)
    Backend->>DB: Insert Notification for Customer & Professional
    Backend->>Redis: Publish `event:new_booking` -> Pro live channel
    Backend->>Redis: Release lock: `lock:pro_slot:...`
    Backend-->>Frontend: Booking Confirmed (Redirect to #booking-success)

    Note over Pro,Frontend: Day of Appointment Execution
    Pro->>Frontend: Logs into Pro Dashboard (#partner)
    Pro->>Backend: PATCH /api/v1/partners/pro/bookings/{id}/status (status: 'EN_ROUTE')
    Backend->>DB: Update Booking status -> 'en_route'
    Backend->>Customer: In-app notification: 'Expert is on the way'
    Pro->>Backend: PATCH /api/v1/partners/pro/bookings/{id}/status (status: 'IN_PROGRESS')
    Backend->>DB: Update Booking status -> 'in_progress'
    Pro->>Backend: PATCH /api/v1/partners/pro/bookings/{id}/status (status: 'COMPLETED')
    Backend->>DB: Update Booking status -> 'completed'
    Backend->>DB: Credit Pro wallet (Booking Price minus 15% Platform Fee)
    Backend->>DB: Record Platform Commission in platform revenue ledger
    Backend->>Admin: Live update in Admin Overview GMV & Commission
    Customer->>Frontend: Receives prompt -> Submits 5-star verified review
```

---

## 3. Scenario 2: Physical Salon & Studio Appointment Lifecycle

This workflow powers appointments at brick-and-mortar luxury salons, managing stylists, chair allocations, and studio calendars.

### End-to-End Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Frontend as Vite Frontend
    participant Backend as FastAPI Backend
    participant DB as PostgreSQL 16
    actor Salon as Salon Owner / Stylist
    participant Admin as Admin Command Centre

    Customer->>Frontend: Browses Salons near Bandra West
    Frontend->>Backend: GET /api/v1/salons/{id}
    Backend->>DB: Query Salon profile, gallery, treatments & active staff
    DB-->>Frontend: Return Salon details + Stylist roster
    Customer->>Frontend: Selects Stylist ('Priya - Master Colorist') & Time
    Frontend->>Backend: POST /api/v1/bookings (type='salon', salon_id, staff_id)
    Backend->>DB: Verify staff availability in `salon_staff` & `availabilities`
    Backend->>DB: Create Booking record (Status: CONFIRMED)
    Backend->>DB: Create In-App Notification for Salon Owner
    Backend-->>Frontend: Confirmation screen + calendar invite

    Note over Salon,Frontend: Salon Operations Management
    Salon->>Frontend: Opens Salon Dashboard (#salon)
    Salon->>Backend: GET /api/v1/partners/salon/appointments
    Backend->>DB: Query all studio appointments filtered by date
    DB-->>Salon: Render multi-stylist chair calendar
    Customer->>Salon: Arrives at parlour reception
    Salon->>Backend: PATCH /api/v1/partners/salon/appointments/{id}/checkin
    Backend->>DB: Update status to 'in_salon'
    Salon->>Backend: POST /api/v1/partners/salon/appointments/{id}/complete
    Backend->>DB: Update status to 'completed'
    Backend->>DB: Record Net Studio Revenue (Price * 0.85) in `salon_revenue`
    Backend->>Admin: Update Platform Financial Statement
```

---

## 4. Scenario 3: Multi-Vendor E-Commerce Engine (Split Cart & Escrow)

GlamGo’s multi-vendor commerce engine handles unified carts containing products from multiple independent beauty sellers, with atomic inventory reservation and automated 14-day escrow settlement.

### End-to-End Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Frontend as Vite Frontend
    participant Backend as FastAPI Commerce Engine
    participant Redis as Redis Atomic Locks
    participant DB as PostgreSQL 16
    actor SellerA as Seller A (Skincare)
    actor SellerB as Seller B (Fragrance)
    participant Razorpay as Razorpay Gateway

    Customer->>Frontend: Adds 'Body Cream' (Seller A) + 'Eau de Parfum' (Seller B)
    Customer->>Frontend: Clicks 'Proceed to Checkout'
    Frontend->>Backend: POST /api/v1/checkout/reserve-inventory
    critical Atomic Stock Reservation
        Backend->>Redis: Decrement available stock keys via Redis pipeline
        Backend->>DB: Insert `inventory_reservations` (TTL: 15 minutes)
    end
    Backend-->>Frontend: Reservation Locked (15-min countdown begins)

    Customer->>Frontend: Submits Delivery Address & Payment
    Frontend->>Backend: POST /api/v1/orders/checkout (payment details)
    Backend->>Razorpay: Capture Payment
    Razorpay-->>Backend: Webhook: `payment.captured` (HMAC-SHA256 verified)

    critical Order Splitting & Escrow Setup
        Backend->>DB: Insert Parent Order: `GG-ORD-89834A`
        Backend->>DB: Split into Sub-Order 1 -> Seller A (Amount: ₹1,290)
        Backend->>DB: Split into Sub-Order 2 -> Seller B (Amount: ₹3,490)
        Backend->>DB: Insert `seller_escrow_records` (Status: HELD, Release: Date + 14 Days)
        Backend->>DB: Finalize `inventory_reservations` -> Deduct permanent stock
    end

    Note over SellerA,SellerB: Independent Seller Fulfillment
    SellerA->>Backend: PATCH /api/v1/partners/seller/suborders/{sub1}/pack
    SellerA->>Backend: POST /api/v1/partners/seller/suborders/{sub1}/ship (AWB: BlueDart-88392)
    Backend->>DB: Insert `shipments` record (Carrier, Tracking Number, Status: DISPATCHED)
    Backend->>Customer: SMS & Email: 'Your Skincare from Seller A is on its way'

    Note over Customer,DB: 14-Day Escrow Release Window
    Customer->>Backend: Confirms Delivery (or Courier Webhook fires 'DELIVERED')
    Backend->>DB: Set Sub-Order status to 'DELIVERED'
    Note over Backend,DB: 7-Day Return Window expires with no return filed
    Note over Backend,DB: On Day 14: Automated Cron Job executes
    Backend->>DB: UPDATE `seller_escrow_records` SET status='MATURED'
    Backend->>DB: Credit Seller A Payout Balance (Price * 0.85)
```

---

## 5. Scenario 4: Partner Onboarding & KYC Governance Lifecycle

Prevents unvetted or fraudulent entities from offering treatments or selling unregulated cosmetics.

```mermaid
sequenceDiagram
    autonumber
    actor Applicant as Prospective Partner
    participant Frontend as Partner Application Form
    participant Backend as FastAPI Moderation Engine
    participant DB as PostgreSQL 16
    actor Admin as Platform Admin (Command Centre)

    Applicant->>Frontend: Submits Onboarding Application (#partner)
    Note over Applicant,Frontend: Form Data: Role, Aadhaar/PAN, GSTIN, Certs, Gallery
    Frontend->>Backend: POST /api/v1/partners/apply
    Backend->>Backend: Validate payload, check duplicate emails/tax IDs
    Backend->>DB: Insert into `partner_drafts` (Status: PENDING)
    Backend->>DB: Create Admin Audit Log: 'PARTNER_APPLICATION_SUBMITTED'
    Backend-->>Applicant: Application Received screen (Pending verification)

    Note over Admin,DB: Administrative Verification
    Admin->>Frontend: Opens Admin Command Centre (#admin)
    Frontend->>Backend: GET /api/v1/admin/moderation/partners?status=PENDING
    Backend->>DB: Query pending partner drafts
    DB-->>Admin: Display applicant cards, uploaded docs & portfolio
    Admin->>Frontend: Reviews credentials & clicks 'Approve Partner'
    Frontend->>Backend: POST /api/v1/admin/moderation/partners/{id}/review (action: 'APPROVE')
    
    critical Atomic Role Promotion & Profile Creation
        Backend->>DB: UPDATE `partner_drafts` SET status='APPROVED', reviewed_by=admin_id
        Backend->>DB: UPDATE `users` SET role='professional' (or 'salon_owner' / 'seller')
        Backend->>DB: Insert initial profile in `professional_profiles` or `salons`
        Backend->>DB: Insert immutable `admin_audit_logs` record
    end
    
    Backend->>Applicant: Sends Approval Notification & Welcome Email
    Applicant->>Frontend: Logs in -> Partner Operational Dashboard unlocks immediately!
```

---

## 6. State Machine Reference & Data Model Dictionary

### Order Lifecycle State Machine
```
[DRAFT] 
   └──> [PENDING_PAYMENT] (Inventory Reserved for 15m)
           ├── (Payment Failed / Expired) ──> [CANCELLED] (Stock Auto-Released)
           └── (Payment Captured) ──────────> [PLACED]
                                                └──> [CONFIRMED]
                                                        └──> [PACKED]
                                                                └──> [IN_TRANSIT]
                                                                        └──> [DELIVERED]
                                                                                ├── (Return Filed within 7d) ──> [RETURN_REQUESTED]
                                                                                └── (Day 14 Matured) ──────────> [SETTLED]
```

### Booking Lifecycle State Machine
```
[REQUESTED] 
   └──> [CONFIRMED] (Slot Locked)
           ├── (Cancelled by Customer/Pro) ──> [CANCELLED] (Slot Released)
           └── (Day of Service) ──────────────> [EN_ROUTE]
                                                   └──> [IN_PROGRESS]
                                                           └──> [COMPLETED] ──> [PAYOUT_RELEASED]
```

---

## 7. Resilience, Idempotency & Concurrency Strategy

1. **Sliding-Window Rate Limiter:**
   - In-memory Redis sliding-window algorithm enforcing **15 req/min on auth** and **30 req/sec platform-wide** per IP, rejecting floods with RFC 429 `Retry-After` headers.
2. **Webhook Idempotency:**
   - All payment webhooks acquire a Redis key `lock:webhook:{event_id}` for 60 seconds before processing. Replay attacks are dropped as HTTP 200 duplicate acknowledgments.
3. **Double-Booking & Overselling Prevention:**
   - Simultaneous checkouts on the same product SKU or appointment chair execute inside a PostgreSQL `SELECT ... FOR UPDATE` row-level lock combined with Redis reservation keys.
4. **Zero Data Loss Principle:**
   - Pre-deployment automated backups (`pg_dump -Fc`) run before every deployment script execution.
   - All financial and administrative mutations write to an append-only, immutable `admin_audit_logs` table.
