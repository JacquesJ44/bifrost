import os
import unittest
from datetime import datetime, timedelta, timezone

# Ensure app.py can be imported in a test environment.
os.environ.setdefault("REDIS_URI", "redis://localhost:6379/0")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("MAIL_SERVER", "localhost")
os.environ.setdefault("MAIL_PORT", "25")
os.environ.setdefault("MAIL_USE_TLS", "False")
os.environ.setdefault("MAIL_USERNAME", "test-user")
os.environ.setdefault("MAIL_PASSWORD", "test-pass")

from app import app as flask_app, evaluate_bot_risk


def iso_seconds_ago(seconds: int) -> str:
    return (datetime.now(timezone.utc) - timedelta(seconds=seconds)).isoformat()


class EvaluateBotRiskTests(unittest.TestCase):
    def run_risk(self, data, user_agent="Mozilla/5.0"):
        with flask_app.test_request_context("/api/signup"):
            return evaluate_bot_risk(data, user_agent)

    def test_legit_browser_submission_is_allowed(self):
        is_bot, reason = self.run_risk(
            {
                "website": "",
                "form_loaded_at": iso_seconds_ago(20),
            },
            "Mozilla/5.0",
        )
        self.assertFalse(is_bot)
        self.assertEqual(reason, "")

    def test_honeypot_only_is_soft_allowed(self):
        is_bot, reason = self.run_risk(
            {
                "website": "autofilled-value",
                "form_loaded_at": iso_seconds_ago(20),
            },
            "Mozilla/5.0",
        )
        self.assertFalse(is_bot)
        self.assertEqual(reason, "")

    def test_extremely_fast_submit_is_blocked(self):
        is_bot, reason = self.run_risk(
            {
                "website": "",
                "form_loaded_at": iso_seconds_ago(1),
            },
            "Mozilla/5.0",
        )
        self.assertTrue(is_bot)
        self.assertIn("extremely fast submit", reason)

    def test_honeypot_plus_fast_submit_is_blocked(self):
        is_bot, reason = self.run_risk(
            {
                "website": "filled",
                "form_loaded_at": iso_seconds_ago(5),
            },
            "Mozilla/5.0",
        )
        self.assertTrue(is_bot)
        self.assertIn("honeypot field filled", reason)
        self.assertIn("fast submit", reason)

    def test_honeypot_plus_non_browser_user_agent_is_blocked(self):
        is_bot, reason = self.run_risk(
            {
                "website": "filled",
                "form_loaded_at": iso_seconds_ago(20),
            },
            "python-requests/2.32",
        )
        self.assertTrue(is_bot)
        self.assertIn("honeypot field filled", reason)
        self.assertIn("non-browser user-agent", reason)

    def test_non_browser_only_is_not_blocked(self):
        is_bot, reason = self.run_risk(
            {
                "website": "",
                "form_loaded_at": iso_seconds_ago(20),
            },
            "python-requests/2.32",
        )
        self.assertFalse(is_bot)
        self.assertEqual(reason, "")

    def test_invalid_form_time_does_not_crash_or_auto_block(self):
        is_bot, reason = self.run_risk(
            {
                "website": "",
                "form_loaded_at": "not-a-timestamp",
            },
            "Mozilla/5.0",
        )
        self.assertFalse(is_bot)
        self.assertEqual(reason, "")


if __name__ == "__main__":
    unittest.main()
