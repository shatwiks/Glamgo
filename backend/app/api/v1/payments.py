import hmac
import hashlib
import json
import secrets
from datetime import datetime, timezone
import razorpay
import requests
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from backend.app.core.database import get_db, SessionLocal
from backend.app.core.config import settings
from backend.app.api.deps import get_current_user
from backend.app.models.user import User, UserRole, Notification, BookingStatus
from backend.app.models.payment import PaymentTransaction
from backend.app.models.order import Order, OrderStatus
from backend.app.models.booking import Booking
from backend.app.models.commerce import (
    SellerListing, SubOrder, SubOrderStatus, ReturnRequest, ReturnStatus,
    InventoryAuditLog, StockAction, SellerEscrowRecord, EscrowStatus,
    RefundRecord,
)
from backend.app.services.commerce_service import (
    CommerceService, to_paise, to_rupees, is_cod_payment_method,
)
from backend.app.services.refund_service import (
    RefundService, RefundGatewayError, RefundInFlightError, RefundValidationError,
)
from backend.app.services.cache_service import cache_service
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
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Payment gateway authentication failed. Verify Razorpay credentials on the server."
        )
    if isinstance(exc, razorpay.errors.BadRequestError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment gateway rejected {operation}: {msg}"
        )
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Payment gateway error occurred while processing the request. Please try again."
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
        if is_cod_payment_method(order.payment_method):
            raise HTTPException(status_code=400, detail="Cash on Delivery orders do not require online payment.")
        captured_tx = db.query(PaymentTransaction).filter(
            PaymentTransaction.order_id == order.id,
            PaymentTransaction.status.in_(("captured", "refunded")),
        ).first()
        if order.payment_status in ("completed", "partially_refunded", "refunded", "refunded_oos", "refund_pending_oos") or captured_tx:
            raise HTTPException(status_code=409, detail="Payment has already been completed for this order.")
        amount = to_rupees(to_paise(order.total))
        if to_paise(amount) <= 0:
            raise HTTPException(status_code=400, detail="Order total must be greater than zero for online payment.")
        return "order", order, amount

    booking = db.query(Booking).filter(Booking.id == booking_id).with_for_update().populate_existing().first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.customer_id != user.id and user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to initiate payment for this booking.")
    if booking.status == BookingStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Cannot initiate payment for a cancelled booking.")
    captured_tx = db.query(PaymentTransaction).filter(
        PaymentTransaction.booking_id == booking.id,
        PaymentTransaction.status.in_(("captured", "refunded")),
    ).first()
    if booking.payment_status in ("completed", "refunded") or captured_tx:
        raise HTTPException(status_code=409, detail="Payment has already been completed for this booking.")
    amount = to_rupees(to_paise(booking.price))
    if to_paise(amount) <= 0:
        raise HTTPException(status_code=400, detail="Booking price must be greater than zero for online payment.")
    return "booking", booking, amount


