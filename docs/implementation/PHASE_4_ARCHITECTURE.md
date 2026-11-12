# GLAMGO — PHASE 4 ARCHITECTURE & SYSTEM DESIGN
# PARTNER ECOSYSTEM & BUSINESS OPERATIONS

**Document Version:** 1.0.0  
**Phase:** Phase 4 — Partner Ecosystem & Business Operations  
**Date:** November 11, 2026  
**Status:** Approved for Implementation  

---

## 1. ARCHITECTURAL OVERVIEW

Phase 4 expands the GlamGo platform from a customer-facing marketplace and administrative console into a comprehensive **multi-tenant partner ecosystem**. The system architecture enforces strict role separation, verifiable data ownership, and transactional financial accounting across all three partner personas:
1. **Independent Beauty Professionals** (`professional`)
2. **Salon & Parlour Owners** (`salon_owner`)
3. **Beauty Product Sellers** (`seller`)

```mermaid
graph TD
    subgraph Client_Layer [Frontend Layer - Vanilla JS ES Modules & Vite 7]
        A["Partner Portal (`partnerPage`)"]
        A1["Professional Dashboard"]
        A2["Salon Owner Dashboard"]
        A3["Seller Dashboard"]
        A4["Partner Application Form"]
    end

    subgraph API_Layer [FastAPI REST API Layer]
        B["/api/v1/partners Router"]
        B1["Onboarding & Drafts (/apply, /drafts)"]
        B2["Professional Endpoints (/professional/*)"]
        B3["Salon Endpoints (/salon/*)"]
        B4["Seller Endpoints (/seller/*)"]
        B5["Financials & Statements (/financials)"]
        B6["Notifications & Alerts (/notifications)"]
    end

    subgraph Security_Layer [RBAC & BOLA / IDOR Verification]
        C["RoleChecker: require_professional"]
        D["RoleChecker: require_salon_owner"]
        E["RoleChecker: require_seller"]
        F["Ownership Verification Engine"]
    end

    subgraph Data_Layer [PostgreSQL 16 & SQLAlchemy 2.0 ORM]
        G["users Table (role enum)"]
        H["partner_drafts Table"]
        I["professional_profiles & service_professionals"]
        J["salons & salon_staff Tables"]
        K["products & product_variants Tables"]
        L["bookings Table (status enum)"]
        M["orders & order_items Tables"]
        N["payment_transactions Table"]
        O["notifications Table"]
    end

    A --> B
    B1 --> F --> H & G
    B2 --> C --> F --> I & L
    B3 --> D --> F --> J & L
    B4 --> E --> F --> K & M
    B5 --> F --> L & M & N
    B6 --> O
```

---

## 2. DATA ENTITY RELATIONSHIPS & OWNERSHIP MATRIX

### Entity Schema & Relationships

```mermaid
erDiagram
    User ||--o| ProfessionalProfile : "has (1:1)"
    User ||--o{ Salon : "owns (1:N)"
    User ||--o{ Product : "sells (1:N)"
    User ||--o{ PartnerDraft : "applies (1:N)"
    User ||--o{ Notification : "receives (1:N)"
    
    Salon ||--o{ SalonStaff : "employs (1:N)"
    Salon ||--o{ Booking : "hosts (1:N)"
    
    ProfessionalProfile ||--o{ Booking : "serves (1:N)"
    ProfessionalProfile }o--o{ Service : "performs (M:N via service_professionals)"
    
    Product ||--o{ ProductVariant : "has variants (1:N)"
    Product ||--o{ OrderItem : "ordered as (1:N)"
    
    Order ||--o{ OrderItem : "contains (1:N)"
    Order ||--o| PaymentTransaction : "paid via (1:1)"
    Booking ||--o| PaymentTransaction : "paid via (1:1)"
```

### Data Ownership & Access Control Matrix

| Resource | Primary Owner Column | Access Guard | Read Access | Mutate Access |
| :--- | :--- | :--- | :--- | :--- |
| `PartnerDraft` | `user_id` | User ownership / `require_admin` | Owner, Admin | Owner (`create`), Admin (`approve`/`reject`) |
| `ProfessionalProfile` | `user_id` | `require_professional` | Public (catalog), Owner | Profile Owner, Admin |
| `ServiceProfessionals` | `professional_id` | `require_professional` | Public, Owner | Profile Owner, Admin |
| `Salon` | `owner_id` | `require_salon_owner` | Public (catalog), Owner | Salon Owner, Admin |
| `SalonStaff` | `salon.owner_id` | `require_salon_owner` | Public (staff details), Owner | Salon Owner, Admin |
| `Product` | `seller_id` | `require_seller` | Public (catalog), Owner | Product Seller, Admin |
| `ProductVariant` | `product.seller_id` | `require_seller` | Public, Owner | Product Seller, Admin |
| `Booking` (Home) | `professional_id` | `require_professional` | Customer, Pro, Admin | Customer (`cancel`), Pro (`status`), Admin |
| `Booking` (Salon) | `salon_id` (via `owner_id`)| `require_salon_owner` | Customer, Salon, Admin | Customer (`cancel`), Salon (`status`), Admin |
| `Order` (Fulfilment) | `items.product.seller_id` | `require_seller` | Customer, Seller, Admin | Seller (`status`), Admin |

