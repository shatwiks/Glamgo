from datetime import datetime, timezone, timedelta
from decimal import Decimal, ROUND_HALF_UP
import hashlib
import json
import secrets
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.app.models.user import User, UserRole, OrderStatus, BookingStatus, Notification
from backend.app.models.catalog import Product, ProductVariant
from backend.app.models.order import Order, OrderItem, Coupon
from backend.app.models.payment import PaymentTransaction
from backend.app.models.commerce import (
    SellerListing, InventoryReservation, ReservationStatus, SubOrder, SubOrderStatus,
    Shipment, ShipmentStatus, ReturnRequest, ReturnStatus, InventoryAuditLog, StockAction,
    SellerEscrowRecord, EscrowStatus
)
from backend.app.schemas.commerce import (
    SellerListingCreate, SellerListingUpdate, ReservationItem,
    MultiVendorCheckoutRequest, ShipmentCreate, ReturnRequestCreate, ReturnDecisionRequest
)
from backend.app.services.cache_service import cache_service

RESERVATION_HOLD_MINUTES = 15
RETURN_WINDOW_DAYS = 7
ESCROW_MATURITY_DAYS = 7
FREE_SHIPPING_THRESHOLD_PAISE = 150000  # ₹1,500
STANDARD_SELLER_SHIPPING_PAISE = 10000  # ₹100 per seller package


