# GlamGo Luxury Beauty Marketplace — Production Deployment Runbook

**Document:** Production Deployment Runbook (`RUNBOOK-DEPLOY-01`)  
**Target Architecture:** Multi-Container Docker Compose / Kubernetes  
**Platform Version:** 1.0.0 (Phase 6 / Final Production Launch)  
**Last Verified:** November 12, 2026  
**Audience:** Site Reliability Engineers, DevOps Engineers, Release Managers  

---

## 1. Pre-Deployment Prerequisites

Before executing a deployment to production or staging environments, ensure all prerequisites are met:

1. **Host Operating System:** Ubuntu 22.04 LTS / 24.04 LTS or Amazon Linux 2023 with kernel >= 5.15.
2. **Container Runtimes:**
   - Docker Engine >= 26.0.0
   - Docker Compose Plugin >= 2.27.0
3. **Network Configuration:**
   - Public Ingress: Ports `80` (HTTP redirect) and `443` (TLS 1.3/HTTPS).
   - Private Network: Bridge network `glamgo_prod_net` (PostgreSQL and Redis must **never** bind to host interfaces `0.0.0.0` or public IPs).
4. **Secrets Availability:** Verified access to the production `.env.production` file generated from secure key-vault storage (AWS Secrets Manager, GCP Secret Manager, or HashiCorp Vault).

---

## 2. Deployment Topology Architecture

```
                    [ Internet Traffic ]
                             │
                             ▼ (HTTPS :443)
              ┌──────────────────────────────┐
              │  Hardened Nginx Reverse Proxy │
              │  - TLS Termination           │
              │  - Gzip Compression (lvl 6)  │
              │  - Static Asset Cache (1y)   │
              │  - Rate Limiting (30 r/s)    │
              └──────────────┬───────────────┘
                             │
            ┌────────────────┴────────────────┐
            │  glamgo_prod_net (Private Net)  │
            │                                 │
            ▼ (HTTP :8000)                    ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│     glamgo_prod_backend   │   │     glamgo_prod_frontend  │
│  - Non-root appuser (10001)│   │  - SPA built via Vite 7   │
│  - Gunicorn (4 workers)   │   │  - Minified JS/CSS        │
│  - FastAPI ASGI engine    │   │  - High cache hit ratio   │
└─────────────┬─────────────┘   └───────────────────────────┘
              │
      ┌───────┴───────┐
      ▼               ▼
┌───────────┐   ┌───────────┐
│   db      │   │   redis   │
│ (PG 16)   │   │ (Redis 7) │
│ Internal  │   │ Internal  │
└───────────┘   └───────────┘
```

---

## 3. Step-by-Step Deployment Procedure

### Step 3.1: Repository State & Source Verification
Clone the verified release tag or commit SHA:
```bash
git clone https://github.com/glamgo/glamgo-marketplace.git /opt/glamgo
cd /opt/glamgo
git checkout tags/v1.0.0-prod
```

### Step 3.2: Environment Configuration Injection
Copy the secured environment file into place with strict POSIX permissions:
```bash
cp /secure/vault/glamgo.env.production /opt/glamgo/.env.production
chmod 600 /opt/glamgo/.env.production
chown root:root /opt/glamgo/.env.production
```

Verify that all mandatory parameters are set:
- `SECRET_KEY` (minimum 32 random characters)
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `ENVIRONMENT=production`
- `ENABLE_DOCS=false`

### Step 3.3: Pre-Deployment Database Backup
Always trigger a pre-deployment binary snapshot before any migration:
```bash
python scripts/backup_and_restore_verify.py --backup-only
```
Verify that the generated dump in `backups/glamgo_db_<timestamp>.dump` is $>100$ KB.

### Step 3.4: Build Production Container Images
Build the production images with caching:
```bash
docker compose -f docker-compose.prod.yml build
```

### Step 3.5: Run Forward-Only Alembic Migrations
Execute database schema updates inside the application container before routing traffic:
```bash
docker compose -f docker-compose.prod.yml run --rm backend alembic upgrade head
```
Verify migration output:
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
0395cd015fed (head)
```

### Step 3.6: Launch Application Stack
Start containers in detached mode:
```bash
docker compose -f docker-compose.prod.yml up -d
```

---

## 4. Post-Deployment Verification (Smoke Tests)

Execute the following automated health checks within 60 seconds of deployment:

### 4.1 Liveness Probe
```bash
curl -f -s http://localhost:8000/health/live | grep '"status":"alive"'
```
Expected output:
```json
{"status":"alive","app":"GlamGo Premium Beauty Marketplace"}
```

### 4.2 Readiness Probe
```bash
curl -f -s http://localhost:8000/health/ready | grep '"status":"ready"'
```
Expected output:
```json
{"status":"ready","database":"healthy","cache":"healthy"}
```

### 4.3 Security Headers Audit
```bash
curl -I -s http://localhost/ | grep -E "Strict-Transport-Security|Content-Security-Policy|X-Frame-Options|X-Content-Type-Options"
```
Ensure `X-Frame-Options: SAMEORIGIN` and `X-Content-Type-Options: nosniff` are present.

### 4.4 Prometheus Metrics Verification
```bash
curl -f -s http://localhost:8000/metrics | grep "glamgo_http_requests_total"
```

---

## 5. Rollback Procedure

If any smoke test fails or error rates exceed 0.5% during the first 15 minutes:

1. **Stop active production containers:**
   ```bash
   docker compose -f docker-compose.prod.yml down
   ```
2. **Restore pre-deployment database snapshot:**
   ```bash
   docker compose -f docker-compose.prod.yml up -d db
   docker cp backups/glamgo_db_pre_deploy.dump glamgo_prod_postgres:/tmp/restore.dump
   docker exec -it glamgo_prod_postgres pg_restore -U glamgo_prod_admin -d glamgo_prod_db --clean --if-exists /tmp/restore.dump
   ```
3. **Switch to previous stable tag:**
   ```bash
   git checkout tags/v1.0.0-stable
   docker compose -f docker-compose.prod.yml up -d
   ```
4. **Verify recovery via `/health/ready`**.
