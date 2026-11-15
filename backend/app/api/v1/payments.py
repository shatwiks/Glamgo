import hmac
import hashlib
import json
import razorpay
import requests
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.api.deps import get_current_user
from backend.app.models.user import User, UserRole, Notification, BookingStatus
from backend.app.models.payment import PaymentTransaction
from backend.app.models.order import Order, OrderStatus
from backend.app.models.booking import Booking
from backend.app.schemas.payment import (
    PaymentOrderCreate, PaymentOrderResponse, PaymentVerifyRequest, PaymentVerifyResponse
)

router = APIRouter()


def get_razorpay_client() -> razorpay.Client:
    """Create an authenticated Razorpay SDK client from server-only environment settings."""
    key_id = (settings.RAZORPAY_KEY_ID or "").strip()
    key_secret = (settings.RAZORPAY_KEY_SECRET or "").strip()
    if not key_id or not key_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment gateway credentials are not configured on the server."
        )
    return razorpay.Client(auth=(key_id, key_secret))


def _raise_gateway_error(exc: Exception, operation: str) -> None:
    """Translate Razorpay SDK or transport errors into safe HTTP error responses."""
    msg = str(exc) or f"Gateway error during {operation}"
    lower = msg.lower()
    if "authentication" in lower or "unauthorized" in lower or "invalid api key" in lower:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Payment gateway authentication failed. Verify Razorpay credentials on the server."
        )
    if isinstance(exc, razorpay.errors.BadRequestError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment gateway rejected {operation}: {msg}"
        )
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Payment gateway is temporarily unavailable. Please try again."
    )


def _resolve_payment_target(db: Session, user: User, order_id: str | None, booking_id: str | None):
    """Validate payment target ownership and return (target_type, target_obj, server_amount_rupees)."""
    if bool(order_id) == bool(booking_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Specify exactly one of order_id or booking_id to initiate payment."
        )

    if order_id:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found.")
        if order.customer_id != user.id and user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Not authorized to initiate payment for this order.")
        if order.status == OrderStatus.CANCELLED:
            raise HTTPException(status_code=400, detail="Cannot initiate payment for a cancelled order.")
        captured_tx = db.query(PaymentTransaction).filter(
            PaymentTransaction.order_id == order.id,
            PaymentTransaction.status == "captured"
        ).first()
        if order.payment_status == "completed" or captured_tx:
            raise HTTPException(status_code=409, detail="Payment has already been completed for this order.")
        amount = float(order.total)
        if amount <= 0:
            raise HTTPException(status_code=400, detail="Order total must be greater than zero for online payment.")
        return "order", order, amount

    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.customer_id != user.id and user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to initiate payment for this booking.")
    if booking.status == BookingStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Cannot initiate payment for a cancelled booking.")
    captured_tx = db.query(PaymentTransaction).filter(
        PaymentTransaction.booking_id == booking.id,
        PaymentTransaction.status == "captured"
    ).first()
    if booking.payment_status == "completed" or captured_tx:
        raise HTTPException(status_code=409, detail="Payment has already been completed for this booking.")
    amount = float(booking.price)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Booking price must be greater than zero for online payment.")
    return "booking", booking, amount


def _mark_transaction_captured(
    db: Session,
    transaction: PaymentTransaction,
    razorpay_payment_id: str | None,
    razorpay_signature: str | None = None,
) -> None:
    """Idempotently transition transaction and linked order/booking to captured/completed."""
    transaction.status = "captured"
    if razorpay_payment_id:
        transaction.razorpay_payment_id = razorpay_payment_id
    if razorpay_signature:
        transaction.razorpay_signature = razorpay_signature

    if transaction.order_id:
        order = db.query(Order).filter(Order.id == transaction.order_id).first()
        if order:
            was_paid = order.payment_status == "completed"
            order.payment_status = "completed"
            if transaction.razorpay_order_id:
                order.razorpay_order_id = transaction.razorpay_order_id
            if not was_paid:
                db.add(Notification(
                    user_id=order.customer_id,
                    type="order",
                    text=f"Your order {order.id} is confirmed & paid."
                ))

    if transaction.booking_id:
        booking = db.query(Booking).filter(Booking.id == transaction.booking_id).first()
        if booking:
            was_paid = booking.payment_status == "completed"
            booking.payment_status = "completed"
            if transaction.razorpay_order_id:
                booking.razorpay_order_id = transaction.razorpay_order_id
            if not was_paid:
                db.add(Notification(
                    user_id=booking.customer_id,
                    type="booking",
                    text=f"Your booking {booking.id} is confirmed & paid."
                ))


