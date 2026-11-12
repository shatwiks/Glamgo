import time
import secrets
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.api.deps import get_current_user
from backend.app.models.user import User, Address, Notification, OrderStatus
from backend.app.models.catalog import Product
from backend.app.models.order import Order, OrderItem, Coupon
from backend.app.schemas.order import (
    OrderCreate, OrderResponse, OrderItemResponse,
    CouponValidateRequest, CouponValidateResponse
)
from backend.app.schemas.commerce import (
    ReservationCreate, ReservationResponse, MultiVendorCheckoutRequest,
    MultiVendorCheckoutResponse, ReturnRequestCreate, ReturnRequestResponse
)
from backend.app.services.commerce_service import CommerceService

router = APIRouter()


def format_order(order: Order) -> dict:
    suborders_list = []
    if hasattr(order, "suborders") and order.suborders:
        for s in order.suborders:
            suborders_list.append({
                "suborder_id": s.id,
                "seller_id": s.seller_id,
                "seller_name": s.seller.full_name if s.seller else f"Seller #{s.seller_id}",
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
                        "qty": oi.qty,
                        "price": oi.price,
                        "return_eligible": (s.status.value == "delivered")
                    }
                    for oi in s.items
                ]
            })

    return {
        "id": order.id,
        "date": order.date,
        "items": [
            {
                "id": str(item.product_id),
                "name": item.name,
                "qty": item.qty,
                "price": item.price
            }
            for item in order.items
        ],
        "subtotal": order.subtotal,
        "discount": order.discount,
        "total": order.total,
        "status": order.status.value,
        "payment_method": order.payment_method,
        "payment_status": order.payment_status,
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


@router.post("/", response_model=OrderResponse)
def create_order(
    order_in: OrderCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not order_in.items:
        raise HTTPException(status_code=400, detail="Cart is empty.")

    # 1. Resolve Delivery Address
    address_label = order_in.address_label or "Home"
    address_text = order_in.address_text

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

    # 2. Server-side Financial Calculations & Stock verification in transaction
    subtotal = 0.0
    order_items_to_create = []

    for item in order_in.items:
        product = db.query(Product).filter(Product.id == item.id, Product.is_active == True).with_for_update().first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with id '{item.id}' is not available.")
        if item.qty <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be greater than 0.")
        if product.stock < item.qty:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for '{product.name}'. Only {product.stock} left.")

        # Decrement inventory
        product.stock -= item.qty
        item_total = product.price * item.qty
        subtotal += item_total

        order_items_to_create.append({
            "product_id": product.id,
            "name": product.name,
            "qty": item.qty,
            "price": product.price
        })

    # 3. Server-side Coupon Calculation
    discount = 0.0
    coupon_applied = None
    if order_in.coupon:
        code_clean = order_in.coupon.strip().upper()
        coupon = db.query(Coupon).filter(Coupon.code == code_clean, Coupon.is_active == True).first()
        if not coupon:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Coupon code '{order_in.coupon}' is invalid or expired."
            )
        discount = min(coupon.max_discount, round(subtotal * (coupon.discount_percent / 100.0)))
        coupon_applied = coupon.code

    total = max(0.0, subtotal - discount)
    # Generate globally unique, collision-proof order identifier
    order_id = f"GG-{secrets.token_hex(4).upper()}"
    today_str = datetime.now().strftime("%Y-%m-%d")

    # Payment lifecycle enforcement
    is_cod = order_in.payment_method.strip().upper() in ["COD", "CASH ON DELIVERY", "CASH"]
    order_status = OrderStatus.PLACED
    payment_status = "pending"

    try:
        order = Order(
            id=order_id,
            customer_id=user.id,
            date=today_str,
            subtotal=subtotal,
            discount=discount,
            total=total,
            status=order_status,
            payment_method=order_in.payment_method,
            payment_status=payment_status,
            address_label=address_label,
            address_text=address_text,
            coupon_code=coupon_applied
        )
        db.add(order)
        db.flush()

        for item_data in order_items_to_create:
            db.add(OrderItem(
                order_id=order.id,
                product_id=item_data["product_id"],
                name=item_data["name"],
                qty=item_data["qty"],
                price=item_data["price"]
            ))

        # Add notification
        notif = Notification(
            user_id=user.id,
            type="order",
            text=f"Your order {order.id} is confirmed."
        )
        db.add(notif)
        db.commit()
        db.refresh(order)
    except Exception:
        db.rollback()
        raise

    return format_order(order)


@router.get("/my", response_model=List[OrderResponse])
def get_my_orders(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    orders = db.query(Order).filter(Order.customer_id == user.id).order_by(Order.created_at.desc()).all()
    return [format_order(o) for o in orders]


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    if order.customer_id != user.id and user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view this order.")
    return format_order(order)
