import time
import json
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.core.database import get_db
from backend.app.api.deps import (
    get_current_user,
    require_professional,
    require_salon_owner,
    require_seller,
    require_partner
)
from backend.app.models.user import User, UserRole, BookingStatus, OrderStatus, Notification
from backend.app.models.catalog import (
    Service, Salon, SalonStaff, Product, ProductVariant,
    ProfessionalProfile, Availability, PartnerDraft
)
from backend.app.models.booking import Booking
from backend.app.models.order import Order, OrderItem
from backend.app.models.payment import PaymentTransaction
from backend.app.models.commerce import (
    SellerListing, SubOrder, SubOrderStatus, Shipment, ShipmentStatus,
    ReturnRequest, SellerEscrowRecord, EscrowStatus, InventoryAuditLog, StockAction
)
from backend.app.schemas.commerce import (
    SellerListingCreate, SellerListingUpdate, SellerListingResponse,
    ShipmentCreate, ReturnDecisionRequest, ReturnRequestResponse, SellerFinancialsResponse
)
from backend.app.services.commerce_service import (
    CommerceService, ESCROW_MATURITY_DAYS, is_cod_payment_method
)
from backend.app.services.cache_service import cache_service
from backend.app.schemas.partner import (
    PartnerProfileUpdate,
    PartnerDraftCreate,
    PartnerDraftResponse,
    PartnerApplicationCreate,
    AvailabilityResponse,
    ProfessionalProfileUpdate,
    ProfessionalServiceAssign,
    SalonProfileUpdate,
    SalonStaffCreate,
    SalonStaffResponse,
    SellerProductCreate,
    SellerProductUpdate,
    SellerStockUpdate,
    ProductVariantCreate,
    PartnerBookingStatusUpdate,
    SellerOrderStatusUpdate,
    PartnerStatementItem,
    PartnerFinancialsResponse
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _format_salon(s: Salon) -> dict:
    services = [x.strip() for x in s.services_list.split(",") if x.strip()] if s.services_list else []
    staff = [
        {"id": st.id, "name": st.name, "specialty": st.specialty, "img": st.img}
        for st in s.staff
    ]
    return {
        "id": s.id,
        "audience": s.audience,
        "owner_id": s.owner_id,
        "name": s.name,
        "area": s.area,
        "distance": s.distance,
        "rating": s.rating,
        "reviews": s.reviews,
        "price": s.price,
        "img": s.img,
        "tag": s.tag or "Popular",
        "services": services,
        "hours": s.hours,
        "about": s.about,
        "staff": staff
    }


def _format_product(p: Product) -> dict:
    active_listings = sorted(
        [l for l in (getattr(p, "seller_listings", None) or []) if l.is_active],
        key=lambda l: (0 if l.seller_id == p.seller_id else 1, float(l.price or 0.0), l.id),
    )
    default_listing_id = active_listings[0].id if active_listings else None
    variant_listings = {}
    for v in (p.variants or []):
        matching = [l for l in active_listings if (l.variant_name or "").strip() == v.name]
        if matching:
            variant_listings[v.name] = matching[0].id
        else:
            unscoped = [l for l in active_listings if not (l.variant_name or "").strip()]
            if unscoped:
                variant_listings[v.name] = unscoped[0].id

    return {
        "id": p.id,
        "audience": p.audience,
        "seller_id": p.seller_id,
        "brand": p.brand,
        "name": p.name,
        "category": p.category,
        "price": p.price,
        "old": p.old or 0.0,
        "rating": p.rating,
        "reviews": p.reviews,
        "img": p.img,
        "tag": p.tag or "",
        "description": p.description,
        "ingredients": p.ingredients or "",
        "stock": p.stock,
        "variants": [{"id": v.id, "name": v.name, "stock": v.stock} for v in p.variants] if p.variants else [],
        "default_listing_id": default_listing_id,
        "variant_listings": variant_listings,
    }


# ---------------------------------------------------------------------------
# Overview & Applications (Milestone A)
# ---------------------------------------------------------------------------

@router.get("/overview")
def get_partner_overview(
    role: str = Query("Professional"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role == UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Partner account required."
        )

    effective_role = role if user.role == UserRole.ADMIN else (
        "Professional" if user.role == UserRole.PROFESSIONAL else
        "Salon Owner" if user.role == UserRole.SALON_OWNER else
        "Product Seller" if user.role == UserRole.SELLER else "Professional"
    )

    if effective_role == "Professional":
        pro_profile = db.query(ProfessionalProfile).filter(
            ProfessionalProfile.user_id == user.id
        ).first()

        q = db.query(Booking).filter(Booking.type == "home")
        if user.role != UserRole.ADMIN and pro_profile:
            q = q.filter(Booking.professional_id == pro_profile.id)
        elif user.role != UserRole.ADMIN:
            q = q.filter(Booking.professional_id == -1)

        home_bookings = q.order_by(Booking.created_at.desc()).all()
        total_val = sum(b.price for b in home_bookings if b.status != BookingStatus.CANCELLED)
        services_count = len(pro_profile.services) if pro_profile and pro_profile.services else db.query(Service).count()

        return {
            "metrics": [
                {"label": "Upcoming appointments", "value": len([b for b in home_bookings if b.status == BookingStatus.CONFIRMED])},
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
        elif user.role != UserRole.ADMIN:
            q = q.filter(Booking.id == "__no_owned_salon__")

        salon_bookings = q.order_by(Booking.created_at.desc()).all()
        total_val = sum(float(b.price or 0) for b in salon_bookings if b.status != BookingStatus.CANCELLED)
        staff_count = db.query(SalonStaff).filter(SalonStaff.salon_id == salon.id).count() if salon else 0

        return {
            "metrics": [
                {"label": "Appointments", "value": len(salon_bookings)},
                {"label": "Active staff", "value": staff_count},
                {"label": "Branches", "value": 1 if salon else 0}
            ],
            "total_value": total_val,
            "bookings": [
                {"id": b.id, "title": b.title, "date": b.date, "time": b.time, "professional": b.professional, "status": b.status.value if hasattr(b.status, "value") else str(b.status or "confirmed"), "price": b.price}
                for b in salon_bookings[:10]
            ]
        }
    elif effective_role == "Product Seller":
        q = db.query(Order).join(OrderItem).join(Product).filter(Product.seller_id == user.id) if user.role != UserRole.ADMIN else db.query(Order)
        orders = q.order_by(Order.created_at.desc()).all()
        total_val = sum(o.total for o in orders if o.status != OrderStatus.CANCELLED)
        products_count = db.query(Product).filter(Product.seller_id == user.id).count() if user.role != UserRole.ADMIN else db.query(Product).count()

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
    else:
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


@router.post("/apply", response_model=PartnerDraftResponse)
def apply_for_partner(
    app_in: PartnerApplicationCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role_norm = app_in.role.strip().lower()
    if "pro" in role_norm:
        target_role = UserRole.PROFESSIONAL
        display_role = "Professional"
    elif "salon" in role_norm:
        target_role = UserRole.SALON_OWNER
        display_role = "Salon Owner"
    elif "sell" in role_norm:
        target_role = UserRole.SELLER
        display_role = "Product Seller"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid partner role requested. Choose professional, salon_owner, or seller."
        )

    # Prevent existing partners from re-applying for their current role
    if user.role == target_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User already holds the role of {display_role}."
        )

    # Prevent duplicate pending applications
    pending = db.query(PartnerDraft).filter(
        PartnerDraft.user_id == user.id,
        PartnerDraft.status == "PENDING",
        PartnerDraft.role == display_role
    ).first()
    if pending:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An application for {display_role} is already pending administrative review."
        )

    # Encode documents and portfolio references into description payload
    doc_meta = []
    if app_in.documents:
        doc_meta.append(f"Docs: {', '.join(app_in.documents)}")
    if app_in.portfolio_links:
        doc_meta.append(f"Portfolio: {', '.join(app_in.portfolio_links)}")
    if app_in.city:
        doc_meta.append(f"City: {app_in.city}")
    if app_in.phone:
        doc_meta.append(f"Phone: {app_in.phone}")

    full_desc = app_in.description.strip()
    if doc_meta:
        full_desc += f" [{ ' | '.join(doc_meta) }]"

    draft = PartnerDraft(
        user_id=user.id,
        role=display_role,
        name=app_in.name.strip(),
        price=float(app_in.price or 0.0),
        description=full_desc,
        status="PENDING"
    )
    db.add(draft)

    # Create applicant notification
    db.add(Notification(
        user_id=user.id,
        type="partner",
        text=f"Your partner application for {display_role} has been submitted and is under administrative review."
    ))

    db.commit()
    db.refresh(draft)
    return draft


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
        description=draft_in.description.strip(),
        status="PENDING"
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


# ---------------------------------------------------------------------------
# Professional Dashboard Operations (Milestone B)
# ---------------------------------------------------------------------------

@router.get("/professional/profile")
def get_professional_profile(
    user: User = Depends(require_professional),
    db: Session = Depends(get_db)
):
    pro = db.query(ProfessionalProfile).filter(
        ProfessionalProfile.user_id == user.id
    ).first()
    if not pro:
        # Auto-create if promoted without profile
        pro = ProfessionalProfile(
            user_id=user.id,
            name=user.full_name,
            specialty="Beauty Specialist",
            experience="Certified Expert",
            price=1500.0,
            rating=5.0,
            reviews=0,
            img="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80",
            is_verified=True
        )
        db.add(pro)
        db.commit()
        db.refresh(pro)

    return {
        "audience": pro.audience,
        "id": pro.id,
        "user_id": pro.user_id,
        "name": pro.name,
        "specialty": pro.specialty,
        "experience": pro.experience,
        "price": pro.price,
        "rating": pro.rating,
        "reviews": pro.reviews,
        "img": pro.img,
        "is_verified": pro.is_verified,
        "services_count": len(pro.services)
    }


@router.put("/professional/profile")
def update_professional_profile(
    payload: ProfessionalProfileUpdate,
    user: User = Depends(require_professional),
    db: Session = Depends(get_db)
):
    pro = db.query(ProfessionalProfile).filter(
        ProfessionalProfile.user_id == user.id
    ).first()
    if not pro:
        pro = ProfessionalProfile(
            user_id=user.id,
            name=payload.name or user.full_name,
            specialty=payload.specialty or "Beauty Specialist",
            experience=payload.experience or "Certified Specialist",
            price=payload.price or 1500.0,
            img=payload.img or "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500",
            is_verified=True
        )
        db.add(pro)
    else:
        if payload.name:
            pro.name = payload.name
        if payload.specialty:
            pro.specialty = payload.specialty
        if payload.experience:
            pro.experience = payload.experience
        if payload.price is not None:
            pro.price = float(payload.price)
        if payload.img:
            pro.img = payload.img

    if payload.audience is not None:
        pro.audience = payload.audience
    db.commit()
    db.refresh(pro)
    cache_service.invalidate_catalog()
    return {
        "audience": pro.audience,
        "id": pro.id,
        "name": pro.name,
        "specialty": pro.specialty,
        "experience": pro.experience,
        "price": pro.price,
        "img": pro.img,
        "is_verified": pro.is_verified
    }


@router.get("/professional/services")
def get_professional_services(
    user: User = Depends(require_professional),
    db: Session = Depends(get_db)
):
    pro = db.query(ProfessionalProfile).filter(
        ProfessionalProfile.user_id == user.id
    ).first()
    if not pro:
        return []
    return [
        {
            "id": s.id,
            "name": s.name,
            "category": s.category,
            "price": s.price,
            "duration": s.duration,
            "desc": s.desc,
            "img": s.img
        }
        for s in pro.services
    ]


@router.post("/professional/services")
def assign_professional_service(
    payload: ProfessionalServiceAssign,
    user: User = Depends(require_professional),
    db: Session = Depends(get_db)
):
    pro = db.query(ProfessionalProfile).filter(
        ProfessionalProfile.user_id == user.id
    ).first()
    if not pro:
        raise HTTPException(status_code=404, detail="Professional profile not found.")

    service = db.query(Service).filter(Service.id == payload.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found.")

    if service not in pro.services:
        pro.services.append(service)
        db.commit()

    return {"message": "Service successfully assigned", "service_id": service.id}


@router.delete("/professional/services/{service_id}")
def unlink_professional_service(
    service_id: str,
    user: User = Depends(require_professional),
    db: Session = Depends(get_db)
):
    pro = db.query(ProfessionalProfile).filter(
        ProfessionalProfile.user_id == user.id
    ).first()
    if not pro:
        raise HTTPException(status_code=404, detail="Professional profile not found.")

    service = db.query(Service).filter(Service.id == service_id).first()
    if service and service in pro.services:
        pro.services.remove(service)
        db.commit()

    return {"message": "Service successfully unlinked"}


@router.get("/professional/bookings")
def get_professional_bookings(
    user: User = Depends(require_professional),
    db: Session = Depends(get_db)
):
    pro = db.query(ProfessionalProfile).filter(
        ProfessionalProfile.user_id == user.id
    ).first()
    pro_id = pro.id if pro else -1

    bookings = db.query(Booking).filter(
        Booking.professional_id == pro_id
    ).order_by(Booking.created_at.desc()).all()

    return [
        {
            "id": b.id,
            "title": b.title,
            "date": b.date,
            "time": b.time,
            "location": b.location,
            "price": b.price,
            "status": b.status.value,
            "customer_id": b.customer_id,
            "customer_name": b.customer.full_name if b.customer else "Client"
        }
        for b in bookings
    ]


@router.patch("/professional/bookings/{booking_id}/status")
def update_professional_booking_status(
    booking_id: str,
    payload: PartnerBookingStatusUpdate,
    user: User = Depends(require_professional),
    db: Session = Depends(get_db)
):
    pro = db.query(ProfessionalProfile).filter(
        ProfessionalProfile.user_id == user.id
    ).first()
    pro_id = pro.id if pro else -1

    booking = db.query(Booking).filter(Booking.id == booking_id).with_for_update().populate_existing().first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    # Strict BOLA / IDOR Verification
    if user.role != UserRole.ADMIN and (not pro or booking.professional_id != pro.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation forbidden: Booking does not belong to your professional account."
        )

    try:
        new_status = BookingStatus(payload.status.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid booking status '{payload.status}'.")

    if new_status == BookingStatus.CANCELLED and booking.payment_status == "pending" and db.query(PaymentTransaction).filter(PaymentTransaction.booking_id == booking.id).first():
        raise HTTPException(status_code=409, detail="A payment attempt is awaiting reconciliation; this appointment cannot be cancelled yet.")
    if new_status in (BookingStatus.CONFIRMED, BookingStatus.COMPLETED) and booking.payment_status != "completed":
        raise HTTPException(status_code=400, detail="Payment must be completed before this appointment can be confirmed or completed.")

    booking.status = new_status

    if new_status == BookingStatus.CANCELLED:
        txn = db.query(PaymentTransaction).filter(
            PaymentTransaction.booking_id == booking.id,
            PaymentTransaction.status == "captured"
        ).first()
        if txn:
            txn.status = "refund_pending"

        db.add(Notification(
            user_id=booking.customer_id,
            type="booking",
            text=f"Your appointment '{booking.title}' on {booking.date} has been cancelled by the professional."
        ))
    elif new_status == BookingStatus.COMPLETED:
        db.add(Notification(
            user_id=booking.customer_id,
            type="booking",
            text=f"Your appointment '{booking.title}' is completed. We invite you to leave a review!"
        ))

    db.commit()
    db.refresh(booking)
    return {
        "id": booking.id,
        "title": booking.title,
        "status": booking.status.value,
        "date": booking.date,
        "price": booking.price
    }


# ---------------------------------------------------------------------------
# Salon Owner Operations (Milestone C)
# ---------------------------------------------------------------------------

@router.get("/salon/profile")
def get_salon_profile(
    user: User = Depends(require_salon_owner),
    db: Session = Depends(get_db)
):
    salon = db.query(Salon).filter(Salon.owner_id == user.id).first()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon profile not found.")
    return _format_salon(salon)


@router.put("/salon/profile")
def update_salon_profile(
    payload: SalonProfileUpdate,
    user: User = Depends(require_salon_owner),
    db: Session = Depends(get_db)
):
    salon = db.query(Salon).filter(Salon.owner_id == user.id).first()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found.")

    if payload.name:
        salon.name = payload.name.strip()
    if payload.area:
        salon.area = payload.area.strip()
    if payload.hours:
        salon.hours = payload.hours.strip()
    if payload.about:
        salon.about = payload.about.strip()
    if payload.price is not None:
        salon.price = float(payload.price)
    if payload.img:
        salon.img = payload.img.strip()
    if payload.services is not None:
        salon.services_list = ",".join(payload.services)
    if payload.audience is not None:
        salon.audience = payload.audience

    db.commit()
    db.refresh(salon)
    cache_service.invalidate_catalog()
    return _format_salon(salon)


@router.get("/salon/staff", response_model=List[SalonStaffResponse])
def get_salon_staff(
    user: User = Depends(require_salon_owner),
    db: Session = Depends(get_db)
):
    salon = db.query(Salon).filter(Salon.owner_id == user.id).first()
    if not salon:
        return []
    return salon.staff


@router.post("/salon/staff", response_model=SalonStaffResponse)
def add_salon_staff(
    payload: SalonStaffCreate,
    user: User = Depends(require_salon_owner),
    db: Session = Depends(get_db)
):
    salon = db.query(Salon).filter(Salon.owner_id == user.id).first()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found.")

    staff = SalonStaff(
        salon_id=salon.id,
        name=payload.name.strip(),
        specialty=payload.specialty.strip(),
        img=payload.img or "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500"
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)
    cache_service.invalidate_catalog()
    return staff


@router.delete("/salon/staff/{staff_id}")
def delete_salon_staff(
    staff_id: int,
    user: User = Depends(require_salon_owner),
    db: Session = Depends(get_db)
):
    staff = db.query(SalonStaff).filter(SalonStaff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found.")

    salon = db.query(Salon).filter(Salon.id == staff.salon_id).first()
    if user.role != UserRole.ADMIN and (not salon or salon.owner_id != user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Staff member belongs to another salon."
        )

    db.delete(staff)
    db.commit()
    cache_service.invalidate_catalog()
    return {"message": "Staff member removed successfully"}


@router.get("/salon/bookings")
def get_salon_bookings(
    user: User = Depends(require_salon_owner),
    db: Session = Depends(get_db)
):
    salon = db.query(Salon).filter(Salon.owner_id == user.id).first()
    if not salon:
        return []

    bookings = db.query(Booking).filter(Booking.salon_id == salon.id).order_by(Booking.created_at.desc()).all()
    return [
        {
            "id": b.id,
            "title": b.title,
            "date": b.date,
            "time": b.time,
            "location": b.location,
            "price": b.price,
            "status": b.status.value,
            "professional": b.professional,
            "customer_name": b.customer.full_name if b.customer else "Client"
        }
        for b in bookings
    ]


@router.patch("/salon/bookings/{booking_id}/status")
def update_salon_booking_status(
    booking_id: str,
    payload: PartnerBookingStatusUpdate,
    user: User = Depends(require_salon_owner),
    db: Session = Depends(get_db)
):
    salon = db.query(Salon).filter(Salon.owner_id == user.id).first()
    booking = db.query(Booking).filter(Booking.id == booking_id).with_for_update().populate_existing().first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if user.role != UserRole.ADMIN and (not salon or booking.salon_id != salon.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation forbidden: Booking does not belong to your salon studio."
        )

    try:
        new_status = BookingStatus(payload.status.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid booking status '{payload.status}'.")

    if new_status == BookingStatus.CANCELLED and booking.payment_status == "pending" and db.query(PaymentTransaction).filter(PaymentTransaction.booking_id == booking.id).first():
        raise HTTPException(status_code=409, detail="A payment attempt is awaiting reconciliation; this appointment cannot be cancelled yet.")
    if new_status in (BookingStatus.CONFIRMED, BookingStatus.COMPLETED) and booking.payment_status != "completed":
        raise HTTPException(status_code=400, detail="Payment must be completed before this appointment can be confirmed or completed.")

    booking.status = new_status

    if new_status == BookingStatus.CANCELLED:
        txn = db.query(PaymentTransaction).filter(
            PaymentTransaction.booking_id == booking.id,
            PaymentTransaction.status == "captured"
        ).first()
        if txn:
            txn.status = "refund_pending"

        db.add(Notification(
            user_id=booking.customer_id,
            type="booking",
            text=f"Your appointment '{booking.title}' at {salon.name if salon else 'the salon'} has been cancelled."
        ))
    elif new_status == BookingStatus.COMPLETED:
        db.add(Notification(
            user_id=booking.customer_id,
            type="booking",
            text=f"Your appointment '{booking.title}' is completed. We hope you enjoyed your studio visit!"
        ))

    db.commit()
    db.refresh(booking)
    return {
        "id": booking.id,
        "title": booking.title,
        "status": booking.status.value,
        "date": booking.date,
        "price": booking.price
    }


# ---------------------------------------------------------------------------
# Seller Operations (Milestone D)
# ---------------------------------------------------------------------------

@router.get("/seller/products")
def get_seller_products(
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    products = db.query(Product).filter(Product.seller_id == user.id).all()
    return [_format_product(p) for p in products]


@router.post("/seller/products")
def create_seller_product(
    payload: SellerProductCreate,
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    pid = f"b{int(time.time()*1000)}"
    variants_clean = [v.strip() for v in (payload.variants or []) if v and v.strip()]
    total_init_stock = max(
        0,
        int(payload.stock if payload.stock is not None else (50 * len(variants_clean) if variants_clean else 100))
    )
    product = Product(
        id=pid,
        seller_id=user.id,
        audience=payload.audience,
        brand=payload.brand.strip(),
        name=payload.name.strip(),
        category=payload.category.strip(),
        price=float(payload.price),
        old=float(payload.old or 0.0),
        img=payload.img.strip(),
        tag=payload.tag.strip() if payload.tag else "",
        description=payload.description.strip(),
        ingredients=payload.ingredients.strip() if payload.ingredients else None,
        stock=total_init_stock,
        is_active=True
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    if variants_clean:
        base_v, rem_v = divmod(total_init_stock, len(variants_clean))
        for idx, v in enumerate(variants_clean):
            db.add(ProductVariant(product_id=product.id, name=v, stock=base_v + (1 if idx < rem_v else 0)))
        db.commit()
        db.refresh(product)

    CommerceService.ensure_product_listings(db, product)
    CommerceService.sync_product_stock(db, product.id)
    db.commit()
    db.refresh(product)

    cache_service.invalidate_catalog()
    return _format_product(product)


@router.put("/seller/products/{product_id}")
def update_seller_product(
    product_id: str,
    payload: SellerProductUpdate,
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    if user.role != UserRole.ADMIN and product.seller_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Product belongs to another seller."
        )

    if payload.audience is not None:
        product.audience = payload.audience
    if payload.brand:
        product.brand = payload.brand.strip()
    if payload.name:
        product.name = payload.name.strip()
    if payload.category:
        product.category = payload.category.strip()
    if payload.price is not None:
        product.price = float(payload.price)
    if payload.old is not None:
        product.old = float(payload.old)
    if payload.img:
        product.img = payload.img.strip()
    if payload.tag is not None:
        product.tag = payload.tag.strip()
    if payload.description:
        product.description = payload.description.strip()
    if payload.ingredients is not None:
        product.ingredients = payload.ingredients.strip()

    if payload.price is not None or payload.old is not None:
        owner_seller_id = product.seller_id or user.id
        canonical_listings = db.query(SellerListing).filter(
            SellerListing.product_id == product.id,
            SellerListing.seller_id == owner_seller_id,
        ).all()
        for l in canonical_listings:
            if payload.price is not None:
                l.price = float(payload.price)
            if payload.old is not None:
                l.compare_at_price = float(payload.old)

    CommerceService.sync_product_stock(db, product.id)
    db.commit()
    db.refresh(product)
    cache_service.invalidate_catalog()
    return _format_product(product)


@router.patch("/seller/products/{product_id}/stock")
def update_seller_stock(
    product_id: str,
    payload: SellerStockUpdate,
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    if user.role != UserRole.ADMIN and product.seller_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Product belongs to another seller."
        )

    target_stock = max(0, int(payload.stock))
    owner_seller_id = product.seller_id or user.id
    listings = (
        db.query(SellerListing)
        .filter(SellerListing.product_id == product.id, SellerListing.seller_id == owner_seller_id)
        .order_by(SellerListing.id.asc())
        .with_for_update()
        .all()
    )
    if not listings:
        CommerceService.ensure_product_listings(db, product)
        listings = (
            db.query(SellerListing)
            .filter(SellerListing.product_id == product.id, SellerListing.seller_id == owner_seller_id)
            .order_by(SellerListing.id.asc())
            .with_for_update()
            .all()
        )

    for idx, l in enumerate(listings):
        before = int(l.stock or 0)
        after = target_stock if idx == 0 else 0
        if before != after:
            l.stock = after
            db.add(InventoryAuditLog(
                listing_id=l.id,
                seller_id=l.seller_id,
                action=StockAction.MANUAL_ADJUSTMENT,
                quantity_delta=after - before,
                balance_before=before,
                balance_after=after,
                reference_type="MANUAL",
                reference_id=product.id,
            ))

    db.flush()
    CommerceService.sync_product_stock(db, product.id)

    # Low-stock notification trigger
    if product.stock <= 5:
        db.add(Notification(
            user_id=user.id,
            type="order",
            text=f"Inventory Alert: Stock for '{product.name}' is critically low ({product.stock} units remaining)."
        ))

    db.commit()
    cache_service.invalidate_catalog()
    return {"product_id": product.id, "name": product.name, "stock": product.stock}


@router.post("/seller/products/{product_id}/variants")
def add_seller_variant(
    product_id: str,
    payload: ProductVariantCreate,
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    if user.role != UserRole.ADMIN and product.seller_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Product belongs to another seller."
        )

    v_name = payload.name.strip()
    if not v_name:
        raise HTTPException(status_code=400, detail="Variant name cannot be empty.")
    if any((v.name or "").strip().lower() == v_name.lower() for v in (product.variants or [])):
        raise HTTPException(status_code=400, detail=f"Variant '{v_name}' already exists.")

    variant = ProductVariant(
        product_id=product.id,
        name=v_name,
        stock=max(0, int(payload.stock if payload.stock is not None else 50))
    )
    db.add(variant)
    db.flush()
    db.refresh(product)
    CommerceService.ensure_product_listings(db, product)
    CommerceService.sync_product_stock(db, product.id)
    db.commit()
    db.refresh(variant)
    cache_service.invalidate_catalog()
    return {"id": variant.id, "product_id": variant.product_id, "name": variant.name, "stock": variant.stock}


@router.get("/seller/orders")
def get_seller_orders(
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    # Orders containing this seller's items or products
    orders = db.query(Order).join(OrderItem).outerjoin(Product).filter(
        or_(OrderItem.seller_id == user.id, Product.seller_id == user.id)
    ).order_by(Order.created_at.desc()).distinct().all()

    results = []
    for o in orders:
        seller_items = [
            {
                "id": i.id,
                "product_id": i.product_id,
                "name": i.name,
                "variant_name": i.variant_name or "",
                "sku": i.sku or "",
                "qty": i.qty,
                "price": i.price,
                "allocated_discount": i.allocated_discount or 0.0,
            }
            for i in o.items if (i.seller_id == user.id or (i.product and i.product.seller_id == user.id))
        ]
        results.append({
            "id": o.id,
            "date": o.date,
            "total": o.total,
            "status": o.status.value,
            "payment_method": o.payment_method,
            "payment_status": o.payment_status,
            "address_text": o.address_text,
            "items": seller_items
        })
    return results


@router.patch("/seller/orders/{order_id}/status")
def update_seller_order_status(
    order_id: str,
    payload: SellerOrderStatusUpdate,
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).with_for_update().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    # Check seller ownership of products/suborders in order
    seller_items = [
        i for i in order.items
        if (i.seller_id == user.id or (i.product and i.product.seller_id == user.id))
    ]
    if user.role != UserRole.ADMIN and not seller_items:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Order does not contain items from your store."
        )

    try:
        new_status = OrderStatus(payload.status.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid order status '{payload.status}'.")

    if order.status == OrderStatus.CANCELLED and new_status != OrderStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Cannot modify a cancelled order.")
    if order.status == OrderStatus.DELIVERED and new_status != OrderStatus.DELIVERED:
        raise HTTPException(status_code=400, detail="Cannot regress a delivered order.")

    is_cod = is_cod_payment_method(order.payment_method)
    if (
        new_status in (OrderStatus.PACKED, OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED)
        and not is_cod
        and order.payment_status != "completed"
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot fulfill an online order before payment is confirmed."
        )

    now_utc = datetime.now(timezone.utc)
    sub_query = db.query(SubOrder).filter(SubOrder.parent_order_id == order.id)
    all_subs = sub_query.with_for_update().all()
    if all_subs:
        target_subs = all_subs if user.role == UserRole.ADMIN else [s for s in all_subs if s.seller_id == user.id]
        status_map = {
            OrderStatus.PLACED: SubOrderStatus.PLACED,
            OrderStatus.PACKED: SubOrderStatus.PACKED,
            OrderStatus.IN_TRANSIT: SubOrderStatus.IN_TRANSIT,
            OrderStatus.DELIVERED: SubOrderStatus.DELIVERED,
            OrderStatus.CANCELLED: SubOrderStatus.CANCELLED,
        }
        mapped_sub_status = status_map[new_status]
        for sub in target_subs:
            sub.status = mapped_sub_status
            sub.updated_at = now_utc
            if mapped_sub_status == SubOrderStatus.DELIVERED:
                shipment = db.query(Shipment).filter(Shipment.suborder_id == sub.id).first()
                if shipment:
                    shipment.delivered_at = shipment.delivered_at or now_utc
                    shipment.status = ShipmentStatus.DELIVERED
                escrow = db.query(SellerEscrowRecord).filter(SellerEscrowRecord.suborder_id == sub.id).with_for_update().first()
                if escrow and escrow.status == EscrowStatus.HELD_IN_ESCROW:
                    if escrow.delivered_at is None:
                        escrow.delivered_at = now_utc
                    if escrow.matures_at is None:
                        escrow.matures_at = now_utc + timedelta(days=ESCROW_MATURITY_DAYS)
        db.flush()
        CommerceService._rollup_parent_order_status(db, order.id)
    else:
        order.status = new_status

    if is_cod and order.status == OrderStatus.DELIVERED and order.payment_status in ("pending", "cod_pending"):
        order.payment_status = "cod_collected"

    # Dispatched tracking updates to customer
    db.add(Notification(
        user_id=order.customer_id,
        type="order",
        text=f"Your order #{order.id} status has been updated to: {order.status.value.replace('_', ' ').title()}."
    ))

    db.commit()
    db.refresh(order)
    return {
        "id": order.id,
        "status": order.status.value,
        "payment_status": order.payment_status,
        "date": order.date,
        "total": order.total
    }


# ---------------------------------------------------------------------------
# Phase 5: Multi-Vendor Seller Operations (Listings, Suborders, Returns, Escrow)
# ---------------------------------------------------------------------------

@router.get("/seller/listings", response_model=List[SellerListingResponse])
def get_seller_listings(
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    listings = db.query(SellerListing).filter(SellerListing.seller_id == user.id).all()
    res = []
    for l in listings:
        res.append({
            "id": l.id,
            "product_id": l.product_id,
            "seller_id": l.seller_id,
            "seller_name": user.full_name,
            "variant_name": l.variant_name or "",
            "sku": l.sku,
            "price": l.price,
            "compare_at_price": l.compare_at_price,
            "stock": l.stock,
            "is_active": l.is_active,
            "condition": l.condition,
            "shipping_lead_time_days": l.shipping_lead_time_days,
            "created_at": l.created_at,
            "updated_at": l.updated_at
        })
    return res


@router.post("/seller/listings", response_model=SellerListingResponse, status_code=status.HTTP_201_CREATED)
def create_seller_listing_endpoint(
    payload: SellerListingCreate,
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    listing = CommerceService.create_seller_listing(db, user.id, payload)
    return {
        "id": listing.id,
        "product_id": listing.product_id,
        "seller_id": listing.seller_id,
        "seller_name": user.full_name,
        "variant_name": listing.variant_name or "",
        "sku": listing.sku,
        "price": listing.price,
        "compare_at_price": listing.compare_at_price,
        "stock": listing.stock,
        "is_active": listing.is_active,
        "condition": listing.condition,
        "shipping_lead_time_days": listing.shipping_lead_time_days,
        "created_at": listing.created_at,
        "updated_at": listing.updated_at
    }


@router.patch("/seller/listings/{listing_id}", response_model=SellerListingResponse)
def update_seller_listing_endpoint(
    listing_id: int,
    payload: SellerListingUpdate,
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    listing = CommerceService.update_seller_listing(db, user.id, listing_id, payload)
    return {
        "id": listing.id,
        "product_id": listing.product_id,
        "seller_id": listing.seller_id,
        "seller_name": user.full_name,
        "variant_name": listing.variant_name or "",
        "sku": listing.sku,
        "price": listing.price,
        "compare_at_price": listing.compare_at_price,
        "stock": listing.stock,
        "is_active": listing.is_active,
        "condition": listing.condition,
        "shipping_lead_time_days": listing.shipping_lead_time_days,
        "created_at": listing.created_at,
        "updated_at": listing.updated_at
    }


@router.get("/seller/suborders")
def get_seller_suborders(
    status_filter: Optional[str] = Query(None, alias="status"),
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    q = db.query(SubOrder).filter(SubOrder.seller_id == user.id)
    if status_filter:
        statuses = [s.strip().lower() for s in status_filter.split(",")]
        q = q.filter(SubOrder.status.in_([SubOrderStatus(s) for s in statuses if s in SubOrderStatus._value2member_map_]))
    suborders = q.order_by(SubOrder.created_at.desc()).all()

    results = []
    for s in suborders:
        parent = s.parent_order
        shipment_data = None
        if s.shipment:
            shipment_data = {
                "id": s.shipment.id,
                "carrier_name": s.shipment.carrier_name,
                "tracking_number": s.shipment.tracking_number,
                "tracking_url": s.shipment.tracking_url,
                "shipped_at": s.shipment.shipped_at,
                "delivered_at": s.shipment.delivered_at,
                "status": s.shipment.status.value
            }
        results.append({
            "suborder_id": s.id,
            "parent_order_id": s.parent_order_id,
            "parent_order_status": parent.status.value if parent else None,
            "seller_id": s.seller_id,
            "seller_name": user.full_name,
            "payment_method": parent.payment_method if parent else None,
            "payment_status": parent.payment_status if parent else None,
            "shipping_address_label": parent.address_label if parent else None,
            "shipping_address_text": parent.address_text if parent else None,
            "subtotal": s.subtotal,
            "shipping_fee": s.shipping_fee,
            "discount": s.discount,
            "total": s.total,
            "status": s.status.value,
            "items": [
                {
                    "order_item_id": oi.id,
                    "product_id": oi.product_id,
                    "name": oi.name,
                    "variant_name": oi.variant_name or "",
                    "sku": oi.sku or "",
                    "seller_name": oi.seller_name or user.full_name,
                    "qty": oi.qty,
                    "price": oi.price,
                    "allocated_discount": oi.allocated_discount or 0.0,
                }
                for oi in s.items
            ],
            "shipment": shipment_data,
            "created_at": s.created_at
        })
    return results


@router.get("/seller/suborders/{suborder_id}")
def get_seller_suborder_detail(
    suborder_id: str,
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    s = db.query(SubOrder).filter(SubOrder.id == suborder_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Suborder not found")
    if user.role != UserRole.ADMIN and s.seller_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to another merchant's suborder")

    parent = s.parent_order
    seller_display_name = s.seller.full_name if s.seller else user.full_name

    shipment_data = None
    if s.shipment:
        shipment_data = {
            "id": s.shipment.id,
            "suborder_id": s.shipment.suborder_id,
            "carrier_name": s.shipment.carrier_name,
            "tracking_number": s.shipment.tracking_number,
            "tracking_url": s.shipment.tracking_url,
            "shipped_at": s.shipment.shipped_at,
            "delivered_at": s.shipment.delivered_at,
            "status": s.shipment.status.value,
            "notes": s.shipment.notes
        }

    return {
        "suborder_id": s.id,
        "parent_order_id": s.parent_order_id,
        "parent_order_status": parent.status.value if parent else None,
        "seller_id": s.seller_id,
        "seller_name": seller_display_name,
        "payment_method": parent.payment_method if parent else None,
        "payment_status": parent.payment_status if parent else None,
        "shipping_address_label": parent.address_label if parent else None,
        "shipping_address_text": parent.address_text if parent else None,
        "subtotal": s.subtotal,
        "shipping_fee": s.shipping_fee,
        "discount": s.discount,
        "total": s.total,
        "status": s.status.value,
        "items": [
            {
                "order_item_id": oi.id,
                "product_id": oi.product_id,
                "name": oi.name,
                "variant_name": oi.variant_name or "",
                "sku": oi.sku or "",
                "seller_name": oi.seller_name or seller_display_name,
                "qty": oi.qty,
                "price": oi.price,
                "allocated_discount": oi.allocated_discount or 0.0,
            }
            for oi in s.items
        ],
        "shipment": shipment_data,
        "created_at": s.created_at
    }


@router.post("/seller/suborders/{suborder_id}/pack")
def pack_seller_suborder(
    suborder_id: str,
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    sub = CommerceService.pack_suborder(db, user.id, suborder_id)
    return {"suborder_id": sub.id, "status": sub.status.value, "message": "Suborder marked as packed."}


@router.post("/seller/suborders/{suborder_id}/ship")
def ship_seller_suborder(
    suborder_id: str,
    payload: ShipmentCreate,
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    sub = CommerceService.ship_suborder(db, user.id, suborder_id, payload)
    return {
        "suborder_id": sub.id,
        "status": sub.status.value,
        "carrier_name": payload.carrier_name,
        "tracking_number": payload.tracking_number,
        "tracking_url": sub.shipment.tracking_url if sub.shipment else None,
        "message": "Suborder dispatched."
    }


@router.post("/seller/suborders/{suborder_id}/deliver")
def deliver_seller_suborder(
    suborder_id: str,
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    sub = CommerceService.deliver_suborder(db, user.id, suborder_id)
    return {"suborder_id": sub.id, "status": sub.status.value, "message": "Delivery confirmed and escrow initialized."}


@router.get("/seller/returns", response_model=List[ReturnRequestResponse])
def get_seller_returns(
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    returns = db.query(ReturnRequest).filter(ReturnRequest.seller_id == user.id).order_by(ReturnRequest.created_at.desc()).all()
    return returns


@router.post("/seller/returns/{return_id}/decide", response_model=ReturnRequestResponse)
def decide_seller_return(
    return_id: str,
    payload: ReturnDecisionRequest,
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    return CommerceService.decide_return(db, user.id, return_id, payload)


@router.get("/seller/financials", response_model=SellerFinancialsResponse)
def get_seller_multi_vendor_financials(
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    return CommerceService.get_seller_financials(db, user.id)


# ---------------------------------------------------------------------------
# Partner Financial Operations (Milestone E)
# ---------------------------------------------------------------------------

@router.get("/financials", response_model=PartnerFinancialsResponse)
def get_partner_financials(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    user: User = Depends(require_partner),
    db: Session = Depends(get_db)
):
    statements: List[PartnerStatementItem] = []
    gross_sales = 0.0
    refund_deductions = 0.0

    if user.role == UserRole.PROFESSIONAL:
        pro = db.query(ProfessionalProfile).filter(
            ProfessionalProfile.user_id == user.id
        ).first()
        pro_id = pro.id if pro else -1

        q = db.query(Booking).filter(
            Booking.professional_id == pro_id
        )
        if start_date:
            q = q.filter(Booking.date >= start_date)
        if end_date:
            q = q.filter(Booking.date <= end_date)

        bookings = q.all()
        for b in bookings:
            comm = round(b.price * 0.15, 2)
            net = round(b.price - comm, 2)
            if b.status in [BookingStatus.CONFIRMED, BookingStatus.COMPLETED]:
                gross_sales += b.price
                statements.append(PartnerStatementItem(
                    transaction_id=f"TXN_BK_{b.id}",
                    type="booking",
                    reference_id=b.id,
                    title=b.title,
                    date=b.date,
                    gross_amount=b.price,
                    commission_amount=comm,
                    net_amount=net,
                    status=b.status.value
                ))
            elif b.status == BookingStatus.CANCELLED:
                refund_deductions += b.price
                statements.append(PartnerStatementItem(
                    transaction_id=f"TXN_BK_REF_{b.id}",
                    type="booking",
                    reference_id=b.id,
                    title=f"[Cancelled] {b.title}",
                    date=b.date,
                    gross_amount=b.price,
                    commission_amount=0.0,
                    net_amount=-b.price,
                    status="refunded"
                ))

    elif user.role == UserRole.SALON_OWNER:
        salon = db.query(Salon).filter(Salon.owner_id == user.id).first()
        if not salon and user.role == UserRole.ADMIN:
            salon = db.query(Salon).first()

        salon_id = salon.id if salon else "none"
        q = db.query(Booking).filter(Booking.salon_id == salon_id)
        if start_date:
            q = q.filter(Booking.date >= start_date)
        if end_date:
            q = q.filter(Booking.date <= end_date)

        bookings = q.all()
        for b in bookings:
            comm = round(b.price * 0.15, 2)
            net = round(b.price - comm, 2)
            if b.status in [BookingStatus.CONFIRMED, BookingStatus.COMPLETED]:
                gross_sales += b.price
                statements.append(PartnerStatementItem(
                    transaction_id=f"TXN_BK_{b.id}",
                    type="booking",
                    reference_id=b.id,
                    title=b.title,
                    date=b.date,
                    gross_amount=b.price,
                    commission_amount=comm,
                    net_amount=net,
                    status=b.status.value
                ))
            elif b.status == BookingStatus.CANCELLED:
                refund_deductions += b.price
                statements.append(PartnerStatementItem(
                    transaction_id=f"TXN_BK_REF_{b.id}",
                    type="booking",
                    reference_id=b.id,
                    title=f"[Cancelled] {b.title}",
                    date=b.date,
                    gross_amount=b.price,
                    commission_amount=0.0,
                    net_amount=-b.price,
                    status="refunded"
                ))

    elif user.role == UserRole.SELLER or user.role == UserRole.ADMIN:
        q = db.query(OrderItem).join(Product).filter(Product.seller_id == user.id) if user.role != UserRole.ADMIN else db.query(OrderItem)
        items = q.all()
        for item in items:
            item_gross = item.price * item.qty
            comm = round(item_gross * 0.15, 2)
            net = round(item_gross - comm, 2)
            if item.order.status != OrderStatus.CANCELLED:
                gross_sales += item_gross
                statements.append(PartnerStatementItem(
                    transaction_id=f"TXN_ORD_{item.id}",
                    type="order",
                    reference_id=item.order_id,
                    title=item.name,
                    date=item.order.date,
                    gross_amount=item_gross,
                    commission_amount=comm,
                    net_amount=net,
                    status=item.order.status.value
                ))
            else:
                refund_deductions += item_gross
                statements.append(PartnerStatementItem(
                    transaction_id=f"TXN_ORD_REF_{item.id}",
                    type="order",
                    reference_id=item.order_id,
                    title=f"[Cancelled] {item.name}",
                    date=item.order.date,
                    gross_amount=item_gross,
                    commission_amount=0.0,
                    net_amount=-item_gross,
                    status="refunded"
                ))

    platform_commission = round(gross_sales * 0.15, 2)
    net_earnings = round(max(0.0, gross_sales - platform_commission - refund_deductions), 2)

    # Real payment transaction settlement tracking
    txns = db.query(PaymentTransaction).filter(PaymentTransaction.status == "captured").all()
    settled_funds = round(sum(t.amount for t in txns if t.user_id == user.id) * 0.85, 2)
    pending_payout = round(max(0.0, net_earnings - settled_funds), 2)

    return PartnerFinancialsResponse(
        gross_sales=gross_sales,
        platform_commission=platform_commission,
        commission_rate=0.15,
        refund_deductions=refund_deductions,
        net_earnings=net_earnings,
        settlement_summary={
            "settled_amount": settled_funds,
            "pending_payout": pending_payout,
            "last_settlement_date": datetime.now(timezone.utc).strftime("%Y-%m-%d") if settled_funds > 0 else None,
            "settlement_currency": "INR",
            "payout_status": "settled" if pending_payout == 0.0 and settled_funds > 0 else "pending_cycle"
        },
        statements=statements
    )
