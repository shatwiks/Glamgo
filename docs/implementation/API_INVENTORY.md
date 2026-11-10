# GlamGo — Complete REST API Inventory & Endpoint Catalog

**Project:** GlamGo Luxury Beauty Marketplace  
**Document:** API Inventory & Endpoint Catalog  
**Version:** 1.0 (Production Verified)  
**Date:** November 10, 2026  
**Total Registered Operations:** 49 operations across 42 endpoint paths  
**Base URL:** `/api/v1` (Proxied via Vite dev server or Nginx reverse proxy)  

---

## 1. Authentication & Identity Router (`/api/v1/auth`)

| Method | Endpoint Path | Auth Req. | Required Roles | Request Schema | Response Schema | Description & DB Operations | Status |
| :---: | :--- | :---: | :---: | :--- | :--- | :--- | :---: |
| `POST` | `/auth/register` | None (Public) | None | `UserRegister` (`email`, `password`, `full_name`, `phone`) | `UserResponse` | Creates a new user record. Strictly forces `role=CUSTOMER`. Rejects admin self-registration with 403. | **Verified Active** |
| `POST` | `/auth/login` | None (Public) | None | `OAuth2PasswordRequestForm` (`username`, `password`) | `Token` (`access_token`, `refresh_token`, `token_type`, `user`) | Verifies bcrypt password hash; generates HS256 JWT access and refresh tokens. | **Verified Active** |
| `POST` | `/auth/refresh` | None (Public) | None | `TokenRefreshRequest` (`refresh_token`) | `Token` | Validates refresh token signature; rotates and issues fresh JWT access token. | **Verified Active** |
| `GET` | `/auth/me` | Bearer Token | Any Authenticated | None | `UserResponse` | Queries active user by token `sub` email; returns profile data. | **Verified Active** |

---

## 2. Users, Profiles & Addresses Router (`/api/v1/users`)

| Method | Endpoint Path | Auth Req. | Required Roles | Request Schema | Response Schema | Description & DB Operations | Status |
| :---: | :--- | :---: | :---: | :--- | :--- | :--- | :---: |
| `GET` | `/users/profile` | Bearer Token | Any Authenticated | None | `UserResponse` | Fetches authenticated user's profile and default address. | **Verified Active** |
| `PUT` | `/users/profile` | Bearer Token | Any Authenticated | `UserProfileUpdate` (`full_name`, `phone`) | `UserResponse` | Updates current user's personal details. | **Verified Active** |
| `GET` | `/users/addresses` | Bearer Token | Any Authenticated | None | `List[AddressResponse]` | Queries all saved delivery/service addresses for authenticated user. | **Verified Active** |
| `POST` | `/users/addresses` | Bearer Token | Any Authenticated | `AddressCreate` (`address_line1`, `city`, `pincode`, etc.) | `AddressResponse` | Inserts new address; manages `is_default` flag atomically. | **Verified Active** |
| `DELETE` | `/users/addresses/{id}` | Bearer Token | Any Authenticated | None | `Dict[status, message]` | Deletes address ensuring user ownership check. | **Verified Active** |
| `GET` | `/users/notifications` | Bearer Token | Any Authenticated | None | `List[NotificationResponse]` | Retrieves up to 50 user notifications ordered by `created_at DESC`. | **Verified Active** |

---

## 3. Services Catalog Router (`/api/v1/services`)

| Method | Endpoint Path | Auth Req. | Required Roles | Request Schema | Response Schema | Description & DB Operations | Status |
| :---: | :--- | :---: | :---: | :--- | :--- | :--- | :---: |
| `GET` | `/services/` | None (Public) | None | Query params (`category`, `search`) | `List[ServiceResponse]` | Lists active services with specialist counts and category filtering. | **Verified Active** |
| `POST` | `/services/` | Bearer Token | `ADMIN`, `PROFESSIONAL` | `ServiceCreate` | `ServiceResponse` | Registers a new beauty service in the marketplace catalog. | **Verified Active** |
| `GET` | `/services/categories`| None (Public) | None | None | `List[str]` | Returns distinct service category tags (`Hair`, `Skin`, `Bridal`, etc.). | **Verified Active** |
| `GET` | `/services/{id}` | None (Public) | None | Path param (`id`) | `ServiceResponse` | Retrieves single service details, duration, pricing, and assigned pros. | **Verified Active** |

---

## 4. Beauty Professionals Router (`/api/v1/professionals`)

| Method | Endpoint Path | Auth Req. | Required Roles | Request Schema | Response Schema | Description & DB Operations | Status |
| :---: | :--- | :---: | :---: | :--- | :--- | :--- | :---: |
| `GET` | `/professionals/` | None (Public) | None | Query params (`city`, `service_id`) | `List[ProfessionalResponse]` | Lists verified doorstep professionals with ratings, city, and specialties. | **Verified Active** |
| `GET` | `/professionals/{id}` | None (Public) | None | Path param (`id`) | `ProfessionalResponse` | Retrieves individual specialist profile, bio, experience, and services. | **Verified Active** |
| `GET` | `/professionals/{id}/availability` | None (Public) | None | Path param (`id`), Query (`date`) | `List[str]` | Returns available time slots for specialist on specified date. | **Verified Active** |

