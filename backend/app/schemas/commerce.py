from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


# -------------------------------------------------------------
# Milestone A: Multi-Vendor Catalog & Listings
# -------------------------------------------------------------
class SellerListingBase(BaseModel):
    product_id: str
    sku: str
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
    listing_id: int
    qty: int = Field(..., gt=0)


class ReservationCreate(BaseModel):
    items: List[ReservationItem]


class SellerGroupedItem(BaseModel):
    listing_id: int
    product_id: str
    product_name: str
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


class MultiVendorPaymentDetails(BaseModel):
    gateway: str
    razorpay_order_id: str
    amount: float
    currency: str
    key_id: str


class MultiVendorCheckoutResponse(BaseModel):
    order_id: str
    date: str
    status: str
    subtotal: float
    discount: float
    shipping: float
    total: float
    suborders: List[SubOrderSummary]
    payment: MultiVendorPaymentDetails


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
    qty: int
    price: float
    seller_listing_id: Optional[int] = None
    return_eligible: bool = False
    return_deadline: Optional[datetime] = None


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
    reason: str
    detailed_explanation: Optional[str] = None
    evidence_image_url: Optional[str] = None


class ReturnDecisionRequest(BaseModel):
    action: str = Field(..., pattern="^(APPROVE|REJECT)$")
    restock_inventory: bool = True
    rejection_reason: Optional[str] = None


class ReturnRequestResponse(BaseModel):
    id: str
    suborder_id: str
    order_item_id: int
    customer_id: int
    seller_id: int
    reason: str
    detailed_explanation: Optional[str] = None
    evidence_image_url: Optional[str] = None
    status: str
    rejection_reason: Optional[str] = None
    restock_approved: bool
    refund_amount: float
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------
# Milestone G: Escrow & Financials
# -------------------------------------------------------------
class EscrowBatchSummary(BaseModel):
    suborder_id: str
    net_amount: float
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
