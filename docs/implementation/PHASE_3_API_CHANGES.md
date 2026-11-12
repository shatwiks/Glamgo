# GLAMGO — PHASE 3 API CONTRACT & ENDPOINT SPECIFICATION

**Document Version:** 1.0.0  
**Phase:** Phase 3 — Customer Experience & Core Booking Engine  
**Status:** Approved Specification  

---

## 1. AUTHENTICATION & USER PROFILE APIS

### 1.1 `GET /api/v1/users/profile`
- **Auth:** `Bearer <JWT>` (Customer, Pro, Salon Owner, Seller, Admin)
- **Description:** Returns the authenticated user profile.
- **Response `200 OK`:**
```json
{
  "id": 2,
  "email": "aanya@example.com",
  "name": "Aanya Mehta",
  "phone": "98201 23456",
  "role": "customer",
  "is_active": true
}
```

### 1.2 `PUT /api/v1/users/profile`
- **Auth:** `Bearer <JWT>`
- **Description:** Updates name, phone, or email.
- **Request Body:**
```json
{
  "name": "Aanya Mehta",
  "phone": "98201 99999",
  "email": "aanya@example.com"
}
```
- **Response `200 OK`:** Updated `UserResponse`.

### 1.3 `GET /api/v1/users/addresses`
- **Auth:** `Bearer <JWT>`
- **Response `200 OK`:** Array of saved addresses.
```json
[
  {
    "id": 1,
    "label": "Home",
    "text": "24 Sea View Road, Bandra West, Mumbai",
    "city": "Mumbai",
    "is_default": true
  }
]
```

### 1.4 `POST /api/v1/users/addresses`
- **Auth:** `Bearer <JWT>`
- **Request Body:**
```json
{
  "label": "Work",
  "text": "Floor 4, Maker Maxity, BKC, Mumbai",
  "city": "Mumbai",
  "is_default": false
}
```
- **Response `200 OK`:** Created `AddressResponse`.

### 1.5 `DELETE /api/v1/users/addresses/{address_id}`
- **Auth:** `Bearer <JWT>`
- **Response `200 OK`:** `{"message": "Address deleted successfully"}`.
- **Error `404 Not Found`:** If address does not exist or belongs to another user.

---

## 2. BOOKING ENGINE APIS

### 2.1 `POST /api/v1/bookings/`
- **Auth:** `Bearer <JWT>` (Customer)
- **Description:** Create an at-home or salon appointment. Row-locks conflicting specialist bookings.
- **Request Body:**
```json
{
  "type": "home",
  "service_id": "s1",
  "professional": "Nisha Kapoor",
  "salon_id": null,
  "date": "2026-11-20",
  "time": "10:30 AM",
  "location": "24 Sea View Road, Bandra West, Mumbai"
}
```
- **Response `200 OK`:**
```json
{
  "id": "BK-A1B2C3D4",
  "customer_id": 2,
  "type": "home",
  "title": "The Signature Facial",
  "service_id": "s1",
  "professional_id": 1,
  "professional": "Nisha Kapoor",
  "salon_id": null,
  "date": "2026-11-20",
  "time": "10:30 AM",
  "location": "24 Sea View Road, Bandra West, Mumbai",
  "price": 1850.0,
  "status": "confirmed",
  "created_at": "2026-11-11T01:30:00Z"
}
```
- **Error `409 Conflict`:** `{"detail": "Nisha Kapoor is already booked at 10:30 AM on 2026-11-20. Please choose another time slot."}`

### 2.2 `GET /api/v1/bookings/my`
- **Auth:** `Bearer <JWT>`
- **Response `200 OK`:** List of bookings belonging to the requesting customer.

### 2.3 `PATCH /api/v1/bookings/{booking_id}/status`
- **Auth:** `Bearer <JWT>`
- **Description:** Updates booking lifecycle. Customers may only transition to `cancelled`.
- **Request Body:**
```json
{
  "status": "cancelled"
}
```
- **Response `200 OK`:** Updated `BookingResponse`.
- **Error `403 Forbidden`:** If customer attempts transition to `completed` or modifies another user's booking.

---

## 3. CHECKOUT & ORDERS APIS

### 3.1 `POST /api/v1/orders/coupon/validate`
- **Auth:** None / Optional
- **Request Body:**
```json
{
  "code": "GLAM10",
  "subtotal": 3500.0
}
```
- **Response `200 OK`:**
```json
{
  "valid": true,
  "code": "GLAM10",
  "discount": 300.0,
  "message": "GLAM10 applied — you save ₹300"
}
```

### 3.2 `POST /api/v1/orders/`
- **Auth:** `Bearer <JWT>`
- **Description:** Server-validated order creation with inventory row-locking.
- **Request Body:**
```json
{
  "items": [
    {"id": "b1", "qty": 1},
    {"id": "b3", "qty": 2}
  ],
  "address_label": "Home",
  "address_text": "24 Sea View Road, Bandra West, Mumbai",
  "payment_method": "UPI",
  "coupon": "GLAM10"
}
```
- **Response `200 OK`:** `OrderResponse` with server-calculated subtotal, discount, total, and `GG-XXXXXXXX` ID.
- **Error `400 Bad Request`:** Insufficient stock or empty cart.

---

## 4. RAZORPAY PAYMENT APIS

### 4.1 `POST /api/v1/payments/razorpay/create-order`
- **Auth:** `Bearer <JWT>`
- **Request Body:**
```json
{
  "amount": 3570.0,
  "order_id": "GG-98A7B6C5",
  "booking_id": null
}
```
- **Response `200 OK`:**
```json
{
  "razorpay_order_id": "order_a1b2c3d4e5f60718",
  "amount": 3570.0,
  "currency": "INR",
  "key_id": "rzp_test_glamgo_mock_key"
}
```

### 4.2 `POST /api/v1/payments/razorpay/verify`
- **Auth:** `Bearer <JWT>`
- **Description:** Verifies payment transaction ownership and HMAC-SHA256 signature.
- **Request Body:**
```json
{
  "razorpay_order_id": "order_a1b2c3d4e5f60718",
  "razorpay_payment_id": "pay_test_9921448",
  "razorpay_signature": "6b3f71c998a442..."
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "status": "captured",
  "message": "Payment verified and order confirmed successfully."
}
```
- **Error `400 Bad Request`:** Invalid signature.
- **Error `403 Forbidden`:** Non-owner attempt.