---

## 5. Salons & Parlours Router (`/api/v1/salons`)

| Method | Endpoint Path | Auth Req. | Required Roles | Request Schema | Response Schema | Description & DB Operations | Status |
| :---: | :--- | :---: | :---: | :--- | :--- | :--- | :---: |
| `GET` | `/salons/` | None (Public) | None | Query params (`city`, `search`) | `List[SalonResponse]` | Lists boutique salons with images, ratings, address, and coordinates. | **Verified Active** |
| `POST` | `/salons/` | Bearer Token | `ADMIN`, `SALON_OWNER` | `LessSalonCreate` | `SalonResponse` | Registers a new physical salon venue. | **Verified Active** |
| `GET` | `/salons/{id}` | None (Public) | None | Path param (`id`) | `SalonResponse` | Retrieves salon profile, stylists, amenities, and available services. | **Verified Active** |

---

## 6. Beauty Products Router (`/api/v1/products`)

| Method | Endpoint Path | Auth Req. | Required Roles | Request Schema | Response Schema | Description & DB Operations | Status |
| :---: | :--- | :---: | :---: | :--- | :--- | :--- | :---: |
| `GET` | `/products/` | None (Public) | None | Query params (`category`, `brand`, `search`) | `List[ProductResponse]` | Returns curated cosmetics with variants, prices, images, and stock. | **Verified Active** |
| `POST` | `/products/` | Bearer Token | `ADMIN`, `SELLER` | `ProductCreate` | `ProductResponse` | Creates a new product catalog item with multi-variant inventory. | **Verified Active** |
| `GET` | `/products/categories`| None (Public) | None | None | `List[str]` | Returns distinct product categories (`Skincare`, `Haircare`, etc.). | **Verified Active** |
| `GET` | `/products/{id}` | None (Public) | None | Path param (`id`) | `ProductResponse` | Detailed view of product, ingredients, directions, and variant skus. | **Verified Active** |

---

## 7. Bookings & Appointments Router (`/api/v1/bookings`)

| Method | Endpoint Path | Auth Req. | Required Roles | Request Schema | Response Schema | Description & DB Operations | Status |
| :---: | :--- | :---: | :---: | :--- | :--- | :--- | :---: |
| `POST` | `/bookings/` | Bearer Token | `CUSTOMER` | `BookingCreate` (`service_id`, `professional_id`, `booking_date`, `time_slot`) | `BookingResponse` | Validates appointment availability with `with_for_update()`; creates booking. | **Verified Active** |
| `GET` | `/bookings/my` | Bearer Token | Any Authenticated | None | `List[BookingResponse]` | Returns all bookings placed by or assigned to authenticated user. | **Verified Active** |
| `GET` | `/bookings/{id}` | Bearer Token | Any Authenticated | Path param (`id`) | `BookingResponse` | Retrieves single appointment details; enforces ownership check. | **Verified Active** |
| `PATCH` | `/bookings/{id}/status` | Bearer Token | `ADMIN`, `PROFESSIONAL`, `SALON_OWNER` | `BookingStatusUpdate` (`status`) | `BookingResponse` | Transitions booking status (`CONFIRMED`, `COMPLETED`, `CANCELLED`). | **Verified Active** |

---

## 8. Orders & Checkout Router (`/api/v1/orders`)

| Method | Endpoint Path | Auth Req. | Required Roles | Request Schema | Response Schema | Description & DB Operations | Status |
| :---: | :--- | :---: | :---: | :--- | :--- | :--- | :---: |
| `POST` | `/orders/coupon/validate` | Bearer Token | Any Authenticated | `CouponValidateRequest` (`code`, `cart_total`) | `CouponValidateResponse` | Validates coupon expiry and minimum spend; calculates capped discount. | **Verified Active** |
| `POST` | `/orders/` | Bearer Token | `CUSTOMER` | `OrderCreate` (`items`, `address_id`, `payment_method`, `coupon_code`) | `OrderResponse` | Row-locks product variants; validates inventory; calculates totals; inserts order. | **Verified Active** |
| `GET` | `/orders/my` | Bearer Token | Any Authenticated | None | `List[OrderResponse]` | Returns authenticated user's order history with tracking statuses. | **Verified Active** |
| `GET` | `/orders/{id}` | Bearer Token | Any Authenticated | Path param (`id`) | `OrderResponse` | Retrieves individual order with line items; enforces ownership check. | **Verified Active** |

---

## 9. Partner Portals Router (`/api/v1/partners`)

