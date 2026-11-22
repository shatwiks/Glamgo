from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class BookingAddonItem(BaseModel):
    id: str
    name: str
    duration: str
    price: float


class BookingCreate(BaseModel):
    type: str  # "home" or "salon"
    service_id: str
    professional: Optional[str] = "Any available expert"
    salon_id: Optional[str] = None
    date: str  # YYYY-MM-DD
    time: str  # "10:30 AM"
    location: str
    idempotency_key: Optional[str] = None
    addons: Optional[List[str]] = []


class BookingStatusUpdate(BaseModel):
    status: str  # "confirmed", "completed", "cancelled"


class BookingRescheduleRequest(BaseModel):
    date: str
    time: str


class BookingOtpVerifyRequest(BaseModel):
    otp: str = Field(..., min_length=4, max_length=4, pattern=r"^\d{4}$")


class BookingResponse(BaseModel):
    id: str
    type: str
    title: str
    professional: str
    date: str
    time: str
    location: str
    price: float
    status: str
    payment_status: str = "pending"
    razorpay_order_id: Optional[str] = None
    arrival_otp: Optional[str] = None
    addons: List[BookingAddonItem] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
