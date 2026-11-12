import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.app.core.config import settings
from backend.app.core.database import get_db, engine
from backend.app.core.redis_client import check_redis_health
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

# 3. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/metrics", tags=["Observability"])
def metrics_endpoint():
    """Prometheus exposition endpoint for scraping system telemetry."""
    return get_metrics_response()


@app.get("/health/live", tags=["Health"])
def liveness_probe():
    """Liveness probe: verifies process is alive and ASGI event loop responds."""
    return {"status": "alive", "app": settings.PROJECT_NAME}


@app.get("/health/ready", tags=["Health"])
def readiness_probe(response: Response, db: Session = Depends(get_db)):
    """Readiness probe: validates all underlying infrastructure dependencies (DB, Redis)."""
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception as e:
        logger.warning("Readiness probe DB check failed: %s", e)
        db_ok = False

    redis_ok = False
    try:
        redis_ok = check_redis_health()
    except Exception as e:
        logger.warning("Readiness probe Redis check failed: %s", e)
        redis_ok = False

    is_ready = db_ok and redis_ok
    if not is_ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": "ready" if is_ready else "degraded",
        "database": "healthy" if db_ok else "unhealthy",
        "cache": "healthy" if redis_ok else "unhealthy"
    }


@app.get("/health", tags=["Health"])
def health_check(response: Response, db: Session = Depends(get_db)):
    """Unified health endpoint (backward-compatible with earlier phases)."""
    try:
        db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    redis_ok = check_redis_health()

    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "database": db_status,
        "cache": "healthy" if redis_ok else "degraded"
    }


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to GlamGo Premium Beauty Marketplace API",
        "docs": "/docs" if settings.ENABLE_DOCS else "disabled in production",
        "health": "/health",
        "metrics": "/metrics"
    }
