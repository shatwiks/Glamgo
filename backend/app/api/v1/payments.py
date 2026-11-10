import hmac
import hashlib
import secrets
from fastapi import APIRouter, Depends, HTTPException, status
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
    # Generate globally unique, unguessable Razorpay order identifier
    razorpay_order_id = f"order_{secrets.token_hex(8)}"

    transaction = PaymentTransaction(
        user_id=user.id,
        order_id=req.order_id,
        booking_id=req.booking_id,
        razorpay_order_id=razorpay_order_id,
        amount=req.amount,
        currency="INR",
        status="created"
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    return PaymentOrderResponse(
        razorpay_order_id=razorpay_order_id,
        amount=req.amount,
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
