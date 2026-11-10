from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.catalog import Salon, SalonStaff
from backend.app.schemas.catalog import SalonResponse, SalonCreate, SalonStaffResponse
from backend.app.api.deps import require_salon_owner

router = APIRouter()


def format_salon(s: Salon) -> dict:
    services = [x.strip() for x in s.services_list.split(",") if x.strip()] if s.services_list else []
    staff = [
        {"id": st.id, "name": st.name, "specialty": st.specialty, "img": st.img}
        for st in s.staff
    ]
    return {
        "id": s.id,
        "name": s.name,
        "area": s.area,
        "distance": s.distance,
        "rating": s.rating,
        "reviews": s.reviews,
        "price": s.price,
        "img": s.img,
        "tag": s.tag or "Popular",
        "services": services,
        "hours": s.hours,
        "about": s.about,
        "staff": staff
    }


@router.get("/", response_model=List[SalonResponse])
def get_salons(
    category: Optional[str] = Query(None),
    sort: Optional[str] = Query("featured"),
    query: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    salons = db.query(Salon).all()
    res = []
    for s in salons:
        data = format_salon(s)
        if category and category.lower() != "all":
            if category.lower() not in [x.lower() for x in data["services"]]:
                continue
        if query:
            q_lower = query.lower()
            if q_lower not in s.name.lower() and q_lower not in s.area.lower():
                continue
        res.append(data)

    if sort == "rating":
        res.sort(key=lambda x: x["rating"], reverse=True)
    elif sort == "price":
        res.sort(key=lambda x: x["price"])

    return res


@router.get("/{salon_id}", response_model=SalonResponse)
def get_salon(salon_id: str, db: Session = Depends(get_db)):
    salon = db.query(Salon).filter(Salon.id == salon_id).first()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")
    return format_salon(salon)


@router.post("/", response_model=SalonResponse)
def create_salon(
    salon_in: SalonCreate,
    db: Session = Depends(get_db),
    user=Depends(require_salon_owner)
):
    import time
    sid = salon_in.id or f"l{int(time.time()*1000)}"
    salon = Salon(
        id=sid,
        owner_id=user.id,
        name=salon_in.name,
        area=salon_in.area,
        distance=salon_in.distance,
        price=salon_in.price,
        img=salon_in.img,
        tag=salon_in.tag or "Popular",
        services_list=",".join(salon_in.services),
        hours=salon_in.hours,
        about=salon_in.about
    )
    db.add(salon)
    db.commit()
    db.refresh(salon)
    return format_salon(salon)
