import logging
import urllib.request
import urllib.parse
import json
import base64
from typing import Optional
from backend.app.core.config import settings

logger = logging.getLogger("glamgo.sms")


class SmsService:
    @staticmethod
    def send_otp(phone: str, otp: str) -> bool:
        message_body = f"Your GlamGo verification code is {otp}. Valid for 10 minutes. Do not share this code."
        norm_phone = "".join(filter(str.isdigit, str(phone or "")))
        
        # 1. Try Fast2SMS (Popular in India for Quick OTP Delivery)
        if settings.FAST2SMS_API_KEY:
            try:
                target_10_digit = norm_phone[-10:] if len(norm_phone) >= 10 else norm_phone
                data = json.dumps({
                    "variables_values": otp,
                    "route": "otp",
                    "numbers": target_10_digit
                }).encode("utf-8")
                req = urllib.request.Request(
                    "https://www.fast2sms.com/dev/bulkV2",
                    data=data,
                    headers={
                        "authorization": settings.FAST2SMS_API_KEY,
                        "Content-Type": "application/json"
                    }
                )
                with urllib.request.urlopen(req, timeout=5) as response:
                    res_body = response.read().decode("utf-8")
                    logger.info("Fast2SMS OTP sent to %s: %s", target_10_digit, res_body)
                    return True
            except Exception as e:
                logger.error("Fast2SMS dispatch failed: %s", e)

        # 2. Try Twilio
        if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_FROM_NUMBER:
            try:
                e164_phone = f"+{norm_phone}" if not phone.startswith("+") else phone
                url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
                auth_str = f"{settings.TWILIO_ACCOUNT_SID}:{settings.TWILIO_AUTH_TOKEN}"
                b64_auth = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")
                
                payload = urllib.parse.urlencode({
                    "To": e164_phone,
                    "From": settings.TWILIO_FROM_NUMBER,
                    "Body": message_body
                }).encode("utf-8")
                
                req = urllib.request.Request(
                    url,
                    data=payload,
                    headers={
                        "Authorization": f"Basic {b64_auth}",
                        "Content-Type": "application/x-www-form-urlencoded"
                    }
                )
                with urllib.request.urlopen(req, timeout=5) as response:
                    res_body = response.read().decode("utf-8")
                    logger.info("Twilio SMS sent to %s: %s", e164_phone, res_body)
                    return True
            except Exception as e:
                logger.error("Twilio SMS dispatch failed: %s", e)

        # 3. Development / Mock Mode
        logger.info("[SMS-DELIVERY-SIMULATED] Phone: %s | Message: '%s'", phone, message_body)
        return True


sms_service = SmsService()
