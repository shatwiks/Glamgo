from datetime import datetime, timezone
import enum
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum, CheckConstraint, Index, text
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
    REFUND_PENDING = "REFUND_PENDING"
    REFUND_FAILED = "REFUND_FAILED"
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
    __table_args__ = (
        CheckConstraint("stock >= 0", name="ck_seller_listings_stock_non_negative"),
        CheckConstraint("price > 0", name="ck_seller_listings_price_positive"),
    )

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(String(50), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    variant_name = Column(String(100), default="", server_default="", nullable=False, index=True)
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
    __table_args__ = (
        CheckConstraint("qty > 0", name="ck_inventory_reservations_qty_positive"),
    )

    id = Column(Integer, primary_key=True, index=True)
    reservation_token = Column(String(64), nullable=False, index=True)
    listing_id = Column(Integer, ForeignKey("seller_listings.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    order_id = Column(String(50), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True)
    variant_name = Column(String(100), default="", server_default="", nullable=False)
    quoted_unit_price = Column(Float, nullable=True)
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
    __table_args__ = (
        CheckConstraint("return_qty > 0", name="ck_return_requests_qty_positive"),
    )

    id = Column(String(60), primary_key=True, index=True)  # e.g. RET-GG1234567-01
    suborder_id = Column(String(60), ForeignKey("suborders.id", ondelete="CASCADE"), nullable=False, index=True)
    order_item_id = Column(Integer, ForeignKey("order_items.id", ondelete="CASCADE"), nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    return_qty = Column(Integer, default=1, nullable=False)
    reason = Column(String(255), nullable=False)
    detailed_explanation = Column(Text, nullable=True)
    evidence_image_url = Column(String(500), nullable=True)
    status = Column(Enum(ReturnStatus), default=ReturnStatus.REQUESTED, nullable=False, index=True)
    rejection_reason = Column(Text, nullable=True)
    restock_approved = Column(Boolean, default=False, nullable=False)
    restocked_at = Column(DateTime, nullable=True)
    refund_amount = Column(Float, nullable=False)
    refund_paise = Column(Integer, default=0, nullable=False)
    gateway_refund_id = Column(String(100), nullable=True, index=True)
    refund_status = Column(String(50), default="NONE", nullable=False)
    refunded_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    suborder = relationship("SubOrder", back_populates="return_requests")
    order_item = relationship("OrderItem")
    customer = relationship("User", foreign_keys=[customer_id])
    seller = relationship("User", foreign_keys=[seller_id])
    refund_record = relationship("RefundRecord", back_populates="return_request", uselist=False)


class RefundRecord(Base):
    __tablename__ = "refund_records"
    __table_args__ = (
        CheckConstraint("amount_paise > 0", name="ck_refund_records_amount_positive"),
        Index("uq_refund_records_logical_key", "logical_key", unique=True),
        Index("uq_refund_records_idempotency_key", "idempotency_key", unique=True),
        Index("uq_refund_records_receipt", "receipt", unique=True),
        Index(
            "uq_refund_records_return_request_id",
            "return_request_id",
            unique=True,
            postgresql_where=text("return_request_id IS NOT NULL"),
        ),
        Index(
            "uq_refund_records_provider_refund_id",
            "provider_refund_id",
            unique=True,
            postgresql_where=text("provider_refund_id IS NOT NULL"),
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    logical_key = Column(String(120), nullable=False)
    idempotency_key = Column(String(80), nullable=False)
    receipt = Column(String(40), nullable=False)
    refund_type = Column(String(30), nullable=False)  # 'RETURN' | 'OOS_AUTO'
    order_id = Column(String(50), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    suborder_id = Column(String(60), ForeignKey("suborders.id", ondelete="SET NULL"), nullable=True, index=True)
    return_request_id = Column(String(60), ForeignKey("return_requests.id", ondelete="SET NULL"), nullable=True)
    payment_transaction_id = Column(Integer, ForeignKey("payment_transactions.id", ondelete="SET NULL"), nullable=True, index=True)
    captured_payment_id = Column(String(100), nullable=True, index=True)
    amount_paise = Column(Integer, nullable=False)
    currency = Column(String(10), default="INR", server_default="INR", nullable=False)
    payload_json = Column(Text, nullable=True)
    provider_refund_id = Column(String(100), nullable=True)
    status = Column(String(40), default="INITIATED", server_default="INITIATED", nullable=False, index=True)
    attempt_count = Column(Integer, default=0, server_default="0", nullable=False)
    max_attempts = Column(Integer, default=5, server_default="5", nullable=False)
    last_error = Column(Text, nullable=True)
    dispatch_started_at = Column(DateTime, nullable=True)
    next_retry_at = Column(DateTime, nullable=True, index=True)
    accounting_applied_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    return_request = relationship("ReturnRequest", back_populates="refund_record")
    accounting_entry = relationship("RefundAccountingEntry", back_populates="refund_record", uselist=False)


class RefundAccountingEntry(Base):
    __tablename__ = "refund_accounting_entries"
    __table_args__ = (
        CheckConstraint("refund_paise > 0", name="ck_refund_accounting_amount_positive"),
        Index("uq_refund_accounting_refund_record_id", "refund_record_id", unique=True),
        Index(
            "uq_refund_accounting_provider_refund_id",
            "provider_refund_id",
            unique=True,
            postgresql_where=text("provider_refund_id IS NOT NULL"),
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    refund_record_id = Column(Integer, ForeignKey("refund_records.id", ondelete="RESTRICT"), nullable=False)
    provider_refund_id = Column(String(100), nullable=True)
    order_id = Column(String(50), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    suborder_id = Column(String(60), ForeignKey("suborders.id", ondelete="SET NULL"), nullable=True, index=True)
    escrow_record_id = Column(Integer, ForeignKey("seller_escrow_records.id", ondelete="SET NULL"), nullable=True, index=True)
    refund_paise = Column(Integer, nullable=False)
    commission_reversal_paise = Column(Integer, default=0, server_default="0", nullable=False)
    seller_deduction_paise = Column(Integer, default=0, server_default="0", nullable=False)
    applied_via = Column(String(40), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    refund_record = relationship("RefundRecord", back_populates="accounting_entry")


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
    refunded_amount = Column(Float, default=0.0, nullable=False)
    reversed_commission = Column(Float, default=0.0, nullable=False)
    status = Column(Enum(EscrowStatus), default=EscrowStatus.HELD_IN_ESCROW, nullable=False, index=True)
    delivered_at = Column(DateTime, nullable=True)
    matures_at = Column(DateTime, nullable=True, index=True)
    disbursed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    seller = relationship("User", back_populates="seller_escrow_records")
    suborder = relationship("SubOrder", back_populates="escrow_record")
