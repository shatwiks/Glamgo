from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.api.v1.api import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-ready FastAPI REST API for the GlamGo Premium Beauty Marketplace.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "database": db_status
    }


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to GlamGo Premium Beauty Marketplace API",
        "docs": "/docs",
        "health": "/health"
    }
