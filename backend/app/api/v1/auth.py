import hashlib
import hmac
import os
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func
from sqlalchemy.orm import Session
import jwt
from backend.app.core.database import get_db
from backend.app.core.security import (
    verify_password, hash_password, create_access_token, create_refresh_token, decode_token
)
from backend.app.core.config import settings
from backend.app.models.user import User, UserRole, Address, Notification
from backend.app.schemas.auth import UserRegister, UserLogin, Token, RefreshTokenRequest
from backend.app.schemas.user import UserResponse
from backend.app.api.deps import get_current_user
from backend.app.core.rate_limit import RateLimiter
from backend.app.services.sms_service import SmsService
from backend.app.services.email_service import EmailService, validate_real_email

router = APIRouter()
auth_limiter = RateLimiter(requests=15, window_seconds=60, prefix="auth")
MAX_CODE_ATTEMPTS = 5


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=1, max_length=32)
    new_password: str = Field(..., min_length=6, max_length=72)


class MobileOtpRequest(BaseModel):
    phone: str = Field(..., min_length=6, max_length=32)


class MobileOtpVerify(BaseModel):
    phone: str = Field(..., min_length=6, max_length=32)
    otp: str = Field(..., min_length=1, max_length=16)


class EmailOtpRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)


class EmailOtpVerify(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    otp: str = Field(..., min_length=1, max_length=16)


def _hash_code(raw: str) -> str:
    return hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        str(raw or "").strip().encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def _normalize_phone_digits(phone: str) -> str:
    digits = re.sub(r"\D", "", str(phone or ""))
    return digits[-10:] if len(digits) >= 10 else digits


def _allow_dev_code_echo() -> bool:
    if not getattr(settings, "ALLOW_DEV_OTP_ECHO", False):
        return False
    return os.environ.get("ALLOW_DEV_OTP_ECHO", "").strip().lower() == "true"


def _utc_now_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _is_expired(expires_at: Optional[datetime]) -> bool:
    if not expires_at:
        return True
    exp_naive = expires_at.replace(tzinfo=None) if expires_at.tzinfo else expires_at
    return exp_naive <= _utc_now_naive()


@router.post("/register", response_model=Token, dependencies=[Depends(auth_limiter)])
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    norm_email = user_in.email.strip().lower()
    existing = db.query(User).filter(func.lower(User.email) == norm_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Prevent anonymous privilege escalation to admin OR unmoderated partner roles
    if user_in.role and user_in.role != UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Privileged and partner roles cannot be self-assigned via public registration."
        )
    assigned_role = UserRole.CUSTOMER

    user = User(
        email=norm_email,
        full_name=user_in.name.strip(),
        phone=user_in.phone.strip() if user_in.phone else None,
        hashed_password=hash_password(user_in.password),
        role=assigned_role,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(subject=user.id, role=user.role.value)
    refresh_token = create_refresh_token(subject=user.id, role=user.role.value)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        role=user.role.value,
        user_id=user.id,
        name=user.full_name,
        email=user.email,
        phone=user.phone
    )


@router.post("/login", response_model=Token, dependencies=[Depends(auth_limiter)])
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    norm_email = login_data.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == norm_email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is inactive. Please contact support."
        )

    access_token = create_access_token(subject=user.id, role=user.role.value)
    refresh_token = create_refresh_token(subject=user.id, role=user.role.value)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        role=user.role.value,
        user_id=user.id,
        name=user.full_name,
        email=user.email,
        phone=user.phone
    )


