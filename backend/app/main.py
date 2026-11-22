import hmac
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Header, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.app.core.config import settings
from backend.app.core.database import get_db, engine, ensure_phase13_schema_columns
from backend.app.core.redis_client import check_redis_health, get_redis_status
from backend.app.core.logging_config import (
    configure_structured_logging,
    CorrelationIdMiddleware,
    SecurityHeadersMiddleware
)
from backend.app.core.metrics import get_metrics_response
from backend.app.api.v1.api import api_router

configure_structured_logging()
logger = logging.getLogger("glamgo.app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup Lifecycle ---
    logger.info("Initializing GlamGo Marketplace Application (env=%s)...", settings.ENVIRONMENT)
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database connection verified successfully.")
        added_cols = ensure_phase13_schema_columns(engine)
        if added_cols:
            logger.info("Applied Phase 13 additive schema columns: %s", ", ".join(added_cols))
    except Exception as e:
        logger.error("Database connection failed on startup: %s", e)

    redis_ok = check_redis_health()
    if redis_ok:
        logger.info("Redis cache/lock cluster connected successfully.")
    else:
        logger.warning("Redis is currently unreachable; operating in degraded mode.")

    yield

    # --- Shutdown Lifecycle ---
    logger.info("Shutting down GlamGo Marketplace Application...")
    try:
        engine.dispose()
        logger.info("Database connection pool cleanly disposed.")
    except Exception as e:
        logger.error("Error disposing database engine: %s", e)


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-ready FastAPI REST API for the GlamGo Premium Beauty Marketplace.",
    version="1.0.0",
    docs_url="/docs" if settings.ENABLE_DOCS else None,
    redoc_url="/redoc" if settings.ENABLE_DOCS else None,
    lifespan=lifespan
)

# 1. Security Headers Middleware (Outer)
app.add_middleware(SecurityHeadersMiddleware)

# 2. Correlation ID & Latency Telemetry Middleware
app.add_middleware(CorrelationIdMiddleware)

# 3. CORS Middleware (strictly scoped to GlamGo origins; never match arbitrary *.vercel.app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"^https:\/\/(?:glamgo-ricoz|glamgo-um5p)(?:-[a-z0-9-]+)?\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID", "X-Requested-With", "Accept"],
)

# 4. Response Compression
app.add_middleware(GZipMiddleware, minimum_size=500)

# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/metrics", tags=["Observability"])
def metrics_endpoint(x_maintenance_token: str | None = Header(default=None)):
    """Prometheus exposition endpoint for scraping system telemetry."""
    if settings.ENVIRONMENT.lower() == "production":
        expected = settings.INTERNAL_MAINTENANCE_TOKEN
        if not expected or not x_maintenance_token or not hmac.compare_digest(x_maintenance_token, expected):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Metrics access restricted in production.")
    return get_metrics_response()


@app.get("/health/live", tags=["Health"])
def liveness_probe():
    """Liveness probe: verifies process is alive and ASGI event loop responds."""
    return {"status": "alive", "app": settings.PROJECT_NAME}


def _check_db_ping(db: Session) -> bool:
    bind = getattr(db, "bind", None)
    if bind is not None:
        with bind.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    db.execute(text("SELECT 1"))
    return True


@app.get("/health/ready", tags=["Health"])
def readiness_probe(response: Response, db: Session = Depends(get_db)):
    """Readiness probe: validates required DB and Redis dependencies per REDIS_REQUIRED policy."""
    db_ok = False
    try:
        db_ok = _check_db_ping(db)
    except Exception as e:
        logger.warning("Readiness probe DB check failed: %s", e)
        db_ok = False

    cache_status, cache_ready = get_redis_status()
    is_ready = db_ok and cache_ready
    if not is_ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": "ready" if is_ready else "degraded",
        "database": "healthy" if db_ok else "unhealthy",
        "cache": cache_status,
        "redis_required": bool(settings.REDIS_REQUIRED),
    }


@app.get("/health", tags=["Health"])
def health_check(response: Response, db: Session = Depends(get_db)):
    """Unified health endpoint (backward-compatible with earlier phases)."""
    try:
        _check_db_ping(db)
        db_status = "healthy"
    except Exception as e:
        logger.warning("Health check DB ping failed: %s", e)
        db_status = "unhealthy"

    cache_status, _ = get_redis_status()

    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "database": db_status,
        "cache": cache_status if cache_status != "unhealthy" else "degraded",
    }


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to GlamGo Premium Beauty Marketplace API",
        "docs": "/docs" if settings.ENABLE_DOCS else "disabled in production",
        "health": "/health",
        "metrics": "/metrics"
    }
