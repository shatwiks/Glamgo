from typing import Generator, List
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import Connection
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from backend.app.core.config import settings

_is_sqlite = settings.DATABASE_URL.lower().startswith("sqlite")
_engine_kwargs = {"pool_pre_ping": True}
if _is_sqlite:
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    _engine_kwargs.update({
        "pool_size": 20,
        "max_overflow": 40,
        "pool_recycle": 1800,
        "pool_timeout": 30,
    })

engine = create_engine(settings.DATABASE_URL, **_engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def ensure_phase13_schema_columns(bind_engine=None) -> List[str]:
    """Idempotently add additive Phase 13 columns on SQLite and PostgreSQL without data loss."""
    target_engine = bind_engine or engine
    inspector = inspect(target_engine)
    existing_tables = set(inspector.get_table_names())
    dialect_name = target_engine.dialect.name.lower()

    float_type = "DOUBLE PRECISION" if dialect_name == "postgresql" else "FLOAT"
    dt_type = "TIMESTAMP" if dialect_name == "postgresql" else "DATETIME"

    migrations = {
        "salons": [
            ("audience", "VARCHAR(20) NOT NULL DEFAULT 'unisex'"),
            ("city", "VARCHAR(100) NOT NULL DEFAULT 'Mumbai'"),
            ("lat", float_type),
            ("lng", float_type),
        ],
        "professional_profiles": [
            ("audience", "VARCHAR(20) NOT NULL DEFAULT 'unisex'"),
            ("city", "VARCHAR(100) NOT NULL DEFAULT 'Mumbai'"),
            ("area", "VARCHAR(255)"),
            ("lat", float_type),
            ("lng", float_type),
        ],
        "services": [
            ("audience", "VARCHAR(20) NOT NULL DEFAULT 'unisex'"),
            ("service_cities", "VARCHAR(255) NOT NULL DEFAULT 'Mumbai,Bengaluru,Delhi'"),
        ],
        "bookings": [
            ("arrival_otp", "VARCHAR(16)"),
            ("addons_json", "TEXT"),
        ],
        "orders": [
            ("wallet_credit_applied", f"{float_type} NOT NULL DEFAULT 0.0"),
        ],
        "users": [
            ("reset_token_hash", "VARCHAR(128)"),
            ("reset_token_expires_at", dt_type),
            ("reset_attempts", "INTEGER NOT NULL DEFAULT 0"),
            ("otp_code_hash", "VARCHAR(128)"),
            ("otp_expires_at", dt_type),
            ("otp_attempts", "INTEGER NOT NULL DEFAULT 0"),
            ("referral_code", "VARCHAR(32)"),
            ("wallet_credits", f"{float_type} NOT NULL DEFAULT 0.0"),
        ],
    }

    migrations["products"] = [("audience", "VARCHAR(20) NOT NULL DEFAULT 'unisex'")]

    pending = []
    for table_name, columns in migrations.items():
        if table_name not in existing_tables:
            continue
        existing_cols = {col["name"] for col in inspector.get_columns(table_name)}
        for col_name, col_def in columns:
            if col_name not in existing_cols:
                pending.append((table_name, col_name, f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_def}"))

    audience_tables = [t for t in ("services", "salons", "products", "professional_profiles") if t in existing_tables]
    normalize_stmts = [
        f"UPDATE {t} SET audience = 'unisex' WHERE audience IS NULL OR audience = '' OR audience = 'unspecified'"
        for t in audience_tables
    ]

    if not pending and not normalize_stmts:
        return []

    added: List[str] = []
    if isinstance(target_engine, Connection):
        for table_name, col_name, ddl in pending:
            target_engine.execute(text(ddl))
            added.append(f"{table_name}.{col_name}")
        for sql in normalize_stmts:
            target_engine.execute(text(sql))
    else:
        with target_engine.begin() as conn:
            for table_name, col_name, ddl in pending:
                conn.execute(text(ddl))
                added.append(f"{table_name}.{col_name}")
            for sql in normalize_stmts:
                conn.execute(text(sql))

    return added


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
