from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum, Table
)
from sqlalchemy.orm import relationship
import enum
from backend.app.core.database import Base


class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    PROFESSIONAL = "professional"
    SALON_OWNER = "salon_owner"
    SELLER = "seller"
    ADMIN = "admin"


class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class OrderStatus(str, enum.Enum):
    PLACED = "placed"
    PACKED = "packed"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    addresses = relationship("Address", back_populates="user", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="customer")
    orders = relationship("Order", back_populates="customer")
    reviews = relationship("Review", back_populates="user")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    professional_profile = relationship("ProfessionalProfile", back_populates="user", uselist=False)
    salons = relationship("Salon", back_populates="owner")
    drafts = relationship("PartnerDraft", back_populates="user", foreign_keys="[PartnerDraft.user_id]")
    seller_listings = relationship("SellerListing", back_populates="seller")
    seller_suborders = relationship("SubOrder", back_populates="seller")
    seller_escrow_records = relationship("SellerEscrowRecord", back_populates="seller")


class Address(Base):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    label = Column(String(50), nullable=False, default="Home")
    text = Column(Text, nullable=False)
    city = Column(String(100), default="Mumbai")
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="addresses")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), nullable=False)  # booking, order, system
    text = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="notifications")