def to_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def to_paise(amount: Any) -> int:
    """Convert a rupee amount into integer minor units (paise) with half-up rounding."""
    if amount is None:
        return 0
    dec = Decimal(str(amount))
    return int((dec * Decimal("100")).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def to_rupees(paise: int) -> float:
    """Convert integer paise to decimal rupees rounded to 2 decimal places."""
    return float((Decimal(int(paise)) / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def allocate_proportionally_paise(total_to_allocate_paise: int, weights_paise: List[int]) -> List[int]:
    """
    Distribute an integer paise total across weights using largest-remainder apportionment.
    Guarantees sum(result) == total_to_allocate_paise with zero rounding drift.
    """
    if not weights_paise or total_to_allocate_paise <= 0:
        return [0 for _ in weights_paise]

    total_weight = sum(max(0, w) for w in weights_paise)
    if total_weight <= 0:
        return [0 for _ in weights_paise]

    shares: List[int] = []
    remainders: List[Tuple[int, int]] = []
    for idx, weight in enumerate(weights_paise):
        w = max(0, weight)
        numerator = w * total_to_allocate_paise
        share = numerator // total_weight
        rem = numerator % total_weight
        shares.append(share)
        remainders.append((rem, idx))

    deficit = total_to_allocate_paise - sum(shares)
    if deficit > 0:
        # Sort descending by remainder, ascending by index for deterministic tie-breaking
        remainders.sort(key=lambda pair: (-pair[0], pair[1]))
        for i in range(deficit):
            _, target_idx = remainders[i]
            shares[target_idx] += 1

    return shares


def is_cod_payment_method(method: Optional[str]) -> bool:
    return (method or "").strip().upper() in ("COD", "CASH ON DELIVERY", "CASH")


class CommerceService:
    # -------------------------------------------------------------------------
    # Canonical Inventory Synchronization (SellerListing as Authoritative Stock)
    # -------------------------------------------------------------------------
    @staticmethod
    def _resolve_default_seller_id(db: Session, product: Product) -> int:
        if product.seller_id:
            return product.seller_id
        seller = db.query(User).filter(User.role == UserRole.SELLER).order_by(User.id.asc()).first()
        if seller:
            return seller.id
        admin = db.query(User).filter(User.role == UserRole.ADMIN).order_by(User.id.asc()).first()
        if admin:
            return admin.id
        any_user = db.query(User).order_by(User.id.asc()).first()
        if any_user:
            return any_user.id
        raise HTTPException(status_code=500, detail="No seller account available to anchor product inventory.")

    @staticmethod
    def ensure_product_listings(db: Session, product: Product) -> List[SellerListing]:
        """
        Guarantee every active product (and each of its ProductVariant rows) has a canonical
        SellerListing row so SellerListing.stock acts as the single transactional inventory ledger.
        """
        seller_id = CommerceService._resolve_default_seller_id(db, product)
        variants = list(product.variants or [])

        existing_listings = db.query(SellerListing).filter(
            SellerListing.product_id == product.id
        ).order_by(SellerListing.id.asc()).all()

        created_any = False
        if variants:
            # Determine initial per-variant fallback if existing product had stock
            total_var_stock = sum(max(0, int(v.stock or 0)) for v in variants)
            for idx, v in enumerate(variants, start=1):
                has_variant_listing = any(
                    l.variant_name == v.name for l in existing_listings
                )
                if not has_variant_listing:
                    init_stock = max(0, int(v.stock if v.stock is not None else (product.stock if len(variants) == 1 else 50)))
                    if total_var_stock == 0 and (product.stock or 0) > 0 and idx == 1:
                        init_stock = int(product.stock)
                    sku = f"GG-{product.id.upper()}-V{idx}"
                    # Guarantee uniqueness for (seller_id, sku)
                    suffix = 1
                    candidate_sku = sku
                    while db.query(SellerListing).filter(
                        SellerListing.seller_id == seller_id,
                        SellerListing.sku == candidate_sku,
                    ).first():
                        suffix += 1
                        candidate_sku = f"{sku}-{suffix}"

                    listing = SellerListing(
                        product_id=product.id,
                        seller_id=seller_id,
                        variant_name=v.name,
                        sku=candidate_sku,
                        price=float(product.price),
                        compare_at_price=float(product.old or 0.0),
                        stock=init_stock,
                        is_active=bool(product.is_active),
                        condition="NEW",
                        shipping_lead_time_days=2,
                    )
                    db.add(listing)
                    db.flush()
                    existing_listings.append(listing)
                    created_any = True
        else:
            if not existing_listings:
                base_sku = f"GG-{product.id.upper()}-STD"
                suffix = 1
                candidate_sku = base_sku
                while db.query(SellerListing).filter(
                    SellerListing.seller_id == seller_id,
                    SellerListing.sku == candidate_sku,
                ).first():
                    suffix += 1
                    candidate_sku = f"{base_sku}-{suffix}"

                listing = SellerListing(
                    product_id=product.id,
                    seller_id=seller_id,
                    variant_name="",
                    sku=candidate_sku,
                    price=float(product.price),
                    compare_at_price=float(product.old or 0.0),
                    stock=max(0, int(product.stock if product.stock is not None else 100)),
                    is_active=bool(product.is_active),
                    condition="NEW",
                    shipping_lead_time_days=2,
                )
                db.add(listing)
                db.flush()
                existing_listings.append(listing)
                created_any = True

        if created_any:
            CommerceService.sync_product_stock(db, product.id)

        return existing_listings

    @staticmethod
    def sync_product_stock(db: Session, product_id: str) -> int:
        """
        Synchronize derived Product.stock and ProductVariant.stock read models from active
        SellerListing.stock rows so catalog projections never diverge from transactional inventory.
        """
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            return 0

        active_listings = db.query(SellerListing).filter(
            SellerListing.product_id == product_id,
            SellerListing.is_active == True,
        ).all()

        total_stock = sum(max(0, int(l.stock or 0)) for l in active_listings)
        product.stock = total_stock

        variants = list(product.variants or [])
        if variants:
            # Map variant stock by exact variant_name when present
            variant_sums: Dict[str, int] = {v.name: 0 for v in variants}
            unscoped_stock = 0
            has_variant_specific = False
            for l in active_listings:
                vname = (l.variant_name or "").strip()
                if vname and vname in variant_sums:
                    variant_sums[vname] += max(0, int(l.stock or 0))
                    has_variant_specific = True
                elif not vname:
                    unscoped_stock += max(0, int(l.stock or 0))

            for v in variants:
                if has_variant_specific:
                    v.stock = variant_sums[v.name] + (unscoped_stock if v == variants[0] else 0)
                else:
                    # Legacy product-level listing without variant labels
                    v.stock = unscoped_stock if len(variants) == 1 else max(0, int(v.stock or 0))

        return total_stock

    # -------------------------------------------------------------------------
    # Milestone A: Master Products & Seller Offers
    # -------------------------------------------------------------------------
    @staticmethod
    def get_product_offers(db: Session, product_id: str) -> Dict[str, Any]:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        listings = (
            db.query(SellerListing)
            .filter(SellerListing.product_id == product_id, SellerListing.is_active == True)
            .order_by(SellerListing.price.asc(), SellerListing.id.asc())
            .all()
        )

        offers = []
        for l in listings:
            seller = db.query(User).filter(User.id == l.seller_id).first()
            seller_name = seller.full_name if seller else f"Seller #{l.seller_id}"
            offers.append({
                "id": l.id,
                "product_id": l.product_id,
                "seller_id": l.seller_id,
                "seller_name": seller_name,
                "variant_name": l.variant_name or "",
                "sku": l.sku,
                "price": l.price,
                "compare_at_price": l.compare_at_price,
                "stock": l.stock,
                "is_active": l.is_active,
                "condition": l.condition,
                "shipping_lead_time_days": l.shipping_lead_time_days,
                "created_at": l.created_at,
                "updated_at": l.updated_at
            })

        lowest_price = offers[0]["price"] if offers else None
        return {
            "product_id": product.id,
            "product_name": product.name,
            "offers_count": len(offers),
            "lowest_price": lowest_price,
            "offers": offers
        }

    @staticmethod
    def create_seller_listing(db: Session, seller_id: int, data: SellerListingCreate) -> SellerListing:
        product = db.query(Product).filter(Product.id == data.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Master product not found")

        variant_clean = (data.variant_name or "").strip()
        if variant_clean and product.variants:
            valid_variants = {v.name for v in product.variants}
            if variant_clean not in valid_variants:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Variant '{variant_clean}' does not exist on product '{product.name}'."
                )

        existing_sku = db.query(SellerListing).filter(
            SellerListing.seller_id == seller_id,
            SellerListing.sku == data.sku
        ).first()
        if existing_sku:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"SKU '{data.sku}' already exists for this seller."
            )

        listing = SellerListing(
            product_id=data.product_id,
            seller_id=seller_id,
            variant_name=variant_clean,
            sku=data.sku,
            price=data.price,
            compare_at_price=data.compare_at_price or 0.0,
            stock=data.stock,
            is_active=data.is_active,
            condition=data.condition,
            shipping_lead_time_days=data.shipping_lead_time_days
        )
        db.add(listing)
        db.flush()

        if data.stock > 0:
            audit = InventoryAuditLog(
                listing_id=listing.id,
                seller_id=seller_id,
                action=StockAction.MANUAL_ADJUSTMENT,
                quantity_delta=data.stock,
                balance_before=0,
                balance_after=data.stock,
                reference_type="MANUAL",
                reference_id=f"INIT-{listing.id}"
            )
            db.add(audit)

        CommerceService.sync_product_stock(db, product.id)
        db.commit()
        db.refresh(listing)
        cache_service.invalidate_catalog()
        return listing

    @staticmethod
    def update_seller_listing(db: Session, seller_id: int, listing_id: int, data: SellerListingUpdate) -> SellerListing:
        listing = db.query(SellerListing).filter(
            SellerListing.id == listing_id,
            SellerListing.seller_id == seller_id
        ).with_for_update().first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found or access denied")

        if data.sku and data.sku != listing.sku:
            existing_sku = db.query(SellerListing).filter(
                SellerListing.seller_id == seller_id,
                SellerListing.sku == data.sku,
                SellerListing.id != listing_id
            ).first()
            if existing_sku:
                raise HTTPException(status_code=409, detail=f"SKU '{data.sku}' already in use.")
            listing.sku = data.sku

        if data.variant_name is not None:
            v_clean = data.variant_name.strip()
            if v_clean and listing.product and listing.product.variants:
                valid = {v.name for v in listing.product.variants}
                if v_clean not in valid:
                    raise HTTPException(status_code=400, detail=f"Invalid variant '{v_clean}' for product.")
            listing.variant_name = v_clean

        if data.price is not None:
            listing.price = data.price
        if data.compare_at_price is not None:
            listing.compare_at_price = data.compare_at_price
        if data.is_active is not None:
            listing.is_active = data.is_active
        if data.condition is not None:
            listing.condition = data.condition
        if data.shipping_lead_time_days is not None:
            listing.shipping_lead_time_days = data.shipping_lead_time_days

        if data.stock is not None and data.stock != listing.stock:
            delta = data.stock - listing.stock
            audit = InventoryAuditLog(
                listing_id=listing.id,
                seller_id=seller_id,
                action=StockAction.MANUAL_ADJUSTMENT,
                quantity_delta=delta,
                balance_before=listing.stock,
                balance_after=data.stock,
                reference_type="MANUAL",
                reference_id=f"UPDATE-{listing.id}"
            )
            listing.stock = data.stock
            db.add(audit)

        listing.updated_at = datetime.now(timezone.utc)
        CommerceService.sync_product_stock(db, listing.product_id)
        db.commit()
        db.refresh(listing)
        cache_service.invalidate_catalog()
        return listing

    # -------------------------------------------------------------------------
    # Milestone B & C: Reservation & Split Checkout
    # -------------------------------------------------------------------------
    @staticmethod
    def _resolve_reservation_line(
        db: Session,
        item: ReservationItem,
    ) -> Tuple[int, str, str]:
        """Resolve a reservation request item into (listing_id, resolved_variant_name, product_id)."""
        if item.qty is None or item.qty <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be greater than zero.")

        if item.listing_id:
            listing = db.query(SellerListing).filter(SellerListing.id == item.listing_id).first()
            if not listing:
                raise HTTPException(status_code=404, detail=f"Listing ID {item.listing_id} not found or inactive")
            product = db.query(Product).filter(Product.id == listing.product_id).first()
            if not product or not product.is_active:
                raise HTTPException(status_code=404, detail=f"Listing ID {item.listing_id} product is inactive")

            req_var = (item.variant_name or "").strip()
            listing_var = (listing.variant_name or "").strip()
            valid_vars = [v.name for v in (product.variants or [])]

            if listing_var:
                if req_var and req_var != listing_var:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Selected variant '{req_var}' does not match listing variant '{listing_var}'."
                    )
                resolved_var = listing_var
            elif req_var:
                if valid_vars and req_var not in valid_vars:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Variant '{req_var}' is not valid for '{product.name}'."
                    )
                resolved_var = req_var
            else:
                resolved_var = valid_vars[0] if valid_vars else ""

            return listing.id, resolved_var, product.id

        if item.product_id:
            product = db.query(Product).filter(
                Product.id == item.product_id,
                Product.is_active == True,
            ).first()
            if not product:
                raise HTTPException(status_code=404, detail=f"Product '{item.product_id}' not found or inactive.")

            CommerceService.ensure_product_listings(db, product)
            valid_vars = [v.name for v in (product.variants or [])]
            req_var = (item.variant_name or "").strip()

            if valid_vars:
                if req_var:
                    if req_var not in valid_vars:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Variant '{req_var}' is not available for '{product.name}'."
                        )
                    resolved_var = req_var
                else:
                    resolved_var = valid_vars[0]
            else:
                if req_var:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Variant '{req_var}' is not available for '{product.name}'."
                    )
                resolved_var = ""

            # Prefer matching variant-specific listing with best stock/price
            candidates = (
                db.query(SellerListing)
                .filter(
                    SellerListing.product_id == product.id,
                    SellerListing.is_active == True,
                    SellerListing.variant_name == resolved_var,
                )
                .order_by(SellerListing.price.asc(), SellerListing.id.asc())
                .all()
            )
            if not candidates:
                candidates = (
                    db.query(SellerListing)
                    .filter(
                        SellerListing.product_id == product.id,
                        SellerListing.is_active == True,
                        SellerListing.variant_name == "",
                    )
                    .order_by(SellerListing.price.asc(), SellerListing.id.asc())
                    .all()
                )
            if not candidates:
                raise HTTPException(status_code=404, detail=f"No active seller listing for '{product.name}'.")

            chosen = next((c for c in candidates if c.stock >= item.qty), candidates[0])
            return chosen.id, resolved_var, product.id

        raise HTTPException(status_code=400, detail="Each reservation item must specify listing_id or product_id.")

    @staticmethod
    def reserve_inventory(db: Session, user_id: int, items: List[ReservationItem]) -> Dict[str, Any]:
        if not items:
            raise HTTPException(status_code=400, detail="Cannot reserve empty cart")

        # 1. Opportunistically expire overdue reservations so abandoned holds don't block buyers
        now_utc = datetime.now(timezone.utc)
        overdue_exists = db.query(InventoryReservation.id).filter(
            InventoryReservation.status == ReservationStatus.PENDING,
            InventoryReservation.expires_at < now_utc,
        ).first()
        if overdue_exists:
            CommerceService.expire_pending_reservations(db)

        # 2. Resolve items and aggregate duplicate (listing_id, variant_name) lines BEFORE stock check
        aggregated_lines: Dict[Tuple[int, str], Dict[str, Any]] = {}
        qty_by_listing: Dict[int, int] = {}
        affected_products: set[str] = set()

        for item in items:
            lid, resolved_var, pid = CommerceService._resolve_reservation_line(db, item)
            key = (lid, resolved_var)
            if key in aggregated_lines:
                aggregated_lines[key]["qty"] += item.qty
            else:
                aggregated_lines[key] = {
                    "listing_id": lid,
                    "variant_name": resolved_var,
                    "product_id": pid,
                    "qty": item.qty,
                }
            qty_by_listing[lid] = qty_by_listing.get(lid, 0) + item.qty
            affected_products.add(pid)

        # 3. Acquire row locks on distinct SellerListings in ascending listing_id order
        sorted_lids = sorted(qty_by_listing.keys())
        listings_map: Dict[int, SellerListing] = {}
        for lid in sorted_lids:
            listing = db.query(SellerListing).filter(SellerListing.id == lid).with_for_update().first()
            if not listing or not listing.is_active:
                raise HTTPException(status_code=404, detail=f"Listing ID {lid} not found or inactive")
            listings_map[lid] = listing

        # 4. Validate combined requested quantity per listing against available stock
        for lid in sorted_lids:
            listing = listings_map[lid]
            req_qty = qty_by_listing[lid]
            if listing.stock < req_qty:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Insufficient stock for listing_id {listing.id}: requested {req_qty}, available {listing.stock}"
                )

        # 5. Create reservation records, deduct stock deterministically, and write audit trail
        token = f"res_{secrets.token_hex(16)}"
        expires_at = now_utc + timedelta(minutes=RESERVATION_HOLD_MINUTES)

        sorted_line_keys = sorted(aggregated_lines.keys(), key=lambda k: (k[0], k[1]))
        sellers_group: Dict[int, Dict[str, Any]] = {}
        total_subtotal_paise = 0

        for line_key in sorted_line_keys:
            line = aggregated_lines[line_key]
            lid = line["listing_id"]
            var_name = line["variant_name"]
            line_qty = line["qty"]
            listing = listings_map[lid]

            before_stock = listing.stock
            listing.stock -= line_qty
            after_stock = listing.stock

            res_record = InventoryReservation(
                reservation_token=token,
                listing_id=listing.id,
                user_id=user_id,
                variant_name=var_name,
                quoted_unit_price=float(listing.price),
                qty=line_qty,
                status=ReservationStatus.PENDING,
                expires_at=expires_at
            )
            db.add(res_record)

            audit = InventoryAuditLog(
                listing_id=listing.id,
                seller_id=listing.seller_id,
                action=StockAction.RESERVATION_HOLD,
                quantity_delta=-line_qty,
                balance_before=before_stock,
                balance_after=after_stock,
                reference_type="RESERVATION",
                reference_id=token
            )
            db.add(audit)

            seller_id = listing.seller_id
            product = db.query(Product).filter(Product.id == listing.product_id).first()
            prod_name = product.name if product else "Luxury Cosmetic"

            if seller_id not in sellers_group:
                seller = db.query(User).filter(User.id == seller_id).first()
                seller_name = seller.full_name if seller else f"Seller #{seller_id}"
                sellers_group[seller_id] = {
                    "seller_id": seller_id,
                    "seller_name": seller_name,
                    "subtotal_paise": 0,
                    "items": []
                }

            unit_paise = to_paise(listing.price)
            line_paise = unit_paise * line_qty
            sellers_group[seller_id]["subtotal_paise"] += line_paise
            total_subtotal_paise += line_paise

            sellers_group[seller_id]["items"].append({
                "listing_id": listing.id,
                "product_id": listing.product_id,
                "product_name": prod_name,
                "variant_name": var_name,
                "sku": listing.sku,
                "qty": line_qty,
                "unit_price": to_rupees(unit_paise),
                "line_total": to_rupees(line_paise)
            })

        total_shipping_paise = 0
        formatted_sellers = []
        for s_data in sellers_group.values():
            s_sub_paise = s_data["subtotal_paise"]
            ship_paise = 0 if s_sub_paise >= FREE_SHIPPING_THRESHOLD_PAISE else STANDARD_SELLER_SHIPPING_PAISE
            total_shipping_paise += ship_paise
            formatted_sellers.append({
                "seller_id": s_data["seller_id"],
                "seller_name": s_data["seller_name"],
                "subtotal": to_rupees(s_sub_paise),
                "estimated_shipping_fee": to_rupees(ship_paise),
                "items": s_data["items"],
            })

        grand_total_paise = total_subtotal_paise + total_shipping_paise

        for pid in sorted(affected_products):
            CommerceService.sync_product_stock(db, pid)

        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            if idem_key:
                existing_order = db.query(Order).filter(
                    Order.customer_id == customer_id,
                    Order.idempotency_key == idem_key,
                ).first()
                if existing_order:
                    if existing_order.request_fingerprint and existing_order.request_fingerprint != fingerprint:
                        raise HTTPException(
                            status_code=status.HTTP_409_CONFLICT,
                            detail="Idempotency key has already been used for a different checkout request."
                        )
                    return CommerceService._format_order_dict(existing_order)
            raise
        cache_service.invalidate_catalog()

        return {
            "reservation_token": token,
            "expires_at": expires_at,
            "expires_in_seconds": RESERVATION_HOLD_MINUTES * 60,
            "sellers": formatted_sellers,
            "total_subtotal": to_rupees(total_subtotal_paise),
            "total_shipping": to_rupees(total_shipping_paise),
            "grand_total": to_rupees(grand_total_paise)
        }

    @staticmethod
    def _release_reservation_rows(db: Session, reservations: List[InventoryReservation]) -> int:
        """Restock locked PENDING reservation rows in deterministic listing_id order."""
        if not reservations:
            return 0
        lids = sorted({r.listing_id for r in reservations})
        lmap: Dict[int, SellerListing] = {}
        affected_pids: set[str] = set()
        for lid in lids:
            lst = db.query(SellerListing).filter(SellerListing.id == lid).with_for_update().first()
            if lst:
                lmap[lid] = lst
                affected_pids.add(lst.product_id)

        released = 0
        for r in reservations:
            if r.status != ReservationStatus.PENDING:
                continue
            lst = lmap.get(r.listing_id)
            if lst:
                before_s = lst.stock
                lst.stock += r.qty
                db.add(InventoryAuditLog(
                    listing_id=lst.id,
                    seller_id=lst.seller_id,
                    action=StockAction.RESERVATION_RELEASE,
                    quantity_delta=r.qty,
                    balance_before=before_s,
                    balance_after=lst.stock,
                    reference_type="RESERVATION",
                    reference_id=r.reservation_token,
                ))
            r.status = ReservationStatus.EXPIRED
            released += 1

        for pid in sorted(affected_pids):
            CommerceService.sync_product_stock(db, pid)
        return released

    @staticmethod
    def release_reservation_hold(db: Session, reservation_token: str) -> int:
        """Atomically release a pending reservation hold (used on checkout rollback)."""
        if not reservation_token:
            return 0
        reservations = (
            db.query(InventoryReservation)
            .filter(
                InventoryReservation.reservation_token == reservation_token,
                InventoryReservation.status == ReservationStatus.PENDING,
            )
            .order_by(InventoryReservation.id.asc())
            .with_for_update()
            .all()
        )
        released = CommerceService._release_reservation_rows(db, reservations)
        if released:
            db.commit()
            cache_service.invalidate_catalog()
        return released

    @staticmethod
    def _format_order_dict(order: Order) -> Dict[str, Any]:
        suborders_summary = []
        for s in (order.suborders or []):
            seller_name = s.seller.full_name if getattr(s, "seller", None) else f"Seller #{s.seller_id}"
            suborders_summary.append({
                "suborder_id": s.id,
                "seller_id": s.seller_id,
                "seller_name": seller_name,
                "subtotal": s.subtotal,
                "discount": s.discount,
                "shipping_fee": s.shipping_fee,
                "total": s.total,
                "status": s.status.value,
                "items_count": sum(i.qty for i in (s.items or [])),
            })

        return {
            "id": order.id,
            "order_id": order.id,
            "date": order.date,
            "status": order.status.value,
            "payment_method": order.payment_method,
            "payment_status": order.payment_status,
            "subtotal": order.subtotal,
            "discount": order.discount,
            "shipping": order.shipping_fee,
            "shipping_fee": order.shipping_fee,
            "total": order.total,
            "reservation_token": order.reservation_token,
            "address": {"label": order.address_label, "text": order.address_text},
            "items": [
                {
                    "id": str(oi.product_id or ""),
                    "name": oi.name,
                    "variant_name": oi.variant_name or "",
                    "sku": oi.sku or "",
                    "seller_id": oi.seller_id,
                    "seller_name": oi.seller_name or "",
                    "qty": oi.qty,
                    "price": oi.price,
                    "allocated_discount": float(oi.allocated_discount or 0.0),
                }
                for oi in (order.items or [])
            ],
            "suborders": suborders_summary,
        }

    @staticmethod
    def checkout_multi_vendor(
        db: Session,
        customer_id: int,
        data: MultiVendorCheckoutRequest,
        request_fingerprint_override: Optional[str] = None,
    ) -> Dict[str, Any]:
        idem_key = data.idempotency_key.strip() if data.idempotency_key and data.idempotency_key.strip() else None
        norm_coupon = (data.coupon_code or "").strip().upper()
        norm_method = (data.payment_method or "Razorpay").strip()
        fingerprint = request_fingerprint_override or hashlib.sha256(
            json.dumps({
                "reservation_token": data.reservation_token,
                "address_label": (data.address_label or "Home").strip(),
                "address_text": data.address_text.strip(),
                "coupon_code": norm_coupon,
                "payment_method": norm_method.upper(),
            }, sort_keys=True).encode("utf-8")
        ).hexdigest()

        if idem_key:
            existing_order = db.query(Order).filter(
                Order.customer_id == customer_id,
                Order.idempotency_key == idem_key,
            ).first()
            if existing_order:
                if existing_order.request_fingerprint and existing_order.request_fingerprint != fingerprint:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Idempotency key has already been used for a different checkout request."
                    )
                return CommerceService._format_order_dict(existing_order)

        # Lock reservations for this token in ascending ID order so concurrent checkouts serialize
        reservations = (
            db.query(InventoryReservation)
            .filter(InventoryReservation.reservation_token == data.reservation_token)
            .order_by(InventoryReservation.id.asc())
            .with_for_update()
            .all()
        )

        if not reservations:
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail=f"Reservation '{data.reservation_token}' expired or not found. Please re-add items to cart."
            )

        if any(r.user_id != customer_id for r in reservations):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to checkout another customer's reservation."
            )

        if all(r.status == ReservationStatus.CONFIRMED for r in reservations):
            prior = db.query(Order).filter(Order.reservation_token == data.reservation_token).first()
            if prior and idem_key and prior.idempotency_key == idem_key:
                return CommerceService._format_order_dict(prior)
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This inventory reservation has already been checked out."
            )

        if any(r.status != ReservationStatus.PENDING for r in reservations):
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail=f"Reservation '{data.reservation_token}' is no longer pending (status: {reservations[0].status.value})."
            )

        now_utc = datetime.now(timezone.utc)
        exp_time = to_utc(reservations[0].expires_at)
        if exp_time and exp_time < now_utc:
            # Release these overdue pending reservations safely before raising 410 Gone
            CommerceService._release_reservation_rows(db, reservations)
            db.commit()
            cache_service.invalidate_catalog()

            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail=f"Reservation '{data.reservation_token}' has expired. Please re-reserve."
            )

        # Lock all referenced listings in ascending listing_id order
        listing_ids = sorted({r.listing_id for r in reservations})
        listings_map: Dict[int, SellerListing] = {}
        for lid in listing_ids:
            lst = db.query(SellerListing).filter(SellerListing.id == lid).with_for_update().first()
            if not lst:
                raise HTTPException(status_code=404, detail=f"Listing ID {lid} no longer exists.")
            listings_map[lid] = lst

        # Mark reservations CONFIRMED atomically inside this transaction
        for r in reservations:
            r.status = ReservationStatus.CONFIRMED

        # Group reservations by seller in deterministic order
        seller_reservations: Dict[int, List[InventoryReservation]] = {}
        for r in reservations:
            listing = listings_map[r.listing_id]
            seller_reservations.setdefault(listing.seller_id, []).append(r)

        ordered_seller_ids = sorted(seller_reservations.keys())
        seller_subtotals_paise: Dict[int, int] = {}
        seller_shipping_paise: Dict[int, int] = {}
        gross_subtotal_paise = 0

        for s_id in ordered_seller_ids:
            sub_paise = 0
            for r in seller_reservations[s_id]:
                listing = listings_map[r.listing_id]
                unit_price = r.quoted_unit_price if r.quoted_unit_price is not None else listing.price
                sub_paise += to_paise(unit_price) * r.qty
            seller_subtotals_paise[s_id] = sub_paise
            gross_subtotal_paise += sub_paise
            seller_shipping_paise[s_id] = (
                0 if sub_paise >= FREE_SHIPPING_THRESHOLD_PAISE else STANDARD_SELLER_SHIPPING_PAISE
            )

        total_shipping_paise = sum(seller_shipping_paise.values())

        # Validate coupon & compute exact server-side discount in integer paise
        total_discount_paise = 0
        applied_coupon_code: Optional[str] = None
        if norm_coupon:
            coupon = db.query(Coupon).filter(
                Coupon.code == norm_coupon,
                Coupon.is_active == True,
            ).first()
            if not coupon:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Coupon code '{data.coupon_code}' is invalid or expired."
                )
            raw_disc_paise = int(
                (Decimal(gross_subtotal_paise) * Decimal(str(coupon.discount_percent)) / Decimal("100"))
                .quantize(Decimal("1"), rounding=ROUND_HALF_UP)
            )
            max_disc_paise = to_paise(coupon.max_discount)
            total_discount_paise = min(raw_disc_paise, max_disc_paise, gross_subtotal_paise)
            applied_coupon_code = coupon.code

        parent_total_paise = max(0, gross_subtotal_paise - total_discount_paise + total_shipping_paise)

        # Remainder-safe proportional discount apportionment across seller suborders
        seller_weights = [seller_subtotals_paise[s_id] for s_id in ordered_seller_ids]
        seller_discounts_paise = allocate_proportionally_paise(total_discount_paise, seller_weights)

        is_cod = is_cod_payment_method(norm_method)
        initial_payment_status = "cod_pending" if is_cod else "pending"
        payment_expires_at = None if is_cod else (now_utc + timedelta(minutes=RESERVATION_HOLD_MINUTES))

        order_id = f"GG{secrets.token_hex(4).upper()}"
        order_date = now_utc.strftime("%Y-%m-%d")

        parent_order = Order(
            id=order_id,
            customer_id=customer_id,
            date=order_date,
            subtotal=to_rupees(gross_subtotal_paise),
            discount=to_rupees(total_discount_paise),
            shipping_fee=to_rupees(total_shipping_paise),
            total=to_rupees(parent_total_paise),
            status=OrderStatus.PLACED,
            payment_method=norm_method,
            payment_status=initial_payment_status,
            reservation_token=data.reservation_token,
            idempotency_key=idem_key,
            request_fingerprint=fingerprint,
            payment_expires_at=payment_expires_at,
            address_label=data.address_label or "Home",
            address_text=data.address_text,
            coupon_code=applied_coupon_code,
            created_at=now_utc
        )
        db.add(parent_order)
        db.flush()

        for r in reservations:
            r.order_id = parent_order.id

        suborders_summary = []
        created_items_summary = []

        for idx, s_id in enumerate(ordered_seller_ids, start=1):
            s_subtotal_paise = seller_subtotals_paise[s_id]
            s_discount_paise = seller_discounts_paise[idx - 1]
            s_shipping_paise = seller_shipping_paise[s_id]
            s_total_paise = max(0, s_subtotal_paise - s_discount_paise + s_shipping_paise)

            commission_rate = 0.15
            commission_paise = (s_total_paise * 15 + 50) // 100
            seller_payout_paise = s_total_paise - commission_paise

            suborder_id = f"{order_id}-S{idx}"
            suborder = SubOrder(
                id=suborder_id,
                parent_order_id=parent_order.id,
                seller_id=s_id,
                subtotal=to_rupees(s_subtotal_paise),
                shipping_fee=to_rupees(s_shipping_paise),
                discount=to_rupees(s_discount_paise),
                total=to_rupees(s_total_paise),
                commission_rate=commission_rate,
                commission_amount=to_rupees(commission_paise),
                seller_payout=to_rupees(seller_payout_paise),
                status=SubOrderStatus.PLACED,
                created_at=now_utc
            )
            db.add(suborder)
            db.flush()

            seller_user = db.query(User).filter(User.id == s_id).first()
            seller_name = seller_user.full_name if seller_user else f"Seller #{s_id}"

            s_res_list = seller_reservations[s_id]
            item_weights_paise = [
                to_paise(r.quoted_unit_price if r.quoted_unit_price is not None else listings_map[r.listing_id].price) * r.qty
                for r in s_res_list
            ]
            item_discounts_paise = allocate_proportionally_paise(s_discount_paise, item_weights_paise)

            items_count = 0
            for item_idx, r in enumerate(s_res_list):
                listing = listings_map[r.listing_id]
                product = db.query(Product).filter(Product.id == listing.product_id).first()
                p_name = product.name if product else "Luxury Product"
                unit_price = r.quoted_unit_price if r.quoted_unit_price is not None else listing.price
                var_name = (r.variant_name or listing.variant_name or "").strip()
                item_disc = to_rupees(item_discounts_paise[item_idx])

                oi = OrderItem(
                    order_id=parent_order.id,
                    suborder_id=suborder.id,
                    product_id=listing.product_id,
                    seller_listing_id=listing.id,
                    seller_id=s_id,
                    seller_name=seller_name,
                    sku=listing.sku,
                    variant_name=var_name,
                    name=p_name,
                    qty=r.qty,
                    price=float(unit_price),
                    allocated_discount=item_disc,
                )
                db.add(oi)
                items_count += r.qty

                created_items_summary.append({
                    "id": str(listing.product_id),
                    "name": p_name,
                    "variant_name": var_name,
                    "sku": listing.sku,
                    "seller_id": s_id,
                    "seller_name": seller_name,
                    "qty": r.qty,
                    "price": float(unit_price),
                    "allocated_discount": item_disc,
                })

                # Physical stock was deducted at RESERVATION_HOLD; record zero-delta suborder trace link
                db.add(InventoryAuditLog(
                    listing_id=listing.id,
                    seller_id=s_id,
                    action=StockAction.CHECKOUT_DECREMENT,
                    quantity_delta=0,
                    balance_before=listing.stock,
                    balance_after=listing.stock,
                    reference_type="SUBORDER",
                    reference_id=suborder.id
                ))

            escrow = SellerEscrowRecord(
                seller_id=s_id,
                suborder_id=suborder.id,
                gross_amount=to_rupees(s_total_paise),
                platform_fee=to_rupees(commission_paise),
                net_settlement=to_rupees(seller_payout_paise),
                refunded_amount=0.0,
                reversed_commission=0.0,
                status=EscrowStatus.HELD_IN_ESCROW,
                created_at=now_utc
            )
            db.add(escrow)

            suborders_summary.append({
                "suborder_id": suborder.id,
                "seller_id": s_id,
                "seller_name": seller_name,
                "subtotal": to_rupees(s_subtotal_paise),
                "discount": to_rupees(s_discount_paise),
                "shipping_fee": to_rupees(s_shipping_paise),
                "total": to_rupees(s_total_paise),
                "status": suborder.status.value,
                "items_count": items_count
            })

        notif_text = (
            f"Your order {parent_order.id} is confirmed (Cash on Delivery)."
            if is_cod
            else f"Your order {parent_order.id} was placed and is awaiting payment."
        )
        db.add(Notification(user_id=customer_id, type="order", text=notif_text))

        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            if idem_key:
                existing_order = db.query(Order).filter(
                    Order.customer_id == customer_id,
                    Order.idempotency_key == idem_key,
                ).first()
                if existing_order:
                    if existing_order.request_fingerprint and existing_order.request_fingerprint != fingerprint:
                        raise HTTPException(
                            status_code=status.HTTP_409_CONFLICT,
                            detail="Idempotency key has already been used for a different checkout request."
                        )
                    return CommerceService._format_order_dict(existing_order)
            raise
        cache_service.invalidate_catalog()

        return {
            "id": parent_order.id,
            "order_id": parent_order.id,
            "date": parent_order.date,
            "status": parent_order.status.value,
            "payment_method": parent_order.payment_method,
            "payment_status": parent_order.payment_status,
            "subtotal": parent_order.subtotal,
            "discount": parent_order.discount,
            "shipping": parent_order.shipping_fee,
            "shipping_fee": parent_order.shipping_fee,
            "total": parent_order.total,
            "reservation_token": parent_order.reservation_token,
            "address": {"label": parent_order.address_label, "text": parent_order.address_text},
            "items": created_items_summary,
            "suborders": suborders_summary,
        }

    # -------------------------------------------------------------------------
    # Milestones D & E: Suborder Fulfillment, Logistics & Rollup
    # -------------------------------------------------------------------------
    @staticmethod
    def _ensure_parent_order_payable_for_fulfillment(db: Session, parent_order_id: str) -> None:
        parent = db.query(Order).filter(Order.id == parent_order_id).first()
        if not parent:
            return
        if parent.status == OrderStatus.CANCELLED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot fulfill a cancelled order."
            )
        is_cod = is_cod_payment_method(parent.payment_method)
        if not is_cod and parent.payment_status not in ("completed", "partially_refunded"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot fulfill suborder before online payment is confirmed."
            )

    @staticmethod
    def pack_suborder(db: Session, seller_id: int, suborder_id: str) -> SubOrder:
        suborder = db.query(SubOrder).filter(SubOrder.id == suborder_id).with_for_update().first()
        if not suborder:
            raise HTTPException(status_code=404, detail="Suborder not found")
        if suborder.seller_id != seller_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to another merchant's suborder")

        if suborder.status != SubOrderStatus.PLACED:
            raise HTTPException(status_code=400, detail=f"Cannot pack suborder with status '{suborder.status.value}'")

        CommerceService._ensure_parent_order_payable_for_fulfillment(db, suborder.parent_order_id)

        suborder.status = SubOrderStatus.PACKED
        suborder.updated_at = datetime.now(timezone.utc)
        db.commit()
        CommerceService._rollup_parent_order_status(db, suborder.parent_order_id)
        db.refresh(suborder)
        return suborder

    @staticmethod
    def ship_suborder(db: Session, seller_id: int, suborder_id: str, ship_data: ShipmentCreate) -> SubOrder:
        suborder = db.query(SubOrder).filter(SubOrder.id == suborder_id).with_for_update().first()
        if not suborder:
            raise HTTPException(status_code=404, detail="Suborder not found")
        if suborder.seller_id != seller_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to another merchant's suborder")

        if suborder.status not in (SubOrderStatus.PLACED, SubOrderStatus.PACKED):
            raise HTTPException(status_code=400, detail=f"Cannot ship suborder with status '{suborder.status.value}'")

        CommerceService._ensure_parent_order_payable_for_fulfillment(db, suborder.parent_order_id)

        now_utc = datetime.now(timezone.utc)
        suborder.status = SubOrderStatus.IN_TRANSIT
        suborder.updated_at = now_utc

        shipment = db.query(Shipment).filter(Shipment.suborder_id == suborder_id).first()
        if not shipment:
            shipment = Shipment(
                suborder_id=suborder_id,
                carrier_name=ship_data.carrier_name,
                tracking_number=ship_data.tracking_number,
                tracking_url=ship_data.tracking_url or f"https://track.glamgo.com/{ship_data.tracking_number}",
                shipped_at=now_utc,
                estimated_delivery=now_utc + timedelta(days=3),
                status=ShipmentStatus.IN_TRANSIT,
                notes=ship_data.notes
            )
            db.add(shipment)
        else:
            shipment.carrier_name = ship_data.carrier_name
            shipment.tracking_number = ship_data.tracking_number
            shipment.tracking_url = ship_data.tracking_url or shipment.tracking_url
            shipment.shipped_at = now_utc
            shipment.status = ShipmentStatus.IN_TRANSIT
            shipment.notes = ship_data.notes

        db.commit()
        CommerceService._rollup_parent_order_status(db, suborder.parent_order_id)
        db.refresh(suborder)
        return suborder

    @staticmethod
    def deliver_suborder(db: Session, seller_id: int, suborder_id: str) -> SubOrder:
        suborder = db.query(SubOrder).filter(SubOrder.id == suborder_id).with_for_update().first()
        if not suborder:
            raise HTTPException(status_code=404, detail="Suborder not found")
        if suborder.seller_id != seller_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to another merchant's suborder")

        if suborder.status != SubOrderStatus.IN_TRANSIT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot confirm delivery for suborder with status '{suborder.status.value}'. Suborder must be in_transit."
            )

        CommerceService._ensure_parent_order_payable_for_fulfillment(db, suborder.parent_order_id)

        now_utc = datetime.now(timezone.utc)
        suborder.status = SubOrderStatus.DELIVERED
        suborder.updated_at = now_utc

        shipment = db.query(Shipment).filter(Shipment.suborder_id == suborder_id).first()
        if shipment:
            shipment.delivered_at = now_utc
            shipment.status = ShipmentStatus.DELIVERED

        # Align escrow maturity date cleanly with the 7-day customer return window
        escrow = db.query(SellerEscrowRecord).filter(SellerEscrowRecord.suborder_id == suborder_id).with_for_update().first()
        if escrow and escrow.status == EscrowStatus.HELD_IN_ESCROW:
            if escrow.delivered_at is None:
                escrow.delivered_at = now_utc
            if escrow.matures_at is None:
                escrow.matures_at = now_utc + timedelta(days=ESCROW_MATURITY_DAYS)

        db.commit()
        CommerceService._rollup_parent_order_status(db, suborder.parent_order_id)

        # If parent order is COD and now fully delivered, transition payment_status to cod_collected
        parent = db.query(Order).filter(Order.id == suborder.parent_order_id).with_for_update().first()
        if parent and is_cod_payment_method(parent.payment_method) and parent.status == OrderStatus.DELIVERED:
            if parent.payment_status in ("pending", "cod_pending"):
                parent.payment_status = "cod_collected"
                db.commit()

        db.refresh(suborder)
        return suborder

    @staticmethod
    def _rollup_parent_order_status(db: Session, parent_order_id: str) -> None:
        parent = db.query(Order).filter(Order.id == parent_order_id).with_for_update().first()
        if not parent:
            return

        suborders = db.query(SubOrder).filter(SubOrder.parent_order_id == parent_order_id).all()
        if not suborders:
            return

        statuses = [s.status for s in suborders]

        if all(st in (SubOrderStatus.DELIVERED, SubOrderStatus.RETURNED) for st in statuses):
            parent.status = OrderStatus.DELIVERED
        elif all(st == SubOrderStatus.CANCELLED for st in statuses):
            parent.status = OrderStatus.CANCELLED
        elif any(st in (SubOrderStatus.IN_TRANSIT, SubOrderStatus.DELIVERED, SubOrderStatus.RETURNED) for st in statuses):
            parent.status = OrderStatus.IN_TRANSIT
        elif all(st in (SubOrderStatus.PACKED, SubOrderStatus.IN_TRANSIT, SubOrderStatus.DELIVERED, SubOrderStatus.RETURNED) for st in statuses):
            parent.status = OrderStatus.PACKED
        else:
            parent.status = OrderStatus.PLACED

        db.commit()

    # -------------------------------------------------------------------------
    # Milestone F: Reverse Logistics, Partial/Discounted Refunds & Gateway Sync
    # -------------------------------------------------------------------------
    @staticmethod
    def request_return(db: Session, customer_id: int, suborder_id: str, data: ReturnRequestCreate) -> ReturnRequest:
        suborder = db.query(SubOrder).filter(SubOrder.id == suborder_id).first()
        if not suborder:
            raise HTTPException(status_code=404, detail="Suborder not found")

        parent = db.query(Order).filter(Order.id == suborder.parent_order_id).first()
        if not parent or parent.customer_id != customer_id:
            raise HTTPException(status_code=403, detail="Order does not belong to customer")

        if suborder.status != SubOrderStatus.DELIVERED:
            raise HTTPException(status_code=400, detail="Cannot request return on an undelivered suborder")

        shipment = db.query(Shipment).filter(Shipment.suborder_id == suborder_id).first()
        raw_delivery_time = (shipment.delivered_at if shipment and shipment.delivered_at else suborder.updated_at)
        now_utc = datetime.now(timezone.utc)
        delivery_time = to_utc(raw_delivery_time) or now_utc

        if now_utc - delivery_time > timedelta(days=RETURN_WINDOW_DAYS):
            raise HTTPException(status_code=400, detail=f"Return window ({RETURN_WINDOW_DAYS} days post-delivery) has expired")

        order_item = db.query(OrderItem).filter(
            OrderItem.id == data.order_item_id,
            OrderItem.suborder_id == suborder_id
        ).first()
        if not order_item:
            raise HTTPException(status_code=404, detail="Order item not found in this suborder")

        # Track prior non-rejected returns against this item so partial returns remain bounded by purchased qty
        prior_returns = db.query(ReturnRequest).filter(
            ReturnRequest.suborder_id == suborder_id,
            ReturnRequest.order_item_id == order_item.id,
            ReturnRequest.status != ReturnStatus.REJECTED,
        ).all()
        already_requested_qty = sum(int(r.return_qty or 1) for r in prior_returns)
        remaining_qty = int(order_item.qty) - already_requested_qty
        if remaining_qty <= 0:
            raise HTTPException(status_code=409, detail="Return already requested for this item")

        return_qty = int(data.qty) if data.qty is not None else remaining_qty
        if return_qty <= 0 or return_qty > remaining_qty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid return quantity {return_qty}; {remaining_qty} unit(s) eligible."
            )

        # Compute exact net paid refund amount in integer paise after apportioned coupon discounts
        item_gross_paise = to_paise(order_item.price) * int(order_item.qty)
        item_discount_paise = to_paise(order_item.allocated_discount or 0.0)
        item_net_paid_paise = max(0, item_gross_paise - item_discount_paise)
        already_refunded_paise = sum(int(r.refund_paise or 0) for r in prior_returns)
        remaining_paid_paise = max(0, item_net_paid_paise - already_refunded_paise)

        if return_qty == remaining_qty:
            refund_paise = remaining_paid_paise
        else:
            refund_paise = min(remaining_paid_paise, (item_net_paid_paise * return_qty) // int(order_item.qty))

        base_id = f"RET-{suborder_id}-{order_item.id}"
        return_id = base_id if not db.query(ReturnRequest).filter(ReturnRequest.id == base_id).first() else f"{base_id}-{secrets.token_hex(2).upper()}"

        ret = ReturnRequest(
            id=return_id,
            suborder_id=suborder_id,
            order_item_id=order_item.id,
            customer_id=customer_id,
            seller_id=suborder.seller_id,
            return_qty=return_qty,
            reason=data.reason,
            detailed_explanation=data.detailed_explanation,
            evidence_image_url=data.evidence_image_url,
            status=ReturnStatus.REQUESTED,
            refund_amount=to_rupees(refund_paise),
            refund_paise=refund_paise,
            refund_status="NONE",
            created_at=now_utc
        )
        db.add(ret)
        db.commit()
        db.refresh(ret)
        return ret

    @staticmethod
    def _apply_refund_to_escrow_and_order(
        db: Session,
        ret: ReturnRequest,
        refund_id: Optional[str],
        refund_tx_status: str = "refunded",
    ) -> None:
        """Apply a confirmed refund to local PaymentTransaction, Order.payment_status, and SellerEscrowRecord."""
        suborder = db.query(SubOrder).filter(SubOrder.id == ret.suborder_id).first()
        parent = db.query(Order).filter(Order.id == suborder.parent_order_id).first() if suborder else None

        existing_ref_tx = None
        if refund_id:
            existing_ref_tx = db.query(PaymentTransaction).filter(PaymentTransaction.refund_id == refund_id).first()

        if existing_ref_tx:
            existing_ref_tx.status = refund_tx_status
        else:
            ref_order_token = f"ref_{ret.id}" if not refund_id else f"ref_{refund_id}"
            db.add(PaymentTransaction(
                user_id=ret.customer_id,
                order_id=parent.id if parent else None,
                razorpay_order_id=ref_order_token,
                razorpay_payment_id=refund_id,
                refund_id=refund_id,
                amount=ret.refund_amount,
                currency="INR",
                status=refund_tx_status,
            ))

        if parent:
            total_paid_paise = to_paise(parent.total)
            all_confirmed_returns = db.query(ReturnRequest).filter(
                ReturnRequest.suborder_id.in_(
                    db.query(SubOrder.id).filter(SubOrder.parent_order_id == parent.id)
                ),
                ReturnRequest.status == ReturnStatus.REFUNDED,
            ).all()
            refunded_sum_paise = sum(int(r.refund_paise or to_paise(r.refund_amount)) for r in all_confirmed_returns)
            if total_paid_paise > 0 and refunded_sum_paise >= total_paid_paise:
                parent.payment_status = "refunded"
            elif refunded_sum_paise > 0:
                parent.payment_status = "partially_refunded"

        escrow = db.query(SellerEscrowRecord).filter(SellerEscrowRecord.suborder_id == ret.suborder_id).with_for_update().first()
        if escrow and suborder:
            refund_paise = int(ret.refund_paise or to_paise(ret.refund_amount))
            # Proportional commission reversal based on net item paid share
            commission_rev_paise = (refund_paise * 15 + 50) // 100
            seller_deduction_paise = max(0, refund_paise - commission_rev_paise)

            prev_ref_paise = to_paise(escrow.refunded_amount or 0.0)
            prev_comm_rev_paise = to_paise(escrow.reversed_commission or 0.0)
            prev_net_paise = to_paise(escrow.net_settlement)

            new_ref_paise = prev_ref_paise + refund_paise
            new_comm_rev_paise = prev_comm_rev_paise + commission_rev_paise
            new_net_paise = max(0, prev_net_paise - seller_deduction_paise)

            escrow.refunded_amount = to_rupees(new_ref_paise)
            escrow.reversed_commission = to_rupees(new_comm_rev_paise)
            escrow.net_settlement = to_rupees(new_net_paise)
            if new_net_paise == 0 and escrow.status in (EscrowStatus.HELD_IN_ESCROW, EscrowStatus.MATURED):
                escrow.status = EscrowStatus.CLAWBACK_REFUND

    @staticmethod
    def decide_return(db: Session, seller_id: int, return_id: str, data: ReturnDecisionRequest) -> ReturnRequest:
        from backend.app.api.v1.payments import get_razorpay_client

        ret = db.query(ReturnRequest).filter(ReturnRequest.id == return_id).with_for_update().first()
        if not ret:
            raise HTTPException(status_code=404, detail="Return request not found")
        if ret.seller_id != seller_id:
            raise HTTPException(status_code=403, detail="Access denied to another merchant's return")

        # Idempotent / terminal guards
        if ret.status == ReturnStatus.REFUNDED:
            if data.action == "APPROVE":
                return ret
            raise HTTPException(status_code=400, detail="Cannot reject a return that has already been refunded.")

        if ret.status == ReturnStatus.REJECTED:
            raise HTTPException(status_code=400, detail="Return request has already been rejected.")

        now_utc = datetime.now(timezone.utc)
        ret.updated_at = now_utc

        if data.action == "REJECT":
            if ret.status not in (ReturnStatus.REQUESTED, ReturnStatus.APPROVED):
                raise HTTPException(status_code=400, detail=f"Cannot reject return in status '{ret.status.value}'")
            ret.status = ReturnStatus.REJECTED
            ret.refund_status = "NONE"
            ret.rejection_reason = data.rejection_reason or "Return policy requirements not met."
            db.commit()
            db.refresh(ret)
            return ret

        # Action == "APPROVE"
        allowed_for_approve = (
            ReturnStatus.REQUESTED,
            ReturnStatus.APPROVED,
            ReturnStatus.INSPECTED,
            ReturnStatus.REFUND_FAILED,
            ReturnStatus.REFUND_PENDING,
        )
        if ret.status not in allowed_for_approve:
            raise HTTPException(status_code=400, detail=f"Return request cannot be approved in status '{ret.status.value}'")

        # 1. Perform restock at most once using restocked_at timestamp guard
        if data.restock_inventory and ret.restocked_at is None:
            oi = db.query(OrderItem).filter(OrderItem.id == ret.order_item_id).first()
            if oi and oi.seller_listing_id:
                listing = db.query(SellerListing).filter(
                    SellerListing.id == oi.seller_listing_id
                ).with_for_update().first()
                if listing:
                    before_stock = listing.stock
                    listing.stock += int(ret.return_qty or oi.qty)
                    db.add(InventoryAuditLog(
                        listing_id=listing.id,
                        seller_id=seller_id,
                        action=StockAction.RESTOCK_RETURN,
                        quantity_delta=int(ret.return_qty or oi.qty),
                        balance_before=before_stock,
                        balance_after=listing.stock,
                        reference_type="RETURN",
                        reference_id=ret.id
                    ))
                    CommerceService.sync_product_stock(db, listing.product_id)
            ret.restock_approved = True
            ret.restocked_at = now_utc
            cache_service.invalidate_catalog()

        suborder = db.query(SubOrder).filter(SubOrder.id == ret.suborder_id).first()
        parent = db.query(Order).filter(Order.id == suborder.parent_order_id).first() if suborder else None
        is_cod = is_cod_payment_method(parent.payment_method if parent else None)

        # 2. Cash-on-Delivery refund handling
        if is_cod:
            if data.cod_refund_confirmed:
                ret.status = ReturnStatus.REFUNDED
                ret.refund_status = "COD_REFUNDED"
                ret.gateway_refund_id = ret.gateway_refund_id or f"cod_payout_{ret.id}"
                CommerceService._apply_refund_to_escrow_and_order(db, ret, ret.gateway_refund_id, refund_tx_status="cod_refunded")
            else:
                ret.status = ReturnStatus.APPROVED
                ret.refund_status = "COD_MANUAL_PENDING"
            db.commit()
            db.refresh(ret)
            return ret

        # 3. Online prepaid order: require captured payment & call Razorpay Refund API outside DB locks
        if not parent:
            raise HTTPException(status_code=400, detail="Parent order not found for refund orchestration.")

        captured_tx = db.query(PaymentTransaction).filter(
            PaymentTransaction.order_id == parent.id,
            PaymentTransaction.status.in_(("captured", "partially_refunded")),
            PaymentTransaction.razorpay_payment_id.isnot(None),
        ).order_by(PaymentTransaction.id.desc()).first()

        if not captured_tx or not captured_tx.razorpay_payment_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot initiate gateway refund: order has no captured online payment."
            )

        refund_paise = int(ret.refund_paise or to_paise(ret.refund_amount))
        if refund_paise <= 0:
            # Zero net monetary refund due; mark resolved cleanly
            ret.status = ReturnStatus.REFUNDED
            ret.refund_status = "PROCESSED"
            db.commit()
            db.refresh(ret)
            return ret

        payment_id_to_refund = captured_tx.razorpay_payment_id
        ret_id_val = ret.id
        sub_id_val = ret.suborder_id
        parent_id_val = parent.id

        # If a gateway refund ID already exists in REFUND_PENDING, avoid issuing a duplicate refund call
        if ret.gateway_refund_id and ret.status == ReturnStatus.REFUND_PENDING:
            client = get_razorpay_client()
            try:
                rzp_refund = client.payment.fetch_refund(payment_id_to_refund, ret.gateway_refund_id)
            except Exception as exc:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Unable to check pending gateway refund status: {exc}"
                )
        else:
            # Commit approved + restocked_at state BEFORE network I/O so no row locks remain open
            ret.status = ReturnStatus.APPROVED
            ret.refund_status = "PENDING"
            db.commit()

            client = get_razorpay_client()
            try:
                rzp_refund = client.payment.refund(
                    payment_id_to_refund,
                    {
                        "amount": refund_paise,
                        "notes": {
                            "return_id": ret_id_val,
                            "suborder_id": sub_id_val,
                            "order_id": parent_id_val,
                        },
                    },
                )
            except Exception as exc:
                # Reload & persist REFUND_FAILED so retry is safe without re-restocking
                ret = db.query(ReturnRequest).filter(ReturnRequest.id == ret_id_val).with_for_update().first()
                if ret:
                    ret.status = ReturnStatus.REFUND_FAILED
                    ret.refund_status = "FAILED"
                    ret.updated_at = datetime.now(timezone.utc)
                    db.commit()
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Payment gateway refund initiation failed: {exc}"
                )

        # Persist gateway refund outcome
        ret = db.query(ReturnRequest).filter(ReturnRequest.id == ret_id_val).with_for_update().first()
        refund_id = rzp_refund.get("id") if isinstance(rzp_refund, dict) else None
        gw_status = str(rzp_refund.get("status", "processed")).lower() if isinstance(rzp_refund, dict) else "failed"

        if refund_id:
            ret.gateway_refund_id = refund_id

        if gw_status == "processed":
            ret.status = ReturnStatus.REFUNDED
            ret.refund_status = "PROCESSED"
            CommerceService._apply_refund_to_escrow_and_order(db, ret, refund_id, refund_tx_status="refunded")
        elif gw_status in ("pending", "created"):
            ret.status = ReturnStatus.REFUND_PENDING
            ret.refund_status = "PENDING"
            if refund_id and not db.query(PaymentTransaction).filter(PaymentTransaction.refund_id == refund_id).first():
                db.add(PaymentTransaction(
                    user_id=ret.customer_id,
                    order_id=parent_id_val,
                    razorpay_order_id=f"ref_{refund_id}",
                    razorpay_payment_id=refund_id,
                    refund_id=refund_id,
                    amount=ret.refund_amount,
                    currency="INR",
                    status="refund_pending",
                ))
        else:
            ret.status = ReturnStatus.REFUND_FAILED
            ret.refund_status = "FAILED"

        ret.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(ret)
        return ret

    # -------------------------------------------------------------------------
    # Milestone G: Escrow Maturity, Reservation Expiry & Financials
    # -------------------------------------------------------------------------
    @staticmethod
    def mature_escrow_records(db: Session) -> int:
        now_utc = datetime.now(timezone.utc)
        held_records = (
            db.query(SellerEscrowRecord)
            .filter(
                SellerEscrowRecord.status == EscrowStatus.HELD_IN_ESCROW,
                SellerEscrowRecord.matures_at.isnot(None),
                SellerEscrowRecord.matures_at <= now_utc,
            )
            .order_by(SellerEscrowRecord.id.asc())
            .with_for_update(skip_locked=True)
            .all()
        )

        matured_count = 0
        unresolved_return_statuses = (
            ReturnStatus.REQUESTED,
            ReturnStatus.APPROVED,
            ReturnStatus.IN_TRANSIT,
            ReturnStatus.INSPECTED,
            ReturnStatus.REFUND_PENDING,
            ReturnStatus.REFUND_FAILED,
        )

        for rec in held_records:
            suborder = db.query(SubOrder).filter(SubOrder.id == rec.suborder_id).first()
            if not suborder or suborder.status != SubOrderStatus.DELIVERED:
                continue

            parent = db.query(Order).filter(Order.id == suborder.parent_order_id).first()
            if not parent or parent.payment_status not in ("completed", "partially_refunded", "cod_collected"):
                continue

            unresolved_return = db.query(ReturnRequest).filter(
                ReturnRequest.suborder_id == rec.suborder_id,
                (ReturnRequest.status.in_(unresolved_return_statuses))
                | (ReturnRequest.refund_status.in_(("PENDING", "FAILED", "COD_MANUAL_PENDING"))),
            ).first()
            if unresolved_return:
                continue

            if to_paise(rec.net_settlement) <= 0:
                rec.status = EscrowStatus.CLAWBACK_REFUND
            else:
                rec.status = EscrowStatus.MATURED
                matured_count += 1
            rec.updated_at = now_utc

        db.commit()
        return matured_count

    @staticmethod
    def expire_pending_reservations(db: Session) -> int:
        now_utc = datetime.now(timezone.utc)
        expired_res = (
            db.query(InventoryReservation)
            .filter(
                InventoryReservation.status == ReservationStatus.PENDING,
                InventoryReservation.expires_at < now_utc
            )
            .order_by(InventoryReservation.id.asc())
            .with_for_update(skip_locked=True)
            .all()
        )

        count = 0
        affected_products: set[str] = set()

        if expired_res:
            lids = sorted({r.listing_id for r in expired_res})
            lmap: Dict[int, SellerListing] = {}
            for lid in lids:
                lst = db.query(SellerListing).filter(SellerListing.id == lid).with_for_update().first()
                if lst:
                    lmap[lid] = lst
                    affected_products.add(lst.product_id)

            for r in expired_res:
                listing = lmap.get(r.listing_id)
                if listing:
                    before_stock = listing.stock
                    listing.stock += r.qty
                    db.add(InventoryAuditLog(
                        listing_id=listing.id,
                        seller_id=listing.seller_id,
                        action=StockAction.RESERVATION_RELEASE,
                        quantity_delta=r.qty,
                        balance_before=before_stock,
                        balance_after=listing.stock,
                        reference_type="RESERVATION",
                        reference_id=r.reservation_token
                    ))
                r.status = ReservationStatus.EXPIRED
                count += 1

        # Also release abandoned unpaid online orders whose payment window has expired
        expired_orders = (
            db.query(Order)
            .filter(
                Order.status == OrderStatus.PLACED,
                Order.payment_status.in_(("pending", "failed")),
                Order.payment_expires_at.isnot(None),
                Order.payment_expires_at < now_utc,
            )
            .order_by(Order.id.asc())
            .with_for_update(skip_locked=True)
            .all()
        )
        for ord_obj in expired_orders:
            if is_cod_payment_method(ord_obj.payment_method):
                continue
            captured_tx = db.query(PaymentTransaction).filter(
                PaymentTransaction.order_id == ord_obj.id,
                PaymentTransaction.status == "captured",
            ).first()
            if captured_tx:
                continue

            items_sorted = sorted(list(ord_obj.items or []), key=lambda oi: oi.seller_listing_id or 0)
            ord_lids = sorted({oi.seller_listing_id for oi in items_sorted if oi.seller_listing_id})
            ord_lmap: Dict[int, SellerListing] = {}
            for lid in ord_lids:
                lst = db.query(SellerListing).filter(SellerListing.id == lid).with_for_update().first()
                if lst:
                    ord_lmap[lid] = lst
                    affected_products.add(lst.product_id)

            for oi in items_sorted:
                lst = ord_lmap.get(oi.seller_listing_id) if oi.seller_listing_id else None
                if lst:
                    before_s = lst.stock
                    lst.stock += oi.qty
                    db.add(InventoryAuditLog(
                        listing_id=lst.id,
                        seller_id=lst.seller_id,
                        action=StockAction.RESERVATION_RELEASE,
                        quantity_delta=oi.qty,
                        balance_before=before_s,
                        balance_after=lst.stock,
                        reference_type="ORDER_EXPIRY",
                        reference_id=ord_obj.id,
                    ))

            ord_obj.status = OrderStatus.CANCELLED
            ord_obj.payment_status = "expired"
            for sub in (ord_obj.suborders or []):
                sub.status = SubOrderStatus.CANCELLED
                sub.cancellation_reason = "Payment hold expired"
                if sub.escrow_record and sub.escrow_record.status == EscrowStatus.HELD_IN_ESCROW:
                    sub.escrow_record.status = EscrowStatus.CLAWBACK_REFUND

        for pid in sorted(affected_products):
            CommerceService.sync_product_stock(db, pid)

        db.commit()
        if affected_products:
            cache_service.invalidate_catalog()
        return count

    @staticmethod
    def get_seller_financials(db: Session, seller_id: int) -> Dict[str, Any]:
        suborders = db.query(SubOrder).filter(
            SubOrder.seller_id == seller_id,
            SubOrder.status != SubOrderStatus.CANCELLED,
        ).all()
        gross_sales = sum(s.total for s in suborders)
        commissions = sum(s.commission_amount for s in suborders)

        escrow_records = db.query(SellerEscrowRecord).filter(SellerEscrowRecord.seller_id == seller_id).all()
        funds_in_escrow = sum(e.net_settlement for e in escrow_records if e.status == EscrowStatus.HELD_IN_ESCROW)
        matured_balance = sum(e.net_settlement for e in escrow_records if e.status == EscrowStatus.MATURED)
        total_disbursed = sum(e.net_settlement for e in escrow_records if e.status == EscrowStatus.DISBURSED)

        returns = db.query(ReturnRequest).filter(
            ReturnRequest.seller_id == seller_id,
            ReturnRequest.status == ReturnStatus.REFUNDED
        ).all()
        refund_deductions = sum(r.refund_amount for r in returns)

        batches = [
            {
                "suborder_id": e.suborder_id,
                "net_amount": e.net_settlement,
                "refunded_amount": float(e.refunded_amount or 0.0),
                "reversed_commission": float(e.reversed_commission or 0.0),
                "status": e.status.value,
                "delivered_at": e.delivered_at,
                "matures_at": e.matures_at
            }
            for e in escrow_records
        ]

        return {
            "currency": "INR",
            "gross_sales": round(gross_sales, 2),
            "platform_commission_15pct": round(commissions, 2),
            "refund_deductions": round(refund_deductions, 2),
            "funds_in_escrow": round(funds_in_escrow, 2),
            "matured_balance_available": round(matured_balance, 2),
            "total_disbursed": round(total_disbursed, 2),
            "escrow_batches": batches
        }
