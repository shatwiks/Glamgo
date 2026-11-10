# GlamGo — Production-Ready Premium Beauty Marketplace

GlamGo is a full-stack, editorial beauty marketplace unifying three distinct experiences under one customer account, PostgreSQL database, and Python FastAPI backend:
1. **At-Home Beauty Services**: Book verified beauticians and certified specialists for doorstep care.
2. **Salons & Parlours**: Discover nearby boutique salons, view staff, browse menus, and book appointments.
3. **The Beauty Store**: Curated skincare, makeup, fragrances, and tools with server-verified checkout, coupon engine, and tracking.
4. **Partner Portals & Admin Command Center**: Role-based portals for Professionals, Salon Owners, Product Sellers, and Platform Administrators.

---

## Architecture & Technology Stack

- **Frontend**: Vite 7 + Vanilla JavaScript (ES Modules, Component-driven single-page architecture).
- **Design System**: Bespoke luxury typography (`Cormorant Garamond` + `Manrope`), custom responsive CSS with full mobile support.
- **Backend**: Python 3.11+ / FastAPI with asynchronous request handling.
- **Database**: PostgreSQL 16 with SQLAlchemy 2.0 ORM.
- **Database Migrations**: Alembic.
- **Authentication**: Secure JWT tokens (HS256) with password hashing via bcrypt (rounds=12).
- **Role-Based Access Control (RBAC)**: Distinct authorization rules for `customer`, `professional`, `salon_owner`, `seller`, and `admin`.
- **Cache & Concurrency**: Redis 7.
- **Payments**: Razorpay integration with HMAC-SHA256 signature verification.
- **Testing**: Pytest with automated unit and integration suites.
- **Containerization**: Docker & Docker Compose.

---

## Quick Start & Local Development

### 1. Start Infrastructure (PostgreSQL & Redis)
Ensure Docker is running, then execute:
```bash
docker compose up -d db redis
```
- PostgreSQL is mapped to port **5439** (database: `glamgo_db`, user: `glamgo`).
- Redis is mapped to port **6382**.

### 2. Setup Python Virtual Environment & Migrations
```bash
python -m venv .venv
.\.venv\Scripts\pip.exe install -r backend/requirements.txt

# Run database migrations
.\.venv\Scripts\alembic.exe upgrade head

# Seed initial catalog and test users
.\.venv\Scripts\python.exe -m backend.app.services.seed_service
```

### 3. Start Backend Server
```bash
.\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Docs available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 4. Start Frontend Dev Server
In a separate terminal:
```bash
npm install
npm run dev
```
Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/) in your browser. (All `/api` calls are automatically proxied to the backend).

---

## Pre-seeded Credentials

| Role | Email | Password | Access / Capabilities |
| :--- | :--- | :--- | :--- |
| **Customer** | `aanya@example.com` | `Password@123` | Services, salons, store, orders, bookings, wishlist |
| **Admin** | `admin@glamgo.com` | `Admin@123456` | Platform GMV, user status toggles, platform-wide orders & bookings |
| **Professional** | `nisha@glamgo.com` | `Pro@123456` | Availability schedule, appointment requests, earnings |
| **Salon Owner** | `salon@glamgo.com` | `Salon@123456` | Salon profile, staff, appointments, revenue analytics |
| **Product Seller** | `seller@glamgo.com` | `Seller@123456` | Product listings, inventory, order fulfillment |

---

## Automated Test Suite

Run the full automated test suite:
```bash
.\.venv\Scripts\python.exe -m pytest -v tests/
```
The test suite validates:
- User registration, login, JWT validation, and token refresh.
- Services, Professionals, Salons, and Products catalog filters and search.
- Double-booking prevention and scheduling conflict checks.
- Server-side order checkout, inventory deduction, and coupon discounts (`GLAM10`).
- Partner availability scheduler and draft listing creations.
- Administrator role-based access control and platform analytics.

---

## Production Docker Deployment

To build and run the full production stack:
```bash
docker compose up --build -d
```
- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:8000`
- PostgreSQL: `localhost:5439`
- Redis: `localhost:6382`