def _apply_capture_in_tx(
    db: Session,
    transaction: PaymentTransaction,
    razorpay_payment_id: str | None,
    razorpay_signature: str | None = None,
) -> tuple[str, int | None]:
    """
    Idempotently transition locked transaction and linked order/booking inside a DB transaction.
    Returns (outcome, oos_refund_record_id) where outcome is 'captured', 'restored', or
    'oos_needs_refund'.
    """
    transaction.status = "captured"
    if razorpay_payment_id:
        transaction.razorpay_payment_id = razorpay_payment_id
    if razorpay_signature:
        transaction.razorpay_signature = razorpay_signature

    outcome = "captured"
    oos_refund_record_id: int | None = None

    if transaction.order_id:
        order = (
            db.query(Order)
            .filter(Order.id == transaction.order_id)
            .with_for_update()
            .populate_existing()
            .first()
        )
        if order:
            if transaction.razorpay_order_id:
                order.razorpay_order_id = transaction.razorpay_order_id

            if order.status == OrderStatus.CANCELLED:
                needed_by_listing: dict[int, int] = {}
                for oi in (order.items or []):
                    if oi.seller_listing_id:
                        needed_by_listing[oi.seller_listing_id] = needed_by_listing.get(oi.seller_listing_id, 0) + oi.qty

                sorted_lids = sorted(needed_by_listing.keys())
                lmap: dict[int, SellerListing] = {}
                can_fulfill = bool(sorted_lids)
                for lid in sorted_lids:
                    lst = (
                        db.query(SellerListing)
                        .filter(SellerListing.id == lid)
                        .with_for_update()
                        .populate_existing()
                        .first()
                    )
                    if not lst or not lst.is_active or lst.stock < needed_by_listing[lid]:
                        can_fulfill = False
                    if lst:
                        lmap[lid] = lst

                if can_fulfill:
                    affected_pids: set[str] = set()
                    for oi in (order.items or []):
                        lst = lmap.get(oi.seller_listing_id)
                        if lst:
                            before_s = lst.stock
                            lst.stock -= oi.qty
                            affected_pids.add(lst.product_id)
                            db.add(InventoryAuditLog(
                                listing_id=lst.id,
                                seller_id=lst.seller_id,
                                action=StockAction.CHECKOUT_DECREMENT,
                                quantity_delta=-oi.qty,
                                balance_before=before_s,
                                balance_after=lst.stock,
                                reference_type="LATE_CAPTURE_RESTORE",
                                reference_id=order.id,
                            ))
                    for pid in sorted(affected_pids):
                        CommerceService.sync_product_stock(db, pid)

                    order.status = OrderStatus.PLACED
                    order.payment_status = "completed"
                    order.payment_expires_at = None
                    now_utc = datetime.now(timezone.utc)
                    for sub in (order.suborders or []):
                        if sub.status == SubOrderStatus.CANCELLED:
                            sub.status = SubOrderStatus.PLACED
                            sub.updated_at = now_utc
                        esc = (
                            db.query(SellerEscrowRecord)
                            .filter(SellerEscrowRecord.suborder_id == sub.id)
                            .with_for_update()
                            .populate_existing()
                            .first()
                        )
                        if esc:
                            esc.status = EscrowStatus.HELD_IN_ESCROW
                    db.add(Notification(
                        user_id=order.customer_id,
                        type="order",
                        text=f"Late payment received: your order {order.id} has been restored & confirmed."
                    ))
                    cache_service.invalidate_catalog()
                    outcome = "restored"
                else:
                    if order.payment_status != "refunded_oos":
                        order.payment_status = "refund_pending_oos"
                    order.payment_expires_at = None
                    for sub in (order.suborders or []):
                        sub.status = SubOrderStatus.CANCELLED
                        esc = (
                            db.query(SellerEscrowRecord)
                            .filter(SellerEscrowRecord.suborder_id == sub.id)
                            .with_for_update()
                            .populate_existing()
                            .first()
                        )
                        if esc:
                            esc.status = EscrowStatus.CLAWBACK_REFUND
                            esc.net_settlement = 0.0

                    cap_pay_id = razorpay_payment_id or transaction.razorpay_payment_id
                    if cap_pay_id:
                        # Flush captured/OOS mutations before create_or_get_refund_intent locks & refreshes rows with populate_existing()
                        db.flush()
                        oos_rec, created_intent = RefundService.create_or_get_refund_intent(
                            db,
                            logical_key=f"oos:{order.id}:{cap_pay_id}",
                            refund_type="OOS_AUTO",
                            order_id=order.id,
                            amount_paise=to_paise(transaction.amount),
                            captured_payment_id=cap_pay_id,
                            payment_transaction_id=transaction.id,
                            extra_notes={"reason": "late_capture_out_of_stock"},
                        )
                        oos_refund_record_id = oos_rec.id
                        if created_intent:
                            db.add(Notification(
                                user_id=order.customer_id,
                                type="order",
                                text=f"Payment captured after hold expired for order {order.id}, which is now out of stock. Initiating full automatic refund."
                            ))
                    outcome = "oos_needs_refund"
            else:
                was_paid = order.payment_status == "completed"
                order.payment_status = "completed"
                order.payment_expires_at = None
                if not was_paid:
                    db.add(Notification(
                        user_id=order.customer_id,
                        type="order",
                        text=f"Your order {order.id} is confirmed & paid."
                    ))

    if transaction.booking_id:
        booking = (
            db.query(Booking)
            .filter(Booking.id == transaction.booking_id)
            .with_for_update()
            .populate_existing()
            .first()
        )
        if booking:
            was_paid = booking.payment_status == "completed"
            booking.payment_status = "completed"
            if booking.status == BookingStatus.PENDING:
                booking.status = BookingStatus.CONFIRMED
                if not booking.arrival_otp:
                    booking.arrival_otp = f"{secrets.randbelow(9000) + 1000}"
            if transaction.razorpay_order_id:
                booking.razorpay_order_id = transaction.razorpay_order_id
            if not was_paid:
                db.add(Notification(
                    user_id=booking.customer_id,
                    type="booking",
                    text=f"Your booking {booking.id} is confirmed & paid."
                ))

    return outcome, oos_refund_record_id


