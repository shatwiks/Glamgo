from typing import List, Optional
from urllib.parse import quote
from fastapi import APIRouter, Depends
from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from backend.app.api.deps import get_optional_current_user
from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.core.rate_limit import RateLimiter
from backend.app.models.booking import Booking
from backend.app.models.catalog import Product, Salon, Service
from backend.app.models.order import Order
from backend.app.models.user import User
from backend.app.schemas.concierge import (
    ConciergeAction,
    ConciergeChatRequest,
    ConciergeChatResponse,
)
from backend.app.services.ai_concierge_service import generate_gemini_concierge_reply

router = APIRouter()
concierge_limiter = RateLimiter(requests=20, window_seconds=300, prefix="concierge_ai")


def _wa_url(text: str) -> str:
    number = "".join(ch for ch in str(settings.WHATSAPP_CONCIERGE_NUMBER or "916360849512") if ch.isdigit()) or "916360849512"
    return f"https://wa.me/{number}?text={quote(text)}"


def _normalize_audience(audience: Optional[str]) -> Optional[str]:
    aud = (audience or "").strip().lower()
    if aud in ("men", "women", "unisex"):
        return aud
    return None


def _audience_filter(model, audience: Optional[str]):
    aud = _normalize_audience(audience)
    if aud == "men":
        return model.audience.in_(["men", "unisex"])
    if aud == "women":
        return model.audience.in_(["women", "unisex", "unspecified"])
    if aud == "unisex":
        return model.audience == "unisex"
    return None


def _query_services(db: Session, keywords: List[str], audience: Optional[str], limit: int = 3) -> List[Service]:
    q = db.query(Service).filter(Service.is_active == True, Service.salon_id.is_(None))
    aud_cond = _audience_filter(Service, audience)
    if aud_cond is not None:
        q = q.filter(aud_cond)
    if keywords:
        clauses = []
        for kw in keywords:
            like = f"%{kw}%"
            clauses.extend([
                Service.category.ilike(like),
                Service.name.ilike(like),
                Service.desc.ilike(like),
            ])
        q = q.filter(or_(*clauses))
    return q.order_by(Service.rating.desc(), Service.price.asc()).limit(limit).all()


def _query_salons(db: Session, location: Optional[str], audience: Optional[str], limit: int = 2) -> List[Salon]:
    q = db.query(Salon).options(selectinload(Salon.menu_services))
    aud_cond = _audience_filter(Salon, audience)
    if aud_cond is not None:
        q = q.filter(aud_cond)
    loc = (location or "").strip()
    if loc:
        city_token = loc.split(",")[-1].strip()
        city_matches = q.filter(
            or_(
                Salon.city.ilike(f"%{city_token}%"),
                Salon.area.ilike(f"%{loc}%"),
            )
        ).order_by(Salon.rating.desc()).limit(limit).all()
        if city_matches:
            return city_matches
    return q.order_by(Salon.rating.desc()).limit(limit).all()


def _query_products(db: Session, keywords: List[str], audience: Optional[str], limit: int = 2) -> List[Product]:
    q = db.query(Product).filter(Product.is_active == True, Product.stock > 0)
    aud_cond = _audience_filter(Product, audience)
    if aud_cond is not None:
        q = q.filter(aud_cond)
    if keywords:
        clauses = []
        for kw in keywords:
            like = f"%{kw}%"
            clauses.extend([
                Product.category.ilike(like),
                Product.name.ilike(like),
                Product.brand.ilike(like),
                Product.description.ilike(like),
            ])
        q = q.filter(or_(*clauses))
    return q.order_by(Product.rating.desc(), Product.price.asc()).limit(limit).all()


def _format_price(price: float) -> str:
    return f"₹{int(round(price)):,}"


def _book_action(svc: Service) -> ConciergeAction:
    return ConciergeAction(
        label=f"Book {svc.name} ({_format_price(svc.price)})",
        action="book-home",
        id=str(svc.id),
    )


