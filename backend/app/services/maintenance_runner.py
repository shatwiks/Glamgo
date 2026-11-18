"""
Scheduled maintenance runner for GlamGo commerce lifecycle tasks:
  1. Expire overdue PENDING inventory reservations & abandoned unpaid online orders.
  2. Mature eligible HELD_IN_ESCROW seller settlement records post T+7 return window.

Can be executed as a one-shot cron job:
    python -m backend.app.services.maintenance_runner --task all

Or as a standalone loop daemon:
    python -m backend.app.services.maintenance_runner --task all --interval-seconds 60
"""

import argparse
import json
import logging
import time
from typing import Dict

from backend.app.core.database import SessionLocal
from backend.app.services.commerce_service import CommerceService

logger = logging.getLogger("glamgo.maintenance")


def run_maintenance_cycle(db, task: str = "all") -> Dict[str, int]:
    """Execute one maintenance cycle and return counts of processed records."""
    summary: Dict[str, int] = {}

    if task in ("all", "expire-reservations"):
        expired_count = CommerceService.expire_pending_reservations(db)
        summary["expired_reservations_count"] = expired_count

    if task in ("all", "mature-escrow"):
        matured_count = CommerceService.mature_escrow_records(db)
        summary["matured_records_count"] = matured_count

    logger.info("Maintenance cycle finished", extra={"props": {"task": task, **summary}})
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description="GlamGo Commerce Maintenance Runner")
    parser.add_argument(
        "--task",
        choices=["all", "expire-reservations", "mature-escrow"],
        default="all",
        help="Which maintenance job to run.",
    )
    parser.add_argument(
        "--interval-seconds",
        type=int,
        default=0,
        help="If > 0, run continuously sleeping interval-seconds between cycles.",
    )
    args = parser.parse_args()

    while True:
        db = SessionLocal()
        try:
            result = run_maintenance_cycle(db, task=args.task)
            print(json.dumps({"status": "ok", "task": args.task, **result}))
        finally:
            db.close()

        if args.interval_seconds <= 0:
            break
        time.sleep(args.interval_seconds)


if __name__ == "__main__":
    main()
