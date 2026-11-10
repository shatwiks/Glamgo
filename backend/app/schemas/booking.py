from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class BookingCreate(BaseModel):
    type: str  # "home" or "salon"
    service_id: str
    professional: Optional[str] = "Any available expert"
    salon_id: Optional[str] = None
    date: str  # YYYY-MM-DD
    time: str  # "10:30 AM"
    location: str


class BookingStatusUpdate(BaseModel):
    status: str  # "confirmed", "completed", "cancelled"


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
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
