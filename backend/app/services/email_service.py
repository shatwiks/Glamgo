import logging
import smtplib
import json
import urllib.error
import urllib.request
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from fastapi import HTTPException, status
from email_validator import validate_email, EmailNotValidError
from backend.app.core.config import settings

logger = logging.getLogger("glamgo.email")

PUBLIC_WEBMAIL_DOMAINS = {
    "gmail.com", "googlemail.com", "yahoo.com", "outlook.com",
    "hotmail.com", "icloud.com", "live.com"
}

# Comprehensive set of common disposable/burner email domains
DISPOSABLE_DOMAINS = {
    "mailinator.com", "tempmail.com", "10minutemail.com", "guerrillamail.com",
    "yopmail.com", "trashmail.com", "getairmail.com", "fakemailgenerator.com",
    "sharklasers.com", "dispostable.com", "throwawaymail.com", "mohmal.com",
    "nada.ltd", "temp-mail.org", "crazymailing.com", "generator.email",
    "inboxkitten.com", "burneronline.com", "mytemp.email", "dropmail.me",
    "trashmail.net", "trashmail.org", "mytempemail.com", "emailondeck.com",
    "tempail.com", "disposablemail.com", "maildrop.cc", "harakirimail.com",
    "mailnesia.com", "guerrillamailblock.com", "pokemail.net", "inboxbear.com"
}


def validate_real_email(email_str: str) -> str:
    """
    Validates that an email address is real:
    1. Checks RFC syntax & length.
    2. Blocks disposable / temporary burner email domains.
    3. Queries DNS for active Mail Exchange (MX) records.
    """
    raw_email = str(email_str or "").strip().lower()
    if not raw_email or "@" not in raw_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address."
        )

    domain = raw_email.split("@")[-1]

    # Layer 1: Block disposable email domains
    if domain in DISPOSABLE_DOMAINS or any(domain.endswith("." + d) for d in DISPOSABLE_DOMAINS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Disposable or temporary email services (@{domain}) are not permitted. Please use a permanent email address."
        )

    # Layer 2: Live DNS MX Deliverability Check
    try:
        validated = validate_email(raw_email, check_deliverability=True)
        return validated.normalized
    except EmailNotValidError as exc:
        err_msg = str(exc)
        if "does not exist" in err_msg or "cannot receive" in err_msg or "no mx" in err_msg.lower():
            detail = f"The email domain '@{domain}' does not exist or has no active mail server."
        else:
            detail = f"Invalid email address: {err_msg}"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )


def _resolve_resend_from() -> str:
    explicit = str(getattr(settings, "RESEND_FROM_EMAIL", "") or "").strip()
    if explicit:
        return explicit
    smtp_from = str(getattr(settings, "SMTP_FROM_EMAIL", "") or "").strip()
    if "@" in smtp_from:
        domain = smtp_from.split("@")[-1].rstrip(">").strip().lower()
        if domain and domain not in PUBLIC_WEBMAIL_DOMAINS:
            return smtp_from
    return "GlamGo <onboarding@resend.dev>"


