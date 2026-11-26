from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.api.deps import require_maintenance_auth
from backend.app.schemas.catalog import SalonResponse, ServiceResponse, ProfessionalResponse
from backend.app.api.v1 import (
    auth, users, services, professionals, salons, products,
    bookings, orders, partners, admin, payments, reviews, concierge
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users & Addresses"])
api_router.include_router(services.router, prefix="/services", tags=["At-Home Services"])
api_router.include_router(professionals.router, prefix="/professionals", tags=["Beauty Professionals"])
api_router.include_router(salons.router, prefix="/salons", tags=["Salons & Parlours"])
api_router.include_router(products.router, prefix="/products", tags=["Beauty Products"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["Bookings & Appointments"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders & Checkout"])
api_router.include_router(partners.router, prefix="/partners", tags=["Partner Portals"])
api_router.include_router(admin.router, prefix="/admin", tags=["Administrator"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments (Razorpay)"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["Reviews & Ratings"])
api_router.include_router(concierge.router, prefix="/concierge", tags=["AI Concierge"])

# Catalog aliases
catalog_router = APIRouter()


@catalog_router.get("/salons", response_model=List[SalonResponse])
def catalog_salons(
    category: Optional[str] = Query(None),
    sort: Optional[str] = Query("featured"),
    query: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    audience: Optional[str] = Query(None),
    lat: Optional[float] = Query(None, ge=-90, le=90),
    lng: Optional[float] = Query(None, ge=-180, le=180),
    max_distance_km: Optional[float] = Query(None, gt=0, le=200),
    db: Session = Depends(get_db),
):
    return salons.get_salons(
        category=category,
        sort=sort,
        query=query,
        city=city,
        audience=audience,
        lat=lat,
        lng=lng,
        max_distance_km=max_distance_km,
        db=db,
    )


@catalog_router.get("/services", response_model=List[ServiceResponse])
def catalog_services(
    category: Optional[str] = Query(None),
    query: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    audience: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    from backend.app.models.catalog import Service
    from sqlalchemy.orm import selectinload
    from backend.app.services.cache_service import cache_service

    cache_key = f"glamgo:catalog:services:v4:{category}:{query}:{city}:{audience}"
    cached = cache_service.get(cache_key)
    if cached is not None:
        return cached

    q = db.query(Service).options(selectinload(Service.owner_professional)).filter(
        Service.is_active == True,
        Service.salon_id.is_(None),
    )
    if category and category.lower() != "all":
        q = q.filter(Service.category.ilike(category))
    if query:
        q = q.filter((Service.name.ilike(f"%{query}%")) | (Service.desc.ilike(f"%{query}%")))
    if audience:
        aud = audience.strip().lower()
        if aud == "men":
            q = q.filter(Service.audience.in_(["men", "unisex"]))
        elif aud == "women":
            q = q.filter(Service.audience.in_(["women", "unisex", "unspecified"]))
        elif aud == "unisex":
            q = q.filter(Service.audience == "unisex")
        elif aud not in ("all", "*"):
            q = q.filter(Service.audience == aud)

    items = [ServiceResponse.model_validate(s).model_dump() for s in q.all()]
    if city and city.strip():
        city_lower = city.strip().lower()
        items = [
            item for item in items
            if city_lower in [c.strip().lower() for c in (item.get("cities") or [])]
        ]
    cache_service.set(cache_key, items, ttl=300)
    return items


@catalog_router.get("/professionals", response_model=List[ProfessionalResponse])
def catalog_professionals(
    specialty: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    audience: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    from backend.app.models.catalog import ProfessionalProfile
    from backend.app.services.cache_service import cache_service

    cache_key = f"glamgo:catalog:professionals:v3:{specialty}:{city}:{audience}"
    cached = cache_service.get(cache_key)
    if cached is not None:
        return cached

    q = db.query(ProfessionalProfile).filter(ProfessionalProfile.is_verified == True)
    if specialty:
        q = q.filter(ProfessionalProfile.specialty.ilike(f"%{specialty}%"))
    if city and city.strip():
        q = q.filter(ProfessionalProfile.city.ilike(city.strip()))
    if audience:
        aud = audience.strip().lower()
        if aud == "men":
            q = q.filter(ProfessionalProfile.audience.in_(["men", "unisex"]))
        elif aud == "women":
            q = q.filter(ProfessionalProfile.audience.in_(["women", "unisex", "unspecified"]))
        elif aud == "unisex":
            q = q.filter(ProfessionalProfile.audience == "unisex")
        elif aud not in ("all", "*"):
            q = q.filter(ProfessionalProfile.audience == aud)

    items = [ProfessionalResponse.model_validate(p).model_dump() for p in q.all()]
    cache_service.set(cache_key, items, ttl=300)
    return items


@catalog_router.get("/products/{product_id}/offers")
def catalog_product_offers(product_id: str, db: Session = Depends(get_db)):
    from backend.app.services.commerce_service import CommerceService
    return CommerceService.get_product_offers(db, product_id)


api_router.include_router(catalog_router, prefix="/catalog", tags=["Catalog"])

# Internal maintenance engine tasks (explicitly authenticated via X-Maintenance-Token or Admin JWT)
internal_router = APIRouter()


@internal_router.post("/inventory/expire-reservations")
def expire_reservations_task(
    db: Session = Depends(get_db),
    _auth: dict = Depends(require_maintenance_auth),
):
    from backend.app.services.commerce_service import CommerceService
    count = CommerceService.expire_pending_reservations(db)
    return {"status": "success", "expired_reservations_count": count, "actor": _auth["actor"]}


@internal_router.post("/escrow/mature")
def mature_escrow_task(
    db: Session = Depends(get_db),
    _auth: dict = Depends(require_maintenance_auth),
):
    from backend.app.services.commerce_service import CommerceService
    count = CommerceService.mature_escrow_records(db)
    return {"status": "success", "matured_records_count": count, "actor": _auth["actor"]}


@internal_router.post("/refunds/recover")
def recover_refunds_task(
    dry_run: bool = Query(False),
    db: Session = Depends(get_db),
    _auth: dict = Depends(require_maintenance_auth),
):
    from backend.app.services.refund_service import RefundService
    summary = RefundService.recover_pending_refunds(db, dry_run=dry_run)
    return {"status": "success", "actor": _auth["actor"], **summary}


api_router.include_router(internal_router, prefix="/internal", tags=["Internal Maintenance Engine"])