def _lookup_transaction_for_verify(db: Session, req: PaymentVerifyRequest) -> PaymentTransaction:
    """Locate transaction using target or stored Razorpay order ID and enforce matching linkage."""
    tx = None
    if req.order_id:
        tx = db.query(PaymentTransaction).filter(
            PaymentTransaction.order_id == req.order_id,
            PaymentTransaction.razorpay_order_id == req.razorpay_order_id
        ).first()
        if not tx:
            other_tx = db.query(PaymentTransaction).filter(PaymentTransaction.order_id == req.order_id).first()
            if other_tx:
                raise HTTPException(status_code=400, detail="Razorpay order ID does not match the GlamGo order.")
    elif req.booking_id:
        tx = db.query(PaymentTransaction).filter(
            PaymentTransaction.booking_id == req.booking_id,
            PaymentTransaction.razorpay_order_id == req.razorpay_order_id
        ).first()
        if not tx:
            other_tx = db.query(PaymentTransaction).filter(PaymentTransaction.booking_id == req.booking_id).first()
            if other_tx:
                raise HTTPException(status_code=400, detail="Razorpay order ID does not match the GlamGo booking.")
    else:
        tx = db.query(PaymentTransaction).filter(
            PaymentTransaction.razorpay_order_id == req.razorpay_order_id
        ).first()

    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment transaction not found for provided order ID."
        )
    return tx


@router.post("/razorpay/create-order", response_model=PaymentOrderResponse)
def create_razorpay_order(
    req: PaymentOrderCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_type, target, server_amount = _resolve_payment_target(db, user, req.order_id, req.booking_id)
    amount_paise = int(round(server_amount * 100))
    if amount_paise < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimum online payment amount is ₹1 (100 paise)."
        )

    # Reuse existing pending Razorpay order for the same order/booking on safe retries
    existing_filter = (
        PaymentTransaction.order_id == target.id
        if target_type == "order"
        else PaymentTransaction.booking_id == target.id
    )
    existing_tx = db.query(PaymentTransaction).filter(
        existing_filter,
        PaymentTransaction.status == "created"
    ).order_by(PaymentTransaction.id.desc()).first()

    client = get_razorpay_client()

    if (
        existing_tx
        and existing_tx.razorpay_order_id
        and target.razorpay_order_id == existing_tx.razorpay_order_id
        and int(round(float(existing_tx.amount) * 100)) == amount_paise
    ):
        return PaymentOrderResponse(
            razorpay_order_id=existing_tx.razorpay_order_id,
            amount=float(existing_tx.amount),
            amount_paise=amount_paise,
            currency=existing_tx.currency,
            key_id=settings.RAZORPAY_KEY_ID
        )

    try:
        rzp_order = client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "receipt": target.id[:40],
            "notes": {
                "target_type": target_type,
                "target_id": target.id,
                "user_id": str(target.customer_id),
            },
        })
    except (
        razorpay.errors.BadRequestError,
        razorpay.errors.GatewayError,
        razorpay.errors.ServerError,
        requests.exceptions.RequestException,
    ) as exc:
        _raise_gateway_error(exc, "order creation")

    razorpay_order_id = rzp_order.get("id") if isinstance(rzp_order, dict) else None
    returned_amount = rzp_order.get("amount") if isinstance(rzp_order, dict) else None
    returned_currency = str(rzp_order.get("currency", "INR")).upper() if isinstance(rzp_order, dict) else ""

    if (
        not razorpay_order_id
        or int(returned_amount if returned_amount is not None else -1) != amount_paise
        or returned_currency != "INR"
    ):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Payment gateway returned an invalid or mismatched order payload."
        )

    transaction = PaymentTransaction(
        user_id=user.id,
        order_id=target.id if target_type == "order" else None,
        booking_id=target.id if target_type == "booking" else None,
        razorpay_order_id=razorpay_order_id,
        amount=server_amount,
        currency="INR",
        status="created"
    )
    target.razorpay_order_id = razorpay_order_id
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    return PaymentOrderResponse(
        razorpay_order_id=razorpay_order_id,
        amount=server_amount,
        amount_paise=amount_paise,
        currency="INR",
        key_id=settings.RAZORPAY_KEY_ID
    )


@router.post("/razorpay/verify", response_model=PaymentVerifyResponse)
def verify_razorpay_payment(
    req: PaymentVerifyRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    transaction = _lookup_transaction_for_verify(db, req)

    if transaction.user_id != user.id and user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to verify this transaction."
        )

    if transaction.status == "captured":
        if transaction.razorpay_payment_id == req.razorpay_payment_id:
            return PaymentVerifyResponse(
                success=True,
                status="captured",
                message="Payment already verified and confirmed."
            )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This order has already been paid under another payment reference."
        )

    if not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment gateway secret is not configured on the server."
        )

    # Always compute HMAC against the server-stored razorpay_order_id
    msg = f"{transaction.razorpay_order_id}|{req.razorpay_payment_id}".encode("utf-8")
    expected_signature = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
        msg,
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, req.razorpay_signature):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Razorpay payment signature."
        )

    client = get_razorpay_client()
    try:
        payment_data = client.payment.fetch(req.razorpay_payment_id)
    except (
        razorpay.errors.BadRequestError,
        razorpay.errors.GatewayError,
        razorpay.errors.ServerError,
        requests.exceptions.RequestException,
    ) as exc:
        _raise_gateway_error(exc, "payment lookup")

    expected_paise = int(round(float(transaction.amount) * 100))
    fetched_order_id = payment_data.get("order_id") if isinstance(payment_data, dict) else None
    fetched_currency = str(payment_data.get("currency", "")).upper() if isinstance(payment_data, dict) else ""
    fetched_amount = payment_data.get("amount") if isinstance(payment_data, dict) else None
    fetched_status = str(payment_data.get("status", "")).lower() if isinstance(payment_data, dict) else ""
    fetched_captured = bool(payment_data.get("captured")) if isinstance(payment_data, dict) else False

    if fetched_order_id != transaction.razorpay_order_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment order association mismatch."
        )
    if fetched_currency != "INR":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment currency does not match INR."
        )
    if fetched_amount is None or int(fetched_amount) != expected_paise:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Captured payment amount does not match expected order total."
        )
    if fetched_status != "captured" and not fetched_captured:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment is not captured (current status: {fetched_status or 'unknown'})."
        )

    _mark_transaction_captured(db, transaction, req.razorpay_payment_id, req.razorpay_signature)
    db.commit()

    return PaymentVerifyResponse(
        success=True,
        status="captured",
        message="Payment verified and order confirmed successfully."
    )


