"""
Runnable, restartable, idempotent canonical inventory backfill CLI for GlamGo.

Converts legacy unscoped SellerListings and un-listed catalog products into
variant-canonical SellerListing ledgers without duplicating physical inventory,
inventing fallback stock, or reassigning listings across sellers.

Usage:
    python -m backend.app.services.inventory_backfill --dry-run
    python -m backend.app.services.inventory_backfill
    python -m backend.app.services.inventory_backfill --product-id b1

Exit codes:
    0 = completed with 0 discrepancies or deferred records
    2 = completed with ambiguous discrepancies or deferred reservation holds requiring review
    1 = fatal runtime/database error
"""

import argparse
import json
import logging
import sys
from typing import Any, Callable, Dict, List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from backend.app.core.database import SessionLocal
from backend.app.models.catalog import Product
from backend.app.models.commerce import SellerListing
from backend.app.services.cache_service import cache_service
from backend.app.services.commerce_service import CommerceService

logger = logging.getLogger("glamgo.inventory_backfill")


def _snapshot_totals(db: Session, product_id: Optional[str] = None) -> Dict[str, Any]:
    pq = db.query(Product)
    lq = db.query(SellerListing)
    if product_id:
        pq = pq.filter(Product.id == product_id)
        lq = lq.filter(SellerListing.product_id == product_id)

    products_count = pq.count()
    active_listings_count = lq.filter(SellerListing.is_active == True).count()
    inactive_listings_count = lq.filter(SellerListing.is_active == False).count()
    active_listing_stock = int(
        lq.with_entities(func.coalesce(func.sum(SellerListing.stock), 0))
        .filter(SellerListing.is_active == True)
        .scalar()
        or 0
    )
    active_unscoped_count = lq.filter(
        SellerListing.is_active == True,
        SellerListing.variant_name == "",
    ).count()
    product_read_model_stock = int(
        pq.with_entities(func.coalesce(func.sum(Product.stock), 0)).scalar() or 0
    )

    return {
        "products_count": products_count,
        "active_listings_count": active_listings_count,
        "inactive_listings_count": inactive_listings_count,
        "active_listing_stock": active_listing_stock,
        "active_unscoped_listings_count": active_unscoped_count,
        "product_read_model_stock": product_read_model_stock,
    }


