#!/usr/bin/env python3
"""
MOVAni Ultra Performance & High Concurrency Load Test Suite
Evaluates throughput, latency distribution (p50, p90, p95, p99), error rates,
and architectural capacity boundaries for MOVAni streaming platform.
"""

import time
import json
import statistics
import concurrent.futures
import urllib.request
import urllib.error
from typing import List, Dict, Any

BASE_URL = "http://127.0.0.1:5000"

ENDPOINTS = [
    {"name": "Catalog API", "path": "/api/catalog"},
    {"name": "Kannada Discovery", "path": "/api/kannada"},
    {"name": "Instant Search", "path": "/api/search?q=kantara"},
    {"name": "OTT Playback Manifest", "path": "/api/ott/playback/564147"},
    {"name": "System Health", "path": "/api/health"},
]

def make_request(url: str, headers: Dict[str, str] = None, timeout: float = 5.0) -> Dict[str, Any]:
    """Execute a single HTTP request and record exact response timing and status."""
    if headers is None:
        headers = {
            "Accept-Encoding": "gzip",
            "User-Agent": "MOVAni-LoadTester/1.0",
            "X-MOVAni-LoadTest": "benchmark_authorized"
        }
    
    start = time.perf_counter()
    status = 0
    size = 0
    error = None

    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            status = resp.status
            content = resp.read()
            size = len(content)
    except urllib.error.HTTPError as e:
        status = e.code
        error = str(e)
    except Exception as e:
        status = 0
        error = str(e)

    duration_ms = (time.perf_counter() - start) * 1000.0
    return {
        "status": status,
        "latency_ms": duration_ms,
        "size_bytes": size,
        "error": error
    }

def run_concurrent_tier(concurrency: int, total_requests: int, endpoint_path: str) -> Dict[str, Any]:
    """Run a burst of concurrent requests against an endpoint and calculate latency percentiles."""
    url = f"{BASE_URL}{endpoint_path}"
    latencies = []
    statuses = []
    errors = 0
    total_bytes = 0

    t_start = time.perf_counter()

    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [executor.submit(make_request, url) for _ in range(total_requests)]
        for f in concurrent.futures.as_completed(futures):
            res = f.result()
            latencies.append(res["latency_ms"])
            statuses.append(res["status"])
            total_bytes += res["size_bytes"]
            if res["status"] != 200:
                errors += 1

    total_time = time.perf_counter() - t_start
    rps = total_requests / total_time if total_time > 0 else 0

    latencies.sort()
    n = len(latencies)
    p50 = latencies[int(n * 0.50)] if n else 0
    p90 = latencies[int(n * 0.90)] if n else 0
    p95 = latencies[int(n * 0.95)] if n else 0
    p99 = latencies[int(n * 0.99)] if n else 0
    mean_lat = statistics.mean(latencies) if n else 0

    return {
        "concurrency": concurrency,
        "total_requests": total_requests,
        "successful_requests": total_requests - errors,
        "failed_requests": errors,
        "error_rate_pct": round((errors / total_requests) * 100, 2) if total_requests else 0,
        "duration_sec": round(total_time, 3),
        "throughput_rps": round(rps, 2),
        "mean_latency_ms": round(mean_lat, 2),
        "p50_ms": round(p50, 2),
        "p90_ms": round(p90, 2),
        "p95_ms": round(p95, 2),
        "p99_ms": round(p99, 2),
        "max_ms": round(max(latencies), 2) if latencies else 0,
        "avg_size_kb": round((total_bytes / total_requests) / 1024, 2) if total_requests else 0
    }

