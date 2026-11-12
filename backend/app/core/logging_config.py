import logging
import time
import secrets
import json
from contextvars import ContextVar
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from backend.app.core.config import settings
from backend.app.core.metrics import HTTP_REQUESTS_TOTAL, HTTP_REQUEST_DURATION_SECONDS

# Context variable to store correlation ID across async execution contexts
correlation_id_ctx: ContextVar[str] = ContextVar("correlation_id", default="")


def get_correlation_id() -> str:
    return correlation_id_ctx.get()


class JSONLogFormatter(logging.Formatter):
    """Formats log records as structured JSON with correlation ID and PII redaction."""
    SENSITIVE_KEYS = {"password", "secret", "token", "access_token", "refresh_token", "authorization", "razorpay_signature"}

    def format(self, record: logging.LogRecord) -> str:
        log_obj = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "correlation_id": get_correlation_id() or "-",
            "message": record.getMessage()
        }
        if hasattr(record, "props") and isinstance(record.props, dict):
            # Redact sensitive values
            sanitized = {}
            for k, v in record.props.items():
                if any(s in k.lower() for s in self.SENSITIVE_KEYS):
                    sanitized[k] = "[REDACTED]"
                else:
                    sanitized[k] = v
            log_obj.update(sanitized)

        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_obj)


def configure_structured_logging():
    handler = logging.StreamHandler()
    handler.setFormatter(JSONLogFormatter())
    root_logger = logging.getLogger()
    # Configure handlers cleanly
    root_logger.setLevel(logging.INFO)
    # Avoid duplicate handlers
    if not any(isinstance(h, logging.StreamHandler) and isinstance(h.formatter, JSONLogFormatter) for h in root_logger.handlers):
        root_logger.addHandler(handler)


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        cid = request.headers.get("X-Request-ID") or f"req_{secrets.token_hex(6)}"
        correlation_id_ctx.set(cid)
        request.state.correlation_id = cid

        start_time = time.perf_counter()
        response = await call_next(request)
        duration = time.perf_counter() - start_time

        response.headers["X-Request-ID"] = cid

        # Record Prometheus metrics (strip dynamic path segments for clean cardinalities)
        path = request.url.path
        # Normalize IDs in path for Prometheus label
        normalized_path = path
        if path.startswith("/api/v1"):
            segments = path.split("/")
            # Replace numeric or hex IDs with {id}
            normalized_segments = [
                "{id}" if (seg.isdigit() or len(seg) > 16 or seg.startswith("GG") or seg.startswith("order_")) else seg
                for seg in segments
            ]
            normalized_path = "/".join(normalized_segments)

        HTTP_REQUESTS_TOTAL.labels(
            method=request.method,
            path_template=normalized_path,
            status_code=str(response.status_code)
        ).inc()

        HTTP_REQUEST_DURATION_SECONDS.labels(
            method=request.method,
            path_template=normalized_path
        ).observe(duration)

        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Defense-in-depth security headers
        headers = response.headers
        headers["X-Content-Type-Options"] = "nosniff"
        headers["X-Frame-Options"] = "SAMEORIGIN"
        headers["X-XSS-Protection"] = "1; mode=block"
        headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # CSP allows fonts from Google Fonts and scripts from self
        headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "img-src 'self' https: data: blob:; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "connect-src 'self' https://api.razorpay.com; "
            "frame-ancestors 'none';"
        )
        headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=(self)"
        
        if settings.ENVIRONMENT.lower() == "production":
            headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"

        return response
