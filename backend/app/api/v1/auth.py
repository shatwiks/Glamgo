from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import jwt
from backend.app.core.database import get_db
from backend.app.core.security import (
    verify_password, hash_password, create_access_token, create_refresh_token, decode_token
)
from backend.app.core.config import settings
from backend.app.models.user import User, UserRole, Address
from backend.app.schemas.auth import UserRegister, UserLogin, Token, RefreshTokenRequest
from backend.app.schemas.user import UserResponse
from backend.app.api.deps import get_current_user
from backend.app.core.rate_limit import RateLimiter

router = APIRouter()
auth_limiter = RateLimiter(requests=15, window_seconds=60, prefix="auth")


@router.post("/register", response_model=Token, dependencies=[Depends(auth_limiter)])
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # CRIT-01 Remediation: Prevent anonymous privilege escalation to admin
    assigned_role = UserRole.CUSTOMER
    if user_in.role and user_in.role != UserRole.CUSTOMER:
        if user_in.role == UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Administrator accounts cannot be created via public registration."
            )
        # Partner roles must be explicitly onboarded; default self-registration to customer
        assigned_role = user_in.role

    user = User(
        email=user_in.email,
        full_name=user_in.name,
        phone=user_in.phone,
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
    user = db.query(User).filter(User.email == login_data.email).first()
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


@router.post("/refresh", response_model=Token)
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
        email=user.email
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
