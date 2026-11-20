"""
Durable, idempotent refund orchestration and exactly-once financial accounting service.

Handles both:
  1. Customer Return refunds (RefundRecord.refund_type = 'RETURN')
  2. Automatic Out-of-Stock late-capture refunds (RefundRecord.refund_type = 'OOS_AUTO')

Guarantees:
  - Durable RefundRecord intent persisted BEFORE external gateway I/O.
  - Stable X-Refund-Idempotency header + unique receipt + identical payload across retries.
  - Zero DB row locks held during gateway HTTP calls.
  - Unknown gateway outcomes (timeout / lost response / 5xx / 409) reconciled via provider
    lookup before ever issuing another logical refund.
  - Concurrent dispatch blocked via deterministic lock + IN_FLIGHT lease.
  - Cumulative refunds capped at captured payment amount under lock.
  - Shared atomic settlement (apply_provider_refund_outcome) backed by populate_existing(),
    accounting_applied_at, and DB UNIQUE constraints on refund_accounting_entries.
"""

from datetime import datetime, timezone, timedelta
import json
import logging
from typing import Any, Dict, List, Optional, Tuple
import uuid

import razorpay
import requests
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from backend.app.core.database import SessionLocal
from backend.app.models.order import Order, OrderStatus
from backend.app.models.payment import PaymentTransaction
from backend.app.models.user import Notification
from backend.app.models.commerce import (
    RefundRecord,
    RefundAccountingEntry,
    ReturnRequest,
    ReturnStatus,
    SellerEscrowRecord,
    EscrowStatus,
    SubOrder,
    SubOrderStatus,
)
from backend.app.services.commerce_service import to_paise, to_rupees

logger = logging.getLogger("glamgo.refunds")

IN_FLIGHT_LEASE_SECONDS = 120
RETRY_BACKOFF_MINUTES = (1, 5, 15, 60)
ALLOWED_PROVIDER_REFUND_STATUSES = frozenset({"processed", "pending", "created", "failed"})
TERMINAL_OR_ESCALATED_STATUSES = frozenset({"PROCESSED", "REQUIRES_OPERATOR"})


class RefundError(Exception):
    """Base error for refund orchestration."""


class RefundInFlightError(RefundError):
    """Raised when another worker/request holds an active lease on this refund."""


class RefundValidationError(RefundError):
    """Raised when a provider refund response fails identity, amount, or status validation."""


class RefundGatewayError(RefundError):
    """Raised when external gateway initiation or reconciliation fails."""

    def __init__(self, outcome: str, message: str, *, refund_record_id: Optional[int] = None):
        super().__init__(message)
        self.outcome = outcome  # "FAILED" | "UNKNOWN" | "REQUIRES_OPERATOR"
        self.refund_record_id = refund_record_id


