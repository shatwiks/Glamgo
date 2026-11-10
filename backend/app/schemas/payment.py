from typing import Optional
from pydantic import BaseModel


class PaymentOrderCreate(BaseModel):
    amount: float
    order_id: Optional[str] = None
    booking_id: Optional[str] = None


class PaymentOrderResponse(BaseModel):
    razorpay_order_id: str
    amount: float
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
