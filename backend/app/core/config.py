from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "GlamGo Premium Beauty Marketplace"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "glamgo-super-secure-production-jwt-secret-key-cormorant-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = "postgresql+psycopg://glamgo:glamgo_secret@127.0.0.1:5439/glamgo_db"

    # Redis
    REDIS_URL: str = "redis://127.0.0.1:6382/0"

    # Payments (Razorpay)
    RAZORPAY_KEY_ID: str = "rzp_test_glamgo_demo"
    RAZORPAY_KEY_SECRET: str = "glamgo_test_secret_key_demo"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
