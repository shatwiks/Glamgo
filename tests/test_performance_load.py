import time
import statistics
import concurrent.futures
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal, get_db


def compute_latencies(durations):
    durations_ms = [d * 1000 for d in durations]
    durations_ms.sort()
    n = len(durations_ms)
    p50 = statistics.median(durations_ms)
    p95 = durations_ms[int(n * 0.95)] if n > 0 else 0
    p99 = durations_ms[int(n * 0.99)] if n > 0 else 0
    return {
        "count": n,
        "p50_ms": round(p50, 2),
        "p95_ms": round(p95, 2),
        "p99_ms": round(p99, 2),
        "mean_ms": round(statistics.mean(durations_ms), 2)
    }


def test_concurrent_catalog_load():
    """Simulates concurrent requests hitting product and service catalog endpoints with independent sessions."""
    concurrency = 20
    urls = [
        "/api/v1/products/",
        "/api/v1/services/",
        "/api/v1/salons/",
        "/api/v1/professionals/"
    ]

    durations = []
    errors = []

    # Use standard app dependency without a single shared session override across 20 threads
    with TestClient(app) as client:
        def make_request(idx):
            url = urls[idx % len(urls)]
            t0 = time.perf_counter()
            resp = client.get(url)
            t1 = time.perf_counter()
            if resp.status_code != 200:
                errors.append((url, resp.status_code))
            return t1 - t0

        start_total = time.perf_counter()
        # Concurrently execute requests against the catalog
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
            results = list(executor.map(make_request, range(concurrency)))
        total_elapsed = time.perf_counter() - start_total

    durations.extend(results)

    stats = compute_latencies(durations)
    rps = concurrency / total_elapsed if total_elapsed > 0 else 0

    assert len(errors) == 0, f"Errors encountered during load test: {errors}"
    assert stats["p50_ms"] < 600, f"P50 latency too high: {stats['p50_ms']}ms"
    assert rps > 10, f"RPS too low: {rps:.2f}"


def test_concurrent_health_and_readiness_load(client: TestClient):
    """Simulates high-throughput probe requests to verify lightweight health responses under load."""
    concurrency = 50
    urls = [
        "/health",
        "/health/live",
        "/health/ready",
        "/metrics"
    ]

    durations = []
    errors = []

    def make_probe(idx):
        url = urls[idx % len(urls)]
        t0 = time.perf_counter()
        resp = client.get(url)
        t1 = time.perf_counter()
        if resp.status_code != 200:
            errors.append((url, resp.status_code))
        return t1 - t0

    start_total = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(make_probe, range(concurrency)))
    total_elapsed = time.perf_counter() - start_total

    durations.extend(results)

    stats = compute_latencies(durations)
    rps = concurrency / total_elapsed if total_elapsed > 0 else 0

    assert len(errors) == 0, f"Probe errors encountered: {errors}"
    assert stats["p50_ms"] < 250, f"Health probe P50 too high: {stats['p50_ms']}ms"
    assert rps >= 35, f"Probe throughput too low: {rps:.2f} rps"
