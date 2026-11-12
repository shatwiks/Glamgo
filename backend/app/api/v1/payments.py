import hmac
import hashlib
import json
import secrets
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.api.deps import get_current_user
from backend.app.models.user import User, UserRole
from backend.app.models.payment import PaymentTransaction
from backend.app.models.order import Order, OrderStatus
from backend.app.models.booking import Booking
from backend.app.schemas.payment import (
    PaymentOrderCreate, PaymentOrderResponse, PaymentVerifyRequest, PaymentVerifyResponse
)

router = APIRouter()


@router.post("/razorpay/create-order", response_model=PaymentOrderResponse)
def create_razorpay_order(
    req: PaymentOrderCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Server-side validation of amount to prevent client tampering
    amount = req.amount
    if req.order_id:
        order = db.query(Order).filter(Order.id == req.order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found.")
        if order.customer_id != user.id and user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Not authorized to initiate payment for this order.")
        amount = order.total
    elif req.booking_id:
        booking = db.query(Booking).filter(Booking.id == req.booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found.")
        if booking.customer_id != user.id and user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Not authorized to initiate payment for this booking.")
        amount = booking.price

    # Generate globally unique, unguessable Razorpay order identifier
    razorpay_order_id = f"order_{secrets.token_hex(8)}"

    transaction = PaymentTransaction(
        user_id=user.id,
        order_id=req.order_id,
        booking_id=req.booking_id,
        razorpay_order_id=razorpay_order_id,
        amount=amount,
        currency="INR",
        status="created"
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    return PaymentOrderResponse(
        razorpay_order_id=razorpay_order_id,
        amount=amount,
        currency="INR",
        key_id=settings.RAZORPAY_KEY_ID
    )


@router.post("/razorpay/verify", response_model=PaymentVerifyResponse)
def verify_razorpay_payment(
    req: PaymentVerifyRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify transaction existence and ownership before signature verification
    transaction = db.query(PaymentTransaction).filter(
        PaymentTransaction.razorpay_order_id == req.razorpay_order_id
    ).first()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment transaction not found for provided order ID."
        )

    if transaction.user_id != user.id and user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to verify this transaction."
        )

    # Cryptographic HMAC-SHA256 signature verification against server secret
    msg = f"{req.razorpay_order_id}|{req.razorpay_payment_id}".encode("utf-8")
    expected_signature = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
        msg,
        hashlib.sha256
    ).hexdigest()

    is_valid = hmac.compare_digest(expected_signature, req.razorpay_signature)

    if not is_valid:
        transaction.status = "failed"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Razorpay payment signature."
        )

    # Signature valid: capture payment and update related order/booking state
    transaction.razorpay_payment_id = req.razorpay_payment_id
    transaction.razorpay_signature = req.razorpay_signature
    transaction.status = "captured"

    if transaction.order_id:
        order = db.query(Order).filter(Order.id == transaction.order_id).first()
        if order:
            order.payment_status = "completed"

    if transaction.booking_id:
        booking = db.query(Booking).filter(Booking.id == transaction.booking_id).first()
        if booking:
            booking.payment_status = "completed"

    db.commit()

    return PaymentVerifyResponse(
        success=True,
        status="captured",
        message="Payment verified and order confirmed successfully."
    )


@router.post("/razorpay/webhook")
async def razorpay_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Asynchronous Razorpay webhook receiver with HMAC-SHA256 signature validation
    and idempotent state machine reconciliation.
    """
    signature = request.headers.get("X-Razorpay-Signature")
    if not signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing X-Razorpay-Signature header"
        )

    body_bytes = await request.body()

    # 1. Cryptographic HMAC-SHA256 validation against webhook secret
    expected_signature = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
        body_bytes,
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, signature):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Razorpay webhook signature."
        )

    # 2. Parse event payload
    try:
        data = json.loads(body_bytes.decode("utf-8"))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Malformed JSON payload."
        )

    event = data.get("event")
    payload = data.get("payload", {})
    payment_entity = payload.get("payment", {}).get("entity", {})
    order_entity = payload.get("order", {}).get("entity", {})

    razorpay_order_id = payment_entity.get("order_id") or order_entity.get("id")
    razorpay_payment_id = payment_entity.get("id")

    if not razorpay_order_id and not razorpay_payment_id:
        return {"status": "ok", "message": "Ignored: No order/payment identifiers in payload"}

    # 3. Lookup transaction for state reconciliation
    transaction = None
    if razorpay_order_id:
        transaction = db.query(PaymentTransaction).filter(
            PaymentTransaction.razorpay_order_id == razorpay_order_id
        ).first()
    if not transaction and razorpay_payment_id:
        transaction = db.query(PaymentTransaction).filter(
            PaymentTransaction.razorpay_payment_id == razorpay_payment_id
        ).first()

    # 4. Handle event types idempotently
    if event in ["payment.captured", "order.paid"]:
        if transaction:
            # Idempotency check: if already captured, acknowledge immediately without duplicate writes
            if transaction.status == "captured":
                return {"status": "ok", "message": "Idempotent: Payment already captured"}

            transaction.status = "captured"
            if razorpay_payment_id:
                transaction.razorpay_payment_id = razorpay_payment_id

            if transaction.order_id:
                order = db.query(Order).filter(Order.id == transaction.order_id).first()
                if order:
                    order.payment_status = "completed"
                    order.status = OrderStatus.PLACED

            if transaction.booking_id:
                booking = db.query(Booking).filter(Booking.id == transaction.booking_id).first()
                if booking:
                    booking.payment_status = "completed"
                    booking.status = "confirmed"

            db.commit()
            return {"status": "ok", "event": event, "processed": True}

    elif event == "payment.failed":
        if transaction:
            transaction.status = "failed"
            db.commit()
            return {"status": "ok", "event": event, "processed": True}

    elif event == "refund.processed":
        if transaction:
            transaction.status = "refunded"
            db.commit()
            return {"status": "ok", "event": event, "processed": True}

    return {"status": "ok", "event": event, "processed": False, "note": "Event acknowledged without state mutation"}