def _refund_oos_capture_outside_locks(
    db: Session,
    tx_id: int,
    payment_id: str | None,
    refund_record_id: int | None = None,
    *,
    applied_via: str = "oos_auto",
) -> tuple[str, str, str | None]:
    """
    Execute or reconcile a durable OOS automatic Razorpay refund WITHOUT holding DB locks.
    Independent of ReturnRequest. Returns (order_payment_status, refund_record_status, provider_refund_id).
    """
    tx = db.query(PaymentTransaction).filter(PaymentTransaction.id == tx_id).populate_existing().first()
    if not tx:
        return "refund_pending_oos", "UNKNOWN", None

    rec_id = refund_record_id
    if rec_id is None and tx.order_id:
        cap_pay_id = payment_id or tx.razorpay_payment_id
        if cap_pay_id:
            rec, _ = RefundService.create_or_get_refund_intent(
                db,
                logical_key=f"oos:{tx.order_id}:{cap_pay_id}",
                refund_type="OOS_AUTO",
                order_id=tx.order_id,
                amount_paise=to_paise(tx.amount),
                captured_payment_id=cap_pay_id,
                payment_transaction_id=tx.id,
                extra_notes={"reason": "late_capture_out_of_stock"},
            )
            db.commit()
            rec_id = rec.id

    if rec_id is None:
        return "refund_pending_oos", "UNKNOWN", None

    try:
        RefundService.execute_or_reconcile_refund(
            db,
            rec_id,
            applied_via=applied_via,
            ignore_backoff=True,
        )
    except (RefundGatewayError, RefundInFlightError, RefundValidationError):
        pass
    except Exception:
        try:
            db.rollback()
        except Exception:
            pass

    rec = db.query(RefundRecord).filter(RefundRecord.id == rec_id).populate_existing().first()
    order = db.query(Order).filter(Order.id == tx.order_id).populate_existing().first() if tx.order_id else None
    final_order_status = order.payment_status if order else "refund_pending_oos"
    if final_order_status not in ("refunded_oos", "refund_pending_oos"):
        final_order_status = "refunded_oos" if (rec and rec.status == "PROCESSED") else "refund_pending_oos"
    return (
        final_order_status,
        rec.status if rec else "UNKNOWN",
        rec.provider_refund_id if rec else None,
    )


