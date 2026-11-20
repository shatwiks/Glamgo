import hashlib
import json
from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from backend.app.core.database import get_db
from backend.app.api.deps import get_current_user
from backend.app.models.user import User, Address
from backend.app.models.order import Order, Coupon
from backend.app.models.commerce import SubOrder, ReturnRequest, RefundRecord
from backend.app.schemas.order import (
    OrderCreate, OrderResponse, OrderItemResponse,
    CouponValidateRequest, CouponValidateResponse
)
from backend.app.schemas.commerce import (
    ReservationCreate, ReservationResponse, ReservationItem, MultiVendorCheckoutRequest,
    MultiVendorCheckoutResponse, ReturnRequestCreate, ReturnRequestResponse
)
from backend.app.services.commerce_service import CommerceService

router = APIRouter()


def format_order(order: Order, db: Optional[Session] = None) -> dict:
    ret_by_item: Dict[int, ReturnRequest] = {}
    if db is not None and order.items:
        item_ids = [oi.id for oi in order.items if oi.id is not None]
        if item_ids:
            returns = (
                db.query(ReturnRequest)
                .filter(ReturnRequest.order_item_id.in_(item_ids))
                .order_by(ReturnRequest.created_at.desc(), ReturnRequest.id.desc())
                .all()
            )
            for rr in returns:
                if rr.order_item_id not in ret_by_item:
                    ret_by_item[rr.order_item_id] = rr

    suborders_list = []
    if hasattr(order, "suborders") and order.suborders:
        for s in order.suborders:
            seller_name = s.seller.full_name if s.seller else f"Seller #{s.seller_id}"
            suborders_list.append({
                "suborder_id": s.id,
                "seller_id": s.seller_id,
                "seller_name": seller_name,
                "status": s.status.value,
                "subtotal": s.subtotal,
                "shipping_fee": s.shipping_fee,
                "discount": s.discount,
                "total": s.total,
                "shipment": {
                    "carrier_name": s.shipment.carrier_name,
                    "tracking_number": s.shipment.tracking_number,
                    "tracking_url": s.shipment.tracking_url,
                    "status": s.shipment.status.value,
                    "shipped_at": s.shipment.shipped_at,
                    "delivered_at": s.shipment.delivered_at
                } if s.shipment else None,
                "items": [
                    {
                        "order_item_id": oi.id,
                        "product_id": oi.product_id,
                        "name": oi.name,
                        "variant_name": oi.variant_name or "",
                        "sku": oi.sku or "",
                        "seller_id": oi.seller_id or s.seller_id,
                        "seller_name": oi.seller_name or seller_name,
                        "qty": oi.qty,
                        "price": oi.price,
                        "allocated_discount": float(oi.allocated_discount or 0.0),
                        "return_eligible": (s.status.value == "delivered" and oi.id not in ret_by_item),
                        "return_id": ret_by_item[oi.id].id if oi.id in ret_by_item else None,
                        "return_status": ret_by_item[oi.id].status.value if oi.id in ret_by_item else None,
                        "refund_status": ret_by_item[oi.id].refund_status if oi.id in ret_by_item else None,
                        "gateway_refund_id": ret_by_item[oi.id].gateway_refund_id if oi.id in ret_by_item else None,
                        "refund_amount": ret_by_item[oi.id].refund_amount if oi.id in ret_by_item else None,
                    }
                    for oi in s.items
                ]
            })

    oos_rec = None
    if db is not None and order.payment_status in ("refund_pending_oos", "refunded_oos"):
        oos_rec = (
            db.query(RefundRecord)
            .filter(
                RefundRecord.order_id == order.id,
                RefundRecord.refund_type == "OOS_AUTO",
            )
            .order_by(RefundRecord.id.desc())
            .first()
        )

    return {
        "id": order.id,
        "date": order.date,
        "items": [
            {
                "id": str(item.product_id or ""),
                "name": item.name,
                "variant_name": item.variant_name or "",
                "sku": item.sku or "",
                "seller_id": item.seller_id,
                "seller_name": item.seller_name or "",
                "qty": item.qty,
                "price": item.price,
                "allocated_discount": float(item.allocated_discount or 0.0),
            }
            for item in order.items
        ],
        "subtotal": order.subtotal,
        "discount": order.discount,
        "shipping_fee": float(order.shipping_fee or 0.0),
        "total": order.total,
        "status": order.status.value,
        "payment_method": order.payment_method,
        "payment_status": order.payment_status,
        "razorpay_order_id": order.razorpay_order_id,
        "reservation_token": order.reservation_token,
        "oos_refund_status": oos_rec.status if oos_rec else None,
        "oos_refund_id": oos_rec.provider_refund_id if oos_rec else None,
        "address": {
            "label": order.address_label,
            "text": order.address_text
        },
        "created_at": order.created_at,
        "suborders": suborders_list
    }


@router.post("/coupon/validate", response_model=CouponValidateResponse)
def validate_coupon(req: CouponValidateRequest, db: Session = Depends(get_db)):
    code_clean = req.code.strip().upper()
    coupon = db.query(Coupon).filter(Coupon.code == code_clean, Coupon.is_active == True).first()
    if not coupon:
        return CouponValidateResponse(
            valid=False,
            code=code_clean,
            discount=0.0,
            message="This coupon is not available."
        )

    discount = min(coupon.max_discount, round(req.subtotal * (coupon.discount_percent / 100.0)))
    return CouponValidateResponse(
        valid=True,
        code=coupon.code,
        discount=float(discount),
        message=f"{coupon.code} applied — you save ₹{int(discount)}"
    )


