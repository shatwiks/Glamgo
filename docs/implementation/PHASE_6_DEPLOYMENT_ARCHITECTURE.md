# GLAMGO — DEPLOYMENT ARCHITECTURE & INFRASTRUCTURE SPECIFICATION
## Phase 6 Implementation Blueprint

**Document Version:** 1.0.0  
**Phase:** Phase 6 — Milestone B Deliverable  
**Status:** Architecture Design & Review  

---

## 1. Hosting Topology Options Evaluation

We evaluate three deployment topologies for GlamGo’s production launch based on operational complexity, monthly cost, maintenance overhead, and scalability.

### Option Comparison Matrix

| Dimension | Option 1: Managed Cloud Serverless (Cloud Run + Cloud SQL) | Option 2: Hardened Docker VPS (Hetzner / DO + Cloudflare) | Option 3: Managed Kubernetes (GKE / EKS) |
| :--- | :--- | :--- | :--- |
| **Frontend** | Cloud Storage + Cloud CDN | Nginx container + Cloudflare CDN | Nginx Ingress + Cloudflare |
| **Backend** | Cloud Run (Auto-scaled) | Multi-worker Uvicorn in Docker | Kubernetes Deployment (HPA) |
| **Database** | Cloud SQL PostgreSQL 16 (HA) | PostgreSQL 16 Container / Managed DB | Cloud SQL / Amazon RDS |
| **Redis** | Memorystore for Redis | Redis 7 Container with AOF persistence | Managed Redis cluster |
| **Object Storage** | Google Cloud Storage (Standard) | AWS S3 / Cloudflare R2 | S3 / Cloudflare R2 |
| **SSL / TLS** | Managed by Google Cloud Load Balancer | Let's Encrypt Certbot via Nginx | Cert-Manager with Let's Encrypt |
| **Estimated Cost (Launch)** | **$180 – $320 / month** | **$45 – $85 / month** | **$450 – $800 / month** |
| **Operational Overhead** | Low (Serverless infrastructure) | Moderate (Docker Compose, systemd, crons) | High (Kube manifests, Ingress, CNI) |
| **Recommendation** | **Post-Launch Scale (Month 6+)** | **PRIMARY RECOMMENDATION (Day 1 Launch)** | **Scale-up Phase (100k+ MAU)** |

---

## 2. Recommended Production Architecture (Launch Phase)

For GlamGo's initial launch (0 to 10,000 active monthly users), **Option 2 (Hardened Docker VPS with Cloudflare Edge)** provides the optimum balance of performance, isolation, predictable cost (<$70/mo), and operational simplicity.

