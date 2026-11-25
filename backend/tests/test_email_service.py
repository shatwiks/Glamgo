import json
from backend.app.services import email_service
from backend.app.services.email_service import EmailService, _resolve_brevo_sender, _resolve_resend_from


def test_resolve_resend_from_skips_public_webmail(monkeypatch):
    monkeypatch.setattr(email_service.settings, "RESEND_FROM_EMAIL", "")
    monkeypatch.setattr(email_service.settings, "SMTP_FROM_EMAIL", "owner@gmail.com")
    assert _resolve_resend_from() == "GlamGo <onboarding@resend.dev>"

    monkeypatch.setattr(email_service.settings, "SMTP_FROM_EMAIL", "noreply@glamgo.in")
    assert _resolve_resend_from() == "noreply@glamgo.in"

    monkeypatch.setattr(email_service.settings, "RESEND_FROM_EMAIL", "GlamGo <hello@verified.example>")
    assert _resolve_resend_from() == "GlamGo <hello@verified.example>"


def test_resolve_brevo_sender_uses_gmail_or_explicit(monkeypatch):
    monkeypatch.setattr(email_service.settings, "SMTP_FROM_NAME", "GlamGo")
    monkeypatch.setattr(email_service.settings, "BREVO_FROM_EMAIL", "")
    monkeypatch.setattr(email_service.settings, "SMTP_FROM_EMAIL", "GlamGo <sender@gmail.com>")
    assert _resolve_brevo_sender() == ("GlamGo", "sender@gmail.com")

    monkeypatch.setattr(email_service.settings, "BREVO_FROM_EMAIL", "custom@gmail.com")
    assert _resolve_brevo_sender() == ("GlamGo", "custom@gmail.com")


def test_production_prefers_brevo_then_resend_before_smtp(monkeypatch):
    calls = []

    monkeypatch.setattr(email_service.settings, "ENVIRONMENT", "production")

    def fake_brevo(*args):
        calls.append("brevo")
        return False

    def fake_resend(*args):
        calls.append("resend")
        return True

    def fake_smtp(*args):
        calls.append("smtp")
        return True

    monkeypatch.setattr(email_service, "_send_via_brevo", fake_brevo)
    monkeypatch.setattr(email_service, "_send_via_resend", fake_resend)
    monkeypatch.setattr(email_service, "_send_via_smtp", fake_smtp)

    assert EmailService.send_otp("user@example.com", "123456") is True
    assert calls == ["brevo", "resend"]


def test_brevo_http_payload(monkeypatch):
    captured = {}

    class FakeResp:
        status = 201
        def __enter__(self):
            return self
        def __exit__(self, *args):
            return False

    def fake_urlopen(req, timeout=8):
        captured["url"] = req.full_url
        captured["headers"] = dict(req.header_items())
        captured["body"] = json.loads(req.data.decode("utf-8"))
        return FakeResp()

    monkeypatch.setattr(email_service.settings, "BREVO_API_KEY", "xkeysib-test")
    monkeypatch.setattr(email_service.settings, "BREVO_FROM_EMAIL", "sender@gmail.com")
    monkeypatch.setattr(email_service.settings, "SMTP_FROM_NAME", "GlamGo")
    monkeypatch.setattr(email_service.urllib.request, "urlopen", fake_urlopen)

    assert email_service._send_via_brevo("cust@gmail.com", "Code", "Plain", "<p>Hi</p>") is True
    assert captured["url"] == "https://api.brevo.com/v3/smtp/email"
    assert captured["headers"]["Api-key"] == "xkeysib-test"
    assert captured["body"]["sender"] == {"name": "GlamGo", "email": "sender@gmail.com"}
    assert captured["body"]["to"] == [{"email": "cust@gmail.com"}]


def test_development_prefers_smtp_first(monkeypatch):
    calls = []

    monkeypatch.setattr(email_service.settings, "ENVIRONMENT", "development")

    def fake_smtp(*args):
        calls.append("smtp")
        return True

    def fake_brevo(*args):
        calls.append("brevo")
        return True

    def fake_resend(*args):
        calls.append("resend")
        return True

    monkeypatch.setattr(email_service, "_send_via_smtp", fake_smtp)
    monkeypatch.setattr(email_service, "_send_via_brevo", fake_brevo)
    monkeypatch.setattr(email_service, "_send_via_resend", fake_resend)

    assert EmailService.send_otp("user@example.com", "123456") is True
    assert calls == ["smtp"]