def _validate_webhook_capture_payload(
    transaction: PaymentTransaction,
    payment_entity: dict,
    order_entity: dict,
) -> None:
    expected_paise = int(round(float(transaction.amount) * 100))
    if payment_entity:
        if payment_entity.get("order_id") and payment_entity["order_id"] != transaction.razorpay_order_id:
            raise HTTPException(status_code=400, detail="Webhook payment order mismatch.")
        if payment_entity.get("currency") and str(payment_entity["currency"]).upper() != "INR":
            raise HTTPException(status_code=400, detail="Webhook currency mismatch.")
        if "amount" in payment_entity and int(payment_entity["amount"]) != expected_paise:
            raise HTTPException(status_code=400, detail="Webhook payment amount mismatch.")
        if payment_entity.get("status") and str(payment_entity["status"]).lower() != "captured":
            raise HTTPException(status_code=400, detail="Webhook payment status is not captured.")
    elif order_entity:
        if order_entity.get("id") and order_entity["id"] != transaction.razorpay_order_id:
            raise HTTPException(status_code=400, detail="Webhook order identifier mismatch.")
        if order_entity.get("currency") and str(order_entity["currency"]).upper() != "INR":
            raise HTTPException(status_code=400, detail="Webhook order currency mismatch.")
        paid_amt = order_entity.get("amount_paid", order_entity.get("amount"))
        if paid_amt is not None and int(paid_amt) != expected_paise:
            raise HTTPException(status_code=400, detail="Webhook order amount mismatch.")


@router.post("/razorpay/webhook")
async def razorpay_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Asynchronous Razorpay webhook receiver with HMAC-SHA256 raw-body signature validation
    and monotonic, idempotent state machine reconciliation.
    """
    signature = request.headers.get("X-Razorpay-Signature")
    if not signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing X-Razorpay-Signature header"
        )

    webhook_secret = (settings.RAZORPAY_WEBHOOK_SECRET or "").strip()
    if not webhook_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Razorpay webhook secret is not configured on the server."
        )

    body_bytes = await request.body()

    expected_signature = hmac.new(
        webhook_secret.encode("utf-8"),
        body_bytes,
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, signature):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Razorpay webhook signature."
        )

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

    transaction = None
    if razorpay_order_id:
        transaction = db.query(PaymentTransaction).filter(
            PaymentTransaction.razorpay_order_id == razorpay_order_id
        ).first()
    if not transaction and razorpay_payment_id:
        transaction = db.query(PaymentTransaction).filter(
            PaymentTransaction.razorpay_payment_id == razorpay_payment_id
        ).first()

    if not transaction:
        return {"status": "ok", "event": event, "processed": False, "note": "Transaction not found"}

    if event in ("payment.captured", "order.paid"):
        if transaction.status in ("captured", "refunded"):
            return {"status": "ok", "message": "Idempotent: Payment already captured"}

        _validate_webhook_capture_payload(transaction, payment_entity, order_entity)
        _mark_transaction_captured(db, transaction, razorpay_payment_id)
        db.commit()
        return {"status": "ok", "event": event, "processed": True}

    if event == "payment.failed":
        if transaction.status in ("captured", "refunded"):
            return {
                "status": "ok",
                "event": event,
                "processed": False,
                "note": "Ignored out-of-order failure event for settled payment"
            }
        transaction.status = "failed"
        if razorpay_payment_id and not transaction.razorpay_payment_id:
            transaction.razorpay_payment_id = razorpay_payment_id
        db.commit()
        return {"status": "ok", "event": event, "processed": True}

    if event == "refund.processed":
        if transaction.status == "refunded":
            return {"status": "ok", "message": "Idempotent: Refund already processed"}
        transaction.status = "refunded"
        db.commit()
        return {"status": "ok", "event": event, "processed": True}

    return {"status": "ok", "event": event, "processed": False, "note": "Event acknowledged without state mutation"}
