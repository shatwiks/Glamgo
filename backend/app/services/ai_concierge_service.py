import json
import logging
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.orm import Session, selectinload

from backend.app.core.config import settings
from backend.app.models.booking import Booking
from backend.app.models.catalog import Product, Salon, Service
from backend.app.models.order import Order
from backend.app.models.user import User

logger = logging.getLogger("glamgo.concierge")

ALLOWED_NAV_ACTIONS = {
    "home-category",
    "experience",
    "scroll",
    "location-set",
    "account-bookings",
    "orders",
    "ai-prompt",
}

FALLBACK_GEMINI_MODELS = (
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
)
RETRYABLE_GEMINI_HTTP_CODES = {404, 429, 500, 502, 503, 504}


def resolve_gemini_endpoint(api_key: str, model: str) -> str:
    clean_model = (model or "gemini-3.1-flash-lite").strip() or "gemini-3.1-flash-lite"
    return f"https://generativelanguage.googleapis.com/v1beta/models/{clean_model}:generateContent"


def _audience_filter(model, audience: Optional[str]):
    aud = (audience or "").strip().lower()
    if aud == "men":
        return model.audience.in_(["men", "unisex"])
    if aud == "women":
        return model.audience.in_(["women", "unisex", "unspecified"])
    if aud == "unisex":
        return model.audience == "unisex"
    return None


def _matches_city(cities: List[str], city: str) -> bool:
    c = (city or "").strip().lower()
    if not c:
        return True
    return any(c == x.strip().lower() for x in (cities or []))


def build_catalog_context(
    db: Session,
    city: str,
    audience: Optional[str],
    user: Optional[User] = None,
) -> Tuple[str, Dict[str, Any]]:
    norm_city = (city or "Mumbai").strip() or "Mumbai"
    norm_aud = (audience or "women").strip().lower()

    svc_q = db.query(Service).options(selectinload(Service.owner_professional)).filter(
        Service.is_active == True,
        Service.salon_id.is_(None),
    )
    svc_aud = _audience_filter(Service, norm_aud)
    if svc_aud is not None:
        svc_aud_rows = svc_q.filter(svc_aud).order_by(Service.rating.desc(), Service.price.asc()).all()
    else:
        svc_aud_rows = svc_q.order_by(Service.rating.desc(), Service.price.asc()).all()

    city_services = [s for s in svc_aud_rows if _matches_city(s.cities, norm_city)]
    bengaluru_services = [s for s in svc_aud_rows if _matches_city(s.cities, "Bengaluru")]

    sal_q = db.query(Salon).options(selectinload(Salon.menu_services))
    sal_aud = _audience_filter(Salon, norm_aud)
    if sal_aud is not None:
        sal_q = sal_q.filter(sal_aud)
    all_salons = sal_q.order_by(Salon.rating.desc()).all()
    city_salons = [s for s in all_salons if (s.city or "").strip().lower() == norm_city.lower()]

    prod_q = db.query(Product).filter(Product.is_active == True, Product.stock > 0)
    prod_aud = _audience_filter(Product, norm_aud)
    if prod_aud is not None:
        prod_q = prod_q.filter(prod_aud)
    products = prod_q.order_by(Product.rating.desc(), Product.price.asc()).limit(16).all()

    valid_service_ids = {str(s.id) for s in svc_aud_rows}
    valid_salon_ids = {str(s.id) for s in all_salons}
    valid_salon_menu_map: Dict[str, set] = {}
    for sal in all_salons:
        valid_salon_menu_map[str(sal.id)] = {
            str(m.id) for m in (sal.menu_services or []) if getattr(m, "is_active", True)
        }
    valid_product_ids = {str(p.id) for p in products}

    lines: List[str] = [
        f"Active city: {norm_city}",
        f"Active preference: {norm_aud} (note: At-home services operate primarily in Bengaluru unless listed for active city).",
        "",
        "AT-HOME SERVICES:",
    ]
    display_services = city_services if city_services else bengaluru_services[:8]
    if not city_services and norm_city.lower() != "bengaluru":
        lines.append(f"(Note: 0 at-home services in {norm_city}; Bengaluru services shown below for reference — you may offer action location-set id='Indiranagar, Bengaluru' to switch city.)")
    for s in display_services[:14]:
        pro_note = f", specialist={s.professional_name}" if s.professional_name else ""
        lines.append(
            f"- id={s.id} | {s.name} | cat={s.category} | aud={s.audience} | ₹{int(round(s.price))} | {s.duration}{pro_note} | {s.desc}"
        )

    lines.append("")
    lines.append(f"SALONS IN {norm_city.upper()}:")
    if city_salons:
        for sal in city_salons[:8]:
            menu = [m for m in (sal.menu_services or []) if getattr(m, "is_active", True)]
            menu_str = "; ".join(
                f"{m.id}:{m.name} (₹{int(round(m.price))}, {m.duration})" for m in menu[:8]
            ) or f"categories: {sal.services_list}"
            lines.append(
                f"- salon_id={sal.id} | {sal.name} | area={sal.area} | hours={sal.hours} | from ₹{int(round(sal.price))} | menu: {menu_str}"
            )
    else:
        lines.append(f"- None listed in {norm_city}.")

    lines.append("")
    lines.append("BEAUTY STORE PRODUCTS (deliverable everywhere):")
    for p in products:
        lines.append(
            f"- product_id={p.id} | {p.brand} - {p.name} | cat={p.category} | aud={p.audience} | ₹{int(round(p.price))} | {p.description}"
        )

    if user is not None:
        bookings = (
            db.query(Booking)
            .filter(Booking.customer_id == user.id)
            .order_by(Booking.created_at.desc())
            .limit(3)
            .all()
        )
        orders = (
            db.query(Order)
            .options(selectinload(Order.items))
            .filter(Order.customer_id == user.id)
            .order_by(Order.created_at.desc())
            .limit(3)
            .all()
        )
        lines.append("")
        lines.append(f"SIGNED-IN CUSTOMER ({user.full_name}):")
        if bookings:
            for b in bookings:
                st = b.status.value if hasattr(b.status, "value") else str(b.status)
                pin = f", arrival_pin={b.arrival_otp}" if (st == "confirmed" and b.arrival_otp) else ""
                lines.append(
                    f"- booking {b.id}: {b.title} on {b.date} at {b.time} with {b.professional} (status={st}, payment={b.payment_status}, ₹{int(round(b.price))}{pin})"
                )
        else:
            lines.append("- Bookings: none yet.")
        if orders:
            for o in orders:
                st = o.status.value if hasattr(o.status, "value") else str(o.status)
                item_names = ", ".join(i.name for i in (o.items or [])[:3]) or "Beauty items"
                lines.append(
                    f"- order {o.id}: {item_names} on {o.date} (status={st}, payment={o.payment_status}, ₹{int(round(o.total))})"
                )
        else:
            lines.append("- Orders: none yet.")

    validators = {
        "valid_service_ids": valid_service_ids,
        "valid_salon_ids": valid_salon_ids,
        "valid_salon_menu_map": valid_salon_menu_map,
        "valid_product_ids": valid_product_ids,
        "is_signed_in": user is not None,
    }
    return "\n".join(lines), validators


