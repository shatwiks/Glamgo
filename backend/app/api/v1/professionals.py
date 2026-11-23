from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.catalog import ProfessionalProfile, Availability
from backend.app.schemas.catalog import ProfessionalResponse
from backend.app.services.cache_service import cache_service

router = APIRouter()


@router.get("/", response_model=List[ProfessionalResponse])
def get_professionals(
    specialty: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    audience: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    cache_key = f"glamgo:catalog:professionals:v2:{specialty}:{city}:{audience}"
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
    result = [ProfessionalResponse.model_validate(p).model_dump() for p in q.all()]
    cache_service.set(cache_key, result, ttl=300)
    return result


@router.get("/{professional_id}", response_model=ProfessionalResponse)
def get_professional(professional_id: int, db: Session = Depends(get_db)):
    pro = db.query(ProfessionalProfile).filter(ProfessionalProfile.id == professional_id).first()
    if not pro:
        raise HTTPException(status_code=404, detail="Professional not found")
    return pro


@router.get("/{professional_id}/availability", response_model=List[str])
def get_professional_availability(professional_id: int, db: Session = Depends(get_db)):
    pro = db.query(ProfessionalProfile).filter(ProfessionalProfile.id == professional_id).first()
    if not pro:
        raise HTTPException(status_code=404, detail="Professional not found")
    if pro.user_id:
        avails = db.query(Availability).filter(Availability.user_id == pro.user_id, Availability.is_available == True).all()
        if avails:
            return [a.day for a in avails]
    return ["Mon", "Tue", "Wed", "Thu", "Fri"]
