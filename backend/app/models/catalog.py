from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Table
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

# Association table between Service and ProfessionalProfile
service_professionals = Table(
    "service_professionals",
    Base.metadata,
    Column("service_id", String(50), ForeignKey("services.id", ondelete="CASCADE"), primary_key=True),
    Column("professional_id", Integer, ForeignKey("professional_profiles.id", ondelete="CASCADE"), primary_key=True)
)


class Service(Base):
    __tablename__ = "services"

    id = Column(String(50), primary_key=True, index=True)  # s1, s2, etc.
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    price = Column(Float, nullable=False)
    duration = Column(String(50), nullable=False)  # "75 min"
    rating = Column(Float, default=4.9)
    reviews = Column(Integer, default=0)
    img = Column(String(500), nullable=False)
    desc = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    professionals = relationship("ProfessionalProfile", secondary=service_professionals, back_populates="services")
    bookings = relationship("Booking", back_populates="service")


class ProfessionalProfile(Base):
    __tablename__ = "professional_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=True)
    name = Column(String(255), nullable=False)
    experience = Column(String(100), nullable=False)
    rating = Column(Float, default=4.9)
    reviews = Column(Integer, default=0)
    price = Column(Float, nullable=False)
    img = Column(String(500), nullable=False)
    specialty = Column(String(255), nullable=False)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="professional_profile")
    services = relationship("Service", secondary=service_professionals, back_populates="professionals")
    bookings = relationship("Booking", back_populates="professional_rel")


class Salon(Base):
    __tablename__ = "salons"

    id = Column(String(50), primary_key=True, index=True)  # l1, l2, etc.
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(255), nullable=False)
    area = Column(String(255), nullable=False, index=True)
    distance = Column(String(100), nullable=False)
    rating = Column(Float, default=4.9)
    reviews = Column(Integer, default=0)
    price = Column(Float, nullable=False)
    img = Column(String(500), nullable=False)
    tag = Column(String(100), default="Popular")
    services_list = Column(Text, nullable=False)  # JSON or comma-separated list e.g. "Hair,Skin,Nails"
    hours = Column(String(100), nullable=False)
    about = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    owner = relationship("User", back_populates="salons")
    staff = relationship("SalonStaff", back_populates="salon", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="salon")


class SalonStaff(Base):
    __tablename__ = "salon_staff"

    id = Column(Integer, primary_key=True, index=True)
    salon_id = Column(String(50), ForeignKey("salons.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    specialty = Column(String(255), nullable=False)
    img = Column(String(500), nullable=True)

    salon = relationship("Salon", back_populates="staff")


class Product(Base):
    __tablename__ = "products"

    id = Column(String(50), primary_key=True, index=True)  # b1, b2, etc.
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    brand = Column(String(255), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    price = Column(Float, nullable=False)
    old = Column(Float, default=0)
    rating = Column(Float, default=4.8)
    reviews = Column(Integer, default=0)
    img = Column(String(500), nullable=False)
    tag = Column(String(100), default="")
    description = Column(Text, nullable=False)
    ingredients = Column(Text, nullable=True)
    stock = Column(Integer, default=100)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="product")
    seller_listings = relationship("SellerListing", back_populates="product", cascade="all, delete-orphan")


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(String(50), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)  # "30 ml", "Rosewood"
    stock = Column(Integer, default=50)

    product = relationship("Product", back_populates="variants")


class Availability(Base):
    __tablename__ = "availabilities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    day = Column(String(10), nullable=False)  # "Mon", "Tue", etc.
    is_available = Column(Boolean, default=True)


class PartnerDraft(Base):
    __tablename__ = "partner_drafts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    role = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    price = Column(Float, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), default="PENDING", nullable=False, index=True)  # PENDING, APPROVED, REJECTED
    reviewed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="drafts", foreign_keys=[user_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