@router.post("/reserve", response_model=ReservationResponse, status_code=status.HTTP_201_CREATED)
def reserve_inventory_endpoint(
    req: ReservationCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return CommerceService.reserve_inventory(db, user.id, req.items)


@router.post("/checkout", response_model=MultiVendorCheckoutResponse, status_code=status.HTTP_201_CREATED)
def checkout_multi_vendor_endpoint(
    req: MultiVendorCheckoutRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return CommerceService.checkout_multi_vendor(db, user.id, req)


@router.post("/suborders/{suborder_id}/return", response_model=ReturnRequestResponse, status_code=status.HTTP_201_CREATED)
def request_return_endpoint(
    suborder_id: str,
    req: ReturnRequestCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return CommerceService.request_return(db, user.id, suborder_id, req)


def _order_query(db: Session):
    return db.query(Order).options(
        selectinload(Order.items),
        selectinload(Order.suborders).selectinload(SubOrder.items),
        selectinload(Order.suborders).selectinload(SubOrder.shipment),
        selectinload(Order.suborders).selectinload(SubOrder.seller),
    )


@router.post("/", response_model=OrderResponse)
def create_order(
    order_in: OrderCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not order_in.items and not order_in.reservation_token:
        raise HTTPException(status_code=400, detail="Cart is empty.")

    if not order_in.reservation_token:
        for item in order_in.items:
            if item.qty <= 0:
                raise HTTPException(status_code=400, detail="Quantity must be greater than 0.")

    # 1. Resolve Delivery Address
    address_label = (order_in.address_label or "Home").strip()
    address_text = (order_in.address_text or "").strip()

    if not address_text:
        if order_in.address_id:
            addr = db.query(Address).filter(Address.id == order_in.address_id, Address.user_id == user.id).first()
            if addr:
                address_label = addr.label
                address_text = addr.text
        if not address_text:
            first_addr = db.query(Address).filter(Address.user_id == user.id).first()
            if first_addr:
                address_label = first_addr.label
                address_text = first_addr.text
            else:
                raise HTTPException(status_code=400, detail="Please provide a delivery address before placing an order.")

    idem_key = order_in.idempotency_key.strip() if order_in.idempotency_key and order_in.idempotency_key.strip() else None
    norm_coupon = (order_in.coupon or "").strip().upper()
    norm_method = (order_in.payment_method or "UPI").strip()

    normalized_items = sorted(
        [
            {
                "product_id": (it.product_id or it.id or "").strip(),
                "listing_id": it.listing_id,
                "variant_name": (it.variant_name or it.variant or "").strip(),
                "qty": int(it.qty),
            }
            for it in (order_in.items or [])
        ],
        key=lambda x: (x["product_id"], str(x["listing_id"] or ""), x["variant_name"], x["qty"]),
    )
    legacy_fp = hashlib.sha256(
        json.dumps({
            "reservation_token": (order_in.reservation_token or "").strip(),
            "address_label": address_label,
            "address_text": address_text,
            "coupon_code": norm_coupon,
            "payment_method": norm_method.upper(),
            "items": normalized_items,
        }, sort_keys=True).encode("utf-8")
    ).hexdigest()

    if idem_key:
        existing_order = _order_query(db).filter(
            Order.customer_id == user.id,
            Order.idempotency_key == idem_key,
        ).first()
        if existing_order:
            if existing_order.request_fingerprint and existing_order.request_fingerprint != legacy_fp:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Idempotency key has already been used for a different order request."
                )
            return format_order(existing_order, db)

    # 2. Obtain inventory reservation via unified multi-vendor reservation engine
    created_local_res = False
    if order_in.reservation_token and order_in.reservation_token.strip():
        res_token = order_in.reservation_token.strip()
    else:
        res_items = [
            ReservationItem(
                listing_id=it.listing_id,
                product_id=(it.product_id or it.id),
                variant_name=(it.variant_name or it.variant or "").strip(),
                qty=it.qty,
            )
            for it in order_in.items
        ]
        try:
            res_data = CommerceService.reserve_inventory(db, user.id, res_items)
        except HTTPException as exc:
            if exc.status_code == status.HTTP_409_CONFLICT:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.detail)
            raise
        res_token = res_data["reservation_token"]
        created_local_res = True

    # 3. Execute unified multi-vendor checkout & release hold cleanly if checkout fails
    checkout_req = MultiVendorCheckoutRequest(
        reservation_token=res_token,
        address_label=address_label,
        address_text=address_text,
        coupon_code=order_in.coupon,
        payment_method=order_in.payment_method,
        idempotency_key=idem_key,
    )
    try:
        checkout_result = CommerceService.checkout_multi_vendor(
            db,
            user.id,
            checkout_req,
            request_fingerprint_override=legacy_fp if created_local_res else None,
        )
    except Exception:
        if created_local_res:
            try:
                CommerceService.release_reservation_hold(db, res_token)
            except Exception:
                db.rollback()
        raise

    if created_local_res and checkout_result.get("reservation_token") != res_token:
        try:
            CommerceService.release_reservation_hold(db, res_token)
        except Exception:
            db.rollback()

    created_order = _order_query(db).filter(Order.id == checkout_result["id"]).first()
    if not created_order:
        raise HTTPException(status_code=500, detail="Order creation committed but record could not be loaded.")
    return format_order(created_order, db)


@router.get("/my", response_model=List[OrderResponse])
def get_my_orders(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    orders = _order_query(db).filter(Order.customer_id == user.id).order_by(Order.created_at.desc()).all()
    return [format_order(o, db) for o in orders]


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = _order_query(db).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    if order.customer_id != user.id and user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view this order.")
    return format_order(order, db)