def validate_concierge_actions(
    raw_actions: Any,
    validators: Dict[str, Any],
    default_wa_url: str,
) -> List[Dict[str, Optional[str]]]:
    if not isinstance(raw_actions, list):
        return []

    valid_services = validators.get("valid_service_ids", set())
    valid_salons = validators.get("valid_salon_ids", set())
    salon_menus = validators.get("valid_salon_menu_map", {})
    valid_products = validators.get("valid_product_ids", set())
    is_signed_in = bool(validators.get("is_signed_in"))

    cleaned: List[Dict[str, Optional[str]]] = []
    for item in raw_actions:
        if not isinstance(item, dict):
            continue
        label = str(item.get("label") or "").strip()
        if not label:
            continue
        url = str(item.get("url") or "").strip() or None
        act = str(item.get("action") or "").strip() or None
        aid = str(item.get("id") or "").strip() or None
        service_id = str(item.get("service_id") or "").strip() or None
        target = str(item.get("target") or "").strip() or None
        prompt = str(item.get("prompt") or "").strip() or None

        if url:
            if url.startswith("https://wa.me/"):
                cleaned.append({"label": label[:80], "url": url})
            else:
                cleaned.append({"label": label[:80], "url": default_wa_url})
        elif act == "book-home":
            if aid and aid in valid_services:
                cleaned.append({"label": label[:80], "action": "book-home", "id": aid})
        elif act == "service-detail":
            if aid and aid in valid_services:
                cleaned.append({"label": label[:80], "action": "service-detail", "id": aid})
        elif act == "book-salon":
            if aid and aid in valid_salons:
                allowed_menu = salon_menus.get(aid, set())
                safe_menu_id = service_id if (service_id and service_id in allowed_menu) else None
                cleaned.append({
                    "label": label[:80],
                    "action": "book-salon",
                    "id": aid,
                    "service_id": safe_menu_id,
                })
        elif act == "salon-detail":
            if aid and aid in valid_salons:
                cleaned.append({"label": label[:80], "action": "salon-detail", "id": aid})
        elif act in ("product-detail", "add-cart"):
            if aid and aid in valid_products:
                cleaned.append({"label": label[:80], "action": act, "id": aid})
        elif act in ("account-bookings", "orders"):
            if is_signed_in:
                cleaned.append({"label": label[:80], "action": act})
        elif act in ALLOWED_NAV_ACTIONS:
            cleaned.append({
                "label": label[:80],
                "action": act,
                "id": aid,
                "target": target,
                "prompt": prompt,
            })

        if len(cleaned) >= 4:
            break

    return cleaned


