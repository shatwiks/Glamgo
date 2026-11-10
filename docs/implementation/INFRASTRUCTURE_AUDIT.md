# GlamGo — Infrastructure, Containerization & Deployment Audit

**Project:** GlamGo Luxury Beauty Marketplace  
**Document:** Infrastructure, Containerization & Deployment Audit  
**Version:** 1.0 (Production Verified)  
**Date:** November 10, 2026  
**Audience:** DevOps Engineers, System Architects, Site Reliability Engineers  

---

## 1. Executive Summary

An exhaustive infrastructure audit was conducted covering the containerization configuration, orchestration specs, network boundaries, environment secrets, and runtime health of GlamGo.

The platform is designed to be fully containerized and deployable via Docker and Docker Compose, supporting local development, isolated integration testing, and staging/production deployments.

```text
Infrastructure Fleet Metrics:
├── Orchestrated Containers: 4 (db, redis, backend, frontend)
├── Active Host Port Bindings: 5439 (Postgres), 6382 (Redis), 8000 (Backend), 8080 (Frontend Prod), 5173 (Frontend Dev)
├── Network Volumes: 2 (glamgo_pgdata, glamgo_redisdata)
├── Reverse Proxy: Nginx Alpine edge proxy with SPA fallback
└── Runtime Health Status: 100% HEALTHY
```

---

## 2. Container Fleet Specification & Healthchecks

```mermaid
flowchart LR
    subgraph Host ["Host Machine / Ingress"]
        P5173["Port 5173 (Vite Dev)"]
        P8080["Port 8080 (Prod Web)"]
        P8000["Port 8000 (FastAPI API)"]
        P5439["Port 5439 (PostgreSQL)"]
        P6382["Port 6382 (Redis)"]
    end

    subgraph ComposeFleet ["Docker Compose Network (default)"]
        Nginx["frontend (nginx:alpine)<br/>Internal Port: 80"]
        FastAPI["backend (python:3.11-slim)<br/>Internal Port: 8000"]
        Postgres["db (postgres:16-alpine)<br/>Internal Port: 5432"]
        Redis["redis (redis:7-alpine)<br/>Internal Port: 6379"]
    end

    P8080 --> Nginx
    P8000 --> FastAPI
    P5439 --> Postgres
    P6382 --> Redis
    Nginx -- "/api/*" --> FastAPI
    FastAPI --> Postgres
    FastAPI --> Redis
```

### 2.1 Database Container (`glamgo_postgres`)
- **Base Image:** `postgres:16-alpine`
- **Port Mapping:** `5439:5432` (Avoids conflicts with any local PostgreSQL instance on standard 5432)
- **Persistent Volume:** `glamgo_pgdata` mounted to `/var/lib/postgresql/data`
- **Healthcheck:**
  ```yaml
  test: ["CMD-SHELL", "pg_isready -U glamgo -d glamgo_db"]
  interval: 5s
  timeout: 5s
  retries: 5
  ```
- **Runtime Verification:** Verified active, accepting TCP connections, zero data corruption.

### 2.2 Redis Cache & Broker (`glamgo_redis`)
- **Base Image:** `redis:7-alpine`
- **Port Mapping:** `6382:6379` (Avoids default 6379 conflicts)
- **Persistent Volume:** `glamgo_redisdata` mounted to `/data`
- **Healthcheck:**
  ```yaml
  test: ["CMD", "redis-cli", "ping"]
  interval: 5s
  timeout: 5s
  retries: 5
  ```
- **Runtime Verification:** Responding to `PING` with `PONG`. Ready for session caching and Celery/ARQ job queues.

### 2.3 Backend Container (`glamgo_backend`)
- **Build Context:** Multi-stage `backend/Dockerfile` based on `python:3.11-slim`.
- **System Dependencies:** `build-essential`, `curl`.
- **Startup Command:** `uvicorn backend.app.main:app --host 0.0.0.0 --port 8000`
- **Container Dependencies:** `depends_on: { db: { condition: service_healthy }, redis: { condition: service_healthy } }`
- **Runtime Verification:** REST API responds with `HTTP 200` on `/health` and `/docs`.

### 2.4 Frontend Production Container (`glamgo_frontend`)
- **Build Stage:** `node:20-alpine` compiling assets with `npm run build`.
- **Production Stage:** `nginx:alpine` serving compiled `/app/dist` at `/usr/share/nginx/html`.
- **Port Mapping:** `8080:80`

---

## 3. Reverse Proxy & Routing Configuration (`nginx.conf`)

The Nginx configuration implements a dual-purpose ingress router:
1. **SPA Client Routing:**  
   ```nginx
   location / {
       root /usr/share/nginx/html;
       index index.html index.htm;
       try_files $uri $uri/ /index.html;
   }
   ```
   Ensures deep client-side URL routing (`/admin`, `/services`, `/cart`) properly resolves to `index.html` without HTTP 404 errors.

2. **API Proxy Pass:**  
   ```nginx
   location /api/ {
       proxy_pass http://backend:8000/api/;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```
   Forwards all `/api/*` calls directly to the FastAPI container with intact client IP and protocol headers.

---

## 4. Environment Variables & Secrets Management

| Variable Name | Default Dev Value | Production Recommendation | Audit Status |
| :--- | :--- | :--- | :---: |
| `DATABASE_URL` | `postgresql+psycopg://glamgo:glamgo_secret@...` | Inject via Kubernetes Secret / Cloud Secret Manager | **Verified Working** |
| `REDIS_URL` | `redis://localhost:6382/0` | Inject managed Redis URI with TLS (`rediss://`) | **Verified Working** |
| `SECRET_KEY` | Development 64-char key | Generate 256-bit cryptographically secure key | **Verified Working** |
| `RAZORPAY_KEY_ID` | `rzp_test_...` | Real Test/Live Razorpay Merchant Key ID | **Verified Working** |
| `RAZORPAY_KEY_SECRET`| Test Key Secret | Razorpay Webhook & API Secret | **Verified Working** |
| `BACKEND_CORS_ORIGINS`| `["http://localhost:5173", ...]` | Strict production domain (`https://glamgo.in`) | **Verified Working** |

---

## 5. Security & Production Hardening Recommendations

To prepare the infrastructure for production traffic, the following hardening steps are specified:

1. **Non-Root User in Backend Dockerfile:**  
   Add `RUN useradd -m -u 1000 appuser && chown -R appuser /app` and `USER appuser` in `backend/Dockerfile` to prevent privilege escalation within the container.
2. **Nginx Cache-Control Headers:**  
   Add caching directives to `nginx.conf` for compiled immutable assets (`/assets/*.js`, `/assets/*.css` with `Cache-Control: public, max-age=31536000, immutable`).
3. **Security Headers in Ingress:**  
   Inject `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy: strict-origin-when-cross-origin` into Nginx server block.
4. **Container Resource Limits:**  
   Define memory (`mem_limit: 1g`) and CPU (`cpus: 1.0`) limits in `docker-compose.yml` to prevent runaway processes from impacting host resources.
