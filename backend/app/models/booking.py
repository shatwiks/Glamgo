from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.user import BookingStatus


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String(50), primary_key=True, index=True)  # e.g. BK1234567
    customer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(20), nullable=False)  # "home" or "salon"
    title = Column(String(255), nullable=False)
    service_id = Column(String(50), ForeignKey("services.id", ondelete="SET NULL"), nullable=True)
    professional_id = Column(Integer, ForeignKey("professional_profiles.id", ondelete="SET NULL"), nullable=True)
    professional = Column(String(255), nullable=False, default="Any available expert")
    salon_id = Column(String(50), ForeignKey("salons.id", ondelete="SET NULL"), nullable=True)
    date = Column(String(20), nullable=False)  # YYYY-MM-DD
    time = Column(String(20), nullable=False)  # "10:30 AM"
    location = Column(Text, nullable=False)
    price = Column(Float, nullable=False)
    status = Column(Enum(BookingStatus), default=BookingStatus.CONFIRMED, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    customer = relationship("User", back_populates="bookings")
    service = relationship("Service", back_populates="bookings")
    professional_rel = relationship("ProfessionalProfile", back_populates="bookings")
    salon = relationship("Salon", back_populates="bookings")