def generate_gemini_concierge_reply(
    db: Session,
    message: str,
    city: str,
    audience: Optional[str],
    experience: Optional[str],
    history: List[Any],
    user: Optional[User],
    default_wa_url: str,
) -> Optional[Dict[str, Any]]:
    api_key = str(getattr(settings, "GEMINI_API_KEY", "") or "").strip()
    if not api_key:
        return None

    context_text, validators = build_catalog_context(db, city, audience, user)
    primary = (getattr(settings, "GEMINI_MODEL", "gemini-3.1-flash-lite") or "gemini-3.1-flash-lite").strip()
    candidate_models = [primary] + [m for m in FALLBACK_GEMINI_MODELS if m != primary]

    system_prompt = (
        "You are GlamGo AI Beauty Concierge — warm, concise, luxurious, and practical. "
        f"Current portal tab: {experience or 'home'}.\n"
        "RULES:\n"
        "1. ONLY recommend services, salon menu items, salons, and products explicitly listed in the LIVE CATALOG below. NEVER invent names, prices, durations, or IDs.\n"
        "2. Keep replies crisp (2-4 short sentences, use **bold** for product/service names and ₹ prices).\n"
        "3. Return 1 to 3 actionable buttons in `actions` using ONLY valid IDs from the catalog:\n"
        "   - Book at-home treatment: {\"label\": \"Book <Name> (₹<Price>)\", \"action\": \"book-home\", \"id\": \"<id>\"}\n"
        "   - Book custom salon service: {\"label\": \"Book <MenuName> at <Salon>\", \"action\": \"book-salon\", \"id\": \"<salon_id>\", \"service_id\": \"<menu_service_id>\"}\n"
        "   - View salon: {\"label\": \"View <Salon>\", \"action\": \"salon-detail\", \"id\": \"<salon_id>\"}\n"
        "   - View/add product: {\"label\": \"View <Product>\", \"action\": \"product-detail\", \"id\": \"<product_id>\"} or {\"label\": \"Add <Product>\", \"action\": \"add-cart\", \"id\": \"<product_id>\"}\n"
        "   - Signed-in account: {\"label\": \"View my bookings\", \"action\": \"account-bookings\"} or {\"label\": \"View my orders\", \"action\": \"orders\"}\n"
        "   - Switch to Bengaluru: {\"label\": \"Switch to Bengaluru\", \"action\": \"location-set\", \"id\": \"Indiranagar, Bengaluru\"}\n"
        "   - Browse category: {\"label\": \"View <Category>\", \"action\": \"home-category\", \"id\": \"Skin\"}\n"
        f"   - WhatsApp handoff: {{\"label\": \"Chat on WhatsApp\", \"url\": \"{default_wa_url}\"}}\n\n"
        "LIVE CATALOG & ACCOUNT CONTEXT:\n"
        f"{context_text}"
    )

    contents: List[Dict[str, Any]] = []
    for turn in (history or [])[-8:]:
        t_role = "model" if getattr(turn, "role", "user") == "ai" else "user"
        t_text = str(getattr(turn, "text", "") or "").strip()
        if t_text:
            contents.append({"role": t_role, "parts": [{"text": t_text}]})
    contents.append({"role": "user", "parts": [{"text": message}]})

    body = {
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "contents": contents,
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 1024,
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "reply": {"type": "STRING"},
                    "actions": {
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "label": {"type": "STRING"},
                                "action": {"type": "STRING"},
                                "id": {"type": "STRING"},
                                "service_id": {"type": "STRING"},
                                "target": {"type": "STRING"},
                                "prompt": {"type": "STRING"},
                                "url": {"type": "STRING"},
                            },
                            "required": ["label"],
                        },
                    },
                },
                "required": ["reply", "actions"],
            },
        },
    }

    payload_bytes = json.dumps(body).encode("utf-8")
    for candidate in candidate_models:
        url = resolve_gemini_endpoint(api_key, candidate)
        req = urllib.request.Request(
            url,
            data=payload_bytes,
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": api_key,
                "User-Agent": "GlamGo-Backend/1.0",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                raw = json.loads(resp.read().decode("utf-8"))
            text_out = raw["candidates"][0]["content"]["parts"][0]["text"]
            parsed = json.loads(text_out)
            reply = str(parsed.get("reply") or "").strip()
            if not reply:
                return None
            actions = validate_concierge_actions(parsed.get("actions"), validators, default_wa_url)
            return {"reply": reply, "actions": actions}
        except urllib.error.HTTPError as e:
            err_body = ""
            try:
                err_body = e.read().decode("utf-8", errors="ignore")[:300]
            except Exception:
                pass
            logger.warning("Gemini Concierge (%s) HTTP %s: %s", candidate, e.code, err_body)
            if e.code in RETRYABLE_GEMINI_HTTP_CODES:
                continue
            return None
        except Exception as e:
            logger.warning("Gemini Concierge (%s) error: %s", candidate, e)
            return None

    return None
