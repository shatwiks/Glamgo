import secrets
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.core.database import get_db
from backend.app.api.deps import require_admin
from backend.app.models.user import User, UserRole, Notification
from backend.app.models.catalog import Service, Salon, Product, ProfessionalProfile, PartnerDraft
from backend.app.models.booking import Booking, BookingStatus
from backend.app.models.order import Order, OrderStatus
from backend.app.models.admin import AdminAuditLog
from backend.app.schemas.user import UserResponse
from backend.app.schemas.admin import (
    AdminStatsEnhancedResponse,
    AdminAuditLogResponse,
    PartnerDraftModerationResponse,
    PartnerDraftRejectRequest,
    UserRoleUpdateRequest
)
from backend.app.services.audit_service import log_admin_action

router = APIRouter()


@router.get("/stats", response_model=AdminStatsEnhancedResponse)
def get_admin_stats(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    customers_count = db.query(User).filter(User.role == UserRole.CUSTOMER).count()
    pros_count = db.query(ProfessionalProfile).count()
    salons_count = db.query(Salon).count()
    products_count = db.query(Product).count()

    booking_revenue = db.query(func.coalesce(func.sum(Booking.price), 0.0)).filter(
        Booking.status != BookingStatus.CANCELLED
    ).scalar() or 0.0

    order_revenue = db.query(func.coalesce(func.sum(Order.total), 0.0)).filter(
        Order.status != OrderStatus.CANCELLED
    ).scalar() or 0.0

    # Vertical breakdowns
    services_gmv = db.query(func.coalesce(func.sum(Booking.price), 0.0)).filter(
        Booking.type == "home",
        Booking.status != BookingStatus.CANCELLED
    ).scalar() or 0.0

    salons_gmv = db.query(func.coalesce(func.sum(Booking.price), 0.0)).filter(
        Booking.type == "salon",
        Booking.status != BookingStatus.CANCELLED
    ).scalar() or 0.0

    ecommerce_gmv = order_revenue

    total_bookings = db.query(func.count(Booking.id)).scalar() or 0
    total_orders = db.query(func.count(Order.id)).scalar() or 0

    active_bookings_count = db.query(func.count(Booking.id)).filter(
        Booking.status != BookingStatus.CANCELLED
    ).scalar() or 0

    active_orders_count = db.query(func.count(Order.id)).filter(
        Order.status != OrderStatus.CANCELLED
    ).scalar() or 0

    gmv = round(booking_revenue + order_revenue, 2)
    platform_commission = round(gmv * 0.15, 2)  # 15% marketplace commission

    avg_booking_val = round(booking_revenue / active_bookings_count, 2) if active_bookings_count > 0 else 0.0
    avg_order_val = round(order_revenue / active_orders_count, 2) if active_orders_count > 0 else 0.0

    return {
        "customers_count": customers_count,
        "professionals_count": pros_count,
        "salons_count": salons_count,
        "products_count": products_count,
        "total_bookings": total_bookings,
        "total_orders": total_orders,
        "booking_revenue": booking_revenue,
        "order_revenue": order_revenue,
        "gross_merchandise_value": gmv,
        "platform_commission": platform_commission,
        "services_gmv": round(services_gmv, 2),
        "salons_gmv": round(salons_gmv, 2),
        "ecommerce_gmv": round(ecommerce_gmv, 2),
        "average_booking_value": avg_booking_val,
        "average_order_value": avg_order_val
    }


@router.get("/users", response_model=List[UserResponse])
def get_admin_users(
    role: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _admin=Depends(require_admin)
):
    q = db.query(User)
    if role:
        try:
            r_enum = UserRole(role.lower())
            q = q.filter(User.role == r_enum)
        except ValueError:
            pass

    if search:
        s_term = f"%{search.strip()}%"
        q = q.filter((User.full_name.ilike(s_term)) | (User.email.ilike(s_term)))

    return q.order_by(User.created_at.desc()).all()


@router.patch("/users/{user_id}/toggle-status", response_model=UserResponse)
def toggle_user_status(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    if admin_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot deactivate their own active account."
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot deactivate administrative accounts."
        )

    try:
        user.is_active = not user.is_active
        client_ip = request.client.host if request.client else None
        log_admin_action(
            db=db,
            admin_id=admin_user.id,
            action="TOGGLE_USER_STATUS",
            target_type="USER",
            target_id=str(user.id),
            details={"email": user.email, "is_active": user.is_active},
            ip_address=client_ip,
            commit=False
        )
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise

    return user


@router.patch("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    payload: UserRoleUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    if admin_user.id == user_id and payload.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot revoke their own administrative privileges."
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    try:
        old_role = user.role.value
        user.role = payload.role
        client_ip = request.client.host if request.client else None
        log_admin_action(
            db=db,
            admin_id=admin_user.id,
            action="UPDATE_USER_ROLE",
            target_type="USER",
            target_id=str(user.id),
            details={"old_role": old_role, "new_role": user.role.value},
            ip_address=client_ip,
            commit=False
        )
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise

    return user


@router.get("/partners/drafts", response_model=List[PartnerDraftModerationResponse])
def get_admin_partner_drafts(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    _admin=Depends(require_admin)
):
    q = db.query(PartnerDraft)
    if status_filter:
        q = q.filter(PartnerDraft.status == status_filter.upper())

    drafts = q.order_by(PartnerDraft.created_at.desc()).all()
    results = []
    for d in drafts:
        applicant_name = d.user.full_name if d.user else "Applicant"
        applicant_email = d.user.email if d.user else "N/A"
        results.append(PartnerDraftModerationResponse(
            id=d.id,
            user_id=d.user_id,
            applicant_name=applicant_name,
            applicant_email=applicant_email,
            role=d.role,
            name=d.name,
            price=d.price,
            description=d.description,
            status=d.status,
            reviewed_by=d.reviewed_by,
            reviewed_at=d.reviewed_at,
            rejection_reason=d.rejection_reason,
            created_at=d.created_at
        ))
    return results


@router.patch("/partners/drafts/{draft_id}/approve", response_model=PartnerDraftModerationResponse)
def approve_partner_draft(
    draft_id: int,
    request: Request,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    draft = db.query(PartnerDraft).filter(PartnerDraft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Partner draft not found.")

    if draft.status == "APPROVED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Partner application is already approved."
        )
    if draft.status == "REJECTED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot approve an application that has been rejected."
        )
    if draft.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot approve application with status '{draft.status}'."
        )

    try:
        draft.status = "APPROVED"
        draft.reviewed_by = admin_user.id
        draft.reviewed_at = datetime.now(timezone.utc)

        # Promote user role & seed profile if needed
        if draft.user_id:
            user = db.query(User).filter(User.id == draft.user_id).first()
            if user:
                role_lower = draft.role.lower()
                if "professional" in role_lower:
                    user.role = UserRole.PROFESSIONAL
                    existing_pro = db.query(ProfessionalProfile).filter(ProfessionalProfile.user_id == user.id).first()
                    if not existing_pro:
                        pro = ProfessionalProfile(
                            user_id=user.id,
                            name=user.full_name,
                            specialty="Beauty Specialist",
                            experience="Certified Specialist",
                            price=draft.price or 1500.0,
                            rating=5.0,
                            reviews=1,
                            img="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80",
                            is_verified=True
                        )
                        db.add(pro)
                elif "salon" in role_lower:
                    user.role = UserRole.SALON_OWNER
                    existing_salon = db.query(Salon).filter(Salon.owner_id == user.id).first()
                    if not existing_salon:
                        salon = Salon(
                            id=f"sal-{secrets.token_hex(3)}",
                            owner_id=user.id,
                            name=draft.name,
                            description=draft.description,
                            address="Bandra West, Mumbai",
                            area="Bandra West",
                            hours="10:00 AM - 8:00 PM",
                            rating=4.9,
                            img="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&auto=format&fit=crop&q=80"
                        )
                        db.add(salon)
                elif "seller" in role_lower:
                    user.role = UserRole.SELLER

                db.add(Notification(
                    user_id=user.id,
                    type="partner",
                    text=f"Congratulations! Your partner application for {draft.role} has been approved."
                ))

        client_ip = request.client.host if request.client else None
        log_admin_action(
            db=db,
            admin_id=admin_user.id,
            action="APPROVE_PARTNER_DRAFT",
            target_type="PARTNER_DRAFT",
            target_id=str(draft.id),
            details={"role": draft.role, "user_id": draft.user_id, "name": draft.name},
            ip_address=client_ip,
            commit=False
        )
        db.commit()
        db.refresh(draft)
    except Exception:
        db.rollback()
        raise

    return PartnerDraftModerationResponse(
        id=draft.id,
        user_id=draft.user_id,
        applicant_name=draft.user.full_name if draft.user else "Applicant",
        applicant_email=draft.user.email if draft.user else "N/A",
        role=draft.role,
        name=draft.name,
        price=draft.price,
        description=draft.description,
        status=draft.status,
        reviewed_by=draft.reviewed_by,
        reviewed_at=draft.reviewed_at,
        rejection_reason=draft.rejection_reason,
        created_at=draft.created_at
    )


@router.patch("/partners/drafts/{draft_id}/reject", response_model=PartnerDraftModerationResponse)
def reject_partner_draft(
    draft_id: int,
    payload: PartnerDraftRejectRequest,
    request: Request,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    draft = db.query(PartnerDraft).filter(PartnerDraft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Partner draft not found.")

    if draft.status == "APPROVED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot reject an application that has already been approved."
        )
    if draft.status == "REJECTED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Partner application is already rejected."
        )
    if draft.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reject application with status '{draft.status}'."
        )

    try:
        draft.status = "REJECTED"
        draft.rejection_reason = payload.rejection_reason.strip()
        draft.reviewed_by = admin_user.id
        draft.reviewed_at = datetime.now(timezone.utc)

        if draft.user_id:
            db.add(Notification(
                user_id=draft.user_id,
                type="partner",
                text=f"Your partner application for {draft.role} was not approved. Reason: {draft.rejection_reason}"
            ))

        client_ip = request.client.host if request.client else None
        log_admin_action(
            db=db,
            admin_id=admin_user.id,
            action="REJECT_PARTNER_DRAFT",
            target_type="PARTNER_DRAFT",
            target_id=str(draft.id),
            details={"rejection_reason": draft.rejection_reason, "user_id": draft.user_id},
            ip_address=client_ip,
            commit=False
        )
        db.commit()
        db.refresh(draft)
    except Exception:
        db.rollback()
        raise

    return PartnerDraftModerationResponse(
        id=draft.id,
        user_id=draft.user_id,
        applicant_name=draft.user.full_name if draft.user else "Applicant",
        applicant_email=draft.user.email if draft.user else "N/A",
        role=draft.role,
        name=draft.name,
        price=draft.price,
        description=draft.description,
        status=draft.status,
        reviewed_by=draft.reviewed_by,
        reviewed_at=draft.reviewed_at,
        rejection_reason=draft.rejection_reason,
        created_at=draft.created_at
    )


