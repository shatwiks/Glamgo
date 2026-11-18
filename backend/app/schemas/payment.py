from typing import Optional
from pydantic import BaseModel


class PaymentOrderCreate(BaseModel):
    amount: Optional[float] = None
    order_id: Optional[str] = None
    booking_id: Optional[str] = None
    idempotency_key: Optional[str] = None


class PaymentOrderResponse(BaseModel):
    razorpay_order_id: str
    amount: float
    amount_paise: int
    currency: str
    key_id: str


class PaymentVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    order_id: Optional[str] = None
    booking_id: Optional[str] = None


class PaymentVerifyResponse(BaseModel):
    success: bool
    status: str
    message: str
    payment_status: Optional[str] = None