def _fallback_chat(
    db: Session,
    q: str,
    city: str,
    location: str,
    audience: Optional[str],
    user: Optional[User],
    context_wa: str,
) -> ConciergeChatResponse:
    low = q.lower()

    if any(k in low for k in ("my booking", "my order", "my appointment", "booking status", "order status", "arrival pin", "track my", "track order")):
        if user is None:
            return ConciergeChatResponse(
                reply="Sign in to your GlamGo account so I can check your live appointments, Arrival PINs, and recent orders.",
                actions=[ConciergeAction(label="Chat on WhatsApp ↗", url=context_wa)],
                whatsapp_url=context_wa,
                source="fallback",
            )
        latest_b = (
            db.query(Booking)
            .filter(Booking.customer_id == user.id)
            .order_by(Booking.created_at.desc())
            .first()
        )
        latest_o = (
            db.query(Order)
            .filter(Order.customer_id == user.id)
            .order_by(Order.created_at.desc())
            .first()
        )
        parts = []
        actions: List[ConciergeAction] = []
        if latest_b:
            st = latest_b.status.value if hasattr(latest_b.status, "value") else str(latest_b.status)
            pin_note = f" (Arrival PIN: **{latest_b.arrival_otp}**)" if (st == "confirmed" and latest_b.arrival_otp) else ""
            parts.append(f"Latest appointment: **{latest_b.title}** on {latest_b.date} at {latest_b.time} ({st.upper()}){pin_note}.")
            actions.append(ConciergeAction(label="View my bookings", action="account-bookings"))
        if latest_o:
            ost = latest_o.status.value if hasattr(latest_o.status, "value") else str(latest_o.status)
            parts.append(f"Latest order **#{latest_o.id}** is {ost.upper()} ({_format_price(latest_o.total)}).")
            actions.append(ConciergeAction(label="Track my orders", action="orders"))
        if not parts:
            parts.append("You have no bookings or product orders yet. Would you like a personalized recommendation?")
            actions.append(ConciergeAction(label="Recommend a treatment", prompt="Recommend a treatment for me"))
        return ConciergeChatResponse(reply=" ".join(parts), actions=actions, whatsapp_url=context_wa, source="fallback")

    if any(k in low for k in ("serum", "product", "cleanser", "moistur", "oil", "buy", "store", "shop")):
        kw = [w for w in ("serum", "cleanser", "beard", "hair", "body", "skin", "lip", "fragrance") if w in low]
        prods = _query_products(db, kw, audience, limit=2) or _query_products(db, [], audience, limit=2)
        if prods:
            names = ", ".join(f"**{p.name}** ({_format_price(p.price)})" for p in prods)
            actions = [ConciergeAction(label=f"View {p.name}", action="product-detail", id=str(p.id)) for p in prods]
            return ConciergeChatResponse(
                reply=f"From our Beauty Store, I recommend {names}. Tap below to check ingredients, variants, and add to bag.",
                actions=actions,
                whatsapp_url=context_wa,
                source="fallback",
            )

    if any(k in low for k in ("facial", "skin", "glow", "detan", "cleanup")):
        matches = _query_services(db, ["skin", "facial", "glow", "detan", "cleanup"], audience)
        svc = matches[0] if matches else None
        if svc:
            reply = (
                f"For an instant radiant complexion, I recommend **{svc.name}** "
                f"({svc.duration}, {_format_price(svc.price)}). {svc.desc} "
                "Our verified specialists arrive with a sterile kit and fresh linens directly at your door."
            )
            actions = [_book_action(svc), ConciergeAction(label="View Skin Category", action="home-category", id="Skin")]
        else:
            reply = (
                "For an instant radiant complexion, I recommend **The Signature Facial** (75 min, ₹1,499). "
                "It includes a gentle botanical cleanse, lymphatic massage, and an antioxidant vitamin infusion. "
                "Our verified specialists arrive with a sterile kit and fresh linens directly at your door."
            )
            actions = [
                ConciergeAction(label="Book The Signature Facial (₹1,499)", action="book-home", id="s1"),
                ConciergeAction(label="View Skin Category", action="home-category", id="Skin"),
            ]
        return ConciergeChatResponse(reply=reply, actions=actions, whatsapp_url=context_wa, source="fallback")

    if any(k in low for k in ("hair", "blowout", "styling", "haircut", "beard", "trim")):
        kw = ["hair", "beard", "haircut", "trim", "styling"] if audience == "men" else ["hair", "blowout", "styling"]
        matches = _query_services(db, kw, audience)
        svc = matches[0] if matches else None
        if svc:
            reply = (
                f"Our **{svc.name}** ({svc.duration}, {_format_price(svc.price)}) is tailored for effortless results. "
                f"{svc.desc}"
            )
            actions = [_book_action(svc), ConciergeAction(label="View Hair Category", action="home-category", id="Hair")]
        else:
            reply = (
                "Our **Express Hair Styling** (45 min, ₹899) is ideal for polished blowouts, silk presses, or event curls. "
                "Our vetted hair stylists bring professional heat tools and styling serums to your home."
            )
            actions = [
                ConciergeAction(label="Book Hair Styling (₹899)", action="book-home", id="s2"),
                ConciergeAction(label="View Hair Category", action="home-category", id="Hair"),
            ]
        return ConciergeChatResponse(reply=reply, actions=actions, whatsapp_url=context_wa, source="fallback")

    if any(k in low for k in ("nail", "manicure", "pedicure")):
        matches = _query_services(db, ["nail", "manicure", "pedicure"], audience)
        svc = matches[0] if matches else None
        if svc:
            reply = f"Treat yourself with **{svc.name}** ({svc.duration}, {_format_price(svc.price)}). {svc.desc}"
            actions = [_book_action(svc), ConciergeAction(label="View Nails Category", action="home-category", id="Nails")]
        else:
            reply = (
                "Treat your hands with the **Classic Manicure & Gel** (50 min, ₹699). "
                "Includes gentle cuticle care, shape refinement, nourishing hand massage, and long-wear chip-free polish."
            )
            actions = [
                ConciergeAction(label="Book Classic Manicure (₹699)", action="book-home", id="s3"),
                ConciergeAction(label="View Nails Category", action="home-category", id="Nails"),
            ]
        return ConciergeChatResponse(reply=reply, actions=actions, whatsapp_url=context_wa, source="fallback")

    if any(k in low for k in ("makeup", "bridal", "wedding", "party")):
        matches = _query_services(db, ["makeup", "bridal", "wedding"], audience)
        svc = matches[0] if matches else None
        pkg = (_query_services(db, ["package", "complete glow"], audience) or [None])[0]
        if svc:
            reply = f"For special celebrations, our **{svc.name}** ({svc.duration}, {_format_price(svc.price)}) delivers a bespoke studio finish. {svc.desc}"
            actions = [_book_action(svc)]
            if pkg and pkg.id != svc.id:
                actions.append(ConciergeAction(label=f"Explore {pkg.name} ({_format_price(pkg.price)})", action="book-home", id=str(pkg.id)))
        else:
            reply = (
                "For special celebrations, our **Occasion & Bridal Makeup** (90 min, ₹2,499) provides bespoke "
                "high-definition looks using luxury, non-comedogenic cosmetics matched to your undertones."
            )
            actions = [
                ConciergeAction(label="Book Occasion Makeup (₹2,499)", action="book-home", id="s4"),
                ConciergeAction(label="Explore Complete Glow Ritual", action="book-home", id="s8"),
            ]
        return ConciergeChatResponse(reply=reply, actions=actions, whatsapp_url=context_wa, source="fallback")

    if any(k in low for k in ("massage", "spa", "relax")):
        matches = _query_services(db, ["spa", "massage", "relax"], audience)
        svc = matches[0] if matches else None
        if svc:
            reply = f"Unwind with our **{svc.name}** ({svc.duration}, {_format_price(svc.price)}). {svc.desc}"
            actions = [_book_action(svc)]
        else:
            reply = (
                "Unwind with our **Relax & Restore Massage** (60 min, ₹1,799). "
                "A soothing, rhythmic full-body ritual using warm aromatic botanical oils."
            )
            actions = [ConciergeAction(label="Book Relax Massage (₹1,799)", action="book-home", id="s5")]
        return ConciergeChatResponse(reply=reply, actions=actions, whatsapp_url=context_wa, source="fallback")

    if any(k in low for k in ("wax", "waxing")):
        matches = _query_services(db, ["wax"], audience)
        svc = matches[0] if matches else None
        if svc:
            reply = f"Our **{svc.name}** ({svc.duration}, {_format_price(svc.price)}) ensures gentle, hygienic results. {svc.desc}"
            actions = [_book_action(svc)]
        else:
            reply = "Our **Smooth Botanical Waxing** (40 min, ₹599) uses gentle, low-heat strip-less peel wax and soothing aloe post-treatment care."
            actions = [ConciergeAction(label="Book Botanical Waxing (₹599)", action="book-home", id="s6")]
        return ConciergeChatResponse(reply=reply, actions=actions, whatsapp_url=context_wa, source="fallback")

    if any(k in low for k in ("thread", "brow")):
        matches = _query_services(db, ["thread", "brow"], audience)
        svc = matches[0] if matches else None
        if svc:
            reply = f"Define your look with **{svc.name}** ({svc.duration}, {_format_price(svc.price)}). {svc.desc}"
            actions = [_book_action(svc)]
        else:
            reply = "Define your arches with the **Brow & Threading Precision Edit** (25 min, ₹299). Clean mapping and threading for a crisp, natural frame."
            actions = [ConciergeAction(label="Book Brow Threading (₹299)", action="book-home", id="s7")]
        return ConciergeChatResponse(reply=reply, actions=actions, whatsapp_url=context_wa, source="fallback")

    if any(k in low for k in ("package", "complete glow", "combo")):
        matches = _query_services(db, ["package", "complete glow", "combo"], audience)
        svc = matches[0] if matches else None
        if svc:
            reply = f"**{svc.name}** ({svc.duration}, {_format_price(svc.price)}) is our curated multi-step ritual: {svc.desc}"
            actions = [_book_action(svc)]
        else:
            reply = (
                "The **Complete Glow Ritual** (150 min, ₹3,299) is our premier head-to-toe package: "
                "combines a botanical facial, classic manicure, and polished salon blowout in a single visit."
            )
            actions = [ConciergeAction(label="Book Complete Glow (₹3,299)", action="book-home", id="s8")]
        return ConciergeChatResponse(reply=reply, actions=actions, whatsapp_url=context_wa, source="fallback")

    if any(k in low for k in ("salon", "parlour", "parlor", "near")):
        salons = _query_salons(db, city or location, audience)
        area_label = location or city or "your area"
        if salons:
            salon_names = ", ".join(f"**{s.name}** ({s.area})" for s in salons)
            reply = f"Here are top-rated partner salons in {area_label}: {salon_names}. Pick one below to inspect stylists and menus."
            actions = [
                ConciergeAction(label=f"View {s.name}", action="salon-detail", id=str(s.id))
                for s in salons
            ]
        else:
            reply = f"You can explore verified partner salons and chair appointments near {area_label} directly in our Salons portal."
            actions = [ConciergeAction(label="Browse Partner Salons", action="experience", id="salon")]
        return ConciergeChatResponse(reply=reply, actions=actions, whatsapp_url=context_wa, source="fallback")

    if any(k in low for k in ("how", "safe", "sterile", "hygiene", "work")):
        reply = (
            "Booking with GlamGo takes 60 seconds: 1) Pick your treatment with upfront pricing, "
            "2) Select your verified specialist, 3) Choose date, time slot & address, "
            "4) Specialist arrives with hospital-grade sanitized tools in sealed pouches."
        )
        actions = [
            ConciergeAction(label="Browse Treatments", action="scroll", target="popular"),
            ConciergeAction(
                label="Chat with Support on WhatsApp",
                url=_wa_url("Hi GlamGo! I have a question about at-home treatments."),
            ),
        ]
        return ConciergeChatResponse(reply=reply, actions=actions, whatsapp_url=context_wa, source="fallback")

    if any(k in low for k in ("whatsapp", "contact", "call", "human", "support")):
        reply = (
            "Our dedicated customer care team is available on WhatsApp daily from 8:00 AM to 9:00 PM "
            "for custom bridal bookings, urgent questions, or personalized requests."
        )
        actions = [ConciergeAction(label="Chat on WhatsApp ↗", url=context_wa)]
        return ConciergeChatResponse(reply=reply, actions=actions, whatsapp_url=context_wa, source="fallback")

    area_label = location or city or "your area"
    top_services = _query_services(db, [], audience, limit=2)
    reply = (
        f"I'm delighted to assist you with GlamGo! We offer certified at-home beauty treatments, "
        f"local salon chair bookings, and clean beauty store products across {area_label}. "
        "What service or product can I help you find today?"
    )
    if top_services:
        actions = [_book_action(s) for s in top_services]
    else:
        actions = [
            ConciergeAction(label="The Signature Facial (₹1,499)", action="book-home", id="s1"),
            ConciergeAction(label="Hair Blowout & Styling (₹899)", action="book-home", id="s2"),
        ]
    actions.append(ConciergeAction(label="Chat on WhatsApp", url=context_wa))
    return ConciergeChatResponse(reply=reply, actions=actions, whatsapp_url=context_wa, source="fallback")


