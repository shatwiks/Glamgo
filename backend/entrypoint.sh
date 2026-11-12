#!/usr/bin/env bash
# ==============================================================================
# GlamGo Backend Production Entrypoint Script
# Handles automated database connectivity checks, schema migrations, and server exec
# ==============================================================================
set -e

echo "[GlamGo Entrypoint] Starting container entrypoint initialization..."

# 1. Wait for PostgreSQL database readiness
echo "[GlamGo Entrypoint] Checking database connectivity..."
python - <<'EOF'
import sys
import time
import logging
from sqlalchemy import create_engine, text
from backend.app.core.config import settings

max_retries = 30
retry_interval = 2

for attempt in range(1, max_retries + 1):
    try:
        engine = create_engine(settings.DATABASE_URL, connect_args={"connect_timeout": 3})
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print(f"[GlamGo Entrypoint] Database is ready (verified on attempt {attempt}).")
        sys.exit(0)
    except Exception as e:
        print(f"[GlamGo Entrypoint] Waiting for database connection (attempt {attempt}/{max_retries})... Error: {e}")
        time.sleep(retry_interval)

print("[GlamGo Entrypoint] ERROR: Database connection failed after maximum retries.", file=sys.stderr)
sys.exit(1)
EOF

# 2. Run Alembic schema migrations
if [ "${AUTO_MIGRATE:-true}" = "true" ]; then
    echo "[GlamGo Entrypoint] Applying pending database migrations (alembic upgrade head)..."
    alembic upgrade head
    echo "[GlamGo Entrypoint] Database migrations applied successfully."
else
    echo "[GlamGo Entrypoint] AUTO_MIGRATE is set to false. Skipping automated migration."
fi

# 3. Optional initial data seed
if [ "${SEED_ON_STARTUP:-false}" = "true" ]; then
    echo "[GlamGo Entrypoint] SEED_ON_STARTUP is enabled. Running seed service..."
    python -m backend.app.services.seed_service || echo "[GlamGo Entrypoint] Seed service finished."
fi

# 4. Hand off execution to CMD (Gunicorn multi-worker)
echo "[GlamGo Entrypoint] Executing primary application process: $@"
exec "$@"