def print_capacity_modeling():
    """Calculates network and infrastructure bandwidth math for 100,000 concurrent viewers."""
    print("\n" + "=" * 80)
    print("MOVAni 100,000 CONCURRENT USERS — INFRASTRUCTURE & CAPACITY MATH")
    print("=" * 80)
    
    scenarios = [
        {"profile": "Mobile / SD 480p", "bitrate_mbps": 1.0},
        {"profile": "Full HD 1080p ABR Standard", "bitrate_mbps": 3.0},
        {"profile": "4K Ultra HD 60FPS / Dolby Vision", "bitrate_mbps": 5.0},
        {"profile": "Premium Cinema 4K High-Bitrate", "bitrate_mbps": 12.0}
    ]

    users = 100000

    print(f"\nTarget Audience: {users:,} simultaneous active video streams")
    print(f"{'Stream Profile':<35} | {'Bandwidth (Gbps)':<18} | {'Bandwidth (TB/hr)':<18} | {'Monthly Egress (PB)'}")
    print("-" * 95)

    for sc in scenarios:
        mbps = sc["bitrate_mbps"]
        total_gbps = (users * mbps) / 1000.0  # Megabits to Gigabits
        bytes_per_sec = (users * mbps * 1_000_000) / 8.0
        tb_per_hour = (bytes_per_sec * 3600) / (1024 ** 4)
        pb_per_month = (tb_per_hour * 24 * 30) / 1024.0

        print(f"{sc['profile']:<35} | {total_gbps:>10.1f} Gbps   | {tb_per_hour:>10.2f} TB/hr  | {pb_per_month:>10.2f} PB/mo")

    print("\n[KEY ARCHITECTURAL IMPLICATION]")
    print("1. A single application server or single cluster CANNOT directly egress 100 - 500 Gbps of raw video.")
    print("2. Raw video segments (.ts/.m4s chunks) MUST be offloaded 100% to Multi-CDN Edge Networks (Cloudflare / Fastly / Akamai / AWS CloudFront).")
    print("3. The MOVAni Python/Flask backend ONLY handles API metadata, auth, sessions, and catalog lookups (~5-10 KB per request).")
    print("4. At 100,000 concurrent users with 1 API hit every 2 minutes = ~833 API requests/sec (RPS) hit the backend cluster.")
    print("5. With 95% Edge CDN caching on public catalog APIs, the origin server only receives ~42 RPS!")
    print("=" * 80 + "\n")

def run_suite():
    print("=" * 80)
    print("STARTING MOVAni HIGH-CONCURRENCY PERFORMANCE VERIFICATION")
    print(f"Target Server: {BASE_URL}")
    print("=" * 80)

    # 1. Warm-up and Verify Availability
    try:
        init_res = make_request(f"{BASE_URL}/api/health")
        if init_res["status"] != 200:
            print(f"Server health check failed: {init_res}")
            return
        print(f"Server is HEALTHY (Response time: {init_res['latency_ms']:.2f}ms)")
    except Exception as e:
        print(f"Unable to reach server: {e}")
        return

    # 2. Run concurrency tests across endpoints
    concurrency_tiers = [
        {"concurrency": 20, "requests": 100, "label": "Tier 1: 20 Concurrent Workers (Baseline Load)"},
        {"concurrency": 50, "requests": 250, "label": "Tier 2: 50 Concurrent Workers (Medium Spike)"},
        {"concurrency": 100, "requests": 500, "label": "Tier 3: 100 Concurrent Workers (Heavy Spike)"},
    ]

    all_results = []

    for tier in concurrency_tiers:
        print(f"\n>>> Running {tier['label']} ({tier['requests']} requests @ c={tier['concurrency']})")
        for ep in ENDPOINTS:
            res = run_concurrent_tier(tier["concurrency"], tier["requests"], ep["path"])
            res["endpoint"] = ep["name"]
            res["tier"] = tier["label"]
            all_results.append(res)
            print(f"  [{ep['name']:<22}] RPS: {res['throughput_rps']:>7.1f} | p50: {res['p50_ms']:>6.1f}ms | p95: {res['p95_ms']:>6.1f}ms | p99: {res['p99_ms']:>6.1f}ms | Err: {res['error_rate_pct']}%")

    # 3. Print Capacity Model for 100,000 users
    print_capacity_modeling()

    # 4. Save results to JSON file
    with open("load_test_results.json", "w", encoding="utf-8") as f:
        json.dump(all_results, f, indent=2)
    print("Load test metrics written to load_test_results.json")

if __name__ == "__main__":
    run_suite()
