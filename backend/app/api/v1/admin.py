from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.core.database import get_db
from backend.app.api.deps import require_admin
from backend.app.models.user import User, UserRole
from backend.app.models.catalog import Service, Salon, Product, ProfessionalProfile
from backend.app.models.booking import Booking, BookingStatus
from backend.app.models.order import Order, OrderStatus
from backend.app.schemas.user import UserResponse

router = APIRouter()


@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    customers_count = db.query(User).filter(User.role == UserRole.CUSTOMER).count()
    pros_count = db.query(ProfessionalProfile).count()
    salons_count = db.query(Salon).count()
    products_count = db.query(Product).count()

    # MIN-06 Remediation: Database-side aggregation for high-performance analytics
    booking_revenue = db.query(func.coalesce(func.sum(Booking.price), 0.0)).filter(
        Booking.status != BookingStatus.CANCELLED
    ).scalar() or 0.0

    order_revenue = db.query(func.coalesce(func.sum(Order.total), 0.0)).filter(
        Order.status != OrderStatus.CANCELLED
    ).scalar() or 0.0

    total_bookings = db.query(func.count(Booking.id)).scalar() or 0
    total_orders = db.query(func.count(Order.id)).scalar() or 0

    gmv = round(booking_revenue + order_revenue, 2)
    platform_commission = round(gmv * 0.15, 2)  # 15% marketplace commission

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
        "platform_commission": platform_commission
    }


@router.get("/users", response_model=List[UserResponse])
def get_admin_users(
    role: Optional[str] = Query(None),
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
    return q.order_by(User.created_at.desc()).all()


@router.patch("/users/{user_id}/toggle-status", response_model=UserResponse)
def toggle_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    # MIN-05 Remediation: Prevent self-lockout
    if admin_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot deactivate their own active account."
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user


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
