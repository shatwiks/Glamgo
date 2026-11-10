from fastapi import APIRouter
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
