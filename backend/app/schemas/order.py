from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel


class OrderItemCreate(BaseModel):
    id: str  # product_id
    qty: int


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    address_id: Optional[int] = None
    address_label: Optional[str] = "Home"
    address_text: Optional[str] = None
    payment_method: str = "UPI"
    coupon: Optional[str] = None


class OrderItemResponse(BaseModel):
    id: str
    name: str
    qty: int
    price: float


class OrderResponse(BaseModel):
    id: str
    date: str
    items: List[OrderItemResponse]
    subtotal: float
    discount: float
    total: float
    status: str
    payment_method: str
    payment_status: str
    address: Dict[str, Any]
    created_at: datetime


class CouponValidateRequest(BaseModel):
    code: str
    subtotal: float


class CouponValidateResponse(BaseModel):
    valid: bool
    code: str
    discount: float
    message: str
