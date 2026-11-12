import time
import statistics
import concurrent.futures
from fastapi.testclient import TestClient


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


def test_concurrent_catalog_load(client: TestClient):
    """Simulates concurrent requests hitting product and service catalog endpoints."""
    concurrency = 20
    urls = [
        "/api/v1/products/",
        "/api/v1/services/",
        "/api/v1/salons/",
        "/api/v1/professionals/"
    ]

    durations = []
    errors = []

    def make_request(idx):
        url = urls[idx % len(urls)]
        t0 = time.perf_counter()
        resp = client.get(url)
        t1 = time.perf_counter()
        if resp.status_code != 200:
            errors.append((url, resp.status_code))
        return t1 - t0

    start_total = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
        results = list(executor.map(make_request, range(concurrency)))
    total_elapsed = time.perf_counter() - start_total

    durations.extend(results)
    stats = compute_latencies(durations)
    rps = round(concurrency / total_elapsed, 2)

    print(f"\n--- Catalog Concurrency Benchmark ({concurrency} workers) ---")
    print(f"Total time: {total_elapsed:.3f}s | Throughput: {rps} req/s")
    print(f"Latency P50: {stats['p50_ms']}ms | P95: {stats['p95_ms']}ms | P99: {stats['p99_ms']}ms | Mean: {stats['mean_ms']}ms")
    print(f"Errors: {len(errors)}")

    assert len(errors) == 0, f"Encountered errors: {errors}"
    assert rps >= 40, f"Throughput below expectation: {rps} req/s"
    assert stats["p95_ms"] < 600, f"P95 latency exceeded test SLA: {stats['p95_ms']}ms"


def test_concurrent_health_and_readiness_load(client: TestClient):
    """Simulates concurrent requests against dual-probe health and metrics endpoints."""
    concurrency = 20
    endpoints = ["/health/live", "/health/ready", "/health"]
    durations = []
    errors = []

    def make_request(idx):
        url = endpoints[idx % len(endpoints)]
        t0 = time.perf_counter()
        resp = client.get(url)
        t1 = time.perf_counter()
        if resp.status_code != 200:
            errors.append((url, resp.status_code))
        return t1 - t0

    start_total = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
        results = list(executor.map(make_request, range(concurrency)))
    total_elapsed = time.perf_counter() - start_total

    durations.extend(results)
    stats = compute_latencies(durations)
    rps = round(concurrency / total_elapsed, 2)

    print(f"\n--- Health & Readiness Benchmark ({concurrency} workers) ---")
    print(f"Total time: {total_elapsed:.3f}s | Throughput: {rps} req/s")
    print(f"Latency P50: {stats['p50_ms']}ms | P95: {stats['p95_ms']}ms | P99: {stats['p99_ms']}ms")
    print(f"Errors: {len(errors)}")

    assert len(errors) == 0
    assert rps >= 35
    assert stats["p95_ms"] < 500
