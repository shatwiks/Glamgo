from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator
from backend.app.models.user import UserRole


class AdminAuditLogResponse(BaseModel):
    id: int
    admin_id: int
    admin_name: Optional[str] = None
    admin_email: Optional[str] = None
    action: str
    target_type: str
    target_id: str
    ip_address: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PartnerDraftModerationResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    applicant_name: Optional[str] = None
    applicant_email: Optional[str] = None
    role: str
    name: str
    price: float
    description: str
    status: str
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PartnerDraftRejectRequest(BaseModel):
    rejection_reason: str

    @field_validator("rejection_reason")
    @classmethod
    def validate_rejection_reason(cls, v: str) -> str:
        cleaned = (v or "").strip()
        if len(cleaned) < 3:
            raise ValueError("Rejection reason must be at least 3 characters long and cannot be blank.")
        return cleaned


class UserRoleUpdateRequest(BaseModel):
    role: UserRole


class AdminStatsEnhancedResponse(BaseModel):
    customers_count: int
    professionals_count: int
    salons_count: int
    products_count: int
    total_bookings: int
    total_orders: int
    booking_revenue: float
    order_revenue: float
    gross_merchandise_value: float
    platform_commission: float
    services_gmv: float
    salons_gmv: float
    ecommerce_gmv: float
    average_booking_value: float
    average_order_value: float
