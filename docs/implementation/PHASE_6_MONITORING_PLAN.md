# GLAMGO — OBSERVABILITY, LOGGING & ALERTING SPECIFICATION
## Prometheus Metrics, Structured Logging & Health Architecture

**Document Version:** 1.0.0  
**Phase:** Phase 6 — Milestone G Deliverable  
**Stack:** Prometheus Metrics, Structured JSON Logging, Grafana Dashboards  
**Status:** Observability Design & Monitoring Protocol  

---

## 1. Executive Summary

Production launch requires comprehensive visibility into request latency, error distribution, database connection health, payment transaction outcomes, and system saturation. The GlamGo observability architecture introduces:
1. Universal Request Correlation IDs (`X-Request-ID`) tracked across Nginx and FastAPI.
2. Structured JSON logging with automated redaction of sensitive credentials and PII.
3. Prometheus metrics endpoint (`/metrics`) exposing standard RED (Rate, Errors, Duration) telemetry.
4. Deep health check probes distinguishing process liveness from operational dependency readiness.

---

## 2. Request Correlation & Structured Logging

### 2.1 Correlation ID Middleware Flow
```
[Client Request] ───► [Nginx Proxy] ───► [FastAPI Middleware]
 (No Header)          (Generates           (Extracts or creates
                       $request_id)         request_id context var)
                                                    │
                                                    ▼
                                            [Every Log Entry]
                                         Includes "correlation_id"
                                                    │
                                                    ▼
[Client Response] ◄── [Header: X-Request-ID: req_xxxx]
```

### 2.2 JSON Log Schema Specification
Every application log record must output formatted JSON:
```json
{
  "timestamp": "2026-11-12T04:50:00.123Z",
  "level": "INFO",
  "logger": "glamgo.access",
  "correlation_id": "req_8f3a9e2c410b",
  "method": "POST",
  "path": "/api/v1/orders/checkout",
  "status_code": 201,
  "duration_ms": 118.42,
  "user_id": 42,
  "client_ip": "203.0.113.195",
  "message": "Split checkout completed successfully for parent order GG-A8C2"
}
```

### 2.3 Automated Field Redaction
A logging filter automatically redacts sensitive fields matching regex patterns:
- Passwords (`password`, `current_password`, `new_password`)
- Tokens (`token`, `access_token`, `refresh_token`, `Authorization`)
- Payment secrets (`razorpay_key_secret`, `razorpay_signature`, `secret`)
- Financial details (`card_number`, `cvv`, `bank_account_number`)

---

## 3. Prometheus Metrics Catalog

The `/metrics` endpoint exposes Prometheus counters, gauges, and histograms:

| Metric Identifier | Type | Labels | Operational Meaning |
| :--- | :--- | :--- | :--- |
| `glamgo_http_requests_total` | Counter | `method`, `handler`, `status` | Total incoming HTTP requests |
| `glamgo_http_request_duration_seconds` | Histogram | `method`, `handler` | Latency distribution (buckets: 0.01s to 5s) |
| `glamgo_db_connections_in_use` | Gauge | `pool_name` | Number of active checked-out DB connections |
| `glamgo_db_connections_max` | Gauge | `pool_name` | Maximum pool size + overflow capacity |
| `glamgo_redis_cache_hits_total` | Counter | `cache_name` | Successful Redis cache hits |
| `glamgo_redis_cache_misses_total` | Counter | `cache_name` | Redis cache misses triggering DB query |
| `glamgo_orders_created_total` | Counter | `payment_method` | Completed customer orders |
| `glamgo_bookings_created_total` | Counter | `type` (`home`, `salon`) | Completed service appointments |
| `glamgo_payments_status_total` | Counter | `status` (`captured`, `failed`) | Payment gateway verification outcomes |
| `glamgo_escrow_matured_rupees_total` | Counter | `currency` | Total Rupees released from escrow |

---

## 4. Health Check Probe Hierarchy

FastAPI exposes two distinct health probes to facilitate container orchestration:

### 1. Liveness Probe (`GET /health/live`)
- Validates that the Python interpreter and ASGI event loop are responsive.
- Returns `{"status": "alive"}` with HTTP 200 immediately.

### 2. Readiness Probe (`GET /health/ready` or `GET /health`)
- Executes:
  1. `SELECT 1` on PostgreSQL with a 2-second timeout.
  2. `redis.ping()` on Redis with a 1-second timeout.
- If either fails, returns HTTP 503 Service Unavailable:
  ```json
  {
    "status": "degraded",
    "database": "healthy",
    "cache": "unreachable: Connection refused"
  }
  ```

---

## 5. Critical Alerting Rules

| Alert Trigger | Threshold Condition | Evaluation Window | Severity | Action Required |
| :--- | :--- | :---: | :---: | :--- |
| **High Error Rate** | Rate of 5xx responses > 2% of total traffic | 5 Minutes | **P0 (Critical)** | Check backend error logs for crashes or DB failure |
| **Payment Failure Surge** | Failed payments > 5 transactions | 10 Minutes | **P0 (Critical)** | Verify Razorpay API connectivity and webhook HMAC |
| **Database Pool Exhaustion** | Active connections > 85% of total pool | 3 Minutes | **P1 (High)** | Investigate slow queries, connection leaks, or traffic spike |
| **Redis Unreachable** | Redis ping failure count > 3 consecutive checks | 1 Minute | **P1 (High)** | Restart Redis container, check AOF disk corruption |
| **High Latency Degradation** | P95 latency > 750ms | 5 Minutes | **P2 (Medium)** | Check index utilization and CPU saturation |
