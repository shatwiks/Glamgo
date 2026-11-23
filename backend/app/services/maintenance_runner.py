"""
Scheduled maintenance runner for GlamGo commerce lifecycle tasks:
  1. Expire overdue PENDING inventory reservations & abandoned unpaid online orders.
  2. Mature eligible HELD_IN_ESCROW seller settlement records post T+7 return window.
  3. Recover and reconcile unresolved online refunds (OOS automatic & customer return).

Can be executed as a one-shot cron job (does NOT run migrations or database seeding):
    python -m backend.app.services.maintenance_runner --task all
    python -m backend.app.services.maintenance_runner --task recover-refunds
    python -m backend.app.services.maintenance_runner --task all --dry-run

Or as a standalone loop daemon:
    python -m backend.app.services.maintenance_runner --task all --interval-seconds 60

Exit codes:
    0 = completed cleanly
    2 = completed with records escalated to REQUIRES_OPERATOR requiring manual attention
    1 = fatal runtime/database error
"""

import argparse
import json
import logging
import sys
import time
from typing import Any, Dict

from backend.app.core.database import SessionLocal
from backend.app.services.commerce_service import CommerceService
from backend.app.services.refund_service import RefundService
from backend.app.services.booking_expiry import expire_unpaid_bookings

logger = logging.getLogger("glamgo.maintenance")


def run_maintenance_cycle(db, task: str = "all", *, dry_run: bool = False) -> Dict[str, Any]:
    """
    Execute one maintenance cycle and return counts/details of processed or previewed records.
    When dry_run=True, executes strictly read-only queries with zero persistent DB writes and
    zero external gateway calls, rolling back the session cleanly.
    """
    summary: Dict[str, Any] = {"dry_run": bool(dry_run)}

    if task in ("all", "expire-reservations"):
        if dry_run:
            exp_prev = CommerceService.preview_expired_reservations(db)
            summary["expired_reservations_count"] = exp_prev["expired_reservations_count"]
            summary["expired_unpaid_orders_count"] = exp_prev["expired_unpaid_orders_count"]
        else:
            summary["expired_reservations_count"] = CommerceService.expire_pending_reservations(db)

    if task in ("all", "expire-bookings"):
        summary["expired_bookings_count"] = expire_unpaid_bookings(db, dry_run=dry_run)

    if task in ("all", "mature-escrow"):
        if dry_run:
            mat_prev = CommerceService.preview_matured_escrow_records(db)
            summary["matured_records_count"] = mat_prev["eligible_mature_count"]
            summary["clawback_records_count"] = mat_prev["eligible_clawback_count"]
        else:
            summary["matured_records_count"] = CommerceService.mature_escrow_records(db)

    if task in ("all", "recover-refunds"):
        rec_summary = RefundService.recover_pending_refunds(db, dry_run=dry_run)
        summary["refund_recovery"] = rec_summary
        summary["requires_operator_count"] = int(rec_summary.get("requires_operator_count", 0))

    if dry_run:
        db.rollback()

    logger.info("Maintenance cycle finished", extra={"props": {"task": task, **summary}})
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description="GlamGo Commerce Maintenance Runner")
    parser.add_argument(
        "--task",
        choices=["all", "expire-reservations", "expire-bookings", "mature-escrow", "recover-refunds"],
        default="all",
        help="Which maintenance job to run.",
    )
    parser.add_argument(
        "--interval-seconds",
        type=int,
        default=0,
        help="If > 0, run continuously sleeping interval-seconds between cycles.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Read-only preview with zero persistent database writes and zero gateway calls.",
    )
    args = parser.parse_args()

    while True:
        db = SessionLocal()
        exit_code = 0
        try:
            result = run_maintenance_cycle(db, task=args.task, dry_run=bool(args.dry_run))
            requires_op = int(result.get("requires_operator_count", 0))
            status_str = "attention_required" if requires_op > 0 else "ok"
            if requires_op > 0:
                exit_code = 2
            print(json.dumps({"status": status_str, "task": args.task, **result}, default=str))
        except Exception as exc:
            try:
                db.rollback()
            except Exception:
                pass
            print(json.dumps({"status": "error", "task": args.task, "error": str(exc)}), file=sys.stderr)
            db.close()
            sys.exit(1)
        finally:
            try:
                db.close()
            except Exception:
                pass

        if args.interval_seconds <= 0:
            sys.exit(exit_code)
        time.sleep(args.interval_seconds)


if __name__ == "__main__":
    main()