| Method | Endpoint Path | Auth Req. | Required Roles | Request Schema | Response Schema | Description & DB Operations | Status |
| :---: | :--- | :---: | :---: | :--- | :--- | :--- | :---: |
| `GET` | `/partners/overview` | Bearer Token | `PROFESSIONAL`, `SALON_OWNER`, `SELLER`, `ADMIN` | None | `PartnerOverviewResponse` | Aggregates partner KPIs (total bookings, revenue, ratings, active status). | **Verified Active** |
| `GET` | `/partners/drafts` | Bearer Token | Any Authenticated | None | `List[PartnerDraftResponse]` | Retrieves onboarding application drafts submitted by authenticated user. | **Verified Active** |
| `POST` | `/partners/drafts` | Bearer Token | Any Authenticated | `PartnerDraftCreate` (`business_type`, `business_name`, `data`) | `PartnerDraftResponse` | Submits partner onboarding application draft for administrative review. | **Verified Active** |
| `GET` | `/partners/availability` | Bearer Token | `PROFESSIONAL`, `SALON_OWNER` | None | `List[AvailabilityResponse]` | Returns configured weekly working hours and slot status. | **Verified Active** |
| `POST` | `/partners/availability/toggle` | Bearer Token | `PROFESSIONAL`, `SALON_OWNER` | `AvailabilityToggle` (`day_of_week`, `time_slot`, `is_available`) | `AvailabilityResponse` | Updates specialist or salon availability schedule. | **Verified Active** |

---

## 10. Administrator Router (`/api/v1/admin`)

| Method | Endpoint Path | Auth Req. | Required Roles | Request Schema | Response Schema | Description & DB Operations | Status |
| :---: | :--- | :---: | :---: | :--- | :--- | :--- | :---: |
| `GET` | `/admin/stats` | Bearer Token | `ADMIN` | None | `AdminStatsResponse` | Aggregates platform-wide metrics (users, GMV, orders, bookings count). | **Verified Active** |
| `GET` | `/admin/users` | Bearer Token | `ADMIN` | Query params (`role`, `is_active`) | `List[UserAdminResponse]` | Lists all platform users with filtering and role information. | **Verified Active** |
| `PATCH` | `/admin/users/{id}/toggle-status` | Bearer Token | `ADMIN` | Path param (`id`) | `UserAdminResponse` | Activates or suspends a user account; prevents admin self-suspension. | **Verified Active** |
| `GET` | `/admin/bookings` | Bearer Token | `ADMIN` | Query params (`status`, `date`) | `List[BookingResponse]` | Global booking monitor across all salons and specialists. | **Verified Active** |
| `GET` | `/admin/orders` | Bearer Token | `ADMIN` | Query params (`status`) | `List[OrderResponse]` | Global e-commerce order monitor across all sellers. | **Verified Active** |

---

## 11. Payments (Razorpay) Router (`/api/v1/payments`)

| Method | Endpoint Path | Auth Req. | Required Roles | Request Schema | Response Schema | Description & DB Operations | Status |
| :---: | :--- | :---: | :---: | :--- | :--- | :--- | :---: |
| `POST` | `/payments/razorpay/create-order` | Bearer Token | `CUSTOMER` | `PaymentOrderCreate` (`amount`, `booking_id`, `order_id`) | `PaymentOrderResponse` | Creates official Razorpay order; inserts `PaymentTransaction` record. | **Verified Active** |
| `POST` | `/payments/razorpay/verify` | Bearer Token | `CUSTOMER` | `PaymentVerifyRequest` (`razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`) | `PaymentVerifyResponse` | Cryptographically verifies HMAC-SHA256 signature; marks transaction `SUCCESS`. | **Verified Active** |

---

## 12. Reviews & Ratings Router (`/api/v1/reviews`)

| Method | Endpoint Path | Auth Req. | Required Roles | Request Schema | Response Schema | Description & DB Operations | Status |
| :---: | :--- | :---: | :---: | :--- | :--- | :--- | :---: |
| `POST` | `/reviews` | Bearer Token | `CUSTOMER` | `ReviewCreate` (`rating`, `comment`, `service_id`, `salon_id`, `product_id`) | `ReviewResponse` | Creates a verified customer review; marks `is_approved=True`. | **Verified Active** |
| `GET` | `/reviews` | None (Public) | None | Query params (`service_id`, `salon_id`, `product_id`) | `List[ReviewResponse]` | Retrieves approved reviews for specific catalog items. | **Verified Active** |
| `GET` | `/reviews/my` | Bearer Token | Any Authenticated | None | `List[ReviewResponse]` | Retrieves reviews authored by authenticated customer. | **Verified Active** |

---

## 13. System Health & Root Endpoints

| Method | Endpoint Path | Auth Req. | Required Roles | Request Schema | Response Schema | Description & DB Operations | Status |
| :---: | :--- | :---: | :---: | :--- | :--- | :--- | :---: |
| `GET` | `/health` | None (Public) | None | None | `Dict[status, app, database]` | Verifies database connectivity (`SELECT 1`); returns system health. | **Verified Active** |
| `GET` | `/` | None (Public) | None | None | `Dict[message, docs, health]` | API root welcoming message and interactive documentation links. | **Verified Active** |
