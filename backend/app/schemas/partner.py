from typing import List, Optional, Any, Dict
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
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PartnerApplicationCreate(BaseModel):
    role: str  # professional | salon_owner | seller
    name: str
    phone: Optional[str] = None
    city: Optional[str] = None
    price: Optional[float] = 0.0
    description: str
    documents: Optional[List[str]] = []
    portfolio_links: Optional[List[str]] = []


class AvailabilityToggle(BaseModel):
    day: str


class AvailabilityResponse(BaseModel):
    days: List[str]


class ProfessionalProfileUpdate(BaseModel):
    name: Optional[str] = None
    specialty: Optional[str] = None
    experience: Optional[str] = None
    price: Optional[float] = None
    img: Optional[str] = None


class ProfessionalServiceAssign(BaseModel):
    service_id: str


class SalonProfileUpdate(BaseModel):
    name: Optional[str] = None
    area: Optional[str] = None
    hours: Optional[str] = None
    about: Optional[str] = None
    price: Optional[float] = None
    img: Optional[str] = None
    services: Optional[List[str]] = None


class SalonStaffCreate(BaseModel):
    name: str
    specialty: str
    img: Optional[str] = None


class SalonStaffResponse(BaseModel):
    id: int
    salon_id: str
    name: str
    specialty: str
    img: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SellerProductCreate(BaseModel):
    brand: str
    name: str
    category: str
    price: float
    old: Optional[float] = 0.0
    img: str
    tag: Optional[str] = ""
    description: str
    ingredients: Optional[str] = None
    stock: Optional[int] = 100
    variants: Optional[List[str]] = []


class SellerProductUpdate(BaseModel):
    brand: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    old: Optional[float] = None
    img: Optional[str] = None
    tag: Optional[str] = None
    description: Optional[str] = None
    ingredients: Optional[str] = None


class SellerStockUpdate(BaseModel):
    stock: int


class ProductVariantCreate(BaseModel):
    name: str
    stock: Optional[int] = 50


class PartnerBookingStatusUpdate(BaseModel):
    status: str  # confirmed | completed | cancelled


class SellerOrderStatusUpdate(BaseModel):
    status: str  # placed | packed | in_transit | delivered | cancelled


class PartnerStatementItem(BaseModel):
    transaction_id: str
    type: str  # booking | order
    reference_id: str
    title: str
    date: str
    gross_amount: float
    commission_amount: float
    net_amount: float
    status: str


class PartnerFinancialsResponse(BaseModel):
    gross_sales: float
    platform_commission: float
    commission_rate: float
    refund_deductions: float
    net_earnings: float
    settlement_summary: Dict[str, Any]
    statements: List[PartnerStatementItem]
