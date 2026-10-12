#!/usr/bin/env python3
"""
MOVAni Gmail SMTP & Transactional Delivery Diagnostic Utility
Tests real SMTP connectivity, authentication, TLS/SSL handshakes,
and message dispatch without leaking sensitive passwords into output.
"""

import os
import sys

# Ensure root directory is in sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.email_service import get_smtp_config, send_password_reset_email


def run_diagnostics(target_email: str = ""):
    print("=" * 60)
    print(" MOVAni Gmail SMTP & Transactional Email Diagnostic Engine")
    print("=" * 60)

    cfg = get_smtp_config()
    print(f"[*] SMTP Host:       {cfg['host'] or '(Not configured)'}")
    print(f"[*] SMTP Port:       {cfg['port']}")
    print(f"[*] SMTP User:       {cfg['user'] or '(Not configured)'}")
    print(f"[*] Password Set:    {'YES (' + str(len(cfg['password'])) + ' chars)' if cfg['password'] else 'NO'}")
    print(f"[*] From Header:     {cfg['from']}")
    print(f"[*] Mode:            {'SSL (Port 465)' if cfg['use_ssl'] else 'STARTTLS (Port 587)' if cfg['use_tls'] else 'Plain'}")
    print(f"[*] Provider:        {'Google Gmail SMTP' if cfg['is_gmail'] else 'Standard SMTP'}")
    print("-" * 60)

    if not cfg["configured"]:
        print("[!] STATUS: SMTP IS NOT CONFIGURED IN backend/.env")
        print("\nTo enable real Gmail delivery, add the following to backend/.env:")
        print("  SMTP_HOST=smtp.gmail.com")
        print("  SMTP_PORT=587")
        print("  SMTP_USERNAME=your_gmail_address@gmail.com")
        print("  SMTP_PASSWORD=your_16_character_app_password")
        print("  MAIL_FROM=\"MOVAni Streaming\" <your_gmail_address@gmail.com>")
        print("\nHOW TO GENERATE A GMAIL 16-CHAR APP PASSWORD:")
        print("  1. Go to your Google Account -> Security (https://myaccount.google.com/security)")
        print("  2. Ensure '2-Step Verification' is turned ON.")
        print("  3. Go to 'App passwords' (https://myaccount.google.com/apppasswords)")
        print("  4. Name it 'MOVAni Streaming' and click 'Create'.")
        print("  5. Copy the 16-character code (e.g. 'abcd efgh ijkl mnop') into SMTP_PASSWORD.")
        print("=" * 60)
        return False

    to_addr = target_email or cfg["user"]
    print(f"[*] Testing live dispatch to: {to_addr} ...")

    # Disable test mode temporarily to perform real network test
    old_test = os.environ.get("MOVANI_TEST_MODE")
    old_testing = os.environ.get("TESTING")
    if "MOVANI_TEST_MODE" in os.environ:
        del os.environ["MOVANI_TEST_MODE"]
    if "TESTING" in os.environ:
        del os.environ["TESTING"]

    try:
        res = send_password_reset_email(
            to_email=to_addr,
            user_name="MOVAni Tester",
            token="diag_test_token_sample",
            otp="999888"
        )
    finally:
        if old_test is not None:
            os.environ["MOVANI_TEST_MODE"] = old_test
        if old_testing is not None:
            os.environ["TESTING"] = old_testing

    if res.get("sent"):
        print(f"[+] SUCCESS! Email accepted by {cfg['host']} for delivery to {to_addr}.")
        print("[+] Please check your Gmail Inbox, as well as Spam / Promotions folders.")
        print("=" * 60)
        return True
    else:
        print(f"[-] FAILED! Email transport rejected:")
        print(f"[-] Error: {res.get('error')}")
        print("=" * 60)
        return False


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else ""
    success = run_diagnostics(target)
    sys.exit(0 if success else 1)
