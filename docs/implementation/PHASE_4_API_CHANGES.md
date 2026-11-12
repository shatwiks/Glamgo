# GLAMGO — PHASE 4 API CHANGES SPECIFICATION
# PARTNER ECOSYSTEM & BUSINESS OPERATIONS

**Document Version:** 1.0.0  
**Phase:** Phase 4 — Partner Ecosystem & Business Operations  
**Date:** November 11, 2026  
**Status:** Approved for Implementation  

---

## 1. ENDPOINT INVENTORY SUMMARY

Phase 4 introduces a dedicated suite of partner REST endpoints organized under `/api/v1/partners/` and integrates with existing administrative moderation routes.

| HTTP Method | Endpoint Path | Description | Access Role | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/partners/apply` | Submit partner application | Customer | `200`, `400`, `409` |
| **GET** | `/api/v1/partners/professional/profile` | Fetch pro profile | Professional | `200`, `404` |
| **PUT** | `/api/v1/partners/professional/profile` | Update pro profile & bio | Professional | `200`, `400` |
| **GET** | `/api/v1/partners/professional/services` | Get pro services | Professional | `200` |
| **POST** | `/api/v1/partners/professional/services` | Assign service to pro | Professional | `200`, `404` |
| **DELETE**| `/api/v1/partners/professional/services/{id}` | Remove pro service | Professional | `200`, `404` |
| **GET** | `/api/v1/partners/professional/bookings` | List pro bookings | Professional | `200` |
| **PATCH**| `/api/v1/partners/professional/bookings/{id}/status` | Accept/Complete/Cancel | Professional | `200`, `403`, `404` |
| **GET** | `/api/v1/partners/salon/profile` | Fetch salon details | Salon Owner | `200`, `404` |
| **PUT** | `/api/v1/partners/salon/profile` | Update salon details | Salon Owner | `200`, `400` |
| **GET** | `/api/v1/partners/salon/staff` | List salon staff | Salon Owner | `200` |
| **POST** | `/api/v1/partners/salon/staff` | Add salon staff member | Salon Owner | `200`, `400` |
| **DELETE**| `/api/v1/partners/salon/staff/{id}` | Remove staff member | Salon Owner | `200`, `403`, `404` |
| **GET** | `/api/v1/partners/salon/bookings` | List salon appointments | Salon Owner | `200` |
| **PATCH**| `/api/v1/partners/salon/bookings/{id}/status` | Update booking status | Salon Owner | `200`, `403`, `404` |
| **GET** | `/api/v1/partners/seller/products` | List seller products | Seller | `200` |
| **POST** | `/api/v1/partners/seller/products` | Create seller product | Seller | `200`, `400` |
| **PUT** | `/api/v1/partners/seller/products/{id}` | Update product details | Seller | `200`, `403`, `404` |
| **PATCH**| `/api/v1/partners/seller/products/{id}/stock` | Update stock quantity | Seller | `200`, `403`, `404` |
| **POST** | `/api/v1/partners/seller/products/{id}/variants` | Add variant | Seller | `200`, `403`, `404` |
| **GET** | `/api/v1/partners/seller/orders` | List incoming orders | Seller | `200` |
| **PATCH**| `/api/v1/partners/seller/orders/{id}/status` | Update fulfillment state | Seller | `200`, `400`, `403`, `404` |
| **GET** | `/api/v1/partners/financials` | Gross, 15% commission, net | Partner | `200` |

---

## 2. DETAILED SCHEMA & PAYLOAD SPECIFICATIONS

### 2.1 Partner Onboarding

#### `POST /api/v1/partners/apply`
**Request Payload:**
```json
{
  "role": "professional", // "professional" | "salon_owner" | "seller"
  "name": "Kavita Hair Studio",
  "phone": "+91 98765 43210",
  "city": "Mumbai",
  "price": 2500.0,
  "description": "Certified bridal makeup artist and luxury hairstylist with 8 years experience.",
  "documents": ["https://assets.glamgo.in/certs/kavita_diploma.pdf"],
  "portfolio_links": ["https://instagram.com/kavita_bridal", "https://glamgo.in/portfolios/kavita"]
}
```
**Validation Rules:**
- `role` must be one of `["professional", "salon_owner", "seller"]`.
- `name` cannot be blank.
- `price` must be non-negative.
- Duplicate check: If user already has an active application with `status == "PENDING"` for the same role, return `HTTP 409 Conflict`.
- Role check: If user already possesses the requested role, return `HTTP 400 Bad Request`.

**Response (200 OK):**
```json
{
  "id": 14,
  "user_id": 8,
  "role": "professional",
  "name": "Kavita Hair Studio",
  "price": 2500.0,
  "description": "Certified bridal makeup artist and luxury hairstylist with 8 years experience.",
  "status": "PENDING",
  "created_at": "2026-11-11T05:30:00Z"
}
```

---

### 2.2 Professional Operations

#### `PUT /api/v1/partners/professional/profile`
**Request Payload:**
```json
{
  "specialty": "Bridal & Editorial Hair Specialist",
  "experience": "9 years luxury bridal salon experience",
  "price": 2800.0,
  "img": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500"
}
```

#### `PATCH /api/v1/partners/professional/bookings/{id}/status`
**Request Payload:**
```json
{
  "status": "completed" // "confirmed" | "completed" | "cancelled"
}
```
**BOLA/IDOR Enforcement:**
- The booking's `professional_id` must match `current_user.professional_profile.id`.
- If another partner attempts to alter this appointment, return `HTTP 403 Forbidden`.

---

### 2.3 Salon Owner Operations

#### `POST /api/v1/partners/salon/staff`
**Request Payload:**
```json
{
  "name": "Rahul Sharma",
  "specialty": "Creative Hair Colorist",
  "img": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500"
}
```
**Response (200 OK):**
```json
{
  "id": 4,
  "salon_id": "l1",
  "name": "Rahul Sharma",
  "specialty": "Creative Hair Colorist",
  "img": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500"
}
```

#### `DELETE /api/v1/partners/salon/staff/{id}`
- Checks that `staff.salon.owner_id == current_user.id`.
- Removes the staff record and returns `{"message": "Staff member removed successfully"}`.

---

### 2.4 Seller Operations

#### `POST /api/v1/partners/seller/products`
**Request Payload:**
```json
{
  "brand": "Maison GlamGo",
  "name": "Botanical Scalp Elixir",
  "category": "Haircare",
  "price": 3200.0,
  "old": 3800.0,
  "img": "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500",
  "tag": "Clean Beauty",
  "description": "Cold-pressed rosemary and cedarwood scalp restorative oil.",
  "ingredients": "Organic Rosemary Oil, Cold-Pressed Jojoba, Cedarwood Essence",
  "stock": 50,
  "variants": ["50 ml", "100 ml"]
}
```

#### `PATCH /api/v1/partners/seller/products/{id}/stock`
**Request Payload:**
```json
{
  "stock": 4
}
```
**Trigger:**
- If new stock is `<= 5`, the backend generates a low-stock alert notification:
  `"Warning: Stock for Botanical Scalp Elixir is critically low (4 units remaining)."`

#### `PATCH /api/v1/partners/seller/orders/{id}/status`
**Request Payload:**
```json
{
  "status": "in_transit" // "placed" | "packed" | "in_transit" | "delivered" | "cancelled"
}
```
- Dispatches notification to customer: `"Your order #GG1234567 is now in transit."`

---

### 2.5 Financial Statements & Ledger

#### `GET /api/v1/partners/financials`
**Query Parameters:**
- `start_date` (optional): `YYYY-MM-DD`
- `end_date` (optional): `YYYY-MM-DD`

**Response (200 OK):**
```json
{
  "gross_sales": 15400.0,
  "platform_commission": 2310.0,
  "commission_rate": 0.15,
  "refund_deductions": 0.0,
  "net_earnings": 13090.0,
  "settlement_summary": {
    "settled_amount": 10000.0,
    "pending_payout": 3090.0,
    "last_settlement_date": "2026-11-05"
  },
  "statements": [
    {
      "transaction_id": "TXN_BK_101",
      "type": "booking",
      "reference_id": "BK827101",
      "title": "Bridal Signature Styling",
      "date": "2026-11-08",
      "gross_amount": 5000.0,
      "commission_amount": 750.0,
      "net_amount": 4250.0,
      "status": "completed"
    }
  ]
}
```
