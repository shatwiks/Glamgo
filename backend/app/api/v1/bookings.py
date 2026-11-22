import hmac
import json
import secrets
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.api.deps import get_current_user
from backend.app.models.user import User, UserRole, Notification
from backend.app.models.catalog import Service, Salon, ProfessionalProfile
from backend.app.models.booking import Booking, BookingStatus
from backend.app.models.payment import PaymentTransaction
from backend.app.schemas.booking import (
    BookingCreate,
    BookingOtpVerifyRequest,
    BookingRescheduleRequest,
    BookingResponse,
    BookingStatusUpdate,
)

router = APIRouter()

BOOKING_ADDONS_CATALOG = {
    "addon-head-massage": {
        "id": "addon-head-massage",
        "name": "Ayurvedic Head Massage",
        "duration": "15 min",
        "price": 299.0,
    },
    "addon-sheet-mask": {
        "id": "addon-sheet-mask",
        "name": "Collagen Peptide Sheet Mask",
        "duration": "15 min",
        "price": 349.0,
    },
    "addon-gel-removal": {
        "id": "addon-gel-removal",
        "name": "Gentle Gel Polish Removal",
        "duration": "15 min",
        "price": 249.0,
    },
    "addon-serum-ampoule": {
        "id": "addon-serum-ampoule",
        "name": "Vitamin C Glow Ampoule",
        "duration": "10 min",
        "price": 499.0,
    },
}


@router.post("/", response_model=BookingResponse)
def create_booking(
    b_in: BookingCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    idem_key = b_in.idempotency_key.strip() if b_in.idempotency_key and b_in.idempotency_key.strip() else None
    if idem_key:
        existing_booking = db.query(Booking).filter(
            Booking.customer_id == user.id,
            Booking.idempotency_key == idem_key
        ).first()
        if existing_booking:
            return existing_booking

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

    selected_addons = []
    addons_total = 0.0
    seen_addon_ids = set()
    for addon_id in (b_in.addons or []):
        aid = str(addon_id or "").strip()
        if aid in BOOKING_ADDONS_CATALOG and aid not in seen_addon_ids:
            seen_addon_ids.add(aid)
            item = BOOKING_ADDONS_CATALOG[aid]
            selected_addons.append(item)
            addons_total += float(item["price"])

    total_price = float(service.price) + addons_total
    arrival_otp = f"{secrets.randbelow(9000) + 1000}"

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
            price=total_price,
            status=BookingStatus.CONFIRMED,
            payment_status="pending",
            idempotency_key=idem_key,
            arrival_otp=arrival_otp,
            addons_json=json.dumps(selected_addons) if selected_addons else None,
        )
        db.add(booking)

        # Add notification for customer
        notif = Notification(
            user_id=user.id,
            type="booking",
            text=f"Your {service.name} booking is confirmed for {b_in.date} at {b_in.time}. Arrival PIN: {arrival_otp}."
        )
        db.add(notif)
        db.commit()
        db.refresh(booking)
    except IntegrityError:
        db.rollback()
        if idem_key:
            existing_booking = db.query(Booking).filter(
                Booking.customer_id == user.id,
                Booking.idempotency_key == idem_key
            ).first()
            if existing_booking:
                return existing_booking
        raise
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


@router.put("/{booking_id}/reschedule", response_model=BookingResponse)
def reschedule_booking(
    booking_id: str,
    payload: BookingRescheduleRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.customer_id != user.id and user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to reschedule this booking.")
    if booking.status in (BookingStatus.CANCELLED, BookingStatus.COMPLETED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reschedule a {booking.status.value} booking."
        )

    new_date = (payload.date or "").strip()
    new_time = (payload.time or "").strip()
    if not new_date or not new_time:
        raise HTTPException(status_code=400, detail="Valid date and time are required.")

    pro_name = booking.professional or "Any available expert"
    if pro_name != "Any available expert":
        conflict = db.query(Booking).filter(
            Booking.id != booking.id,
            Booking.professional == pro_name,
            Booking.date == new_date,
            Booking.time == new_time,
            Booking.status != BookingStatus.CANCELLED
        ).with_for_update().first()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"{pro_name} is already booked at {new_time} on {new_date}. Please choose another time slot."
            )

    old_date, old_time = booking.date, booking.time
    booking.date = new_date
    booking.time = new_time
    db.add(Notification(
        user_id=booking.customer_id,
        type="booking",
        text=f"Your {booking.title} appointment has been rescheduled from {old_date} ({old_time}) to {new_date} at {new_time}."
    ))
    db.commit()
    db.refresh(booking)
    return booking


@router.post("/{booking_id}/verify-arrival-otp")
def verify_arrival_otp(
    booking_id: str,
    payload: BookingOtpVerifyRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if user.role == UserRole.PROFESSIONAL:
        pro_profile = db.query(ProfessionalProfile).filter(
            (ProfessionalProfile.user_id == user.id) | (ProfessionalProfile.name == user.full_name)
        ).first()
        is_assigned = (pro_profile and booking.professional_id == pro_profile.id) or (booking.professional == user.full_name)
        if not is_assigned:
            raise HTTPException(status_code=403, detail="Not authorized to verify arrival OTP for this appointment.")
    elif user.role == UserRole.SALON_OWNER:
        salon = db.query(Salon).filter(Salon.owner_id == user.id).first()
        if not salon or booking.salon_id != salon.id:
            raise HTTPException(status_code=403, detail="Not authorized to verify arrival OTP for this salon appointment.")
    elif user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Partner or Administrator role required to verify arrival OTP.")

    # Pre-compare safety checks BEFORE hmac.compare_digest
    if not booking.arrival_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Arrival OTP is not available for this appointment."
        )
    if booking.status in (BookingStatus.CANCELLED, BookingStatus.COMPLETED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot verify arrival OTP for a {booking.status.value} appointment."
        )

    if not hmac.compare_digest(str(booking.arrival_otp), str(payload.otp)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid arrival PIN. Please ask the customer for their 4-digit Arrival PIN."
        )

    db.add(Notification(
        user_id=booking.customer_id,
        type="booking",
        text=f"Specialist arrival verified via 4-digit PIN for your {booking.title} appointment (#{booking.id})."
    ))
    db.commit()
    return {"verified": True, "booking_id": booking.id, "stage": "arrived"}
