from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.catalog import Service
from backend.app.schemas.catalog import ServiceResponse, ServiceCreate
from backend.app.api.deps import require_partner

router = APIRouter()


@router.get("/", response_model=List[ServiceResponse])
def get_services(
    category: Optional[str] = Query(None),
    query: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(Service).filter(Service.is_active == True)
    if category and category.lower() != "all":
        q = q.filter(Service.category.ilike(category))
    if query:
        q = q.filter((Service.name.ilike(f"%{query}%")) | (Service.desc.ilike(f"%{query}%")))
    return q.all()


@router.get("/categories", response_model=List[str])
def get_service_categories(db: Session = Depends(get_db)):
    categories = db.query(Service.category).distinct().all()
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
    return service
