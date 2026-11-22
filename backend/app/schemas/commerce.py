from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


# -------------------------------------------------------------
# Milestone A: Multi-Vendor Catalog & Listings
# -------------------------------------------------------------
class SellerListingBase(BaseModel):
    product_id: str
    sku: str
    variant_name: str = ""
    price: float = Field(..., gt=0)
    compare_at_price: Optional[float] = 0.0
    stock: int = Field(default=0, ge=0)
    is_active: bool = True
    condition: str = "NEW"
    shipping_lead_time_days: int = 2


class SellerListingCreate(SellerListingBase):
    pass


class SellerListingUpdate(BaseModel):
    sku: Optional[str] = None
    variant_name: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    compare_at_price: Optional[float] = None
    stock: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None
    condition: Optional[str] = None
    shipping_lead_time_days: Optional[int] = None


class SellerListingResponse(SellerListingBase):
    id: int
    seller_id: int
    seller_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ProductOffersResponse(BaseModel):
    product_id: str
    product_name: str
    offers_count: int
    lowest_price: Optional[float] = None
    offers: List[SellerListingResponse]


# -------------------------------------------------------------
# Milestone B & C: Cart, Reservation & Checkout
# -------------------------------------------------------------
class ReservationItem(BaseModel):
    listing_id: Optional[int] = None
    product_id: Optional[str] = None
    variant_name: Optional[str] = ""
    qty: int = Field(..., gt=0)


class ReservationCreate(BaseModel):
    items: List[ReservationItem]


class SellerGroupedItem(BaseModel):
    listing_id: int
    product_id: str
    product_name: str
    variant_name: str = ""
    sku: str = ""
    qty: int
    unit_price: float
    line_total: float


class SellerPackageSummary(BaseModel):
    seller_id: int
    seller_name: str
    subtotal: float
    estimated_shipping_fee: float
    items: List[SellerGroupedItem]


class ReservationResponse(BaseModel):
    reservation_token: str
    expires_at: datetime
    expires_in_seconds: int
    sellers: List[SellerPackageSummary]
    total_subtotal: float
    total_shipping: float
    grand_total: float


class MultiVendorCheckoutRequest(BaseModel):
    reservation_token: str
    address_label: Optional[str] = "Home"
    address_text: str
    coupon_code: Optional[str] = None
    payment_method: Optional[str] = "Razorpay"
    idempotency_key: Optional[str] = None
    apply_wallet_credit: bool = False


class SubOrderSummary(BaseModel):
    suborder_id: str
    seller_id: int
    seller_name: str
    subtotal: float
    discount: float
    shipping_fee: float
    total: float
    status: str
    items_count: int


class MultiVendorCheckoutResponse(BaseModel):
    id: str
    order_id: str
    date: str
    status: str
    payment_method: str
    payment_status: str
    subtotal: float
    discount: float
    shipping: float
    shipping_fee: float
    wallet_credit_applied: float = 0.0
    total: float
    reservation_token: Optional[str] = None
    address: Dict[str, Any] = {}
    items: List[Dict[str, Any]] = []
    suborders: List[SubOrderSummary]


# -------------------------------------------------------------
# Milestones D & E: Suborder Fulfillment & Tracking
# -------------------------------------------------------------
class ShipmentCreate(BaseModel):
    carrier_name: str
    tracking_number: str
    tracking_url: Optional[str] = None
    notes: Optional[str] = None


class ShipmentResponse(BaseModel):
    id: int
    suborder_id: str
    carrier_name: str
    tracking_number: str
    tracking_url: Optional[str] = None
    shipped_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    status: str
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class OrderItemDetail(BaseModel):
    order_item_id: int
    product_id: Optional[str] = None
    name: str
    variant_name: str = ""
    sku: str = ""
    seller_name: str = ""
    qty: int
    price: float
    allocated_discount: float = 0.0
    seller_listing_id: Optional[int] = None
    return_eligible: bool = False
    return_deadline: Optional[datetime] = None
    return_status: Optional[str] = None
    refund_status: Optional[str] = None
    gateway_refund_id: Optional[str] = None


class SubOrderDetailResponse(BaseModel):
    suborder_id: str
    parent_order_id: str
    seller_id: int
    seller_name: str
    subtotal: float
    shipping_fee: float
    discount: float
    total: float
    status: str
    items: List[OrderItemDetail]
    shipment: Optional[ShipmentResponse] = None
    cancellation_reason: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------
# Milestone F: Reverse Logistics & Returns
# -------------------------------------------------------------
class ReturnRequestCreate(BaseModel):
    order_item_id: int
    qty: Optional[int] = Field(None, gt=0)
    reason: str
    detailed_explanation: Optional[str] = None
    evidence_image_url: Optional[str] = None


class ReturnDecisionRequest(BaseModel):
    action: str = Field(..., pattern="^(APPROVE|REJECT)$")
    restock_inventory: bool = True
    rejection_reason: Optional[str] = None
    cod_refund_confirmed: bool = True


class ReturnRequestResponse(BaseModel):
    id: str
    suborder_id: str
    order_item_id: int
    customer_id: int
    seller_id: int
    return_qty: int = 1
    reason: str
    detailed_explanation: Optional[str] = None
    evidence_image_url: Optional[str] = None
    status: str
    rejection_reason: Optional[str] = None
    restock_approved: bool
    restocked_at: Optional[datetime] = None
    refund_amount: float
    refund_paise: int = 0
    refund_status: str = "NONE"
    gateway_refund_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------
# Milestone G: Escrow & Financials
# -------------------------------------------------------------
class EscrowBatchSummary(BaseModel):
    suborder_id: str
    net_amount: float
    refunded_amount: float = 0.0
    reversed_commission: float = 0.0
    status: str
    delivered_at: Optional[datetime] = None
    matures_at: Optional[datetime] = None


class SellerFinancialsResponse(BaseModel):
    currency: str = "INR"
    gross_sales: float
    platform_commission_15pct: float
    refund_deductions: float
    funds_in_escrow: float
    matured_balance_available: float
    total_disbursed: float
    escrow_batches: List[EscrowBatchSummary]