def run_inventory_backfill(
    session_factory: Callable[[], Session] = SessionLocal,
    *,
    dry_run: bool = False,
    product_id: Optional[str] = None,
    batch_size: int = 50,
    on_product_processed: Optional[Callable[[str, int, Dict[str, Any]], None]] = None,
    emit_progress: bool = False,
) -> Dict[str, Any]:
    """
    Execute canonical inventory backfill across target products.

    - In dry_run=True mode, runs purely read-only queries in a rolled-back session
      and projects exact after-totals and discrepancies without mutating any DB state.
    - In dry_run=False mode, isolates each product in its own transaction, locking the
      product and its SellerListings in deterministic order so interrupted runs can be
      safely restarted and repeated runs become exact no-ops.
    """
    inspect_db = session_factory()
    try:
        before_totals = _snapshot_totals(inspect_db, product_id=product_id)
        id_query = inspect_db.query(Product.id).order_by(Product.id.asc())
        if product_id:
            id_query = id_query.filter(Product.id == product_id)
        target_ids = [row[0] for row in id_query.all()]
    finally:
        inspect_db.close()

    per_product: List[Dict[str, Any]] = []
    discrepancies: List[Dict[str, Any]] = []
    status_counts = {
        "migrated": 0,
        "created_initial": 0,
        "already_canonical": 0,
        "skipped_ambiguous": 0,
        "deferred_reservations": 0,
    }
    projected_active_stock = 0
    projected_active_count = 0

    total_targets = len(target_ids)
    for idx, pid in enumerate(target_ids, start=1):
        db = session_factory()
        try:
            pq = db.query(Product).options(selectinload(Product.variants)).filter(Product.id == pid)
            if not dry_run:
                pq = pq.with_for_update()
            prod = pq.first()
            if not prod:
                if dry_run:
                    db.rollback()
                continue

            if not dry_run:
                db.query(SellerListing).filter(
                    SellerListing.product_id == pid
                ).order_by(SellerListing.id.asc()).with_for_update().all()

            rep = CommerceService.reconcile_product_listings(db, prod, dry_run=dry_run)
            if dry_run:
                db.rollback()
            else:
                if rep["status"] in ("migrated", "created_initial", "already_canonical"):
                    db.commit()
                else:
                    db.rollback()
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

        st = rep["status"]
        status_counts[st] = status_counts.get(st, 0) + 1
        projected_active_stock += int(rep.get("after_active_listing_stock", 0))
        projected_active_count += int(rep.get("after_active_listing_count", 0))
        if rep.get("discrepancies"):
            discrepancies.extend(rep["discrepancies"])
        per_product.append(rep)

        if emit_progress and (idx % max(1, batch_size) == 0 or idx == total_targets):
            print(
                f"[inventory_backfill] progress {idx}/{total_targets} (last={pid}, status={st})",
                file=sys.stderr,
            )

        if on_product_processed is not None:
            on_product_processed(pid, idx, rep)

    if dry_run:
        after_totals = {
            **before_totals,
            "active_listings_count": projected_active_count,
            "active_listing_stock": projected_active_stock,
        }
    else:
        verify_db = session_factory()
        try:
            after_totals = _snapshot_totals(verify_db, product_id=product_id)
        finally:
            verify_db.close()
        if status_counts["migrated"] > 0 or status_counts["created_initial"] > 0:
            cache_service.invalidate_catalog()

    summary = {
        "mode": "dry_run" if dry_run else "apply",
        "products_scanned": total_targets,
        "products_migrated": status_counts["migrated"],
        "products_created_initial": status_counts["created_initial"],
        "products_already_canonical": status_counts["already_canonical"],
        "products_skipped_ambiguous": status_counts["skipped_ambiguous"],
        "products_deferred_reservations": status_counts["deferred_reservations"],
        "before_totals": before_totals,
        "after_totals": after_totals,
        "delta_active_listing_stock": (
            after_totals["active_listing_stock"] - before_totals["active_listing_stock"]
        ),
        "discrepancies_count": len(discrepancies),
        "discrepancies": discrepancies,
        "per_product": per_product,
    }
    logger.info(
        "Canonical inventory backfill finished",
        extra={
            "props": {
                "mode": summary["mode"],
                "products_scanned": total_targets,
                "migrated": status_counts["migrated"],
                "discrepancies": len(discrepancies),
                "delta_stock": summary["delta_active_listing_stock"],
            }
        },
    )
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description="GlamGo Canonical Inventory Backfill CLI")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Read-only preview reporting projected totals and ambiguous records with zero writes.",
    )
    parser.add_argument(
        "--product-id",
        default=None,
        help="Optional single product ID to inspect/backfill.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=50,
        help="Progress reporting interval to stderr.",
    )
    args = parser.parse_args()

    try:
        result = run_inventory_backfill(
            SessionLocal,
            dry_run=bool(args.dry_run),
            product_id=args.product_id,
            batch_size=max(1, int(args.batch_size)),
            emit_progress=True,
        )
    except Exception as exc:
        print(json.dumps({"status": "error", "error": str(exc)}), file=sys.stderr)
        sys.exit(1)

    has_issues = bool(
        result["discrepancies_count"] > 0
        or result["products_skipped_ambiguous"] > 0
        or result["products_deferred_reservations"] > 0
    )
    output = {
        "status": "attention_required" if has_issues else "ok",
        **{k: v for k, v in result.items() if k != "per_product"},
        "changed_products": [
            p for p in result["per_product"] if p["status"] not in ("already_canonical",)
        ],
    }
    print(json.dumps(output, default=str))
    sys.exit(2 if has_issues else 0)


if __name__ == "__main__":
    main()
