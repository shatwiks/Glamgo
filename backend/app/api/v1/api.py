from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.api.deps import require_maintenance_auth
from backend.app.api.v1 import (
    auth, users, services, professionals, salons, products,
    bookings, orders, partners, admin, payments, reviews
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users & Addresses"])
api_router.include_router(services.router, prefix="/services", tags=["At-Home Services"])
api_router.include_router(professionals.router, prefix="/professionals", tags=["Beauty Professionals"])
api_router.include_router(salons.router, prefix="/salons", tags=["Salons & Parlours"])
api_router.include_router(products.router, prefix="/products", tags=["Beauty Products"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["Bookings & Appointments"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders & Checkout"])
api_router.include_router(partners.router, prefix="/partners", tags=["Partner Portals"])
api_router.include_router(admin.router, prefix="/admin", tags=["Administrator"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments (Razorpay)"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["Reviews & Ratings"])

# Catalog aliases
catalog_router = APIRouter()


@catalog_router.get("/products/{product_id}/offers")
def catalog_product_offers(product_id: str, db: Session = Depends(get_db)):
    from backend.app.services.commerce_service import CommerceService
    return CommerceService.get_product_offers(db, product_id)


api_router.include_router(catalog_router, prefix="/catalog", tags=["Catalog"])

# Internal maintenance engine tasks (explicitly authenticated via X-Maintenance-Token or Admin JWT)
internal_router = APIRouter()


@internal_router.post("/inventory/expire-reservations")
def expire_reservations_task(
    db: Session = Depends(get_db),
    _auth: dict = Depends(require_maintenance_auth),
):
    from backend.app.services.commerce_service import CommerceService
    count = CommerceService.expire_pending_reservations(db)
    return {"status": "success", "expired_reservations_count": count, "actor": _auth["actor"]}


@internal_router.post("/escrow/mature")
def mature_escrow_task(
    db: Session = Depends(get_db),
    _auth: dict = Depends(require_maintenance_auth),
):
    from backend.app.services.commerce_service import CommerceService
    count = CommerceService.mature_escrow_records(db)
    return {"status": "success", "matured_records_count": count, "actor": _auth["actor"]}


@internal_router.post("/refunds/recover")
def recover_refunds_task(
    dry_run: bool = Query(False),
    db: Session = Depends(get_db),
    _auth: dict = Depends(require_maintenance_auth),
):
    from backend.app.services.refund_service import RefundService
    summary = RefundService.recover_pending_refunds(db, dry_run=dry_run)
    return {"status": "success", "actor": _auth["actor"], **summary}


api_router.include_router(internal_router, prefix="/internal", tags=["Internal Maintenance Engine"])
