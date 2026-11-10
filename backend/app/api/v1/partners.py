from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.api.deps import get_current_user
from backend.app.models.user import User, UserRole, OrderStatus, BookingStatus
from backend.app.models.catalog import (
    Service, Salon, Product, ProfessionalProfile, Availability, PartnerDraft
)
from backend.app.models.booking import Booking
from backend.app.models.order import Order
from backend.app.schemas.partner import (
    PartnerProfileUpdate, PartnerDraftCreate, PartnerDraftResponse, AvailabilityResponse
)

router = APIRouter()


@router.get("/overview")
def get_partner_overview(
    role: str = Query("Professional"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # MAJ-02 Remediation: Restrict partner metrics to authorized roles
    if user.role == UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Partner account required."
        )

    # Determine effective role scope
    effective_role = role if user.role == UserRole.ADMIN else (
        "Professional" if user.role == UserRole.PROFESSIONAL else
        "Salon Owner" if user.role == UserRole.SALON_OWNER else
        "Product Seller" if user.role == UserRole.SELLER else "Professional"
    )

    if effective_role == "Professional":
        pro_profile = db.query(ProfessionalProfile).filter(
            (ProfessionalProfile.user_id == user.id) | (ProfessionalProfile.name == user.full_name)
        ).first()

        q = db.query(Booking).filter(Booking.type == "home")
        if user.role != UserRole.ADMIN and pro_profile:
            q = q.filter((Booking.professional_id == pro_profile.id) | (Booking.professional == user.full_name))
        elif user.role != UserRole.ADMIN:
            q = q.filter(Booking.professional == user.full_name)

        home_bookings = q.order_by(Booking.created_at.desc()).all()
        total_val = sum(b.price for b in home_bookings)
        services_count = db.query(Service).count()

        return {
            "metrics": [
                {"label": "Upcoming appointments", "value": len(home_bookings)},
                {"label": "Services listed", "value": services_count},
                {"label": "Recorded earnings", "value": f"₹{int(total_val):,}"}
            ],
            "total_value": total_val,
            "bookings": [
                {"id": b.id, "title": b.title, "date": b.date, "time": b.time, "professional": b.professional, "status": b.status.value, "price": b.price}
                for b in home_bookings[:10]
            ]
        }
    elif effective_role == "Salon Owner":
        salon = db.query(Salon).filter(Salon.owner_id == user.id).first()
        q = db.query(Booking).filter(Booking.type == "salon")
        if user.role != UserRole.ADMIN and salon:
            q = q.filter(Booking.salon_id == salon.id)

        salon_bookings = q.order_by(Booking.created_at.desc()).all()
        total_val = sum(b.price for b in salon_bookings)

        return {
            "metrics": [
                {"label": "Appointments", "value": len(salon_bookings)},
                {"label": "Active staff", "value": 2},
                {"label": "Branches", "value": 1}
            ],
            "total_value": total_val,
            "bookings": [
                {"id": b.id, "title": b.title, "date": b.date, "time": b.time, "professional": b.professional, "status": b.status.value, "price": b.price}
                for b in salon_bookings[:10]
            ]
        }
    elif effective_role == "Product Seller":
        orders = db.query(Order).order_by(Order.created_at.desc()).all()
        total_val = sum(o.total for o in orders)
        products_count = db.query(Product).count()

        return {
            "metrics": [
                {"label": "Products", "value": products_count},
                {"label": "Orders", "value": len(orders)},
                {"label": "Sales revenue", "value": f"₹{int(total_val):,}"}
            ],
            "total_value": total_val,
            "orders": [
                {"id": o.id, "total": o.total, "status": o.status.value, "items_count": len(o.items), "date": o.date}
                for o in orders[:10]
            ]
        }
    else:  # Admin platform overview
        bookings = db.query(Booking).all()
        orders = db.query(Order).all()
        total_gmv = sum(o.total for o in orders) + sum(b.price for b in bookings)
        customers_count = db.query(User).filter(User.role == UserRole.CUSTOMER).count()
        return {
            "metrics": [
                {"label": "Customers", "value": customers_count},
                {"label": "Bookings", "value": len(bookings)},
                {"label": "Orders", "value": len(orders)}
            ],
            "total_value": total_gmv
        }


@router.get("/drafts", response_model=List[PartnerDraftResponse])
def get_drafts(
    role: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(PartnerDraft).filter(PartnerDraft.user_id == user.id)
    if role:
        q = q.filter(PartnerDraft.role == role)
    return q.order_by(PartnerDraft.created_at.desc()).all()


@router.post("/drafts", response_model=PartnerDraftResponse)
def create_draft(
    draft_in: PartnerDraftCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    draft = PartnerDraft(
        user_id=user.id,
        role=draft_in.role,
        name=draft_in.name.strip(),
        price=draft_in.price,
        description=draft_in.description.strip()
    )
    db.add(draft)
    db.commit()
    db.refresh(draft)
    return draft


@router.get("/availability", response_model=List[str])
def get_my_availability(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    avails = db.query(Availability).filter(Availability.user_id == user.id, Availability.is_available == True).all()
    if not avails:
        return ["Mon", "Tue", "Wed", "Thu", "Fri"]
    return [a.day for a in avails]


@router.post("/availability/toggle", response_model=List[str])
def toggle_availability(
    day: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    clean_day = day.strip()
    existing = db.query(Availability).filter(Availability.user_id == user.id, Availability.day == clean_day).first()
    if existing:
        existing.is_available = not existing.is_available
    else:
        db.add(Availability(user_id=user.id, day=clean_day, is_available=True))
    db.commit()

    active = db.query(Availability).filter(Availability.user_id == user.id, Availability.is_available == True).all()
    return [a.day for a in active]