@router.post("/refresh", response_model=Token, dependencies=[Depends(auth_limiter)])
def refresh_token(req: RefreshTokenRequest, db: Session = Depends(get_db)):
    try:
        payload = decode_token(req.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        user_id = payload.get("sub")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    try:
        uid = int(user_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid subject in token")

    user = db.query(User).filter(User.id == uid).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    new_access = create_access_token(subject=user.id, role=user.role.value)
    new_refresh = create_refresh_token(subject=user.id, role=user.role.value)

    return Token(
        access_token=new_access,
        refresh_token=new_refresh,
        role=user.role.value,
        user_id=user.id,
        name=user.full_name,
        email=user.email,
        phone=user.phone
    )


@router.get("/me")
def get_current_user_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    addresses = db.query(Address).filter(Address.user_id == user.id).all()
    return {
        "id": user.id,
        "name": user.full_name,
        "email": user.email,
        "phone": user.phone or "",
        "role": user.role.value,
        "addresses": [{"id": a.id, "label": a.label, "text": a.text, "city": a.city, "is_default": a.is_default} for a in addresses]
    }


@router.post("/password-reset/request", dependencies=[Depends(auth_limiter)])
def request_password_reset(payload: PasswordResetRequest, db: Session = Depends(get_db)):
    generic_msg = "If an account with that email exists, a reset code has been sent."
    user = (
        db.query(User)
        .filter(func.lower(User.email) == payload.email.strip().lower(), User.is_active == True)
        .first()
    )
    if not user or user.role == UserRole.ADMIN:
        return {"message": generic_msg}

    code = str(secrets.randbelow(900000) + 100000)
    user.reset_token_hash = _hash_code(code)
    user.reset_token_expires_at = _utc_now_naive() + timedelta(minutes=15)
    user.reset_attempts = 0
    db.add(
        Notification(
            user_id=user.id,
            type="system",
            text="A password reset verification code was requested for your account (valid for 15 minutes).",
        )
    )
    db.commit()

    res = {"message": generic_msg}
    if _allow_dev_code_echo():
        res["dev_code"] = code
    return res


@router.post("/password-reset/confirm", dependencies=[Depends(auth_limiter)])
def confirm_password_reset(payload: PasswordResetConfirm, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .filter(func.lower(User.email) == payload.email.strip().lower(), User.is_active == True)
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset code.",
        )
    if user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator passwords cannot be reset via self-service.",
        )
    if not user.reset_token_hash or _is_expired(user.reset_token_expires_at):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset code.",
        )

    if not hmac.compare_digest(_hash_code(payload.code), user.reset_token_hash):
        user.reset_attempts = int(user.reset_attempts or 0) + 1
        if user.reset_attempts >= MAX_CODE_ATTEMPTS:
            user.reset_token_hash = None
            user.reset_token_expires_at = None
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many invalid attempts. Please request a new reset code.",
            )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset code.",
        )

    user.hashed_password = hash_password(payload.new_password)
    user.reset_token_hash = None
    user.reset_token_expires_at = None
    user.reset_attempts = 0
    db.commit()
    return {"message": "Password has been reset successfully. You can now sign in."}


@router.post("/otp/request", dependencies=[Depends(auth_limiter)])
def request_mobile_otp(payload: MobileOtpRequest, db: Session = Depends(get_db)):
    norm_phone = _normalize_phone_digits(payload.phone)
    if len(norm_phone) < 7:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please enter a valid mobile phone number."
        )

    active_users = db.query(User).filter(User.is_active == True, User.phone.isnot(None)).all()
    matches = [u for u in active_users if _normalize_phone_digits(u.phone or "") == norm_phone]

    if len(matches) > 1:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Multiple accounts match this mobile number. Please sign in with email and password."
        )
    elif not matches:
        # Seamless consumer mobile onboarding: Auto-create customer account
        default_email = f"user_{norm_phone}@glamgo.in"
        existing_email = db.query(User).filter(User.email == default_email).first()
        if existing_email:
            default_email = f"user_{norm_phone}_{secrets.token_hex(3)}@glamgo.in"
        user = User(
            email=default_email,
            full_name=f"Customer {norm_phone[-4:]}",
            phone=payload.phone.strip(),
            hashed_password=hash_password(secrets.token_urlsafe(16)),
            role=UserRole.CUSTOMER,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user = matches[0]

    if user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator accounts must sign in with email and password."
        )

    otp = str(secrets.randbelow(900000) + 100000)
    user.otp_code_hash = _hash_code(otp)
    user.otp_expires_at = _utc_now_naive() + timedelta(minutes=10)
    user.otp_attempts = 0
    db.commit()

    # Dispatch via SMS service (Fast2SMS / Twilio if configured, or simulated)
    from backend.app.services.sms_service import sms_service
    sms_service.send_otp(user.phone or payload.phone, otp)

    allow_echo = _allow_dev_code_echo()
    return {
        "message": f"Verification code sent to {payload.phone}." if not allow_echo else f"Verification code sent. Code: {otp}",
        "dev_otp": otp if allow_echo else None,
        "otp": otp if allow_echo else None,
        "phone": payload.phone.strip()
    }


