from typing import List, Optional
from urllib.parse import quote
from fastapi import APIRouter, Depends
from sqlalchemy import or_
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.models.catalog import Salon, Service
from backend.app.schemas.concierge import (
    ConciergeAction,
    ConciergeChatRequest,
    ConciergeChatResponse,
)

router = APIRouter()


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
    q = db.query(Salon)
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


def _format_price(price: float) -> str:
    return f"₹{int(round(price)):,}"


def _book_action(svc: Service) -> ConciergeAction:
    return ConciergeAction(
        label=f"Book {svc.name} ({_format_price(svc.price)})",
        action="book-home",
        id=str(svc.id),
    )


@router.get("/config")
def get_concierge_config():
    return {
        "whatsapp_number": settings.WHATSAPP_CONCIERGE_NUMBER,
        "whatsapp_url": _wa_url("Hello GlamGo! I would like to inquire about beauty services and salon appointments."),
    }


@router.post("/chat", response_model=ConciergeChatResponse)
def concierge_chat(payload: ConciergeChatRequest, db: Session = Depends(get_db)):
    q = payload.message.strip()
    low = q.lower()
    audience = _normalize_audience(payload.audience)
    location = (payload.location or "").strip()
    default_wa = _wa_url("Hello GlamGo! Connecting from AI chat for assistance.")

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
        return ConciergeChatResponse(reply=reply, actions=actions, whatsapp_url=default_wa)

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
        return ConciergeChatResponse(reply=reply, actions=actions, whatsapp_url=default_wa)

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
        return ConciergeChatResponse(reply=reply, actions=actions, whatsapp_url=default_wa)

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
        return ConciergeChatResponse(reply=reply, actions=actions, whatsapp_url=default_wa)

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
        return ConciergeChatResponse(reply=reply, actions=actions, whatsapp_url=default_wa)

    if any(k in low for k in ("wax", "waxing")):
        matches = _query_services(db, ["wax"], audience)
        svc = matches[0] if matches else None
        if svc:
            reply = f"Our **{svc.name}** ({svc.duration}, {_format_price(svc.price)}) ensures gentle, hygienic results. {svc.desc}"
            actions = [_book_action(svc)]
        else:
            reply = "Our **Smooth Botanical Waxing** (40 min, ₹599) uses gentle, low-heat strip-less peel wax and soothing aloe post-treatment care."
            actions = [ConciergeAction(label="Book Botanical Waxing (₹599)", action="book-home", id="s6")]
        return ConciergeChatResponse(reply=reply, actions=actions, whatsapp_url=default_wa)

    if any(k in low for k in ("thread", "brow")):
        matches = _query_services(db, ["thread", "brow"], audience)
        svc = matches[0] if matches else None
        if svc:
            reply = f"Define your look with **{svc.name}** ({svc.duration}, {_format_price(svc.price)}). {svc.desc}"
            actions = [_book_action(svc)]
        else:
            reply = "Define your arches with the **Brow & Threading Precision Edit** (25 min, ₹299). Clean mapping and threading for a crisp, natural frame."
            actions = [ConciergeAction(label="Book Brow Threading (₹299)", action="book-home", id="s7")]
        return ConciergeChatResponse(reply=reply, actions=actions, whatsapp_url=default_wa)

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
        return ConciergeChatResponse(reply=reply, actions=actions, whatsapp_url=default_wa)

    if any(k in low for k in ("salon", "parlour", "parlor", "near")):
        salons = _query_salons(db, location, audience)
        area_label = location or "your area"
        if salons:
            salon_names = ", ".join(f"**{s.name}** ({s.area})" for s in salons)
            reply = f"Here are top-rated partner salons near {area_label}: {salon_names}. Pick one below to inspect stylists and open chairs."
            actions = [
                ConciergeAction(label=f"View {s.name}", action="salon-detail", id=str(s.id))
                for s in salons
            ]
        else:
            reply = f"You can explore verified partner salons and chair appointments near {area_label} directly in our Salons portal."
            actions = [ConciergeAction(label="Browse Partner Salons", action="experience", id="salon")]
        return ConciergeChatResponse(reply=reply, actions=actions, whatsapp_url=default_wa)

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
        return ConciergeChatResponse(reply=reply, actions=actions, whatsapp_url=default_wa)

    if any(k in low for k in ("whatsapp", "contact", "call", "human", "support")):
        reply = (
            "Our dedicated customer care team is available on WhatsApp daily from 8:00 AM to 9:00 PM "
            "for custom bridal bookings, urgent questions, or personalized requests."
        )
        actions = [ConciergeAction(label="Chat on WhatsApp ↗", url=default_wa)]
        return ConciergeChatResponse(reply=reply, actions=actions, whatsapp_url=default_wa)

    area_label = location or "your area"
    top_services = _query_services(db, [], audience, limit=2)
    reply = (
        f"I'm delighted to assist you with GlamGo! We offer certified at-home beauty treatments, "
        f"local salon chair bookings, and clean beauty store products across {area_label}. "
        "What service can I help you book today?"
    )
    if top_services:
        actions = [_book_action(s) for s in top_services]
    else:
        actions = [
            ConciergeAction(label="The Signature Facial (₹1,499)", action="book-home", id="s1"),
            ConciergeAction(label="Hair Blowout & Styling (₹899)", action="book-home", id="s2"),
        ]
    actions.append(
        ConciergeAction(
            label="Chat on WhatsApp",
            url=_wa_url("Hi GlamGo! I would like more information."),
        )
    )
    return ConciergeChatResponse(reply=reply, actions=actions, whatsapp_url=default_wa)
