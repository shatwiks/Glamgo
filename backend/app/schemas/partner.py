from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class PartnerProfileUpdate(BaseModel):
    name: str
    email: str
    phone: str
    city: str


class PartnerDraftCreate(BaseModel):
    role: str
    name: str
    price: float
    description: str


class PartnerDraftResponse(BaseModel):
    id: int
    role: str
    name: str
    price: float
    description: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AvailabilityToggle(BaseModel):
    day: str


class AvailabilityResponse(BaseModel):
    days: List[str]
