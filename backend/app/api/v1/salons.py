import math
import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload
from backend.app.core.database import get_db
from backend.app.models.catalog import Salon, SalonStaff
from backend.app.schemas.catalog import SalonResponse, SalonCreate, SalonStaffResponse
from backend.app.services.cache_service import cache_service
from backend.app.api.deps import require_salon_owner

router = APIRouter()

NEAR_SALON_RADIUS_KM = 8.0


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    radius_km = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    return 2.0 * radius_km * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))


def _parse_distance_km(raw_distance: Optional[str]) -> Optional[float]:
    if not raw_distance:
        return None
    m = re.search(r"(\d+(?:\.\d+)?)", str(raw_distance))
    return float(m.group(1)) if m else None


def format_salon(
    s: Salon,
    user_lat: Optional[float] = None,
    user_lng: Optional[float] = None,
) -> dict:
    services = [x.strip() for x in s.services_list.split(",") if x.strip()] if s.services_list else []
    staff = [
        {"id": st.id, "name": st.name, "specialty": st.specialty, "img": st.img}
        for st in s.staff
    ]
    city_val = getattr(s, "city", None) or "Mumbai"
    lat_val = getattr(s, "lat", None)
    lng_val = getattr(s, "lng", None)

    distance_km: Optional[float] = None
    is_far: Optional[bool] = None
    distance_display = s.distance

    if user_lat is not None and user_lng is not None and lat_val is not None and lng_val is not None:
        distance_km = round(_haversine_km(user_lat, user_lng, float(lat_val), float(lng_val)), 1)
        is_far = distance_km > NEAR_SALON_RADIUS_KM
        distance_display = f"{distance_km:.1f} km away"

    return {
        "id": s.id,
        "name": s.name,
        "city": city_val,
        "area": s.area,
        "lat": lat_val,
        "lng": lng_val,
        "distance": distance_display,
        "distance_km": distance_km,
        "is_far": is_far,
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
    city: Optional[str] = Query(None),
    lat: Optional[float] = Query(None, ge=-90, le=90),
    lng: Optional[float] = Query(None, ge=-180, le=180),
    max_distance_km: Optional[float] = Query(None, gt=0, le=200),
    db: Session = Depends(get_db)
):
    cache_key = f"glamgo:catalog:salons:v2:{category}:{sort}:{query}:{city}:{lat}:{lng}:{max_distance_km}"
    cached = cache_service.get(cache_key)
    if cached is not None:
        return cached

    has_coords = lat is not None and lng is not None
    salons = db.query(Salon).options(selectinload(Salon.staff)).all()
    res = []
    for s in salons:
        data = format_salon(s, user_lat=lat if has_coords else None, user_lng=lng if has_coords else None)
        if city and city.strip():
            if data["city"].strip().lower() != city.strip().lower():
                continue
        if category and category.lower() != "all":
            if category.lower() not in [x.lower() for x in data["services"]]:
                continue
        if query:
            q_lower = query.lower()
            if (
                q_lower not in s.name.lower()
                and q_lower not in s.area.lower()
                and q_lower not in data["city"].lower()
            ):
                continue
        if max_distance_km is not None:
            effective_dist = data["distance_km"]
            if effective_dist is None and not has_coords:
                effective_dist = _parse_distance_km(s.distance)
            if effective_dist is None or effective_dist > max_distance_km:
                continue
        res.append(data)

    if sort == "rating":
        res.sort(key=lambda x: x["rating"], reverse=True)
    elif sort == "price":
        res.sort(key=lambda x: x["price"])
    elif sort in ("featured", "nearest") and has_coords:
        res.sort(key=lambda x: (x["distance_km"] is None, x["distance_km"] if x["distance_km"] is not None else float("inf")))

    cache_service.set(cache_key, res, ttl=300)
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
        city=salon_in.city or "Mumbai",
        area=salon_in.area,
        lat=salon_in.lat,
        lng=salon_in.lng,
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
    cache_service.invalidate_catalog()
    return format_salon(salon)
