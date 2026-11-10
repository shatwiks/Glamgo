from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class ServiceResponse(BaseModel):
    id: str
    name: str
    category: str
    price: float
    duration: str
    rating: float
    reviews: int
    img: str
    desc: str

    model_config = ConfigDict(from_attributes=True)


class ServiceCreate(BaseModel):
    id: Optional[str] = None
    name: str
    category: str
    price: float
    duration: str
    img: str
    desc: str


class ProfessionalResponse(BaseModel):
    id: int
    name: str
    experience: str
    rating: float
    reviews: int
    price: float
    img: str
    specialty: str
    is_verified: bool

    model_config = ConfigDict(from_attributes=True)


class SalonStaffResponse(BaseModel):
    id: int
    name: str
    specialty: str
    img: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SalonResponse(BaseModel):
    id: str
    name: str
    area: str
    distance: str
    rating: float
    reviews: int
    price: float
    img: str
    tag: str
    services: List[str]
    hours: str
    about: str
    staff: Optional[List[SalonStaffResponse]] = []

    model_config = ConfigDict(from_attributes=True)


class SalonCreate(BaseModel):
    id: Optional[str] = None
    name: str
    area: str
    distance: str
    price: float
    img: str
    tag: Optional[str] = "Popular"
    services: List[str]
    hours: str
    about: str


class ProductVariantResponse(BaseModel):
    id: int
    name: str
    stock: int

    model_config = ConfigDict(from_attributes=True)


class ProductResponse(BaseModel):
    id: str
    brand: str
    name: str
    category: str
    price: float
    old: float
    rating: float
    reviews: int
    img: str
    tag: str
    description: str
    ingredients: Optional[str] = None
    variants: List[str] = []

    model_config = ConfigDict(from_attributes=True)


class ProductCreate(BaseModel):
    id: Optional[str] = None
    brand: str
    name: str
    category: str
    price: float
    old: Optional[float] = 0.0
    img: str
    tag: Optional[str] = ""
    description: str
    ingredients: Optional[str] = None
    variants: List[str] = []
