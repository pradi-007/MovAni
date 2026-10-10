#!/usr/bin/env python3
"""
Unit Tests for MOVAni Enterprise Security Shield
Verifies:
- HTTP Security Headers (CSP, X-Frame-Options, X-Content-Type-Options, Permissions-Policy, Server token masking)
- Anti-Path-Traversal and Anti-Injection defenses
- IP Rate Limiting (Anti-DDoS / Anti-Scraping)
- Sanitized error responses
"""

import unittest
from backend.app import app, shield


class TestSecurityShield(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_security_headers_present_on_api(self):
        """Verify OWASP-compliant security headers on all responses."""
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)

        # Check critical security headers
        self.assertIn("Content-Security-Policy", res.headers)
        self.assertEqual(res.headers.get("X-Content-Type-Options"), "nosniff")
        self.assertEqual(res.headers.get("X-Frame-Options"), "SAMEORIGIN")
        self.assertEqual(res.headers.get("X-XSS-Protection"), "1; mode=block")
        self.assertEqual(res.headers.get("Server"), "MOVAni-Enterprise-Shield/4.0")
        self.assertIn("frame-ancestors 'self'", res.headers.get("Content-Security-Policy"))

    def test_path_traversal_blocked(self):
        """Verify that directory traversal attempts are blocked with HTTP 403."""
        # Attempt traversal attack in path
        res = self.client.get('/api/catalog/..%2f..%2fetc%2fpasswd')
        self.assertEqual(res.status_code, 403)
        data = res.get_json()
        self.assertEqual(data.get("status"), 403)
        self.assertIn("Security Shield", data.get("message"))

    def test_sql_injection_blocked(self):
        """Verify that SQL injection strings in query parameters are blocked."""
        res = self.client.get('/api/catalog?q=test+union+select+1,2,3')
        self.assertEqual(res.status_code, 403)

    def test_xss_vector_blocked(self):
        """Verify that XSS script payload attempts are blocked with HTTP 403."""
        res = self.client.get('/api/catalog?q=<script>alert(1)</script>')
        self.assertEqual(res.status_code, 403)

    def test_rate_limiting_enforcement(self):
        """Verify that exceeding rate limit window returns HTTP 429."""
        test_ip = "192.168.1.99"
        # Temporarily set lower limit for quick testing
        original_limit = shield.max_requests_per_window
        shield.max_requests_per_window = 10
        shield.request_records[test_ip] = []

        try:
            # Send 10 allowed requests
            for _ in range(10):
                res = self.client.get('/api/catalog', environ_base={'REMOTE_ADDR': test_ip})
                self.assertEqual(res.status_code, 200)

            # 11th request must be rejected with 429 Too Many Requests
            res = self.client.get('/api/catalog', environ_base={'REMOTE_ADDR': test_ip})
            self.assertEqual(res.status_code, 429)
            data = res.get_json()
            self.assertEqual(data.get("status"), 429)
            self.assertIn("velocity limit", data.get("message"))
        finally:
            shield.max_requests_per_window = original_limit
            shield.request_records.pop(test_ip, None)

    def test_sanitized_404_error(self):
        """Verify 404 does not leak stack traces."""
        res = self.client.get('/api/non_existent_route')
        self.assertEqual(res.status_code, 404)
        data = res.get_json()
        self.assertIn("Not Found", data.get("error"))


if __name__ == '__main__':
    unittest.main()
