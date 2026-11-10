from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Text
)
from backend.app.core.database import Base


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    order_id = Column(String(50), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)
    booking_id = Column(String(50), ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True)
    razorpay_order_id = Column(String(100), index=True, nullable=False)
    razorpay_payment_id = Column(String(100), index=True, nullable=True)
    razorpay_signature = Column(String(255), nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    status = Column(String(50), default="created", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
