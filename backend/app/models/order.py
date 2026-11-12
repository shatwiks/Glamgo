from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.user import OrderStatus


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    discount_percent = Column(Float, default=10.0)
    max_discount = Column(Float, default=300.0)
    is_active = Column(Boolean, default=True)


class Order(Base):
    __tablename__ = "orders"

    id = Column(String(50), primary_key=True, index=True)  # e.g. GG1234567
    customer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(String(20), nullable=False)
    subtotal = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    total = Column(Float, nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.PLACED, nullable=False)
    payment_method = Column(String(50), default="UPI", nullable=False)
    payment_status = Column(String(50), default="completed", nullable=False)
    address_label = Column(String(100), default="Home")
    address_text = Column(Text, nullable=False)
    coupon_code = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    customer = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    suborders = relationship("SubOrder", back_populates="parent_order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(50), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    suborder_id = Column(String(60), ForeignKey("suborders.id", ondelete="CASCADE"), nullable=True)
    product_id = Column(String(50), ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    seller_listing_id = Column(Integer, ForeignKey("seller_listings.id", ondelete="SET NULL"), nullable=True)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(255), nullable=False)
    qty = Column(Integer, nullable=False, default=1)
    price = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    suborder = relationship("SubOrder", back_populates="items")
    product = relationship("Product", back_populates="order_items")
    seller_listing = relationship("SellerListing", back_populates="order_items")
