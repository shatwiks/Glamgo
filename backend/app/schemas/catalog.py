from typing import Dict, List, Optional, Literal
from pydantic import BaseModel, ConfigDict


Audience = Literal["women", "men", "unisex", "unspecified"]


class ServiceResponse(BaseModel):
    audience: Audience = "unspecified"
    id: str
    name: str
    category: str
    price: float
    duration: str
    rating: float
    reviews: int
    img: str
    desc: str
    cities: List[str] = ["Mumbai", "Bengaluru", "Delhi"]

    model_config = ConfigDict(from_attributes=True)


class ServiceCreate(BaseModel):
    audience: Audience = "unspecified"
    id: Optional[str] = None
    name: str
    category: str
    price: float
    duration: str
    img: str
    desc: str
    service_cities: Optional[str] = "Mumbai,Bengaluru,Delhi"


class ProfessionalResponse(BaseModel):
    audience: Audience = "unspecified"
    id: int
    name: str
    city: str = "Mumbai"
    area: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
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
    audience: Audience = "unspecified"
    id: str
    name: str
    city: str = "Mumbai"
    area: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    distance: str
    distance_km: Optional[float] = None
    is_far: Optional[bool] = None
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
    audience: Audience = "unspecified"
    id: Optional[str] = None
    name: str
    city: Optional[str] = "Mumbai"
    area: str
    lat: Optional[float] = None
    lng: Optional[float] = None
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
    audience: Audience = "unspecified"
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
    stock: int = 100
    variant_stocks: Dict[str, int] = {}
    default_listing_id: Optional[int] = None
    variant_listings: Dict[str, int] = {}

    model_config = ConfigDict(from_attributes=True)


class ProductCreate(BaseModel):
    audience: Audience = "unspecified"
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
