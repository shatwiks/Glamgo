import time
from typing import Callable
from fastapi import Request, Response
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST

# Standard HTTP metrics
HTTP_REQUESTS_TOTAL = Counter(
    "glamgo_http_requests_total",
    "Total incoming HTTP requests",
    ["method", "path_template", "status_code"]
)

HTTP_REQUEST_DURATION_SECONDS = Histogram(
    "glamgo_http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "path_template"],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0]
)

# Business metrics
ORDERS_CREATED_TOTAL = Counter(
    "glamgo_orders_created_total",
    "Total orders created",
    ["status"]
)

BOOKINGS_CREATED_TOTAL = Counter(
    "glamgo_bookings_created_total",
    "Total bookings confirmed",
    ["service_type"]
)

PAYMENT_VERIFICATIONS_TOTAL = Counter(
    "glamgo_payment_verifications_total",
    "Payment verification attempts",
    ["status"]
)

REDIS_CACHE_HITS_TOTAL = Counter(
    "glamgo_redis_cache_hits_total",
    "Redis cache hits count",
    ["cache_key"]
)

REDIS_CACHE_MISSES_TOTAL = Counter(
    "glamgo_redis_cache_misses_total",
    "Redis cache misses count",
    ["cache_key"]
)

DB_POOL_IN_USE = Gauge(
    "glamgo_db_connections_in_use",
    "Number of database connections currently checked out of pool"
)


def get_metrics_response() -> Response:
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