```
+---------------------------------------------------------------------------------------+
|                                    CLOUDFLARE EDGE                                    |
|   - DNS & DDoS Mitigation                                                             |
|   - Global CDN Caching (HTML/JS/CSS/WebP Assets)                                      |
|   - WAF & TLS 1.3 Termination (Edge to Browser)                                       |
+-------------------------------------------+-------------------------------------------+
                                            | Full Strict SSL
+-------------------------------------------v-------------------------------------------+
|                           PRODUCTION HOST SERVER (Ubuntu 24.04 LTS)                   |
|                                                                                       |
|   +-------------------------------------------------------------------------------+   |
|   |   EXTERNAL PERIMETER (Only Ports 80 & 443 Exposed to Cloudflare IPs)          |   |
|   |                                                                               |   |
|   |   +-----------------------------------------------------------------------+   |   |
|   |   |   NGINX REVERSE PROXY & STATIC ASSET SERVER                           |   |   |
|   |   |   - Let's Encrypt SSL / Certbot Auto-Renewal                          |   |   |
|   |   |   - Static Assets (/usr/share/nginx/html) with 1-Year Immutable Cache |   |   |
|   |   |   - API Proxy (/api/v1/ -> backend:8000)                              |   |   |
|   |   |   - Security Headers (HSTS, CSP, X-Frame-Options)                     |   |   |
|   |   |   - Rate Limiting (30 req/sec per IP burst 50)                        |   |   |
|   |   +-----------------------------------+-----------------------------------+   |   |
|   +---------------------------------------|---------------------------------------+   |
|                                           | Internal Docker Bridge Network            |
|   +---------------------------------------v---------------------------------------+   |
|   |   ISOLATED INTERNAL DOCKER NETWORK (glamgo_internal — No External Ports)      |   |
|   |                                                                               |   |
|   |   +---------------------------------------+                                   |   |
|   |   |   FASTAPI BACKEND (glamgo_backend)    |                                   |   |
|   |   |   - 4 Workers (Uvicorn / Gunicorn)    |                                   |   |
|   |   |   - Lifespan Engine Warmup & Teardown |                                   |   |
|   |   |   - Prometheus Metrics Exporter       |                                   |   |
|   |   |   - Request Correlation ID Injection  |                                   |   |
|   |   +-------------------+---------------+                                   |   |
|   |                       |                                                       |   |
|   |           +-----------+-----------+                                           |   |
|   |           |                       |                                           |   |
|   |   +-------v-------+       +-------v-------+                                   |   |
|   |   |  POSTGRESQL   |       |    REDIS 7    |                                   |   |
|   |   | (glamgo_db)   |       | (glamgo_redis)|                                   |   |
|   |   | Port 5432     |       | Port 6379     |                                   |   |
|   |   +---------------+       +---------------+                                   |   |
|   |                                                                               |   |
|   +-------------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------------+
```

---

## 3. Network Boundaries & Port Hardening

### Internal Network Rule
In the current development setup, PostgreSQL port 5439 and Redis port 6382 are bound to `0.0.0.0`. In production:
1. **Remove host port mappings** for `db` and `redis`. They must communicate strictly over the internal Docker network `glamgo_internal`.
2. **Backend port 8000** must not be exposed to the public Internet; it is only reachable via Nginx proxying inside Docker.
3. **Host Firewall (UFW):**
   - Allow Port 22 (SSH with Ed25519 key authentication only; password login disabled).
   - Allow Port 80 (HTTP for ACME challenge & HTTPS redirect).
   - Allow Port 443 (HTTPS).
   - Deny all other incoming traffic.

---

## 4. Environment-Specific Configurations

Three distinct configuration profiles must be maintained:

### 1. Development (`docker-compose.dev.yml`)
- Single container instances with host-mapped debug ports (5439, 6382, 8000).
- Live reload enabled for Vite (`npm run dev`) and Uvicorn (`--reload`).
- Permissive CORS for localhost origins.
- SQLite or local PostgreSQL with seeded luxury demo data.

### 2. Staging (`docker-compose.staging.yml`)
- Complete parity with production topology.
- Isolated database (`glamgo_staging_db`) and Redis DB 1.
- Razorpay test keys active (`rzp_test_...`).
- Automated continuous delivery from `master` branch.
- Sanitized mock data mimicking production scale.

### 3. Production (`docker-compose.prod.yml`)
- Zero debug ports exposed to the host.
- Gunicorn supervisor with 4 Uvicorn workers (`(2 * CPU cores) + 1`).
- All credentials loaded securely from Docker secrets or encrypted `.env.prod`.
- Razorpay live keys active with strict webhook signature verification.
- Automated daily backup cron with encrypted offsite replication.

---

## 5. Object Storage & Media Delivery

For customer review attachments, partner credentials, and portfolio lookbooks:
- **Cloudflare R2 or AWS S3 Bucket:** `glamgo-production-assets`.
- **Upload Flow:** Client requests a signed PUT URL from `/api/v1/media/upload-url`; backend generates a 15-minute expiring presigned URL with explicit `Content-Type` and size constraints.
- **Serving Flow:** Delivered via Cloudflare CDN under `https://assets.glamgo.example` with aggressive browser caching.