def _build_verify_response_for_settled_tx(
    db: Session,
    transaction: PaymentTransaction,
    req_payment_id: str | None,
) -> PaymentVerifyResponse:
    """
    Resolve linked Order/Booking state authoritatively before answering /payments/razorpay/verify.
    Never returns success=True/payment_status='completed' for cancelled or OOS-refund orders.
    """
    if (
        transaction.status == "captured"
        and transaction.razorpay_payment_id
        and req_payment_id
        and transaction.razorpay_payment_id != req_payment_id
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This order has already been paid under another payment reference."
        )

    if transaction.order_id:
        order = (
            db.query(Order)
            .filter(Order.id == transaction.order_id)
            .populate_existing()
            .first()
        )
        oos_rec = (
            db.query(RefundRecord)
            .filter(
                RefundRecord.order_id == transaction.order_id,
                RefundRecord.refund_type == "OOS_AUTO",
            )
            .order_by(RefundRecord.id.desc())
            .populate_existing()
            .first()
        )
        if order:
            if (
                order.payment_status == "refunded_oos"
                or (oos_rec and oos_rec.status == "PROCESSED")
                or (transaction.status == "refunded" and order.status == OrderStatus.CANCELLED)
            ):
                return PaymentVerifyResponse(
                    success=False,
                    status="refunded_oos",
                    payment_status="refunded_oos",
                    order_status=order.status.value,
                    refund_status="PROCESSED",
                    refund_id=(oos_rec.provider_refund_id if oos_rec else transaction.refund_id),
                    message="Payment was captured after hold expired while out of stock and has been automatically refunded.",
                )

            if (
                order.payment_status == "refund_pending_oos"
                or (order.status == OrderStatus.CANCELLED and transaction.status in ("captured", "refund_pending"))
            ):
                return PaymentVerifyResponse(
                    success=False,
                    status="refund_pending_oos",
                    payment_status="refund_pending_oos",
                    order_status=order.status.value,
                    refund_status=(oos_rec.status if oos_rec else "PENDING"),
                    refund_id=(oos_rec.provider_refund_id if oos_rec else transaction.refund_id),
                    message="Order was cancelled after reservation expiry while out of stock; automatic full refund is in progress.",
                )

            if order.payment_status == "refunded" or transaction.status == "refunded":
                return PaymentVerifyResponse(
                    success=False,
                    status="refunded",
                    payment_status="refunded",
                    order_status=order.status.value,
                    refund_status="PROCESSED",
                    refund_id=transaction.refund_id,
                    message="Payment was already captured and refunded.",
                )

            return PaymentVerifyResponse(
                success=True,
                status="captured",
                payment_status=order.payment_status or "completed",
                order_status=order.status.value,
                message="Payment already verified and confirmed.",
            )

    if transaction.status == "refunded":
        return PaymentVerifyResponse(
            success=False,
            status="refunded",
            payment_status="refunded",
            refund_status="PROCESSED",
            refund_id=transaction.refund_id,
            message="Payment was already captured and refunded.",
        )

    return PaymentVerifyResponse(
        success=True,
        status="captured",
        payment_status="completed",
        message="Payment already verified and confirmed.",
    )


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
    amount_paise = to_paise(server_amount)
    if amount_paise < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimum online payment amount is ₹1 (100 paise)."
        )

    idem_key = req.idempotency_key.strip() if req.idempotency_key and req.idempotency_key.strip() else None
    fingerprint = hashlib.sha256(
        json.dumps(
            {
                "target_type": target_type,
                "target_id": target.id,
                "amount_paise": amount_paise,
            },
            sort_keys=True,
        ).encode("utf-8")
    ).hexdigest()

    if idem_key:
        idem_tx = db.query(PaymentTransaction).filter(
            PaymentTransaction.user_id == user.id,
            PaymentTransaction.idempotency_key == idem_key,
        ).first()
        if idem_tx:
            if idem_tx.request_fingerprint and idem_tx.request_fingerprint != fingerprint:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Idempotency key has already been used for a different payment request."
                )
            if idem_tx.status == "initiating":
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Payment initiation already in progress; please retry shortly."
                )
            if idem_tx.razorpay_order_id and idem_tx.status in ("created", "captured"):
                return PaymentOrderResponse(
                    order_id=idem_tx.razorpay_order_id,
                    razorpay_order_id=idem_tx.razorpay_order_id,
                    amount=float(idem_tx.amount),
                    amount_paise=to_paise(idem_tx.amount),
                    currency=idem_tx.currency,
                    key_id=settings.RAZORPAY_KEY_ID,
                )

    # Reuse existing pending Razorpay order for the same order/booking on safe retries
    existing_filter = (
        PaymentTransaction.order_id == target.id
        if target_type == "order"
        else PaymentTransaction.booking_id == target.id
    )
    if target_type == "booking" and db.query(PaymentTransaction).filter(
        existing_filter, PaymentTransaction.status == "initiating"
    ).first():
        raise HTTPException(status_code=409, detail="A payment attempt is still being reconciled. Please contact support before trying again.")
    existing_tx = db.query(PaymentTransaction).filter(
        existing_filter,
        PaymentTransaction.status == "created"
    ).order_by(PaymentTransaction.id.desc()).first()

    client = get_razorpay_client()

    if (
        existing_tx
        and existing_tx.razorpay_order_id
        and target.razorpay_order_id == existing_tx.razorpay_order_id
        and to_paise(existing_tx.amount) == amount_paise
    ):
        return PaymentOrderResponse(
            order_id=existing_tx.razorpay_order_id,
            razorpay_order_id=existing_tx.razorpay_order_id,
            amount=float(existing_tx.amount),
            amount_paise=amount_paise,
            currency=existing_tx.currency,
            key_id=settings.RAZORPAY_KEY_ID
        )

    # Pre-commit an initiating PaymentTransaction before external gateway I/O so no DB locks are held
    pending_ref = f"init_{secrets.token_hex(8)}"
    transaction = PaymentTransaction(
        user_id=user.id,
        order_id=target.id if target_type == "order" else None,
        booking_id=target.id if target_type == "booking" else None,
        razorpay_order_id=pending_ref,
        idempotency_key=idem_key,
        request_fingerprint=fingerprint,
        amount=server_amount,
        currency="INR",
        status="initiating"
    )
    db.add(transaction)
    try:
        db.commit()
        db.refresh(transaction)
    except IntegrityError:
        db.rollback()
        if idem_key:
            dup = db.query(PaymentTransaction).filter(
                PaymentTransaction.user_id == user.id,
                PaymentTransaction.idempotency_key == idem_key,
            ).first()
            if dup:
                if dup.request_fingerprint and dup.request_fingerprint != fingerprint:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Idempotency key has already been used for a different payment request."
                    )
                if dup.razorpay_order_id and dup.status in ("created", "captured"):
                    return PaymentOrderResponse(
                        order_id=dup.razorpay_order_id,
                        razorpay_order_id=dup.razorpay_order_id,
                        amount=float(dup.amount),
                        amount_paise=to_paise(dup.amount),
                        currency=dup.currency,
                        key_id=settings.RAZORPAY_KEY_ID,
                    )
        raise

    tx_id = transaction.id
    target_id_val = target.id
    customer_id_val = target.customer_id

    try:
        rzp_order = client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "receipt": target_id_val[:40],
            "notes": {
                "target_type": target_type,
                "target_id": target_id_val,
                "user_id": str(customer_id_val),
                "tx_id": str(tx_id),
            },
        })
    except (
        razorpay.errors.BadRequestError,
        razorpay.errors.GatewayError,
        razorpay.errors.ServerError,
        requests.exceptions.RequestException,
    ) as exc:
        failed_tx = db.query(PaymentTransaction).filter(PaymentTransaction.id == tx_id).first()
        if failed_tx and failed_tx.status == "initiating":
            # BadRequestError (including gateway Authentication failed) confirms no order was created.
            # Only ambiguous transport/server errors keep initiating booking tx for reconciliation.
            if target_type != "booking" or isinstance(exc, razorpay.errors.BadRequestError):
                db.delete(failed_tx)
            db.commit()
        _raise_gateway_error(exc, "order creation")

    razorpay_order_id = rzp_order.get("id") if isinstance(rzp_order, dict) else None
    returned_amount = rzp_order.get("amount") if isinstance(rzp_order, dict) else None
    returned_currency = str(rzp_order.get("currency", "INR")).upper() if isinstance(rzp_order, dict) else ""

    if (
        not razorpay_order_id
        or int(returned_amount if returned_amount is not None else -1) != amount_paise
        or returned_currency != "INR"
    ):
        bad_tx = db.query(PaymentTransaction).filter(PaymentTransaction.id == tx_id).first()
        if bad_tx and bad_tx.status == "initiating":
            # Preserve unresolved booking attempts for reconciliation.
            if target_type != "booking":
                db.delete(bad_tx)
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Payment gateway returned an invalid or mismatched order payload."
        )

    try:
        tx_to_update = (
            db.query(PaymentTransaction)
            .filter(PaymentTransaction.id == tx_id)
            .with_for_update()
            .populate_existing()
            .first()
        )
        if tx_to_update:
            tx_to_update.razorpay_order_id = razorpay_order_id
            if tx_to_update.status == "initiating":
                tx_to_update.status = "created"
        if target_type == "order":
            t_row = db.query(Order).filter(Order.id == target_id_val).first()
        else:
            t_row = db.query(Booking).filter(Booking.id == target_id_val).first()
        if t_row:
            t_row.razorpay_order_id = razorpay_order_id
        db.commit()
    except Exception:
        db.rollback()
        rec_db = SessionLocal()
        try:
            rec_tx = rec_db.query(PaymentTransaction).filter(PaymentTransaction.id == tx_id).first()
            if rec_tx:
                rec_tx.razorpay_order_id = razorpay_order_id
                if rec_tx.status == "initiating":
                    rec_tx.status = "created"
            if target_type == "order":
                rec_t = rec_db.query(Order).filter(Order.id == target_id_val).first()
            else:
                rec_t = rec_db.query(Booking).filter(Booking.id == target_id_val).first()
            if rec_t:
                rec_t.razorpay_order_id = razorpay_order_id
            rec_db.commit()
        finally:
            rec_db.close()

    return PaymentOrderResponse(
        order_id=razorpay_order_id,
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
    if not (
        req.razorpay_order_id and req.razorpay_order_id.strip()
        and req.razorpay_payment_id and req.razorpay_payment_id.strip()
        and req.razorpay_signature and req.razorpay_signature.strip()
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required Razorpay verification fields (razorpay_order_id, razorpay_payment_id, razorpay_signature)."
        )

    transaction = _lookup_transaction_for_verify(db, req)

    if transaction.user_id != user.id and user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to verify this transaction."
        )

    if transaction.status in ("captured", "refunded"):
        return _build_verify_response_for_settled_tx(db, transaction, req.razorpay_payment_id)

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
    tx_id = transaction.id
    expected_paise = to_paise(transaction.amount)
    stored_rzp_order_id = transaction.razorpay_order_id

    # Commit any pending changes in the caller's session and close read transaction before external gateway call
    db.commit()

    try:
        payment_data = client.payment.fetch(req.razorpay_payment_id)
    except (
        razorpay.errors.BadRequestError,
        razorpay.errors.GatewayError,
        razorpay.errors.ServerError,
        requests.exceptions.RequestException,
    ) as exc:
        _raise_gateway_error(exc, "payment lookup")

    fetched_order_id = payment_data.get("order_id") if isinstance(payment_data, dict) else None
    fetched_currency = str(payment_data.get("currency", "")).upper() if isinstance(payment_data, dict) else ""
    fetched_amount = payment_data.get("amount") if isinstance(payment_data, dict) else None
    fetched_status = str(payment_data.get("status", "")).lower() if isinstance(payment_data, dict) else ""
    fetched_captured = bool(payment_data.get("captured")) if isinstance(payment_data, dict) else False

    if fetched_order_id != stored_rzp_order_id:
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

    locked_tx = (
        db.query(PaymentTransaction)
        .filter(PaymentTransaction.id == tx_id)
        .with_for_update()
        .populate_existing()
        .first()
    )
    if not locked_tx:
        raise HTTPException(status_code=404, detail="Payment transaction no longer exists.")

    if locked_tx.status in ("captured", "refunded"):
        return _build_verify_response_for_settled_tx(db, locked_tx, req.razorpay_payment_id)

    outcome, oos_rec_id = _apply_capture_in_tx(db, locked_tx, req.razorpay_payment_id, req.razorpay_signature)
    db.commit()

    if outcome == "oos_needs_refund":
        final_pay_status, ref_rec_status, ref_id = _refund_oos_capture_outside_locks(
            db, tx_id, req.razorpay_payment_id, oos_rec_id, applied_via="verify_oos"
        )
        msg = (
            f"Payment captured after hold expired while out of stock; full automatic refund ({ref_id}) completed."
            if final_pay_status == "refunded_oos"
            else "Payment captured after hold expired and stock sold out; automatic full refund is being processed."
        )
        return PaymentVerifyResponse(
            success=False,
            status=final_pay_status,
            payment_status=final_pay_status,
            order_status=OrderStatus.CANCELLED.value,
            refund_status=ref_rec_status,
            refund_id=ref_id,
            message=msg,
        )

    return PaymentVerifyResponse(
        success=True,
        status="captured",
        payment_status="completed",
        order_status=OrderStatus.PLACED.value,
        message=(
            "Late payment verified and order restored successfully."
            if outcome == "restored"
            else "Payment verified and order confirmed successfully."
        ),
    )


