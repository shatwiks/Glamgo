"""Release abandoned booking holds that have never reached a payment gateway.

Gateway orders can still capture later, including after an apparent failure. They
are deliberately excluded until a durable booking-refund workflow is available.
"""
from datetime import datetime, timedelta, timezone
from sqlalchemy import exists
from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.models.booking import Booking
from backend.app.models.payment import PaymentTransaction
from backend.app.models.user import BookingStatus, Notification


def expire_unpaid_bookings(db: Session, *, now=None, dry_run=False, batch_size=100) -> int:
    now = now or datetime.now(timezone.utc)
    cutoff = now - timedelta(minutes=settings.BOOKING_HOLD_MINUTES)
    has_payment = exists().where(PaymentTransaction.booking_id == Booking.id)
    query = (db.query(Booking)
             .filter(Booking.status == BookingStatus.PENDING,
                     Booking.payment_status == 'pending',
                     Booking.created_at <= cutoff,
                     ~has_payment)
             .order_by(Booking.created_at, Booking.id)
             .limit(batch_size))
    if dry_run:
        return len(query.all())
    bookings = query.with_for_update(skip_locked=True).all()
    for booking in bookings:
        booking.status = BookingStatus.CANCELLED
        booking.payment_status = 'expired'
        db.add(Notification(user_id=booking.customer_id, type='booking',
            text=f"Your unpaid {booking.title} booking for {booking.date} at {booking.time} expired. Please book again."))
    if bookings:
        db.commit()
    return len(bookings)
