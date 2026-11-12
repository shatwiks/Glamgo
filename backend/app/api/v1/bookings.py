import time
import secrets
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.api.deps import get_current_user
from backend.app.models.user import User, UserRole, Notification
from backend.app.models.catalog import Service, Salon, ProfessionalProfile
from backend.app.models.booking import Booking, BookingStatus
from backend.app.models.payment import PaymentTransaction
from backend.app.schemas.booking import BookingCreate, BookingResponse, BookingStatusUpdate

router = APIRouter()


@router.post("/", response_model=BookingResponse)
def create_booking(
    b_in: BookingCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = db.query(Service).filter(Service.id == b_in.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found.")

    salon = None
    if b_in.type == "salon" and b_in.salon_id:
        salon = db.query(Salon).filter(Salon.id == b_in.salon_id).first()
        if not salon:
            raise HTTPException(status_code=404, detail="Salon not found.")

    # Concurrency / double-booking conflict check with row-locking
    pro_name = b_in.professional or "Any available expert"
    pro_profile = None

    if pro_name != "Any available expert":
        conflict = db.query(Booking).filter(
            Booking.professional == pro_name,
            Booking.date == b_in.date,
            Booking.time == b_in.time,
            Booking.status != BookingStatus.CANCELLED
        ).with_for_update().first()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"{pro_name} is already booked at {b_in.time} on {b_in.date}. Please choose another time slot."
            )
        pro_profile = db.query(ProfessionalProfile).filter(ProfessionalProfile.name == pro_name).first()
    else:
        # Dynamic dispatch to available professional
        all_pros = db.query(ProfessionalProfile).all()
        busy_pros = db.query(Booking.professional).filter(
            Booking.date == b_in.date,
            Booking.time == b_in.time,
            Booking.status != BookingStatus.CANCELLED
        ).all()
        busy_names = {b[0] for b in busy_pros}
        free_pro = next((p for p in all_pros if p.name not in busy_names), None)
        if free_pro:
            pro_name = free_pro.name
            pro_profile = free_pro
        elif len(busy_names) >= max(1, len(all_pros)):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"All beauty specialists are booked at {b_in.time} on {b_in.date}. Please select another time slot."
            )

    booking_id = f"BK-{secrets.token_hex(4).upper()}"
    location = salon.name + ", " + salon.area if salon else b_in.location

    try:
        booking = Booking(
            id=booking_id,
            customer_id=user.id,
            type=b_in.type,
            title=service.name,
            service_id=service.id,
            professional_id=pro_profile.id if pro_profile else None,
            professional=pro_name,
            salon_id=salon.id if salon else None,
            date=b_in.date,
            time=b_in.time,
            location=location,
            price=service.price,
            status=BookingStatus.CONFIRMED
        )
        db.add(booking)

        # Add notification for customer
        notif = Notification(
            user_id=user.id,
            type="booking",
            text=f"Your {service.name} booking is confirmed for {b_in.date} at {b_in.time}."
        )
        db.add(notif)
        db.commit()
        db.refresh(booking)
    except Exception:
        db.rollback()
        raise

    return booking


@router.get("/my", response_model=List[BookingResponse])
def get_my_bookings(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Booking).filter(Booking.customer_id == user.id).order_by(Booking.created_at.desc()).all()


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.customer_id != user.id and user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to view this booking.")
    return booking


@router.patch("/{booking_id}/status", response_model=BookingResponse)
def update_booking_status(
    booking_id: str,
    status_update: BookingStatusUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    try:
        new_status = BookingStatus(status_update.status.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid booking status.")

    # Strict RBAC: BOLA / IDOR Prevention
    if user.role == UserRole.CUSTOMER:
        if booking.customer_id != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to modify this booking.")
        if new_status != BookingStatus.CANCELLED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Customers are only authorized to cancel their appointments."
            )
    elif user.role == UserRole.PROFESSIONAL:
        pro_profile = db.query(ProfessionalProfile).filter(ProfessionalProfile.user_id == user.id).first()
        is_assigned = (pro_profile and booking.professional_id == pro_profile.id) or (booking.professional == user.full_name)
        if not is_assigned and user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Professionals can only update appointments assigned to them."
            )
    elif user.role == UserRole.SALON_OWNER:
        salon = db.query(Salon).filter(Salon.owner_id == user.id).first()
        if not salon or booking.salon_id != salon.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Salon owners can only update appointments for their registered salon."
            )
    elif user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to modify this booking.")

    try:
        booking.status = new_status
        if new_status == BookingStatus.CANCELLED:
            txn = db.query(PaymentTransaction).filter(
                PaymentTransaction.booking_id == booking.id,
                PaymentTransaction.status == "captured"
            ).first()
            if txn:
                txn.status = "refund_pending"

            notif = Notification(
                user_id=booking.customer_id,
                type="booking",
                text=f"Your {booking.title} appointment on {booking.date} at {booking.time} has been cancelled."
            )
            db.add(notif)

        db.commit()
        db.refresh(booking)
    except Exception:
        db.rollback()
        raise

    return booking