def _validate_webhook_capture_payload(
    transaction: PaymentTransaction,
    payment_entity: dict,
    order_entity: dict,
) -> None:
    expected_paise = to_paise(transaction.amount)
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
    payment_entity = payload.get("payment", {}).get("entity", {}) or {}
    order_entity = payload.get("order", {}).get("entity", {}) or {}
    refund_entity = payload.get("refund", {}).get("entity", {}) or {}

    # 1. Reconcile async gateway refund webhooks via shared atomic settlement layer
    if event in ("refund.processed", "refund.failed", "refund.created"):
        raw_entity_status = str(refund_entity.get("status") or "").strip().lower()
        if not raw_entity_status:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Webhook refund payload is missing explicit 'status'.",
            )
        expected_status_map = {
            "refund.processed": {"processed"},
            "refund.failed": {"failed"},
            "refund.created": {"created", "pending", "processed"},
        }
        if raw_entity_status not in expected_status_map[event]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Webhook refund status '{raw_entity_status}' conflicts with event '{event}'.",
            )

        refund_id = str(refund_entity.get("id") or "").strip() or None
        ref_payment_id = str(refund_entity.get("payment_id") or payment_entity.get("id") or "").strip() or None
        ref_receipt = str(refund_entity.get("receipt") or "").strip() or None
        ref_notes = refund_entity.get("notes") if isinstance(refund_entity.get("notes"), dict) else {}
        note_logical_key = ref_notes.get("logical_key")
        note_idem_key = ref_notes.get("idempotency_key")
        ret_id = ref_notes.get("return_id")

        # Read-only lookup first so apply_provider_refund_outcome acquires ALL locks in canonical order
        rec = None
        if refund_id:
            rec = db.query(RefundRecord).filter(RefundRecord.provider_refund_id == refund_id).first()
        if not rec and ref_receipt:
            rec = db.query(RefundRecord).filter(RefundRecord.receipt == ref_receipt).first()
        if not rec and note_idem_key:
            rec = db.query(RefundRecord).filter(RefundRecord.idempotency_key == note_idem_key).first()
        if not rec and note_logical_key:
            rec = db.query(RefundRecord).filter(RefundRecord.logical_key == note_logical_key).first()
        if not rec and ret_id:
            rec = db.query(RefundRecord).filter(RefundRecord.return_request_id == ret_id).first()
        if not rec and ref_payment_id:
            oos_candidates = (
                db.query(RefundRecord)
                .filter(
                    RefundRecord.captured_payment_id == ref_payment_id,
                    RefundRecord.refund_type == "OOS_AUTO",
                )
                .all()
            )
            if len(oos_candidates) == 1:
                rec = oos_candidates[0]

        # Backfill-create RefundRecord only if a pre-migration ReturnRequest or OOS PaymentTransaction matches unambiguously
        if not rec:
            ret_req = None
            if refund_id:
                ret_req = db.query(ReturnRequest).filter(ReturnRequest.gateway_refund_id == refund_id).first()
            if not ret_req and ret_id:
                ret_req = db.query(ReturnRequest).filter(ReturnRequest.id == ret_id).first()
            if ret_req:
                sub = db.query(SubOrder).filter(SubOrder.id == ret_req.suborder_id).first()
                parent_id = sub.parent_order_id if sub else None
                cap_tx = (
                    db.query(PaymentTransaction)
                    .filter(
                        PaymentTransaction.order_id == parent_id,
                        PaymentTransaction.refund_id.is_(None),
                        PaymentTransaction.razorpay_payment_id.isnot(None),
                        PaymentTransaction.status.in_(("captured", "partially_refunded", "refunded")),
                    )
                    .order_by(PaymentTransaction.id.desc())
                    .first()
                    if parent_id
                    else None
                )
                if parent_id:
                    rec, _ = RefundService.create_or_get_refund_intent(
                        db,
                        logical_key=f"return:{ret_req.id}",
                        refund_type="RETURN",
                        order_id=parent_id,
                        amount_paise=int(ret_req.refund_paise or to_paise(ret_req.refund_amount)),
                        captured_payment_id=(cap_tx.razorpay_payment_id if cap_tx else ref_payment_id),
                        payment_transaction_id=(cap_tx.id if cap_tx else None),
                        suborder_id=ret_req.suborder_id,
                        return_request_id=ret_req.id,
                    )
            else:
                ref_tx = None
                if refund_id:
                    ref_tx = db.query(PaymentTransaction).filter(PaymentTransaction.refund_id == refund_id).first()
                if not ref_tx and ref_payment_id:
                    ref_tx = (
                        db.query(PaymentTransaction)
                        .filter(
                            PaymentTransaction.razorpay_payment_id == ref_payment_id,
                            PaymentTransaction.order_id.isnot(None),
                        )
                        .first()
                    )
                if ref_tx and ref_tx.order_id:
                    ord_obj = db.query(Order).filter(Order.id == ref_tx.order_id).first()
                    if ord_obj and ord_obj.status == OrderStatus.CANCELLED:
                        cap_pay = ref_tx.razorpay_payment_id or ref_payment_id
                        rec, _ = RefundService.create_or_get_refund_intent(
                            db,
                            logical_key=f"oos:{ord_obj.id}:{cap_pay}",
                            refund_type="OOS_AUTO",
                            order_id=ord_obj.id,
                            amount_paise=to_paise(ref_tx.amount),
                            captured_payment_id=cap_pay,
                            payment_transaction_id=ref_tx.id,
                            extra_notes={"reason": "late_capture_out_of_stock"},
                        )

        if not rec:
            return {"status": "ok", "event": event, "processed": False, "note": "Refund record not found"}

        rec_id = rec.id
        already_processed = rec.status == "PROCESSED" or rec.accounting_applied_at is not None
        try:
            settled_rec = RefundService.apply_provider_refund_outcome(
                db,
                rec_id,
                refund_entity,
                applied_via="webhook",
                escalate_on_validation_error=False,
            )
        except RefundValidationError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

        if already_processed:
            return {
                "status": "ok",
                "event": event,
                "processed": False,
                "message": "Idempotent: Refund already settled",
                "refund_status": settled_rec.status,
            }

        return {
            "status": "ok",
            "event": event,
            "processed": True,
            "refund_status": settled_rec.status,
            "refund_id": settled_rec.provider_refund_id,
        }

    # 2. Payment capture / failure webhook events
    razorpay_order_id = payment_entity.get("order_id") or order_entity.get("id")
    razorpay_payment_id = payment_entity.get("id")

    if not razorpay_order_id and not razorpay_payment_id:
        return {"status": "ok", "message": "Ignored: No order/payment identifiers in payload"}

    transaction = None
    if razorpay_order_id:
        transaction = (
            db.query(PaymentTransaction)
            .filter(PaymentTransaction.razorpay_order_id == razorpay_order_id)
            .with_for_update()
            .populate_existing()
            .first()
        )
    if not transaction and razorpay_payment_id:
        transaction = (
            db.query(PaymentTransaction)
            .filter(PaymentTransaction.razorpay_payment_id == razorpay_payment_id)
            .with_for_update()
            .populate_existing()
            .first()
        )

    # Reconcile webhook that arrived before local PaymentTransaction record received razorpay_order_id
    if not transaction:
        notes = payment_entity.get("notes") or order_entity.get("notes") or {}
        if not isinstance(notes, dict):
            notes = {}
        tx_id_note = notes.get("tx_id")
        target_id_note = notes.get("target_id") or order_entity.get("receipt")
        target_type_note = notes.get("target_type")

        if tx_id_note:
            try:
                transaction = db.query(PaymentTransaction).filter(
                    PaymentTransaction.id == int(tx_id_note)
                ).with_for_update().first()
            except (TypeError, ValueError):
                transaction = None

        if transaction and razorpay_order_id and transaction.status == "initiating":
            transaction.razorpay_order_id = razorpay_order_id
            transaction.status = "created"

        if not transaction and target_id_note:
            target_order = None
            target_booking = None
            if target_type_note != "booking":
                target_order = db.query(Order).filter(Order.id == target_id_note).first()
            if not target_order and target_type_note != "order":
                target_booking = db.query(Booking).filter(Booking.id == target_id_note).first()

            if target_order:
                transaction = db.query(PaymentTransaction).filter(
                    PaymentTransaction.order_id == target_order.id,
                    PaymentTransaction.status == "initiating",
                ).order_by(PaymentTransaction.id.desc()).with_for_update().first()
                if transaction and razorpay_order_id:
                    transaction.razorpay_order_id = razorpay_order_id
                    transaction.status = "created"
                elif razorpay_order_id:
                    transaction = PaymentTransaction(
                        user_id=target_order.customer_id,
                        order_id=target_order.id,
                        razorpay_order_id=razorpay_order_id,
                        amount=target_order.total,
                        currency="INR",
                        status="created",
                    )
                    db.add(transaction)
                    db.flush()
            elif target_booking:
                transaction = db.query(PaymentTransaction).filter(
                    PaymentTransaction.booking_id == target_booking.id,
                    PaymentTransaction.status == "initiating",
                ).order_by(PaymentTransaction.id.desc()).with_for_update().first()
                if transaction and razorpay_order_id:
                    transaction.razorpay_order_id = razorpay_order_id
                    transaction.status = "created"
                elif razorpay_order_id:
                    transaction = PaymentTransaction(
                        user_id=target_booking.customer_id,
                        booking_id=target_booking.id,
                        razorpay_order_id=razorpay_order_id,
                        amount=target_booking.price,
                        currency="INR",
                        status="created",
                    )
                    db.add(transaction)
                    db.flush()
            else:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Target order/payment record not yet committed; retry webhook delivery."
                )

    if not transaction:
        return {"status": "ok", "event": event, "processed": False, "note": "Transaction not found"}

    if event in ("payment.captured", "order.paid"):
        if transaction.status in ("captured", "refunded"):
            if transaction.order_id:
                ord_obj = (
                    db.query(Order)
                    .filter(Order.id == transaction.order_id)
                    .populate_existing()
                    .first()
                )
                if ord_obj and ord_obj.status == OrderStatus.CANCELLED and ord_obj.payment_status == "refund_pending_oos":
                    cap_pay = transaction.razorpay_payment_id or razorpay_payment_id
                    if cap_pay:
                        oos_rec, _ = RefundService.create_or_get_refund_intent(
                            db,
                            logical_key=f"oos:{ord_obj.id}:{cap_pay}",
                            refund_type="OOS_AUTO",
                            order_id=ord_obj.id,
                            amount_paise=to_paise(transaction.amount),
                            captured_payment_id=cap_pay,
                            payment_transaction_id=transaction.id,
                            extra_notes={"reason": "late_capture_out_of_stock"},
                        )
                        db.commit()
                        if oos_rec.status not in ("PROCESSED", "REQUIRES_OPERATOR"):
                            final_pay_status, ref_rec_status, ref_id = _refund_oos_capture_outside_locks(
                                db, transaction.id, cap_pay, oos_rec.id, applied_via="webhook_capture_retry"
                            )
                            return {
                                "status": "ok",
                                "event": event,
                                "processed": True,
                                "outcome": "oos_recovery_attempted",
                                "payment_status": final_pay_status,
                                "refund_status": ref_rec_status,
                                "refund_id": ref_id,
                            }
            return {"status": "ok", "message": "Idempotent: Payment already captured"}

        _validate_webhook_capture_payload(transaction, payment_entity, order_entity)
        tx_id = transaction.id
        outcome, oos_rec_id = _apply_capture_in_tx(db, transaction, razorpay_payment_id)
        db.commit()
        if outcome == "oos_needs_refund":
            _refund_oos_capture_outside_locks(
                db, tx_id, razorpay_payment_id, oos_rec_id, applied_via="webhook_oos"
            )
        return {"status": "ok", "event": event, "processed": True, "outcome": outcome}

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
        if transaction.order_id:
            ord_obj = db.query(Order).filter(Order.id == transaction.order_id).with_for_update().first()
            if ord_obj and ord_obj.payment_status == "pending":
                ord_obj.payment_status = "failed"
        db.commit()
        return {"status": "ok", "event": event, "processed": True}

    return {"status": "ok", "event": event, "processed": False, "note": "Event acknowledged without state mutation"}