def _utc_naive_or_aware(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _compute_next_retry(attempt_count: int, now_utc: datetime) -> datetime:
    idx = min(max(int(attempt_count) - 1, 0), len(RETRY_BACKOFF_MINUTES) - 1)
    return now_utc + timedelta(minutes=RETRY_BACKOFF_MINUTES[idx])


def _extract_gateway_client():
    from backend.app.api.v1.payments import get_razorpay_client
    return get_razorpay_client()


class RefundService:
    @staticmethod
    def generate_idempotency_key() -> str:
        # 37 chars, strictly [A-Za-z0-9_], satisfies Razorpay >=10 char rule
        return f"rfnd_{uuid.uuid4().hex}"

    @staticmethod
    def generate_receipt(idempotency_key: str) -> str:
        # <= 40 chars unique receipt bound to logical refund
        clean = idempotency_key.replace("-", "")
        return f"rcpt_{clean[-32:]}"

    @staticmethod
    def classify_gateway_exception(exc: Exception) -> str:
        """
        Distinguish definitive gateway rejection ('DEFINITIVE_REJECT') from ambiguous/lost
        outcomes ('UNKNOWN') that must be reconciled before retrying.
        """
        if isinstance(exc, HTTPException):
            if exc.status_code == status.HTTP_400_BAD_REQUEST:
                return "DEFINITIVE_REJECT"
            return "UNKNOWN"

        if isinstance(exc, razorpay.errors.BadRequestError):
            msg = str(exc).lower()
            ambiguous_markers = (
                "409",
                "conflict",
                "in progress",
                "already in progress",
                "duplicate receipt",
            )
            if any(marker in msg for marker in ambiguous_markers):
                return "UNKNOWN"
            return "DEFINITIVE_REJECT"

        return "UNKNOWN"

    @staticmethod
    def validate_provider_refund_payload(
        payload: Any,
        *,
        expected_payment_id: Optional[str],
        expected_amount_paise: int,
        expected_refund_id: Optional[str] = None,
    ) -> Tuple[str, str]:
        """
        Strictly validate gateway/webhook refund payload identity, amount, and explicit status.
        Never infers 'processed' if status is omitted.
        """
        if not isinstance(payload, dict):
            raise RefundValidationError("Provider refund payload is not a JSON object.")

        refund_id = str(payload.get("id") or "").strip()
        if not refund_id:
            raise RefundValidationError("Provider refund payload is missing required 'id'.")

        if expected_refund_id and refund_id != expected_refund_id:
            raise RefundValidationError(
                f"Provider refund id mismatch: expected '{expected_refund_id}', got '{refund_id}'."
            )

        raw_status = payload.get("status")
        if raw_status is None or not str(raw_status).strip():
            raise RefundValidationError("Provider refund payload is missing explicit 'status'.")
        gw_status = str(raw_status).strip().lower()
        if gw_status not in ALLOWED_PROVIDER_REFUND_STATUSES:
            raise RefundValidationError(f"Unsupported provider refund status '{gw_status}'.")

        resp_payment_id = payload.get("payment_id")
        if expected_payment_id:
            if not resp_payment_id or str(resp_payment_id).strip() != expected_payment_id:
                raise RefundValidationError(
                    f"Provider refund payment_id mismatch: expected '{expected_payment_id}', got '{resp_payment_id}'."
                )

        raw_amount = payload.get("amount")
        if raw_amount is None:
            raise RefundValidationError("Provider refund payload is missing required 'amount'.")
        try:
            resp_amount_paise = int(raw_amount)
        except (TypeError, ValueError) as exc:
            raise RefundValidationError(f"Invalid provider refund amount '{raw_amount}'.") from exc

        if resp_amount_paise != int(expected_amount_paise):
            raise RefundValidationError(
                f"Provider refund amount mismatch: expected {expected_amount_paise} paise, got {resp_amount_paise} paise."
            )

        return refund_id, gw_status

    @staticmethod
    def _reconcile_with_provider(
        client: Any,
        *,
        captured_payment_id: str,
        provider_refund_id: Optional[str],
        receipt: str,
        idempotency_key: str,
        logical_key: str,
    ) -> Optional[dict]:
        """
        Query provider for an existing refund matching this logical refund intent.
        Returns the matching provider refund dict if found, or None if definitively absent.
        Raises exception if provider lookup fails or is inconclusive.
        """
        payment_res = getattr(client, "payment", None)
        if not payment_res:
            raise RuntimeError("Gateway client has no payment resource.")

        # 1. If provider_refund_id is already known, fetch it directly
        if provider_refund_id:
            if hasattr(payment_res, "fetch_refund_id"):
                return payment_res.fetch_refund_id(captured_payment_id, provider_refund_id)
            refund_res = getattr(client, "refund", None)
            if refund_res and hasattr(refund_res, "fetch"):
                return refund_res.fetch(provider_refund_id)
            if hasattr(payment_res, "fetch_refund"):
                return payment_res.fetch_refund(captured_payment_id, provider_refund_id)

        # 2. Otherwise search refunds on captured_payment_id matching our unique receipt / keys
        if not hasattr(payment_res, "fetch_multiple_refund"):
            if provider_refund_id is None:
                return None
            raise RuntimeError("Gateway client lacks refund fetch/list lookup method.")

        skip = 0
        count = 100
        while True:
            resp = payment_res.fetch_multiple_refund(captured_payment_id, {"count": count, "skip": skip})
            if not isinstance(resp, dict):
                raise RuntimeError("Unexpected response format from fetch_multiple_refund.")
            items = resp.get("items") or []
            for item in items:
                if not isinstance(item, dict):
                    continue
                notes = item.get("notes") if isinstance(item.get("notes"), dict) else {}
                if (
                    (provider_refund_id and item.get("id") == provider_refund_id)
                    or item.get("receipt") == receipt
                    or notes.get("idempotency_key") == idempotency_key
                    or notes.get("logical_key") == logical_key
                ):
                    return item
            if len(items) < count:
                break
            skip += count

        return None

    @staticmethod
    def _remaining_refundable_paise_locked(
        db: Session,
        *,
        captured_payment_id: Optional[str],
        order_id: str,
        cap_paise: int,
        exclude_record_id: Optional[int] = None,
    ) -> int:
        """Compute committed/active refund total in paise (excluding FAILED and self)."""
        # Always sum all non-FAILED RefundRecords across the entire Order so partial returns can never exceed Order total
        q = db.query(RefundRecord).filter(
            RefundRecord.order_id == order_id,
            RefundRecord.status != "FAILED",
        )
        if exclude_record_id is not None:
            q = q.filter(RefundRecord.id != exclude_record_id)
        committed = sum(int(r.amount_paise or 0) for r in q.with_for_update().populate_existing().all())
        return max(0, int(cap_paise) - committed)

    @staticmethod
    def create_or_get_refund_intent(
        db: Session,
        *,
        logical_key: str,
        refund_type: str,
        order_id: str,
        amount_paise: int,
        captured_payment_id: Optional[str],
        payment_transaction_id: Optional[int],
        suborder_id: Optional[str] = None,
        return_request_id: Optional[str] = None,
        extra_notes: Optional[Dict[str, str]] = None,
        max_attempts: int = 5,
    ) -> Tuple[RefundRecord, bool]:
        """
        Create or retrieve a durable RefundRecord inside an existing DB transaction,
        enforcing cumulative refund caps under Order/PaymentTransaction locks.
        Returns (record, created_bool).
        """
        if amount_paise <= 0:
            raise HTTPException(status_code=400, detail="Refund amount must be positive.")

        # Persist any in-flight mutations on Order / PaymentTransaction before populate_existing() refreshes them
        db.flush()

        order = (
            db.query(Order)
            .filter(Order.id == order_id)
            .with_for_update()
            .populate_existing()
            .first()
        )
        if not order:
            raise HTTPException(status_code=404, detail="Order not found for refund intent.")

        cap_paise = to_paise(order.total)
        if payment_transaction_id:
            tx = (
                db.query(PaymentTransaction)
                .filter(PaymentTransaction.id == payment_transaction_id)
                .with_for_update()
                .populate_existing()
                .first()
            )
            if tx:
                cap_paise = to_paise(tx.amount)

        existing = (
            db.query(RefundRecord)
            .filter(RefundRecord.logical_key == logical_key)
            .with_for_update()
            .populate_existing()
            .first()
        )
        if existing:
            return existing, False

        remaining = RefundService._remaining_refundable_paise_locked(
            db,
            captured_payment_id=captured_payment_id,
            order_id=order_id,
            cap_paise=cap_paise,
        )
        if amount_paise > remaining:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Cumulative refund exceeds remaining refundable amount "
                    f"(requested {amount_paise} paise, remaining {remaining} paise)."
                ),
            )

        idem_key = RefundService.generate_idempotency_key()
        receipt = RefundService.generate_receipt(idem_key)
        notes: Dict[str, str] = {
            "order_id": order_id,
            "logical_key": logical_key,
            "idempotency_key": idem_key,
            "refund_type": refund_type,
        }
        if suborder_id:
            notes["suborder_id"] = suborder_id
        if return_request_id:
            notes["return_id"] = return_request_id
        if extra_notes:
            for k, v in extra_notes.items():
                if v is not None:
                    notes[str(k)] = str(v)

        payload_dict = {
            "amount": int(amount_paise),
            "receipt": receipt,
            "notes": notes,
        }
        now_utc = datetime.now(timezone.utc)
        rec = RefundRecord(
            logical_key=logical_key,
            idempotency_key=idem_key,
            receipt=receipt,
            refund_type=refund_type,
            order_id=order_id,
            suborder_id=suborder_id,
            return_request_id=return_request_id,
            payment_transaction_id=payment_transaction_id,
            captured_payment_id=captured_payment_id,
            amount_paise=int(amount_paise),
            currency="INR",
            payload_json=json.dumps(payload_dict, sort_keys=True),
            status="INITIATED",
            attempt_count=0,
            max_attempts=max_attempts,
            created_at=now_utc,
            updated_at=now_utc,
        )
        try:
            with db.begin_nested():
                db.add(rec)
                db.flush()
            return rec, True
        except IntegrityError:
            existing_after = (
                db.query(RefundRecord)
                .filter(RefundRecord.logical_key == logical_key)
                .with_for_update()
                .populate_existing()
                .first()
            )
            if existing_after:
                return existing_after, False
            raise

    @staticmethod
    def _recompute_order_payment_status_locked(db: Session, order: Order) -> None:
        if order.payment_status in ("refund_pending_oos", "refunded_oos"):
            return
        total_paid_paise = to_paise(order.total)
        processed_records = (
            db.query(RefundRecord)
            .filter(
                RefundRecord.order_id == order.id,
                RefundRecord.refund_type == "RETURN",
                RefundRecord.status == "PROCESSED",
            )
            .all()
        )
        refunded_sum_paise = sum(int(r.amount_paise or 0) for r in processed_records)
        if total_paid_paise > 0 and refunded_sum_paise >= total_paid_paise:
            order.payment_status = "refunded"
        elif refunded_sum_paise > 0:
            order.payment_status = "partially_refunded"

    @staticmethod
    def apply_cod_refund_accounting(
        db: Session,
        ret: ReturnRequest,
    ) -> RefundRecord:
        """
        Atomically record a confirmed manual COD refund in RefundRecord, RefundAccountingEntry,
        ReturnRequest, SellerEscrowRecord, PaymentTransaction, and Order.payment_status.
        """
        suborder = db.query(SubOrder).filter(SubOrder.id == ret.suborder_id).first()
        if not suborder:
            raise HTTPException(status_code=404, detail="Suborder not found for COD return.")

        order = (
            db.query(Order)
            .filter(Order.id == suborder.parent_order_id)
            .with_for_update()
            .populate_existing()
            .first()
        )
        if not order:
            raise HTTPException(status_code=404, detail="Parent order not found for COD return.")

        ret = (
            db.query(ReturnRequest)
            .filter(ReturnRequest.id == ret.id)
            .with_for_update()
            .populate_existing()
            .first()
        )
        refund_paise = int(ret.refund_paise or to_paise(ret.refund_amount))
        cod_ref_id = ret.gateway_refund_id or f"cod_payout_{ret.id}"
        logical_key = f"return:{ret.id}"

        rec = (
            db.query(RefundRecord)
            .filter(RefundRecord.logical_key == logical_key)
            .with_for_update()
            .populate_existing()
            .first()
        )
        if not rec:
            rec, _ = RefundService.create_or_get_refund_intent(
                db,
                logical_key=logical_key,
                refund_type="RETURN",
                order_id=order.id,
                amount_paise=max(1, refund_paise),
                captured_payment_id=None,
                payment_transaction_id=None,
                suborder_id=suborder.id,
                return_request_id=ret.id,
            )

        now_utc = datetime.now(timezone.utc)
        rec.provider_refund_id = rec.provider_refund_id or cod_ref_id
        ret.gateway_refund_id = rec.provider_refund_id
        ret.status = ReturnStatus.REFUNDED
        ret.refund_status = "COD_REFUNDED"
        ret.refunded_at = ret.refunded_at or now_utc
        ret.updated_at = now_utc

        if refund_paise > 0 and rec.accounting_applied_at is None:
            existing_entry = (
                db.query(RefundAccountingEntry)
                .filter(RefundAccountingEntry.refund_record_id == rec.id)
                .first()
            )
            if existing_entry is None:
                escrow = (
                    db.query(SellerEscrowRecord)
                    .filter(SellerEscrowRecord.suborder_id == suborder.id)
                    .with_for_update()
                    .populate_existing()
                    .first()
                )
                comm_rev_paise = (refund_paise * 15 + 50) // 100
                seller_deduction_paise = max(0, refund_paise - comm_rev_paise)
                db.add(RefundAccountingEntry(
                    refund_record_id=rec.id,
                    provider_refund_id=cod_ref_id,
                    order_id=order.id,
                    suborder_id=suborder.id,
                    escrow_record_id=escrow.id if escrow else None,
                    refund_paise=refund_paise,
                    commission_reversal_paise=comm_rev_paise,
                    seller_deduction_paise=seller_deduction_paise,
                    applied_via="cod_manual",
                    created_at=now_utc,
                ))
                db.flush()
                if escrow:
                    new_ref_paise = to_paise(escrow.refunded_amount or 0.0) + refund_paise
                    new_comm_rev_paise = to_paise(escrow.reversed_commission or 0.0) + comm_rev_paise
                    new_net_paise = max(0, to_paise(escrow.net_settlement) - seller_deduction_paise)
                    escrow.refunded_amount = to_rupees(new_ref_paise)
                    escrow.reversed_commission = to_rupees(new_comm_rev_paise)
                    escrow.net_settlement = to_rupees(new_net_paise)
                    escrow.updated_at = now_utc
                    if new_net_paise == 0 and escrow.status in (EscrowStatus.HELD_IN_ESCROW, EscrowStatus.MATURED):
                        escrow.status = EscrowStatus.CLAWBACK_REFUND

                existing_tx = db.query(PaymentTransaction).filter(
                    PaymentTransaction.refund_id == cod_ref_id
                ).first()
                if existing_tx:
                    existing_tx.status = "cod_refunded"
                else:
                    db.add(PaymentTransaction(
                        user_id=ret.customer_id,
                        order_id=order.id,
                        razorpay_order_id=f"ref_{cod_ref_id}",
                        razorpay_payment_id=cod_ref_id,
                        refund_id=cod_ref_id,
                        amount=to_rupees(refund_paise),
                        currency="INR",
                        status="cod_refunded",
                    ))

        rec.status = "PROCESSED"
        rec.accounting_applied_at = rec.accounting_applied_at or now_utc
        rec.updated_at = now_utc
        RefundService._recompute_order_payment_status_locked(db, order)
        db.commit()
        db.refresh(rec)
        return rec

    @staticmethod
    def apply_provider_refund_outcome(
        db: Session,
        refund_record_id: int,
        provider_refund: Any,
        *,
        applied_via: str,
        escalate_on_validation_error: Optional[bool] = None,
    ) -> RefundRecord:
        """
        Shared, atomic, idempotent settlement operation used by synchronous HTTP refund
        responses, asynchronous webhooks, and background recovery workers.

        Always re-reads authoritative state under lock with populate_existing(), enforces
        strict payload validation, protects terminal PROCESSED states against delayed
        non-final updates, and inserts RefundAccountingEntry at most once.
        """
        should_escalate = (applied_via != "webhook") if escalate_on_validation_error is None else escalate_on_validation_error
        order_id_row = db.query(RefundRecord.order_id).filter(RefundRecord.id == refund_record_id).first()
        if not order_id_row:
            raise ValueError(f"RefundRecord {refund_record_id} not found.")
        order_id = order_id_row[0]

        order = (
            db.query(Order)
            .filter(Order.id == order_id)
            .with_for_update()
            .populate_existing()
            .first()
        )
        rec = (
            db.query(RefundRecord)
            .filter(RefundRecord.id == refund_record_id)
            .with_for_update()
            .populate_existing()
            .first()
        )
        if not rec or not order:
            raise ValueError(f"RefundRecord {refund_record_id} or parent Order missing.")

        ret = None
        if rec.return_request_id:
            ret = (
                db.query(ReturnRequest)
                .filter(ReturnRequest.id == rec.return_request_id)
                .with_for_update()
                .populate_existing()
                .first()
            )

        escrow = None
        if rec.suborder_id:
            escrow = (
                db.query(SellerEscrowRecord)
                .filter(SellerEscrowRecord.suborder_id == rec.suborder_id)
                .with_for_update()
                .populate_existing()
                .first()
            )

        captured_tx = None
        if rec.payment_transaction_id:
            captured_tx = (
                db.query(PaymentTransaction)
                .filter(PaymentTransaction.id == rec.payment_transaction_id)
                .with_for_update()
                .populate_existing()
                .first()
            )

        try:
            refund_id, gw_status = RefundService.validate_provider_refund_payload(
                provider_refund,
                expected_payment_id=rec.captured_payment_id,
                expected_amount_paise=int(rec.amount_paise),
                expected_refund_id=rec.provider_refund_id,
            )
        except RefundValidationError as exc:
            if should_escalate and rec.status != "PROCESSED":
                rec.status = "REQUIRES_OPERATOR"
                rec.last_error = str(exc)
                rec.dispatch_started_at = None
                rec.next_retry_at = None
                rec.updated_at = datetime.now(timezone.utc)
                db.commit()
            else:
                db.rollback()
            raise

        # Protect terminal PROCESSED state against delayed/out-of-order pending or failed updates
        if rec.status == "PROCESSED" or rec.accounting_applied_at is not None:
            if not rec.provider_refund_id:
                rec.provider_refund_id = refund_id
                rec.updated_at = datetime.now(timezone.utc)
                db.commit()
            else:
                db.commit()
            db.refresh(rec)
            return rec

        now_utc = datetime.now(timezone.utc)
        rec.provider_refund_id = refund_id
        rec.dispatch_started_at = None
        rec.updated_at = now_utc

        if gw_status == "processed":
            existing_entry = (
                db.query(RefundAccountingEntry)
                .filter(
                    (RefundAccountingEntry.refund_record_id == rec.id)
                    | (RefundAccountingEntry.provider_refund_id == refund_id)
                )
                .first()
            )
            if existing_entry is None:
                refund_paise = int(rec.amount_paise)
                comm_rev_paise = 0
                seller_deduction_paise = 0
                if rec.refund_type == "RETURN" and escrow:
                    comm_rev_paise = (refund_paise * 15 + 50) // 100
                    seller_deduction_paise = max(0, refund_paise - comm_rev_paise)

                db.add(RefundAccountingEntry(
                    refund_record_id=rec.id,
                    provider_refund_id=refund_id,
                    order_id=order.id,
                    suborder_id=rec.suborder_id,
                    escrow_record_id=escrow.id if escrow else None,
                    refund_paise=refund_paise,
                    commission_reversal_paise=comm_rev_paise,
                    seller_deduction_paise=seller_deduction_paise,
                    applied_via=applied_via,
                    created_at=now_utc,
                ))
                db.flush()

                if rec.refund_type == "RETURN":
                    if escrow:
                        new_ref_paise = to_paise(escrow.refunded_amount or 0.0) + refund_paise
                        new_comm_rev_paise = to_paise(escrow.reversed_commission or 0.0) + comm_rev_paise
                        new_net_paise = max(0, to_paise(escrow.net_settlement) - seller_deduction_paise)
                        escrow.refunded_amount = to_rupees(new_ref_paise)
                        escrow.reversed_commission = to_rupees(new_comm_rev_paise)
                        escrow.net_settlement = to_rupees(new_net_paise)
                        escrow.updated_at = now_utc
                        if new_net_paise == 0 and escrow.status in (EscrowStatus.HELD_IN_ESCROW, EscrowStatus.MATURED):
                            escrow.status = EscrowStatus.CLAWBACK_REFUND

                    ref_tx = (
                        db.query(PaymentTransaction)
                        .filter(PaymentTransaction.refund_id == refund_id)
                        .with_for_update()
                        .populate_existing()
                        .first()
                    )
                    if ref_tx:
                        ref_tx.status = "refunded"
                    else:
                        db.add(PaymentTransaction(
                            user_id=ret.customer_id if ret else order.customer_id,
                            order_id=order.id,
                            razorpay_order_id=f"ref_{refund_id}",
                            razorpay_payment_id=refund_id,
                            refund_id=refund_id,
                            amount=to_rupees(refund_paise),
                            currency=rec.currency or "INR",
                            status="refunded",
                        ))

                    if ret:
                        ret.gateway_refund_id = refund_id
                        ret.refund_status = "PROCESSED"
                        ret.status = ReturnStatus.REFUNDED
                        ret.refunded_at = ret.refunded_at or now_utc
                        ret.updated_at = now_utc

                elif rec.refund_type == "OOS_AUTO":
                    if captured_tx:
                        captured_tx.refund_id = refund_id
                        captured_tx.status = "refunded"
                    order.payment_status = "refunded_oos"
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
                            esc.updated_at = now_utc
                    db.add(Notification(
                        user_id=order.customer_id,
                        type="order",
                        text=f"Automatic full refund ({refund_id}) processed for out-of-stock expired order {order.id}.",
                    ))

            rec.status = "PROCESSED"
            rec.accounting_applied_at = rec.accounting_applied_at or now_utc
            rec.next_retry_at = None
            rec.last_error = None
            if rec.refund_type == "RETURN":
                RefundService._recompute_order_payment_status_locked(db, order)

        elif gw_status in ("pending", "created"):
            rec.status = "PENDING"
            rec.next_retry_at = now_utc + timedelta(minutes=2)
            rec.last_error = None
            if rec.refund_type == "RETURN":
                if ret:
                    ret.gateway_refund_id = refund_id
                    ret.status = ReturnStatus.REFUND_PENDING
                    ret.refund_status = "PENDING"
                    ret.updated_at = now_utc
                ref_tx = db.query(PaymentTransaction).filter(PaymentTransaction.refund_id == refund_id).first()
                if not ref_tx:
                    db.add(PaymentTransaction(
                        user_id=ret.customer_id if ret else order.customer_id,
                        order_id=order.id,
                        razorpay_order_id=f"ref_{refund_id}",
                        razorpay_payment_id=refund_id,
                        refund_id=refund_id,
                        amount=to_rupees(rec.amount_paise),
                        currency=rec.currency or "INR",
                        status="refund_pending",
                    ))
            elif rec.refund_type == "OOS_AUTO":
                if captured_tx and not captured_tx.refund_id:
                    captured_tx.refund_id = refund_id
                order.payment_status = "refund_pending_oos"

        else:  # "failed"
            escalated = int(rec.attempt_count or 0) >= int(rec.max_attempts or 5)
            rec.status = "REQUIRES_OPERATOR" if escalated else "FAILED"
            rec.next_retry_at = None if escalated else _compute_next_retry(int(rec.attempt_count or 1), now_utc)
            rec.last_error = f"Gateway reported refund status='failed' (refund_id={refund_id})"
            if not escalated:
                rec.provider_refund_id = None
            if rec.refund_type == "RETURN" and ret:
                ret.gateway_refund_id = refund_id
                ret.status = ReturnStatus.REFUND_FAILED
                ret.refund_status = "FAILED"
                ret.updated_at = now_utc
            elif rec.refund_type == "OOS_AUTO":
                order.payment_status = "refund_pending_oos"

        db.commit()
        db.refresh(rec)
        return rec

    @staticmethod
    def _record_non_final_gateway_failure(
        db: Session,
        refund_record_id: int,
        *,
        outcome_kind: str,
        error_msg: str,
    ) -> RefundRecord:
        """Persist FAILED / SUBMITTED_UNKNOWN / REQUIRES_OPERATOR after a gateway exception."""
        rec = (
            db.query(RefundRecord)
            .filter(RefundRecord.id == refund_record_id)
            .with_for_update()
            .populate_existing()
            .first()
        )
        if not rec:
            raise ValueError(f"RefundRecord {refund_record_id} missing when recording failure.")

        if rec.status == "PROCESSED" or rec.accounting_applied_at is not None:
            db.commit()
            db.refresh(rec)
            return rec

        now_utc = datetime.now(timezone.utc)
        escalated = int(rec.attempt_count or 0) >= int(rec.max_attempts or 5)
        if escalated:
            new_status = "REQUIRES_OPERATOR"
            next_retry = None
        elif outcome_kind == "DEFINITIVE_REJECT":
            new_status = "FAILED"
            next_retry = _compute_next_retry(int(rec.attempt_count or 1), now_utc)
        else:
            new_status = "SUBMITTED_UNKNOWN"
            next_retry = _compute_next_retry(int(rec.attempt_count or 1), now_utc)

        rec.status = new_status
        rec.last_error = str(error_msg)[:1000]
        rec.dispatch_started_at = None
        rec.next_retry_at = next_retry
        rec.updated_at = now_utc

        if rec.return_request_id:
            ret = (
                db.query(ReturnRequest)
                .filter(ReturnRequest.id == rec.return_request_id)
                .with_for_update()
                .populate_existing()
                .first()
            )
            if ret and ret.status != ReturnStatus.REFUNDED:
                if outcome_kind == "DEFINITIVE_REJECT" and not escalated:
                    ret.status = ReturnStatus.REFUND_FAILED
                    ret.refund_status = "FAILED"
                else:
                    ret.status = ReturnStatus.REFUND_PENDING
                    ret.refund_status = "REQUIRES_OPERATOR" if escalated else "UNKNOWN"
                ret.updated_at = now_utc

        db.commit()
        db.refresh(rec)
        return rec

    @staticmethod
    def execute_or_reconcile_refund(
        db: Session,
        refund_record_id: int,
        *,
        applied_via: str,
        ignore_backoff: bool = False,
    ) -> RefundRecord:
        """
        Safely execute or reconcile a durable RefundRecord with zero DB locks held during
        external gateway calls.
        """
        now_utc = datetime.now(timezone.utc)
        order_row = db.query(RefundRecord.order_id).filter(RefundRecord.id == refund_record_id).first()
        if not order_row:
            raise ValueError(f"RefundRecord {refund_record_id} not found.")
        order_id = order_row[0]

        order = (
            db.query(Order)
            .filter(Order.id == order_id)
            .with_for_update()
            .populate_existing()
            .first()
        )
        rec = (
            db.query(RefundRecord)
            .filter(RefundRecord.id == refund_record_id)
            .with_for_update()
            .populate_existing()
            .first()
        )
        if not rec or not order:
            raise ValueError(f"RefundRecord {refund_record_id} or Order missing.")

        if rec.status == "PROCESSED" or rec.accounting_applied_at is not None:
            db.commit()
            return rec

        if rec.status == "REQUIRES_OPERATOR":
            db.commit()
            raise RefundGatewayError(
                "REQUIRES_OPERATOR",
                f"Refund {rec.logical_key} requires operator review: {rec.last_error or 'max attempts exceeded'}",
                refund_record_id=rec.id,
            )

        if not rec.captured_payment_id:
            db.commit()
            raise ValueError(f"RefundRecord {rec.id} has no captured_payment_id for gateway dispatch.")

        # Enforce lease exclusion on IN_FLIGHT records
        if rec.status == "IN_FLIGHT":
            started = _utc_naive_or_aware(rec.dispatch_started_at)
            if started and (now_utc - started).total_seconds() < IN_FLIGHT_LEASE_SECONDS:
                db.commit()
                raise RefundInFlightError(
                    f"Refund {rec.logical_key} is currently in flight; duplicate concurrent submission blocked."
                )
            # Lease expired -> treat prior crashed process outcome as unknown and reconcile first
            rec.status = "SUBMITTED_UNKNOWN"

        # If previously FAILED, re-verify cumulative refund cap before retrying
        if rec.status == "FAILED":
            cap_paise = to_paise(order.total)
            if rec.payment_transaction_id:
                tx_row = (
                    db.query(PaymentTransaction)
                    .filter(PaymentTransaction.id == rec.payment_transaction_id)
                    .with_for_update()
                    .populate_existing()
                    .first()
                )
                if tx_row:
                    cap_paise = to_paise(tx_row.amount)
            remaining = RefundService._remaining_refundable_paise_locked(
                db,
                captured_payment_id=rec.captured_payment_id,
                order_id=order.id,
                cap_paise=cap_paise,
                exclude_record_id=rec.id,
            )
            if int(rec.amount_paise) > remaining:
                rec.status = "REQUIRES_OPERATOR"
                rec.last_error = "Cumulative refund cap exceeded on retry."
                rec.updated_at = now_utc
                db.commit()
                raise HTTPException(status_code=400, detail="Cumulative refund exceeds captured amount.")

        needs_reconcile = (
            rec.status in ("SUBMITTED_UNKNOWN", "PENDING")
            or rec.provider_refund_id is not None
        )
        rec.status = "IN_FLIGHT"
        rec.dispatch_started_at = now_utc
        rec.attempt_count = int(rec.attempt_count or 0) + 1
        rec.updated_at = now_utc

        # Snapshot primitive values BEFORE committing & releasing all DB locks
        rec_id = rec.id
        captured_payment_id = rec.captured_payment_id
        provider_refund_id = rec.provider_refund_id
        receipt = rec.receipt
        idem_key = rec.idempotency_key
        logical_key = rec.logical_key
        payload = json.loads(rec.payload_json) if rec.payload_json else {
            "amount": int(rec.amount_paise),
            "receipt": receipt,
            "notes": {
                "order_id": order.id,
                "logical_key": logical_key,
                "idempotency_key": idem_key,
                "refund_type": rec.refund_type,
            },
        }
        db.commit()

        # -------------------- EXTERNAL NETWORK I/O (ZERO DB LOCKS HELD) --------------------
        client = _extract_gateway_client()
        provider_response: Optional[dict] = None

        if needs_reconcile:
            try:
                provider_response = RefundService._reconcile_with_provider(
                    client,
                    captured_payment_id=captured_payment_id,
                    provider_refund_id=provider_refund_id,
                    receipt=receipt,
                    idempotency_key=idem_key,
                    logical_key=logical_key,
                )
            except Exception as exc:
                saved = RefundService._record_non_final_gateway_failure(
                    db,
                    rec_id,
                    outcome_kind="UNKNOWN",
                    error_msg=f"Reconciliation lookup failed: {exc}",
                )
                raise RefundGatewayError(
                    saved.status,
                    f"Unable to reconcile prior refund attempt with payment gateway: {exc}",
                    refund_record_id=rec_id,
                ) from exc

        if provider_response is None:
            try:
                provider_response = client.payment.refund(
                    captured_payment_id,
                    dict(payload),
                    headers={"X-Refund-Idempotency": idem_key},
                )
            except Exception as exc:
                outcome_kind = RefundService.classify_gateway_exception(exc)
                saved = RefundService._record_non_final_gateway_failure(
                    db,
                    rec_id,
                    outcome_kind=outcome_kind,
                    error_msg=str(exc),
                )
                raise RefundGatewayError(
                    saved.status,
                    f"Payment gateway refund initiation failed ({saved.status}): {exc}",
                    refund_record_id=rec_id,
                ) from exc

        # -------------------- ATOMIC POST-GATEWAY SETTLEMENT + RECOVERY --------------------
        try:
            return RefundService.apply_provider_refund_outcome(
                db,
                rec_id,
                provider_response,
                applied_via=applied_via,
            )
        except RefundValidationError:
            raise
        except SQLAlchemyError as db_exc:
            logger.error(
                "Primary DB write failed after gateway refund response; attempting SessionLocal recovery for refund_record_id=%s: %s",
                rec_id,
                db_exc,
            )
            try:
                db.rollback()
            except Exception:
                pass
            rec_db = SessionLocal()
            try:
                return RefundService.apply_provider_refund_outcome(
                    rec_db,
                    rec_id,
                    provider_response,
                    applied_via=f"{applied_via}_db_recovery",
                )
            finally:
                rec_db.close()

    @staticmethod
    def recover_pending_refunds(
        db: Session,
        *,
        dry_run: bool = False,
        limit: int = 50,
    ) -> Dict[str, Any]:
        """
        Reconcile and retry unresolved online RefundRecords (RETURN and OOS_AUTO).
        When dry_run=True, performs zero persistent writes and zero gateway calls.
        """
        now_utc = datetime.now(timezone.utc)
        stale_lease_cutoff = now_utc - timedelta(seconds=IN_FLIGHT_LEASE_SECONDS)

        candidates = (
            db.query(RefundRecord)
            .filter(
                RefundRecord.captured_payment_id.isnot(None),
                (
                    (
                        RefundRecord.status.in_(("INITIATED", "SUBMITTED_UNKNOWN", "PENDING", "FAILED"))
                        & (
                            RefundRecord.next_retry_at.is_(None)
                            | (RefundRecord.next_retry_at <= now_utc)
                        )
                    )
                    | (
                        (RefundRecord.status == "IN_FLIGHT")
                        & (
                            RefundRecord.dispatch_started_at.is_(None)
                            | (RefundRecord.dispatch_started_at <= stale_lease_cutoff)
                        )
                    )
                ),
            )
            .order_by(RefundRecord.id.asc())
            .limit(max(1, int(limit)))
            .all()
        )

        operator_escalated_count = (
            db.query(RefundRecord)
            .filter(RefundRecord.status == "REQUIRES_OPERATOR")
            .count()
        )

        summary: Dict[str, Any] = {
            "dry_run": bool(dry_run),
            "candidates_found": len(candidates),
            "processed_count": 0,
            "still_pending_count": 0,
            "unknown_count": 0,
            "failed_count": 0,
            "requires_operator_count": int(operator_escalated_count),
            "skipped_in_flight_count": 0,
            "candidate_logical_keys": [c.logical_key for c in candidates],
        }

        if dry_run or not candidates:
            return summary

        for cand in candidates:
            cand_id = cand.id
            try:
                settled = RefundService.execute_or_reconcile_refund(
                    db,
                    cand_id,
                    applied_via="recovery_worker",
                )
                if settled.status == "PROCESSED":
                    summary["processed_count"] += 1
                elif settled.status == "PENDING":
                    summary["still_pending_count"] += 1
            except RefundInFlightError:
                summary["skipped_in_flight_count"] += 1
            except RefundGatewayError as g_exc:
                if g_exc.outcome == "PENDING":
                    summary["still_pending_count"] += 1
                elif g_exc.outcome == "FAILED":
                    summary["failed_count"] += 1
                elif g_exc.outcome == "REQUIRES_OPERATOR":
                    summary["requires_operator_count"] += 1
                else:
                    summary["unknown_count"] += 1
            except RefundValidationError:
                summary["requires_operator_count"] += 1
            except Exception as exc:
                logger.error("Unexpected error recovering refund_record_id=%s: %s", cand_id, exc)
                try:
                    db.rollback()
                except Exception:
                    pass
                summary["unknown_count"] += 1

        summary["requires_operator_count"] = (
            db.query(RefundRecord)
            .filter(RefundRecord.status == "REQUIRES_OPERATOR")
            .count()
        )
        return summary
