from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.api.deps import get_current_user
from backend.app.models.user import User, Address, Notification
from backend.app.schemas.user import (
    UserResponse, UserUpdate, AddressCreate, AddressResponse, NotificationResponse
)

router = APIRouter()


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