def _send_via_smtp(to_email: str, subject: str, plain_text: str, html_content: str) -> bool:
    smtp_user = getattr(settings, "SMTP_USER", None)
    smtp_pass = getattr(settings, "SMTP_PASSWORD", None)
    if not (smtp_user and smtp_pass):
        return False
    try:
        clean_pass = str(smtp_pass).replace(" ", "").strip()
        smtp_host = getattr(settings, "SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(getattr(settings, "SMTP_PORT", 587))
        from_email = getattr(settings, "SMTP_FROM_EMAIL", None) or smtp_user
        from_name = getattr(settings, "SMTP_FROM_NAME", "GlamGo")

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_name} <{from_email}>"
        msg["To"] = to_email

        msg.attach(MIMEText(plain_text, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.starttls()
            server.login(smtp_user.strip(), clean_pass)
            server.sendmail(from_email, [to_email], msg.as_string())

        logger.info("SMTP email OTP dispatched to %s via %s", to_email, smtp_host)
        return True
    except Exception as e:
        logger.error("SMTP dispatch failed for %s: %s", to_email, e)
        return False


def _send_via_resend(to_email: str, subject: str, plain_text: str, html_content: str) -> bool:
    api_key = getattr(settings, "RESEND_API_KEY", None)
    if not api_key:
        return False
    try:
        from_addr = _resolve_resend_from()
        data = json.dumps({
            "from": from_addr,
            "to": [to_email],
            "subject": subject,
            "html": html_content,
            "text": plain_text
        }).encode("utf-8")
        req = urllib.request.Request(
            "https://api.resend.com/emails",
            data=data,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": "GlamGo-Backend/1.0"
            }
        )
        with urllib.request.urlopen(req, timeout=8) as res:
            logger.info("Resend email OTP dispatched to %s via %s (HTTP %s)", to_email, from_addr, res.status)
            return True
    except urllib.error.HTTPError as e:
        err_body = ""
        try:
            err_body = e.read().decode("utf-8", errors="ignore")
        except Exception:
            pass
        logger.error("Resend API dispatch HTTP %s for %s: %s %s", e.code, to_email, e, err_body)
        return False
    except Exception as e:
        logger.error("Resend API dispatch failed for %s: %s", to_email, e)
        return False


class EmailService:
    @staticmethod
    def send_otp(to_email: str, otp: str) -> bool:
        """
        Dispatches a 6-digit login OTP code to the recipient email:
        - In production with RESEND_API_KEY: tries Resend HTTPS API first (Render blocks outbound SMTP), then SMTP.
        - In development/local: tries SMTP first, then Resend HTTPS API, then console fallback.
        """
        subject = f"Your GlamGo Login Code: {otp}"
        plain_text = (
            f"Hello,\n\n"
            f"Your GlamGo verification code is: {otp}\n\n"
            f"This code will expire in 10 minutes. If you did not request this code, please ignore this email.\n\n"
            f"Best regards,\n"
            f"The GlamGo Team\n"
            f"https://glamgo.in"
        )
        html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your GlamGo Verification Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7F4EF; margin: 0; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E5DDD2; border-radius: 12px; padding: 36px 32px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
    <div style="text-align: center; margin-bottom: 28px;">
      <h1 style="font-size: 26px; font-weight: 800; letter-spacing: 0.14em; color: #1E1C1A; margin: 0;">GLAMGO<span style="color: #C5A059; font-size: 16px;">✦</span></h1>
      <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.18em; color: #665E55; margin-top: 6px;">Your Beauty. Your Way.</p>
    </div>
    <h2 style="font-size: 18px; font-weight: 600; color: #1E1C1A; margin-bottom: 12px;">Your Verification Code</h2>
    <p style="font-size: 14px; color: #665E55; line-height: 1.6; margin-bottom: 24px;">
      Use the 6-digit verification code below to complete your sign-in to GlamGo. This code is valid for <strong>10 minutes</strong>.
    </p>
    <div style="background: #F7F4EF; border: 1px solid #E5DDD2; border-radius: 8px; text-align: center; padding: 18px 0; margin-bottom: 24px;">
      <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 0.28em; color: #1C342B;">{otp}</span>
    </div>
    <p style="font-size: 12px; color: #8C847A; line-height: 1.5; margin: 0;">
      If you did not request this verification code, you can safely ignore this email. Never share this code with anyone.
    </p>
    <hr style="border: 0; border-top: 1px solid #EFEAE1; margin: 28px 0 20px;">
    <p style="font-size: 11px; color: #B0A89E; text-align: center; margin: 0;">
      &copy; 2026 GlamGo Marketplace. All rights reserved.
    </p>
  </div>
</body>
</html>"""

        is_prod = str(getattr(settings, "ENVIRONMENT", "") or "").strip().lower() == "production"
        if is_prod and getattr(settings, "RESEND_API_KEY", None):
            if _send_via_resend(to_email, subject, plain_text, html_content):
                return True
            if _send_via_smtp(to_email, subject, plain_text, html_content):
                return True
        else:
            if _send_via_smtp(to_email, subject, plain_text, html_content):
                return True
            if _send_via_resend(to_email, subject, plain_text, html_content):
                return True

        # Dev / Console fallback
        logger.info("[EMAIL DISPATCH] To: %s | OTP: %s", to_email, otp)
        print(f"\n[DEV EMAIL GATEWAY] To: {to_email} | OTP: {otp}\n")
        return True
