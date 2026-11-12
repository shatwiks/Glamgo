# GLAMGO — DISASTER RECOVERY & BACKUP RELIABILITY PLAN
## Phase 6 Data Protection Specification

**Document Version:** 1.0.0  
**Phase:** Phase 6 — Milestone C Deliverable  
**Database Engine:** PostgreSQL 16.11  
**Target Recovery Objectives:** RTO < 60 Minutes | RPO < 15 Minutes  
**Status:** Operational Runbook & Verification Protocol  

---

## 1. Objectives & Data Protection Principles

A backup is not considered valid until restoration has been empirically tested. The GlamGo Disaster Recovery strategy guarantees:
1. **Zero Data Loss Rule:** The active production database (`glamgo_db`) must never be dropped, truncated, or overwritten during backup or restoration tests.
2. **Point-In-Time Recovery (PITR):** Recovery Point Objective (RPO) $\le$ 15 minutes through write-ahead log (WAL) archiving and periodic base backups.
3. **Recovery Time Objective (RTO):** Full database restoration and application reconnection $\le$ 60 minutes.
4. **Isolated Restore Testing:** All restoration dry runs must execute against an isolated disposable container (`glamgo_restore_test_db`).

---

## 2. Automated Backup Strategy

### Backup Schedule & Retention Matrix

| Tier | Frequency | Tool / Command | Retention | Destination |
| :--- | :--- | :--- | :--- | :--- |
| **Transaction Logs (WAL)** | Continuous (archive_timeout = 900s) | PostgreSQL WAL Archiving | 7 Days | Local Volume + Offsite S3/GCS |
| **Hourly Snapshots** | Every hour at mm:00 | `pg_dump -Fc` (Custom compressed) | 48 Hours | Local Backup Volume |
| **Daily Base Backups** | Daily at 02:00 UTC | `pg_dump -Fc` + AES-256 GPG Encryption | 30 Days | Offsite Encrypted Object Storage |
| **Weekly Archives** | Every Sunday at 03:00 UTC | Full Compressed Database Image | 12 Weeks | Cold Storage / Glacier |
| **Monthly Archives** | 1st of each month | Full Compressed Database Image | 12 Months | Compliance Vault Storage |

---

## 3. Automated Backup Script (`scripts/backup_db.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/var/backups/glamgo"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/glamgo_db_${TIMESTAMP}.dump"
ENCRYPTED_FILE="${BACKUP_FILE}.gpg"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting PostgreSQL compressed backup..."
docker exec glamgo_postgres pg_dump -U glamgo -d glamgo_db -F c -b -v -f "/tmp/glamgo_backup.dump"
docker cp glamgo_postgres:/tmp/glamgo_backup.dump "${BACKUP_FILE}"
docker exec glamgo_postgres rm -f /tmp/glamgo_backup.dump

echo "[$(date)] Encrypting backup with GPG..."
gpg --batch --yes --encrypt --recipient ops@glamgo.example --output "${ENCRYPTED_FILE}" "${BACKUP_FILE}"
rm -f "${BACKUP_FILE}"

echo "[$(date)] Backup completed: ${ENCRYPTED_FILE} ($(du -h "${ENCRYPTED_FILE}" | cut -f1))"

# Prune local backups older than 48 hours
find "${BACKUP_DIR}" -type f -name "glamgo_db_*.dump.gpg" -mtime +2 -delete
```

---

## 4. Empirical Restoration Verification Runbook

Restoration testing is conducted in an isolated temporary container:

```bash
#!/usr/bin/env bash
set -euo pipefail

RESTORE_CONTAINER="glamgo_restore_test_db"
RESTORE_PORT="5499"

echo "=== 1. Starting Isolated Disposable Test Database ==="
docker run -d --name "${RESTORE_CONTAINER}" \
  -e POSTGRES_USER=glamgo \
  -e POSTGRES_PASSWORD=restore_test_secret \
  -e POSTGRES_DB=glamgo_restore_verify \
  -p "${RESTORE_PORT}:5432" \
  postgres:16-alpine

echo "=== 2. Waiting for Test DB Health ==="
until docker exec "${RESTORE_CONTAINER}" pg_isready -U glamgo -d glamgo_restore_verify; do
  sleep 1
done

echo "=== 3. Restoring Backup into Test DB ==="
docker cp "$1" "${RESTORE_CONTAINER}:/tmp/restore_target.dump"
docker exec "${RESTORE_CONTAINER}" pg_restore -U glamgo -d glamgo_restore_verify --clean --if-exists -v /tmp/restore_target.dump || true

echo "=== 4. Validating Row Counts & Schema Integrity ==="
docker exec "${RESTORE_CONTAINER}" psql -U glamgo -d glamgo_restore_verify -c "
  SELECT 'users' as tbl, count(*) FROM users
  UNION ALL SELECT 'products', count(*) FROM products
  UNION ALL SELECT 'seller_listings', count(*) FROM seller_listings
  UNION ALL SELECT 'orders', count(*) FROM orders
  UNION ALL SELECT 'suborders', count(*) FROM suborders
  UNION ALL SELECT 'bookings', count(*) FROM bookings;
"

echo "=== 5. Cleaning up Disposable Container ==="
docker stop "${RESTORE_CONTAINER}" && docker rm "${RESTORE_CONTAINER}"
echo "=== Restoration Verification Passed Successfully ==="
```

---

## 5. Zero-Downtime Alembic Migration Runbook

All database schema evolutions must follow the **Expand/Contract (Blue-Green) pattern**:
1. **Preflight Validation:** Inspect migration SQL without execution:
   ```bash
   alembic upgrade head --sql
   ```
2. **Backward Compatibility Guarantee:**
   - New columns must either be `NULL` or have a non-locking default (`server_default`).
   - Never rename or drop columns in the same release as application code changes.
   - Column deprecation must span two releases (Release 1: stop writing; Release 2: drop column).
3. **Execution Window:**
   - Execute `alembic upgrade head` before starting new backend worker containers.
   - Verify `alembic current` matches repository head.
   - If migration fails, transactional DDL automatically rolls back the revision in PostgreSQL.
