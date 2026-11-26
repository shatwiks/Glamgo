from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload
from backend.app.core.database import get_db
from backend.app.models.catalog import Service
from backend.app.schemas.catalog import ServiceResponse, ServiceCreate
from backend.app.services.cache_service import cache_service
from backend.app.api.deps import require_partner

router = APIRouter()


@router.get("/", response_model=List[ServiceResponse])
def get_services(
    category: Optional[str] = Query(None),
    query: Optional[str] = Query(None),
    audience: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    cache_key = f"glamgo:catalog:services:v2:{category}:{query}:{audience}:{city}"
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
    if city and city.strip():
        q = q.filter(Service.service_cities.ilike(f"%{city.strip()}%"))

    result = [ServiceResponse.model_validate(s).model_dump() for s in q.all()]
    cache_service.set(cache_key, result, ttl=300)
    return result


@router.get("/categories", response_model=List[str])
def get_service_categories(db: Session = Depends(get_db)):
    categories = db.query(Service.category).filter(Service.is_active == True, Service.salon_id.is_(None)).distinct().all()
    res = ["All"] + [c[0] for c in categories if c[0]]
    return res


@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(service_id: str, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service


@router.post("/", response_model=ServiceResponse)
def create_service(
    service_in: ServiceCreate,
    db: Session = Depends(get_db),
    _user=Depends(require_partner)
):
    import time
    sid = service_in.id or f"s{int(time.time()*1000)}"
    service = Service(
        id=sid,
        audience=service_in.audience,
        name=service_in.name,
        category=service_in.category,
        price=service_in.price,
        duration=service_in.duration,
        img=service_in.img,
        desc=service_in.desc
    )
    db.add(service)
    db.commit()
    db.refresh(service)
    cache_service.invalidate_catalog()
    return service
