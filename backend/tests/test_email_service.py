from backend.app.services import email_service
from backend.app.services.email_service import EmailService, _resolve_resend_from


def test_resolve_resend_from_skips_public_webmail(monkeypatch):
    monkeypatch.setattr(email_service.settings, "RESEND_FROM_EMAIL", "")
    monkeypatch.setattr(email_service.settings, "SMTP_FROM_EMAIL", "owner@gmail.com")
    assert _resolve_resend_from() == "GlamGo <onboarding@resend.dev>"

    monkeypatch.setattr(email_service.settings, "SMTP_FROM_EMAIL", "noreply@glamgo.in")
    assert _resolve_resend_from() == "noreply@glamgo.in"

    monkeypatch.setattr(email_service.settings, "RESEND_FROM_EMAIL", "GlamGo <hello@verified.example>")
    assert _resolve_resend_from() == "GlamGo <hello@verified.example>"


def test_production_prefers_resend_before_smtp(monkeypatch):
    calls = []

    monkeypatch.setattr(email_service.settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(email_service.settings, "RESEND_API_KEY", "re_test_key")

    def fake_resend(*args):
        calls.append("resend")
        return True

    def fake_smtp(*args):
        calls.append("smtp")
        return True

    monkeypatch.setattr(email_service, "_send_via_resend", fake_resend)
    monkeypatch.setattr(email_service, "_send_via_smtp", fake_smtp)

    assert EmailService.send_otp("user@example.com", "123456") is True
    assert calls == ["resend"]


def test_development_prefers_smtp_before_resend(monkeypatch):
    calls = []

    monkeypatch.setattr(email_service.settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(email_service.settings, "RESEND_API_KEY", "re_test_key")

    def fake_smtp(*args):
        calls.append("smtp")
        return True

    def fake_resend(*args):
        calls.append("resend")
        return True

    monkeypatch.setattr(email_service, "_send_via_smtp", fake_smtp)
    monkeypatch.setattr(email_service, "_send_via_resend", fake_resend)

    assert EmailService.send_otp("user@example.com", "123456") is True
    assert calls == ["smtp"]
