from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.catalog import ProfessionalProfile, Availability
from backend.app.schemas.catalog import ProfessionalResponse

router = APIRouter()


@router.get("/", response_model=List[ProfessionalResponse])
def get_professionals(
    specialty: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(ProfessionalProfile).filter(ProfessionalProfile.is_verified == True)
    if specialty:
        q = q.filter(ProfessionalProfile.specialty.ilike(f"%{specialty}%"))
    return q.all()


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