@router.post("/otp/verify", response_model=Token, dependencies=[Depends(auth_limiter)])
def verify_mobile_otp(payload: MobileOtpVerify, db: Session = Depends(get_db)):
    norm_phone = _normalize_phone_digits(payload.phone)
    active_users = (
        db.query(User).filter(User.is_active == True, User.phone.isnot(None)).all()
        if len(norm_phone) >= 7
        else []
    )
    matches = [u for u in active_users if _normalize_phone_digits(u.phone or "") == norm_phone]

    if len(matches) > 1:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ambiguous phone number — sign in with email and password.",
        )
    if not matches:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP.",
        )

    user = matches[0]
    if user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator accounts must sign in with email and password.",
        )
    if not user.otp_code_hash or _is_expired(user.otp_expires_at):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP.",
        )

    if not hmac.compare_digest(_hash_code(payload.otp), user.otp_code_hash):
        user.otp_attempts = int(user.otp_attempts or 0) + 1
        if user.otp_attempts >= MAX_CODE_ATTEMPTS:
            user.otp_code_hash = None
            user.otp_expires_at = None
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many invalid OTP attempts. Please request a new OTP.",
            )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid OTP.",
        )

    user.otp_code_hash = None
    user.otp_expires_at = None
    user.otp_attempts = 0
    db.commit()

    access_token = create_access_token(subject=user.id, role=user.role.value)
    refresh_token = create_refresh_token(subject=user.id, role=user.role.value)
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        role=user.role.value,
        user_id=user.id,
        name=user.full_name,
        email=user.email,
        phone=user.phone,
    )


@router.post("/otp/email/request", dependencies=[Depends(auth_limiter)])
def request_email_otp(payload: EmailOtpRequest, db: Session = Depends(get_db)):
    """
    Enforces real-email verification (valid format, disposable domain blocklist, active DNS MX check),
    auto-provisions customer accounts for new legitimate emails, and dispatches a 6-digit OTP code.
    """
    norm_email = validate_real_email(payload.email)

    user = db.query(User).filter(func.lower(User.email) == norm_email).first()
    if not user:
        # Seamless consumer onboarding for real emails: Auto-create customer account
        name_part = norm_email.split("@")[0].replace(".", " ").replace("_", " ").title()
        user = User(
            email=norm_email,
            full_name=name_part if name_part else "Customer",
            phone=None,
            hashed_password=hash_password(secrets.token_urlsafe(16)),
            role=UserRole.CUSTOMER,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact support."
        )

    if user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator accounts must sign in with email and password."
        )

    otp = str(secrets.randbelow(900000) + 100000)
    user.otp_code_hash = _hash_code(otp)
    user.otp_expires_at = _utc_now_naive() + timedelta(minutes=10)
    user.otp_attempts = 0
    db.commit()

    # Dispatch via Email Service (SMTP / Resend / Dev console)
    EmailService.send_otp(user.email, otp)

    allow_echo = _allow_dev_code_echo()
    res = {
        "message": f"Verification code sent to {user.email}. Please check your inbox.",
        "email": user.email
    }
    if allow_echo:
        res["dev_otp"] = otp
        res["otp"] = otp
    return res


@router.post("/otp/email/verify", response_model=Token, dependencies=[Depends(auth_limiter)])
def verify_email_otp(payload: EmailOtpVerify, db: Session = Depends(get_db)):
    norm_email = str(payload.email or "").strip().lower()
    user = db.query(User).filter(func.lower(User.email) == norm_email).first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP."
        )

    if user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator accounts must sign in with email and password."
        )

    if not user.otp_code_hash or _is_expired(user.otp_expires_at):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP."
        )

    if not hmac.compare_digest(_hash_code(payload.otp), user.otp_code_hash):
        user.otp_attempts = int(user.otp_attempts or 0) + 1
        if user.otp_attempts >= MAX_CODE_ATTEMPTS:
            user.otp_code_hash = None
            user.otp_expires_at = None
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many invalid OTP attempts. Please request a new OTP."
            )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid OTP."
        )

    user.otp_code_hash = None
    user.otp_expires_at = None
    user.otp_attempts = 0
    db.commit()

    access_token = create_access_token(subject=user.id, role=user.role.value)
    refresh_token = create_refresh_token(subject=user.id, role=user.role.value)
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        role=user.role.value,
        user_id=user.id,
        name=user.full_name,
        email=user.email,
        phone=user.phone,
    )