@router.get("/config")
def get_concierge_config():
    return {
        "whatsapp_number": settings.WHATSAPP_CONCIERGE_NUMBER,
        "whatsapp_url": _wa_url("Hello GlamGo! I would like to inquire about beauty services and salon appointments."),
    }


@router.post("/chat", response_model=ConciergeChatResponse, dependencies=[Depends(concierge_limiter)])
def concierge_chat(
    payload: ConciergeChatRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    q = payload.message.strip()
    audience = _normalize_audience(payload.audience)
    location = (payload.location or "").strip()
    city = (payload.city or (location.split(",")[-1].strip() if location else "") or "Mumbai").strip()

    wa_note = f"Hi GlamGo ({city})! Connecting from AI Concierge about: {q[:120]}"
    context_wa = _wa_url(wa_note)

    llm_result = generate_gemini_concierge_reply(
        db=db,
        message=q,
        city=city,
        audience=audience,
        experience=payload.experience,
        history=payload.history,
        user=current_user,
        default_wa_url=context_wa,
    )
    if llm_result:
        actions = [ConciergeAction(**a) for a in llm_result.get("actions", [])]
        return ConciergeChatResponse(
            reply=llm_result["reply"],
            actions=actions,
            whatsapp_url=context_wa,
            source="gemini",
        )

    return _fallback_chat(db, q, city, location, audience, current_user, context_wa)