@router.get("/audit-logs", response_model=List[AdminAuditLogResponse])
def get_admin_audit_logs(
    action: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _admin=Depends(require_admin)
):
    q = db.query(AdminAuditLog)
    if action:
        q = q.filter(AdminAuditLog.action == action.upper())

    logs = q.order_by(AdminAuditLog.created_at.desc()).offset(offset).limit(limit).all()
    results = []
    for l in logs:
        admin_name = l.admin.full_name if l.admin else "Administrator"
        admin_email = l.admin.email if l.admin else "N/A"
        results.append(AdminAuditLogResponse(
            id=l.id,
            admin_id=l.admin_id,
            admin_name=admin_name,
            admin_email=admin_email,
            action=l.action,
            target_type=l.target_type,
            target_id=l.target_id,
            ip_address=l.ip_address,
            details=l.details,
            created_at=l.created_at
        ))
    return results


@router.get("/bookings")
def get_admin_bookings(
    db: Session = Depends(get_db),
    _admin=Depends(require_admin)
):
    bookings = db.query(Booking).order_by(Booking.created_at.desc()).limit(100).all()
    return [
        {
            "id": b.id,
            "customer_id": b.customer_id,
            "title": b.title,
            "type": b.type,
            "professional": b.professional,
            "date": b.date,
            "time": b.time,
            "location": b.location,
            "price": b.price,
            "status": b.status.value,
            "created_at": b.created_at
        }
        for b in bookings
    ]


@router.get("/orders")
def get_admin_orders(
    db: Session = Depends(get_db),
    _admin=Depends(require_admin)
):
    orders = db.query(Order).order_by(Order.created_at.desc()).limit(100).all()
    return [
        {
            "id": o.id,
            "customer_id": o.customer_id,
            "total": o.total,
            "subtotal": o.subtotal,
            "discount": o.discount,
            "status": o.status.value,
            "payment_method": o.payment_method,
            "payment_status": o.payment_status,
            "items_count": len(o.items),
            "date": o.date,
            "created_at": o.created_at
        }
        for o in orders
    ]
