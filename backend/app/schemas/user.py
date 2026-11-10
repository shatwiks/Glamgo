from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from backend.app.models.user import UserRole


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: str = Field(default="", validation_alias="full_name")
    phone: Optional[str] = None
    role: UserRole
    is_active: bool

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


class AddressCreate(BaseModel):
    label: str
    text: str
    city: Optional[str] = "Mumbai"
    is_default: Optional[bool] = False


class AddressResponse(BaseModel):
    id: int
    label: str
    text: str
    city: str
    is_default: bool

    model_config = ConfigDict(from_attributes=True)


class NotificationResponse(BaseModel):
    id: int
    type: str
    text: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
