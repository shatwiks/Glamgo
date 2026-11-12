from datetime import datetime, timezone, timedelta
import secrets
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.app.models.user import User, UserRole, OrderStatus, PaymentStatus
from backend.app.models.catalog import Product
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


def to_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


class CommerceService:
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
            .order_by(SellerListing.price.asc())
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

        # Check duplicate SKU for this seller
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

        # Audit initial stock
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

        db.commit()
        db.refresh(listing)
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
        db.commit()
        db.refresh(listing)
        return listing

    # -------------------------------------------------------------------------
    # Milestone B & C: Reservation & Split Checkout
    # -------------------------------------------------------------------------
    @staticmethod
    def reserve_inventory(db: Session, user_id: int, items: List[ReservationItem]) -> Dict[str, Any]:
        if not items:
            raise HTTPException(status_code=400, detail="Cannot reserve empty cart")

        # Sort listing IDs ascending to eliminate deadlock risk
        sorted_items = sorted(items, key=lambda x: x.listing_id)
        listing_ids = [item.listing_id for item in sorted_items]

        # Row-lock listings in order
        listings_map = {}
        for lid in listing_ids:
            listing = db.query(SellerListing).filter(SellerListing.id == lid).with_for_update().first()
            if not listing or not listing.is_active:
                raise HTTPException(status_code=404, detail=f"Listing ID {lid} not found or inactive")
            listings_map[lid] = listing

        # Validate stock availability
        for item in sorted_items:
            listing = listings_map[item.listing_id]
            if listing.stock < item.qty:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Insufficient stock for listing_id {listing.id}: requested {item.qty}, available {listing.stock}"
                )

        # Generate reservation token and expiry
        token = f"res_{secrets.token_hex(16)}"
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

        # Deduct temporary stock and record reservations
        for item in sorted_items:
            listing = listings_map[item.listing_id]
            listing.stock -= item.qty
            
            res_record = InventoryReservation(
                reservation_token=token,
                listing_id=listing.id,
                user_id=user_id,
                qty=item.qty,
                status=ReservationStatus.PENDING,
                expires_at=expires_at
            )
            db.add(res_record)

            audit = InventoryAuditLog(
                listing_id=listing.id,
                seller_id=listing.seller_id,
                action=StockAction.RESERVATION_HOLD,
                quantity_delta=-item.qty,
                balance_before=listing.stock + item.qty,
                balance_after=listing.stock,
                reference_type="RESERVATION",
                reference_id=token
            )
            db.add(audit)

        # Group by seller for response
        sellers_group: Dict[int, Dict[str, Any]] = {}
        total_subtotal = 0.0

        for item in sorted_items:
            listing = listings_map[item.listing_id]
            seller_id = listing.seller_id
            product = db.query(Product).filter(Product.id == listing.product_id).first()
            prod_name = product.name if product else "Luxury Cosmetic"

            if seller_id not in sellers_group:
                seller = db.query(User).filter(User.id == seller_id).first()
                seller_name = seller.full_name if seller else f"Seller #{seller_id}"
                sellers_group[seller_id] = {
                    "seller_id": seller_id,
                    "seller_name": seller_name,
                    "subtotal": 0.0,
                    "estimated_shipping_fee": 100.0,  # Standard delivery fee per seller package
                    "items": []
                }

            line_total = round(listing.price * item.qty, 2)
            sellers_group[seller_id]["subtotal"] = round(sellers_group[seller_id]["subtotal"] + line_total, 2)
            total_subtotal = round(total_subtotal + line_total, 2)

            sellers_group[seller_id]["items"].append({
                "listing_id": listing.id,
                "product_id": listing.product_id,
                "product_name": prod_name,
                "qty": item.qty,
                "unit_price": listing.price,
                "line_total": line_total
            })

        # Waive shipping if seller subtotal > 1500
        total_shipping = 0.0
        for s_data in sellers_group.values():
            if s_data["subtotal"] >= 1500.0:
                s_data["estimated_shipping_fee"] = 0.0
            total_shipping += s_data["estimated_shipping_fee"]

        grand_total = round(total_subtotal + total_shipping, 2)

        db.commit()

        return {
            "reservation_token": token,
            "expires_at": expires_at,
            "expires_in_seconds": 900,
            "sellers": list(sellers_group.values()),
            "total_subtotal": total_subtotal,
            "total_shipping": total_shipping,
            "grand_total": grand_total
        }

    @staticmethod
    def checkout_multi_vendor(db: Session, customer_id: int, data: MultiVendorCheckoutRequest) -> Dict[str, Any]:
        # Fetch active reservations for token
        reservations = (
            db.query(InventoryReservation)
            .filter(
                InventoryReservation.reservation_token == data.reservation_token,
                InventoryReservation.user_id == customer_id,
                InventoryReservation.status == ReservationStatus.PENDING
            )
            .all()
        )

        if not reservations:
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail=f"Reservation '{data.reservation_token}' expired or not found. Please re-add items to cart."
            )

        # Check expiry
        now_utc = datetime.now(timezone.utc)
        exp_time = to_utc(reservations[0].expires_at)
        if exp_time and exp_time < now_utc:
            # Expire them and release stock
            CommerceService.expire_pending_reservations(db)
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail=f"Reservation '{data.reservation_token}' has expired. Please re-reserve."
            )

        # Mark confirmed
        for r in reservations:
            r.status = ReservationStatus.CONFIRMED

        # Group reservations by seller
        seller_reservations: Dict[int, List[InventoryReservation]] = {}
        for r in reservations:
            listing = db.query(SellerListing).filter(SellerListing.id == r.listing_id).first()
            seller_id = listing.seller_id
            seller_reservations.setdefault(seller_id, []).append(r)

        # Calculate totals
        gross_subtotal = 0.0
        seller_subtotals: Dict[int, float] = {}
        seller_shipping: Dict[int, float] = {}

        for s_id, s_res_list in seller_reservations.items():
            sub = 0.0
            for r in s_res_list:
                listing = db.query(SellerListing).filter(SellerListing.id == r.listing_id).first()
                sub += round(listing.price * r.qty, 2)
            seller_subtotals[s_id] = round(sub, 2)
            gross_subtotal = round(gross_subtotal + sub, 2)
            seller_shipping[s_id] = 0.0 if sub >= 1500.0 else 100.0

        total_shipping = sum(seller_shipping.values())

        # Coupon apportionment
        total_discount = 0.0
        if data.coupon_code:
            coupon = db.query(Coupon).filter(
                Coupon.code == data.coupon_code.upper(),
                Coupon.is_active == True
            ).first()
            if coupon:
                calculated_discount = (gross_subtotal * coupon.discount_percent) / 100.0
                total_discount = min(calculated_discount, coupon.max_discount)
                total_discount = round(total_discount, 2)

        parent_total = round(gross_subtotal - total_discount + total_shipping, 2)
        order_id = f"GG{secrets.token_hex(4).upper()}"
        order_date = now_utc.strftime("%d %b %Y")

        # Create parent order
        parent_order = Order(
            id=order_id,
            customer_id=customer_id,
            date=order_date,
            subtotal=gross_subtotal,
            discount=total_discount,
            total=parent_total,
            status=OrderStatus.PLACED,
            payment_method=data.payment_method or "Razorpay",
            payment_status="completed",
            address_label=data.address_label or "Home",
            address_text=data.address_text,
            coupon_code=data.coupon_code,
            created_at=now_utc
        )
        db.add(parent_order)
        db.flush()

        # Create suborders and order_items
        suborders_summary = []
        suborder_idx = 1

        for s_id, s_res_list in seller_reservations.items():
            s_subtotal = seller_subtotals[s_id]
            # Proportional discount: (seller_subtotal / gross_subtotal) * total_discount
            s_discount = round((s_subtotal / gross_subtotal) * total_discount, 2) if gross_subtotal > 0 else 0.0
            s_shipping = seller_shipping[s_id]
            s_total = round(s_subtotal - s_discount + s_shipping, 2)

            commission_rate = 0.15
            commission_amount = round(s_total * commission_rate, 2)
            seller_payout = round(s_total - commission_amount, 2)

            suborder_id = f"{order_id}-S{suborder_idx}"
            suborder_idx += 1

            suborder = SubOrder(
                id=suborder_id,
                parent_order_id=parent_order.id,
                seller_id=s_id,
                subtotal=s_subtotal,
                shipping_fee=s_shipping,
                discount=s_discount,
                total=s_total,
                commission_rate=commission_rate,
                commission_amount=commission_amount,
                seller_payout=seller_payout,
                status=SubOrderStatus.PLACED,
                created_at=now_utc
            )
            db.add(suborder)
            db.flush()

            # Create items under suborder
            items_count = 0
            for r in s_res_list:
                listing = db.query(SellerListing).filter(SellerListing.id == r.listing_id).first()
                product = db.query(Product).filter(Product.id == listing.product_id).first()
                p_name = product.name if product else "Luxury Product"

                oi = OrderItem(
                    order_id=parent_order.id,
                    suborder_id=suborder.id,
                    product_id=listing.product_id,
                    seller_listing_id=listing.id,
                    seller_id=s_id,
                    name=p_name,
                    qty=r.qty,
                    price=listing.price
                )
                db.add(oi)
                items_count += r.qty

                # Audit deduction
                audit = InventoryAuditLog(
                    listing_id=listing.id,
                    seller_id=s_id,
                    action=StockAction.CHECKOUT_DECREMENT,
                    quantity_delta=-r.qty,
                    balance_before=listing.stock + r.qty,
                    balance_after=listing.stock,
                    reference_type="SUBORDER",
                    reference_id=suborder.id
                )
                db.add(audit)

            # Create initial Escrow record for suborder
            escrow = SellerEscrowRecord(
                seller_id=s_id,
                suborder_id=suborder.id,
                gross_amount=s_total,
                platform_fee=commission_amount,
                net_settlement=seller_payout,
                status=EscrowStatus.HELD_IN_ESCROW,
                created_at=now_utc
            )
            db.add(escrow)

            seller_user = db.query(User).filter(User.id == s_id).first()
            seller_name = seller_user.full_name if seller_user else f"Seller #{s_id}"

            suborders_summary.append({
                "suborder_id": suborder.id,
                "seller_id": s_id,
                "seller_name": seller_name,
                "subtotal": s_subtotal,
                "discount": s_discount,
                "shipping_fee": s_shipping,
                "total": s_total,
                "status": suborder.status.value,
                "items_count": items_count
            })

        # Payment Transaction
        rzp_order_id = f"order_{secrets.token_hex(8)}"
        payment_tx = PaymentTransaction(
            user_id=customer_id,
            order_id=parent_order.id,
            razorpay_order_id=rzp_order_id,
            razorpay_payment_id=f"pay_{secrets.token_hex(8)}",
            razorpay_signature=secrets.token_hex(16),
            amount=parent_total,
            currency="INR",
            status="completed"
        )
        db.add(payment_tx)

        db.commit()

        return {
            "order_id": parent_order.id,
            "date": parent_order.date,
            "status": parent_order.status.value,
            "subtotal": gross_subtotal,
            "discount": total_discount,
            "shipping": total_shipping,
            "total": parent_total,
            "suborders": suborders_summary,
            "payment": {
                "gateway": "Razorpay",
                "razorpay_order_id": rzp_order_id,
                "amount": parent_total,
                "currency": "INR",
                "key_id": "rzp_test_mock_glamgo"
            }
        }

    # -------------------------------------------------------------------------
    # Milestones D & E: Suborder Fulfillment, Logistics & Rollup
    # -------------------------------------------------------------------------
    @staticmethod
    def pack_suborder(db: Session, seller_id: int, suborder_id: str) -> SubOrder:
        suborder = db.query(SubOrder).filter(SubOrder.id == suborder_id).first()
        if not suborder:
            raise HTTPException(status_code=404, detail="Suborder not found")
        if suborder.seller_id != seller_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to another merchant's suborder")

        if suborder.status != SubOrderStatus.PLACED:
            raise HTTPException(status_code=400, detail=f"Cannot pack suborder with status '{suborder.status.value}'")

        suborder.status = SubOrderStatus.PACKED
        suborder.updated_at = datetime.now(timezone.utc)
        db.commit()
        CommerceService._rollup_parent_order_status(db, suborder.parent_order_id)
        db.refresh(suborder)
        return suborder

    @staticmethod
    def ship_suborder(db: Session, seller_id: int, suborder_id: str, ship_data: ShipmentCreate) -> SubOrder:
        suborder = db.query(SubOrder).filter(SubOrder.id == suborder_id).first()
        if not suborder:
            raise HTTPException(status_code=404, detail="Suborder not found")
        if suborder.seller_id != seller_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to another merchant's suborder")

        if suborder.status not in (SubOrderStatus.PLACED, SubOrderStatus.PACKED):
            raise HTTPException(status_code=400, detail=f"Cannot ship suborder with status '{suborder.status.value}'")

        now_utc = datetime.now(timezone.utc)
        suborder.status = SubOrderStatus.IN_TRANSIT
        suborder.updated_at = now_utc

        # Create or update Shipment
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
        suborder = db.query(SubOrder).filter(SubOrder.id == suborder_id).first()
        if not suborder:
            raise HTTPException(status_code=404, detail="Suborder not found")
        if suborder.seller_id != seller_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to another merchant's suborder")

        now_utc = datetime.now(timezone.utc)
        suborder.status = SubOrderStatus.DELIVERED
        suborder.updated_at = now_utc

        # Update shipment
        shipment = db.query(Shipment).filter(Shipment.suborder_id == suborder_id).first()
        if shipment:
            shipment.delivered_at = now_utc
            shipment.status = ShipmentStatus.DELIVERED

        # Update escrow record: set maturity date = delivered_at + 3 days
        escrow = db.query(SellerEscrowRecord).filter(SellerEscrowRecord.suborder_id == suborder_id).first()
        if escrow:
            escrow.delivered_at = now_utc
            escrow.matures_at = now_utc + timedelta(days=3)
            escrow.status = EscrowStatus.HELD_IN_ESCROW

        db.commit()
        CommerceService._rollup_parent_order_status(db, suborder.parent_order_id)
        db.refresh(suborder)
        return suborder

    @staticmethod
    def _rollup_parent_order_status(db: Session, parent_order_id: str) -> None:
        parent = db.query(Order).filter(Order.id == parent_order_id).first()
        if not parent:
            return

        suborders = db.query(SubOrder).filter(SubOrder.parent_order_id == parent_order_id).all()
        if not suborders:
            return

        statuses = [s.status for s in suborders]

        if all(st == SubOrderStatus.DELIVERED for st in statuses):
            parent.status = OrderStatus.DELIVERED
        elif all(st == SubOrderStatus.CANCELLED for st in statuses):
            parent.status = OrderStatus.CANCELLED
        elif any(st in (SubOrderStatus.IN_TRANSIT, SubOrderStatus.DELIVERED) for st in statuses):
            parent.status = OrderStatus.IN_TRANSIT
        elif all(st in (SubOrderStatus.PACKED, SubOrderStatus.IN_TRANSIT, SubOrderStatus.DELIVERED) for st in statuses):
            parent.status = OrderStatus.PACKED
        else:
            parent.status = OrderStatus.PLACED

        db.commit()

    # -------------------------------------------------------------------------
    # Milestone F: Reverse Logistics & Returns
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

        # Check delivery window (7 days)
        shipment = db.query(Shipment).filter(Shipment.suborder_id == suborder_id).first()
        raw_delivery_time = (shipment.delivered_at if shipment and shipment.delivered_at else suborder.updated_at)
        now_utc = datetime.now(timezone.utc)
        delivery_time = to_utc(raw_delivery_time) or now_utc

        if now_utc - delivery_time > timedelta(days=7):
            raise HTTPException(status_code=400, detail="Return window (7 days post-delivery) has expired")

        order_item = db.query(OrderItem).filter(
            OrderItem.id == data.order_item_id,
            OrderItem.suborder_id == suborder_id
        ).first()
        if not order_item:
            raise HTTPException(status_code=404, detail="Order item not found in this suborder")

        refund_val = round(order_item.price * order_item.qty, 2)
        return_id = f"RET-{suborder_id}-{order_item.id}"

        # Prevent duplicate return requests
        existing = db.query(ReturnRequest).filter(ReturnRequest.id == return_id).first()
        if existing:
            raise HTTPException(status_code=409, detail="Return already requested for this item")

        ret = ReturnRequest(
            id=return_id,
            suborder_id=suborder_id,
            order_item_id=order_item.id,
            customer_id=customer_id,
            seller_id=suborder.seller_id,
            reason=data.reason,
            detailed_explanation=data.detailed_explanation,
            evidence_image_url=data.evidence_image_url,
            status=ReturnStatus.REQUESTED,
            refund_amount=refund_val,
            created_at=now_utc
        )
        db.add(ret)
        db.commit()
        db.refresh(ret)
        return ret

    @staticmethod
    def decide_return(db: Session, seller_id: int, return_id: str, data: ReturnDecisionRequest) -> ReturnRequest:
        ret = db.query(ReturnRequest).filter(ReturnRequest.id == return_id).first()
        if not ret:
            raise HTTPException(status_code=404, detail="Return request not found")
        if ret.seller_id != seller_id:
            raise HTTPException(status_code=403, detail="Access denied to another merchant's return")

        if ret.status != ReturnStatus.REQUESTED:
            raise HTTPException(status_code=400, detail=f"Return request already has status '{ret.status.value}'")

        now_utc = datetime.now(timezone.utc)
        ret.updated_at = now_utc

        if data.action == "APPROVE":
            ret.status = ReturnStatus.REFUNDED
            ret.restock_approved = data.restock_inventory

            # Restock inventory if approved
            if data.restock_inventory:
                oi = db.query(OrderItem).filter(OrderItem.id == ret.order_item_id).first()
                if oi and oi.seller_listing_id:
                    listing = db.query(SellerListing).filter(SellerListing.id == oi.seller_listing_id).with_for_update().first()
                    if listing:
                        listing.stock += oi.qty
                        audit = InventoryAuditLog(
                            listing_id=listing.id,
                            seller_id=seller_id,
                            action=StockAction.RESTOCK_RETURN,
                            quantity_delta=oi.qty,
                            balance_before=listing.stock - oi.qty,
                            balance_after=listing.stock,
                            reference_type="RETURN",
                            reference_id=ret.id
                        )
                        db.add(audit)

            # Record refund transaction
            sub = db.query(SubOrder).filter(SubOrder.id == ret.suborder_id).first()
            p_order_id = sub.parent_order_id if sub else None
            refund_tx = PaymentTransaction(
                user_id=ret.customer_id,
                order_id=p_order_id,
                razorpay_order_id=f"refund_{secrets.token_hex(8)}",
                amount=ret.refund_amount,
                currency="INR",
                status="refunded"
            )
            db.add(refund_tx)

            # Clawback from escrow if still held
            escrow = db.query(SellerEscrowRecord).filter(SellerEscrowRecord.suborder_id == ret.suborder_id).first()
            if escrow and escrow.status == EscrowStatus.HELD_IN_ESCROW:
                escrow.status = EscrowStatus.CLAWBACK_REFUND

        else:
            ret.status = ReturnStatus.REJECTED
            ret.rejection_reason = data.rejection_reason or "Return policy requirements not met."

        db.commit()
        db.refresh(ret)
        return ret

    # -------------------------------------------------------------------------
    # Milestone G: Escrow Maturity & Financials
    # -------------------------------------------------------------------------
    @staticmethod
    def mature_escrow_records(db: Session) -> int:
        now_utc = datetime.now(timezone.utc)
        held_records = (
            db.query(SellerEscrowRecord)
            .filter(
                SellerEscrowRecord.status == EscrowStatus.HELD_IN_ESCROW,
                SellerEscrowRecord.matures_at != None,
                SellerEscrowRecord.matures_at <= now_utc
            )
            .all()
        )

        for rec in held_records:
            rec.status = EscrowStatus.MATURED
            rec.updated_at = now_utc

        db.commit()
        return len(held_records)

    @staticmethod
    def expire_pending_reservations(db: Session) -> int:
        now_utc = datetime.now(timezone.utc)
        expired_res = (
            db.query(InventoryReservation)
            .filter(
                InventoryReservation.status == ReservationStatus.PENDING,
                InventoryReservation.expires_at < now_utc
            )
            .all()
        )

        count = 0
        for r in expired_res:
            listing = db.query(SellerListing).filter(SellerListing.id == r.listing_id).with_for_update().first()
            if listing:
                listing.stock += r.qty
                audit = InventoryAuditLog(
                    listing_id=listing.id,
                    seller_id=listing.seller_id,
                    action=StockAction.RESERVATION_RELEASE,
                    quantity_delta=r.qty,
                    balance_before=listing.stock - r.qty,
                    balance_after=listing.stock,
                    reference_type="RESERVATION",
                    reference_id=r.reservation_token
                )
                db.add(audit)
            r.status = ReservationStatus.EXPIRED
            count += 1

        db.commit()
        return count

    @staticmethod
    def get_seller_financials(db: Session, seller_id: int) -> Dict[str, Any]:
        suborders = db.query(SubOrder).filter(SubOrder.seller_id == seller_id).all()
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
