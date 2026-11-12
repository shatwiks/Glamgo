from datetime import datetime, timezone
import enum
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class ReservationStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    RELEASED = "RELEASED"
    EXPIRED = "EXPIRED"


class SubOrderStatus(str, enum.Enum):
    PLACED = "placed"
    PACKED = "packed"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    RETURN_REQUESTED = "return_requested"
    RETURNED = "returned"


class ShipmentStatus(str, enum.Enum):
    MANIFESTED = "manifested"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    FAILED_ATTEMPT = "failed_attempt"
    RETURNED_TO_ORIGIN = "returned_to_origin"


class ReturnStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    APPROVED = "APPROVED"
    IN_TRANSIT = "IN_TRANSIT"
    INSPECTED = "INSPECTED"
    REFUNDED = "REFUNDED"
    REJECTED = "REJECTED"


class StockAction(str, enum.Enum):
    RESERVATION_HOLD = "RESERVATION_HOLD"
    RESERVATION_RELEASE = "RESERVATION_RELEASE"
    CHECKOUT_DECREMENT = "CHECKOUT_DECREMENT"
    RESTOCK_RETURN = "RESTOCK_RETURN"
    MANUAL_ADJUSTMENT = "MANUAL_ADJUSTMENT"


class EscrowStatus(str, enum.Enum):
    HELD_IN_ESCROW = "HELD_IN_ESCROW"
    MATURED = "MATURED"
    DISBURSED = "DISBURSED"
    CLAWBACK_REFUND = "CLAWBACK_REFUND"


class SellerListing(Base):
    __tablename__ = "seller_listings"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(String(50), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    sku = Column(String(100), nullable=False)
    price = Column(Float, nullable=False)
    compare_at_price = Column(Float, default=0.0)
    stock = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    condition = Column(String(50), default="NEW", nullable=False)
    shipping_lead_time_days = Column(Integer, default=2, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    product = relationship("Product", back_populates="seller_listings")
    seller = relationship("User", back_populates="seller_listings")
    reservations = relationship("InventoryReservation", back_populates="listing", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="seller_listing")
    audit_logs = relationship("InventoryAuditLog", back_populates="listing", cascade="all, delete-orphan")


class InventoryReservation(Base):
    __tablename__ = "inventory_reservations"

    id = Column(Integer, primary_key=True, index=True)
    reservation_token = Column(String(64), nullable=False, index=True)
    listing_id = Column(Integer, ForeignKey("seller_listings.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    qty = Column(Integer, default=1, nullable=False)
    status = Column(Enum(ReservationStatus), default=ReservationStatus.PENDING, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    listing = relationship("SellerListing", back_populates="reservations")
    user = relationship("User")


class SubOrder(Base):
    __tablename__ = "suborders"

    id = Column(String(60), primary_key=True, index=True)  # e.g. GG1234567-S1
    parent_order_id = Column(String(50), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    subtotal = Column(Float, nullable=False)
    shipping_fee = Column(Float, default=0.0, nullable=False)
    discount = Column(Float, default=0.0, nullable=False)
    total = Column(Float, nullable=False)
    commission_rate = Column(Float, default=0.15, nullable=False)
    commission_amount = Column(Float, nullable=False)
    seller_payout = Column(Float, nullable=False)
    status = Column(Enum(SubOrderStatus), default=SubOrderStatus.PLACED, nullable=False, index=True)
    cancellation_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    parent_order = relationship("Order", back_populates="suborders")
    seller = relationship("User", back_populates="seller_suborders")
    items = relationship("OrderItem", back_populates="suborder", cascade="all, delete-orphan")
    shipment = relationship("Shipment", back_populates="suborder", uselist=False, cascade="all, delete-orphan")
    return_requests = relationship("ReturnRequest", back_populates="suborder", cascade="all, delete-orphan")
    escrow_record = relationship("SellerEscrowRecord", back_populates="suborder", uselist=False, cascade="all, delete-orphan")


class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    suborder_id = Column(String(60), ForeignKey("suborders.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    carrier_name = Column(String(100), nullable=False)
    tracking_number = Column(String(100), nullable=False, index=True)
    tracking_url = Column(String(500), nullable=True)
    shipped_at = Column(DateTime, nullable=True)
    estimated_delivery = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    status = Column(Enum(ShipmentStatus), default=ShipmentStatus.MANIFESTED, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    suborder = relationship("SubOrder", back_populates="shipment")


class ReturnRequest(Base):
    __tablename__ = "return_requests"

    id = Column(String(60), primary_key=True, index=True)  # e.g. RET-GG1234567-01
    suborder_id = Column(String(60), ForeignKey("suborders.id", ondelete="CASCADE"), nullable=False, index=True)
    order_item_id = Column(Integer, ForeignKey("order_items.id", ondelete="CASCADE"), nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    reason = Column(String(255), nullable=False)
    detailed_explanation = Column(Text, nullable=True)
    evidence_image_url = Column(String(500), nullable=True)
    status = Column(Enum(ReturnStatus), default=ReturnStatus.REQUESTED, nullable=False, index=True)
    rejection_reason = Column(Text, nullable=True)
    restock_approved = Column(Boolean, default=False, nullable=False)
    refund_amount = Column(Float, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    suborder = relationship("SubOrder", back_populates="return_requests")
    order_item = relationship("OrderItem")
    customer = relationship("User", foreign_keys=[customer_id])
    seller = relationship("User", foreign_keys=[seller_id])


class InventoryAuditLog(Base):
    __tablename__ = "inventory_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("seller_listings.id", ondelete="CASCADE"), nullable=False, index=True)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(Enum(StockAction), nullable=False)
    quantity_delta = Column(Integer, nullable=False)
    balance_before = Column(Integer, nullable=False)
    balance_after = Column(Integer, nullable=False)
    reference_type = Column(String(50), nullable=False)  # 'RESERVATION', 'SUBORDER', 'RETURN', 'MANUAL'
    reference_id = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    listing = relationship("SellerListing", back_populates="audit_logs")
    seller = relationship("User")


class SellerEscrowRecord(Base):
    __tablename__ = "seller_escrow_records"

    id = Column(Integer, primary_key=True, index=True)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    suborder_id = Column(String(60), ForeignKey("suborders.id", ondelete="CASCADE"), unique=True, nullable=False)
    gross_amount = Column(Float, nullable=False)
    platform_fee = Column(Float, nullable=False)
    net_settlement = Column(Float, nullable=False)
    status = Column(Enum(EscrowStatus), default=EscrowStatus.HELD_IN_ESCROW, nullable=False, index=True)
    delivered_at = Column(DateTime, nullable=True)
    matures_at = Column(DateTime, nullable=True, index=True)
    disbursed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    seller = relationship("User", back_populates="seller_escrow_records")
    suborder = relationship("SubOrder", back_populates="escrow_record")
