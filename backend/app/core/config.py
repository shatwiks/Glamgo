from typing import List, Union
from pydantic import AnyHttpUrl, field_validator, ValidationInfo
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "GlamGo Premium Beauty Marketplace"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    ENABLE_DOCS: bool = True
    
    # Security
    SECRET_KEY: str = "glamgo-super-secure-production-jwt-secret-key-cormorant-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # Hardened to 30 minutes (was 1440)
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = "postgresql+psycopg://glamgo:glamgo_secret@127.0.0.1:5439/glamgo_db"

    # Redis
    REDIS_URL: str = "redis://127.0.0.1:6382/0"
    REDIS_REQUIRED: bool = False

    # Unpaid booking holds without a gateway payment attempt.
    BOOKING_HOLD_MINUTES: int = 15
    BOOKING_EXPIRY_INTERVAL_SECONDS: int = 60

    # Payments (Razorpay) - loaded exclusively from environment variables / .env
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""

    # SMS Gateway (Optional real delivery: Twilio, Fast2SMS)
    SMS_PROVIDER: str = "auto"
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_NUMBER: str = ""
    FAST2SMS_API_KEY: str = ""
    ALLOW_DEV_OTP_ECHO: bool = False
    ALLOW_DEMO_GIFT_CARDS: bool = False

    # Email Gateway (Optional real delivery: Gmail SMTP, Brevo, Resend)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "GlamGo"
    RESEND_API_KEY: str = ""

    # Internal Scheduled Maintenance Service Token (required in production)
    INTERNAL_MAINTENANCE_TOKEN: str = ""

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "https://glamgo-ricoz.vercel.app",
        "https://glamgo-um5p.vercel.app",
    ]

    @field_validator("DATABASE_URL")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        url = (v or "").strip()
        if url.startswith("postgres://"):
            return "postgresql+psycopg://" + url[len("postgres://"):]
        if url.startswith("postgresql://"):
            return "postgresql+psycopg://" + url[len("postgresql://"):]
        return url

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str, info: ValidationInfo) -> str:
        env = info.data.get("ENVIRONMENT", "development") if info.data else "development"
        insecure_defaults = [
            "glamgo-super-secure-production-jwt-secret-key-cormorant-2026",
            "secret", "change_me", "default_secret"
        ]
        if env.lower() == "production":
            if v in insecure_defaults:
                raise ValueError("CRITICAL SECURITY VIOLATION: Default or insecure SECRET_KEY detected in production. Refusing to boot.")
            if len(v) < 32:
                raise ValueError("CRITICAL SECURITY VIOLATION: SECRET_KEY must be at least 32 characters in production.")
        return v

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