---

## 3. OPERATIONAL STATE MACHINES

### 3.1 Partner Onboarding & Moderation Lifecycle
```mermaid
stateDiagram-v2
    [*] --> DRAFT_SUBMITTED: Customer submits application (POST /partners/apply)
    DRAFT_SUBMITTED --> PENDING: Application recorded in partner_drafts
    PENDING --> APPROVED: Admin review (PATCH /admin/partners/drafts/{id}/approve)
    PENDING --> REJECTED: Admin review with reason (PATCH /admin/partners/drafts/{id}/reject)
    
    APPROVED --> ROLE_PROMOTED: User role updated (professional / salon_owner / seller)
    ROLE_PROMOTED --> PROFILE_PROVISIONED: Auto-provisions ProfessionalProfile / Salon
    ROLE_PROMOTED --> NOTIFICATION_SENT: Applicant receives approval notification
    
    REJECTED --> NOTIFICATION_SENT: Applicant receives rejection notification + reason
```

### 3.2 Appointment Booking Lifecycle (Partner Managed)
```mermaid
stateDiagram-v2
    [*] --> CONFIRMED: Customer books & pays (POST /bookings/)
    CONFIRMED --> IN_PROGRESS: Pro arrives / Salon starts treatment
    CONFIRMED --> CANCELLED: Partner or Customer cancels (sets refund_pending)
    IN_PROGRESS --> COMPLETED: Partner marks service finished
    COMPLETED --> REVIEW_ELIGIBLE: Customer can submit rating & review
    CANCELLED --> [*]
    COMPLETED --> [*]
```

### 3.3 Seller Order Fulfillment Lifecycle
```mermaid
stateDiagram-v2
    [*] --> PLACED: Customer checks out & completes payment
    PLACED --> PACKED: Seller prepares package & assigns inventory
    PACKED --> IN_TRANSIT: Seller hands to courier & provides tracking
    IN_TRANSIT --> DELIVERED: Package delivered to customer residence
    PLACED --> CANCELLED: Seller out of stock or Customer cancels
    CANCELLED --> [*]
    DELIVERED --> [*]
```

---

## 4. FINANCIAL OPERATIONS & COMMISSION ENGINE

All partner financial metrics are computed server-side from verified PostgreSQL transactional records. Client applications are never trusted with revenue calculations.

### Financial Equations
1. **Gross Sales ($G$):**
   - For Professionals: $\sum \text{Booking.price}$ for bookings where $\text{status} \in \{\text{CONFIRMED}, \text{COMPLETED}\}$.
   - For Salons: $\sum \text{Booking.price}$ for salon bookings where $\text{status} \in \{\text{CONFIRMED}, \text{COMPLETED}\}$.
   - For Sellers: $\sum (\text{OrderItem.price} \times \text{OrderItem.qty})$ for seller's products in orders where $\text{status} \neq \text{CANCELLED}$.

2. **Marketplace Commission ($C$):**
   $$C = G \times 15\%$$
   The platform retains a standard 15% service fee for marketing, technology infrastructure, and payment processing.

3. **Refund Deductions ($R$):**
   $$\sum \text{Transaction.amount} \quad \text{where status} \in \{\text{refund\_pending}, \text{refunded}\}$$

4. **Net Earnings ($E_{net}$):**
   $$E_{net} = G - C - R$$

5. **Settlement Ledger:**
   - **Settled Funds:** Payments already remitted through platform bank transfer or completed gateway settlement.
   - **Pending Settlement:** $E_{net} - \text{Total Settled Funds}$.
   - **Strict Rule:** Funds are never marked as "paid" or "settled" without a valid transaction reference.

---

## 5. NOTIFICATION DISPATCH ENGINE

The notification subsystem (`Notification` model in `backend/app/models/user.py`) acts as the event broker for partner operations:
- When a partner changes booking status to `completed`, a notification is created for the customer.
- When a seller updates an order to `in_transit`, a tracking alert is created for the customer.
- When an order is placed, a notification is created for each merchant whose products are in the order.
- When a product's stock count falls below 5, a high-priority low-stock notification is dispatched to the seller.
