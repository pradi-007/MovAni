"""
MOVAni Streaming Engine - Source Health & SSRF Security Guard
Monitors streaming source availability with bounded timeouts, caching,
and enterprise SSRF protections against internal network scanning.
"""

import socket
import ipaddress
import urllib.parse
import urllib.request
import time
from typing import Dict, Any, Optional, Tuple
from datetime import datetime, timezone

from backend.streaming.models import SourceHealthResult

# Disallowed private and cloud-metadata IP ranges for SSRF prevention
BLOCKED_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),       # Loopback
    ipaddress.ip_network("10.0.0.0/8"),        # RFC 1918 Class A
    ipaddress.ip_network("172.16.0.0/12"),     # RFC 1918 Class B
    ipaddress.ip_network("192.168.0.0/16"),    # RFC 1918 Class C
    ipaddress.ip_network("169.254.0.0/16"),    # Link-local / AWS & GCP metadata
    ipaddress.ip_network("100.64.0.0/10"),     # Carrier-grade NAT
    ipaddress.ip_network("::1/128"),           # IPv6 loopback
    ipaddress.ip_network("fe80::/10"),         # IPv6 link-local
    ipaddress.ip_network("fc00::/7"),          # IPv6 unique local
]


class SSRFSecurityGuard:
    """Validates external URLs to prevent Server-Side Request Forgery."""

    @staticmethod
    def is_safe_url(url: str) -> Tuple[bool, str]:
        """
        Validates URL scheme and resolves destination IP to ensure it does not
        target internal, localhost, or cloud-metadata addresses.
        """
        if not url:
            return False, "URL cannot be empty."

        try:
            parsed = urllib.parse.urlparse(url)
        except Exception as e:
            return False, f"Malformed URL: {str(e)}"

        # 1. Scheme restriction: only HTTP and HTTPS
        if parsed.scheme.lower() not in ("http", "https"):
            return False, f"Unsupported URL scheme '{parsed.scheme}'. Only http and https permitted."

        hostname = parsed.hostname
        if not hostname:
            return False, "URL must include a valid hostname."

        # 2. Block direct localhost names
        low_host = hostname.lower()
        if low_host in ("localhost", "127.0.0.1", "0.0.0.0", "::1", "metadata.google.internal", "instance-data"):
            return False, f"Access to restricted hostname '{hostname}' is denied."

        # 3. DNS resolution and IP verification
        try:
            # Resolve all IPs for hostname
            addr_info = socket.getaddrinfo(hostname, None)
            for addr in addr_info:
                ip_str = addr[4][0]
                ip_obj = ipaddress.ip_address(ip_str)
                for blocked_net in BLOCKED_NETWORKS:
                    if ip_obj in blocked_net:
                        return False, f"Resolved IP {ip_str} falls within protected network {blocked_net}."
        except socket.gaierror:
            # Domain cannot be resolved
            return False, f"Could not resolve domain '{hostname}'."
        except Exception as ex:
            return False, f"Security verification error: {str(ex)}"

        return True, "URL passed SSRF security checks."


class SourceHealthMonitor:
    """
    Checks availability of streaming providers and media URLs with bounded timeouts
    and in-memory rate-limiting/caching.
    """
    _health_cache: Dict[str, Dict[str, Any]] = {}
    CACHE_TTL_SECONDS = 300  # 5 minutes cache to prevent excessive provider requests

    @classmethod
    def check_url_health(cls, url: str, source_id: str = "generic", timeout_seconds: float = 3.0) -> SourceHealthResult:
        """
        Checks if a media or provider endpoint is live using HTTP HEAD/GET with range header.
        """
        now = time.time()
        cached = cls._health_cache.get(url)
        if cached and (now - cached["timestamp"] < cls.CACHE_TTL_SECONDS):
            return cached["result"]

        # 1. SSRF Safety Check
        is_safe, reason = SSRFSecurityGuard.is_safe_url(url)
        if not is_safe:
            res = SourceHealthResult(
                source_id=source_id,
                provider_name="Unknown",
                slot_number=0,
                is_healthy=False,
                status="blocked_by_security",
                latency_ms=0,
                error_message=f"SSRF Policy Rejection: {reason}"
            )
            cls._health_cache[url] = {"result": res, "timestamp": now}
            return res

        # 2. HTTP Probe
        start_time = time.time()
        status_code = None
        error_msg = None
        is_healthy = False

        try:
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "MOVAni-StreamHealth/2.0 (+https://movani.org)",
                    "Range": "bytes=0-1024"  # Efficient range request for video streams
                },
                method="GET"
            )
            with urllib.request.urlopen(req, timeout=timeout_seconds) as resp:
                status_code = resp.status
                # 200, 206 (Partial Content), or 302/304 are valid
                if status_code in (200, 206, 302, 304):
                    is_healthy = True
        except urllib.error.HTTPError as he:
            status_code = he.code
            if status_code in (200, 206, 302, 304):
                is_healthy = True
            else:
                error_msg = f"HTTP {status_code}"
        except urllib.error.URLError as ue:
            error_msg = f"Network timeout/error: {str(ue.reason)}"
        except Exception as e:
            error_msg = f"Probe error: {str(e)}"

        latency = int((time.time() - start_time) * 1000)
        res = SourceHealthResult(
            source_id=source_id,
            provider_name=source_id.replace("_", " ").title(),
            slot_number=1,
            is_healthy=is_healthy,
            status="healthy" if is_healthy else ("degraded" if status_code and status_code < 500 else "offline"),
            latency_ms=latency,
            status_code=status_code,
            error_message=error_msg
        )

        cls._health_cache[url] = {"result": res, "timestamp": now}
        return res
