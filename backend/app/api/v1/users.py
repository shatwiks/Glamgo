import re
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.api.deps import get_current_user
from backend.app.models.user import User, Address, Notification
from backend.app.schemas.user import (
    UserResponse, UserUpdate, AddressCreate, AddressResponse, NotificationResponse
)

router = APIRouter()

GIFT_CARDS_CATALOG = {
    "GLAM500": {"code": "GLAM500", "title": "The Signature Gift Card", "amount": 500.0},
    "LUXE1000": {"code": "LUXE1000", "title": "The Atelier Ritual Card", "amount": 1000.0},
    "BRIDAL2500": {"code": "BRIDAL2500", "title": "The Bridal Suite Card", "amount": 2500.0},
}
REFERRAL_BONUS_AMOUNT = 300.0


class RewardsSummaryResponse(BaseModel):
    referral_code: str
    wallet_credits: float
    referral_bonus_amount: float = REFERRAL_BONUS_AMOUNT
    gift_cards: List[Dict[str, Any]] = []


class RewardRedeemRequest(BaseModel):
    code: str


class RewardRedeemResponse(BaseModel):
    code: str
    kind: str
    credited_amount: float
    wallet_credits: float
    message: str


def _ensure_user_referral_code(db: Session, user: User) -> str:
    if user.referral_code and user.referral_code.strip():
        return user.referral_code.strip()
    alnum = re.sub(r"[^A-Za-z0-9]", "", user.full_name or user.email or "GLAM").upper()
    prefix = (alnum[:4] or "GLAM").ljust(4, "X")
    code = f"GLAM-{prefix}{int(user.id):03d}"
    user.referral_code = code
    db.commit()
    db.refresh(user)
    return code


@router.get("/profile", response_model=UserResponse)
def get_profile(user: User = Depends(get_current_user)):
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.full_name,
        phone=user.phone,
        role=user.role,
        is_active=user.is_active
    )


@router.put("/profile", response_model=UserResponse)
def update_profile(
    data: UserUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if data.name is not None:
        user.full_name = data.name.strip()
    if data.phone is not None:
        user.phone = data.phone.strip()
    if data.email is not None and data.email != user.email:
        # Check uniqueness
        existing = db.query(User).filter(User.email == data.email, User.id != user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email is already in use by another account.")
        user.email = data.email

    db.commit()
    db.refresh(user)

    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.full_name,
        phone=user.phone,
        role=user.role,
        is_active=user.is_active
    )


@router.get("/addresses", response_model=List[AddressResponse])
def get_addresses(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Address).filter(Address.user_id == user.id).all()


@router.post("/addresses", response_model=AddressResponse)
def add_address(
    addr: AddressCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_addr = Address(
        user_id=user.id,
        label=addr.label.strip(),
        text=addr.text.strip(),
        city=addr.city.strip() if addr.city else "Mumbai",
        is_default=addr.is_default or False
    )
    db.add(new_addr)
    db.commit()
    db.refresh(new_addr)
    return new_addr


@router.delete("/addresses/{address_id}")
def delete_address(
    address_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    addr = db.query(Address).filter(Address.id == address_id, Address.user_id == user.id).first()
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found.")
    db.delete(addr)
    db.commit()
    return {"message": "Address deleted successfully"}


@router.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Notification).filter(Notification.user_id == user.id).order_by(Notification.created_at.desc()).all()


@router.get("/rewards", response_model=RewardsSummaryResponse)
def get_my_rewards(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ref_code = _ensure_user_referral_code(db, user)
    return RewardsSummaryResponse(
        referral_code=ref_code,
        wallet_credits=float(user.wallet_credits or 0.0),
        referral_bonus_amount=REFERRAL_BONUS_AMOUNT,
        gift_cards=list(GIFT_CARDS_CATALOG.values()),
    )


@router.post("/rewards/redeem", response_model=RewardRedeemResponse)
def redeem_reward_code(
    payload: RewardRedeemRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    code = (payload.code or "").strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="Please enter a gift card or referral code.")

    locked_user = db.query(User).filter(User.id == user.id).with_for_update().first()
    if not locked_user:
        raise HTTPException(status_code=404, detail="User account not found.")

    my_ref_code = _ensure_user_referral_code(db, locked_user)
    if code == my_ref_code.upper():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot redeem your own referral code."
        )

    audit_marker = f"[CODE:{code}]"
    existing_claim = db.query(Notification).filter(
        Notification.user_id == locked_user.id,
        Notification.type == "reward",
        Notification.text.contains(audit_marker)
    ).first()
    if existing_claim:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Code '{code}' has already been redeemed on your account."
        )

    if code in GIFT_CARDS_CATALOG:
        gc = GIFT_CARDS_CATALOG[code]
        amount = float(gc["amount"])
        locked_user.wallet_credits = float(locked_user.wallet_credits or 0.0) + amount
        db.add(Notification(
            user_id=locked_user.id,
            type="reward",
            text=f"Redeemed {gc['title']} (+₹{amount:.0f} wallet credit) {audit_marker}"
        ))
        db.commit()
        db.refresh(locked_user)
        return RewardRedeemResponse(
            code=code,
            kind="gift_card",
            credited_amount=amount,
            wallet_credits=float(locked_user.wallet_credits or 0.0),
            message=f"₹{amount:.0f} gift card credited to your GlamGo wallet!",
        )

    referrer = db.query(User).filter(
        User.referral_code == code,
        User.is_active == True
    ).with_for_update().first()
    if not referrer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Code '{code}' is not a valid GlamGo Gift Card or referral code."
        )

    if referrer.id == locked_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot redeem your own referral code."
        )

    bonus = REFERRAL_BONUS_AMOUNT
    locked_user.wallet_credits = float(locked_user.wallet_credits or 0.0) + bonus
    referrer.wallet_credits = float(referrer.wallet_credits or 0.0) + bonus

    db.add(Notification(
        user_id=locked_user.id,
        type="reward",
        text=f"Referral welcome bonus credited (+₹{bonus:.0f}) from {referrer.full_name} {audit_marker}"
    ))
    db.add(Notification(
        user_id=referrer.id,
        type="reward",
        text=f"Your friend {locked_user.full_name} redeemed your referral code {code} (+₹{bonus:.0f} wallet credit)."
    ))
    db.commit()
    db.refresh(locked_user)
    return RewardRedeemResponse(
        code=code,
        kind="referral",
        credited_amount=bonus,
        wallet_credits=float(locked_user.wallet_credits or 0.0),
        message=f"Referral code applied! ₹{bonus:.0f} added to your wallet (and ₹{bonus:.0f} sent to {referrer.full_name}).",
    )
