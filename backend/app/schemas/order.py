from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel


class OrderItemCreate(BaseModel):
    id: Optional[str] = None  # product_id
    product_id: Optional[str] = None
    listing_id: Optional[int] = None
    variant: Optional[str] = ""
    variant_name: Optional[str] = ""
    qty: int


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    address_id: Optional[int] = None
    address_label: Optional[str] = "Home"
    address_text: Optional[str] = None
    payment_method: str = "UPI"
    coupon: Optional[str] = None
    idempotency_key: Optional[str] = None
    reservation_token: Optional[str] = None


class OrderItemResponse(BaseModel):
    id: str
    name: str
    variant_name: str = ""
    sku: str = ""
    seller_id: Optional[int] = None
    seller_name: str = ""
    qty: int
    price: float
    allocated_discount: float = 0.0


class OrderResponse(BaseModel):
    id: str
    date: str
    items: List[OrderItemResponse]
    subtotal: float
    discount: float
    shipping_fee: float = 0.0
    total: float
    status: str
    payment_method: str
    payment_status: str
    razorpay_order_id: Optional[str] = None
    reservation_token: Optional[str] = None
    address: Dict[str, Any]
    created_at: datetime
    suborders: Optional[List[Dict[str, Any]]] = None


class CouponValidateRequest(BaseModel):
    code: str
    subtotal: float


class CouponValidateResponse(BaseModel):
    valid: bool
    code: str
    discount: float
    message: str
