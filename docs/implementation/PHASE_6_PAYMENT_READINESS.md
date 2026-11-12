# GLAMGO — PAYMENT & FINANCIAL READINESS RUNBOOK
## Razorpay Lifecycle, Webhook Verification & Multi-Vendor Settlement

**Document Version:** 1.0.0  
**Phase:** Phase 6 — Milestone E Deliverable  
**Payment Gateway:** Razorpay API v1/v2  
**Compliance Standard:** PCI-DSS Level 1 via Razorpay Checkout Modal  
**Status:** Architecture & Production Readiness Protocol  

---

## 1. Executive Summary

GlamGo utilizes Razorpay as its core payment infrastructure for beauty appointments and multi-vendor e-commerce purchases. While Phase 3 and Phase 4 established basic order creation and client verification HMAC checks, production launch requires full asynchronous webhook verification, idempotency ledgers, automatic refund processing for returns, and reliable multi-vendor escrow disbursement.

---

## 2. Complete Payment State Machine & Lifecycle

```
[Customer Checkout] 
       │
       ▼
[POST /orders/checkout] ──────────────────► [Create Parent Order + SubOrders]
       │
       ▼
[POST /razorpay/create-order] ────────────► [Razorpay Order Created: order_XXXX]
       │                                     Status: 'created'
       ▼
[Client Razorpay Checkout.js Modal]
       │
       ├───► [Client Callback Success] ───► [POST /razorpay/verify] ───► Status: 'captured'
       │                                         │
       └───► [Network Drop / Closed Tab]         │
                   │                             │
                   ▼ (Fallback Channel)          │
       [Razorpay Webhook: payment.captured] ─────┴─────────────────► [Idempotency Ledger]
                                                                             │
                                                                             ▼
                                                                [Order Status -> 'placed']
                                                                [SubOrders -> 'placed']
                                                                [Escrow Records -> 'HELD']
```

---

## 3. Webhook Architecture & Idempotency Protocol

### 3.1 Webhook Endpoint Specification
- **Path:** `POST /api/v1/payments/razorpay/webhook`
- **Authentication:** Unauthenticated in HTTP headers; authenticated cryptographically via `X-Razorpay-Signature`.
- **Signature Algorithm:** HMAC-SHA256 of raw request body against `settings.RAZORPAY_WEBHOOK_SECRET`.
- **Timing Safe Comparison:** Use `hmac.compare_digest` to prevent timing attacks.

### 3.2 Supported Event Types
1. `payment.captured`: Confirms payment settlement. Updates `payment_transactions.status = 'captured'`, updates `orders.payment_status = 'completed'`, and confirms child `suborders`.
2. `payment.failed`: Records failure reason, marks transaction as `failed`, leaves order in `pending`, and notifies customer to retry.
3. `refund.processed`: Confirms return refund completion; updates `return_requests.status = 'APPROVED'` and marks escrow as `REFUNDED`.
4. `refund.failed`: Alerts administrator of refund failure for manual banking resolution.

### 3.3 Idempotency Ledger
Razorpay guarantees at-least-once delivery; webhooks may be delivered multiple times.
- Create an `idempotency_keys` table or use a unique index on `payment_transactions.razorpay_payment_id` and `webhook_event_id`.
- If an incoming `event_id` was already processed, immediately return `200 OK` without re-executing state transitions.

---

## 4. Multi-Vendor Financial Settlement & Escrow Execution

### 4.1 Commission Accounting Model
- **Gross Suborder Value ($V_{gross}$):** Item sum + seller-specific shipping fee.
- **Platform Commission ($C_{platform}$):** $15\%$ of item sum (shipping fee is passed 100% to merchant).
- **Net Merchant Escrow ($E_{net}$):** $V_{gross} - C_{platform} - D_{coupon}$.
- **Formula:**
  $$E_{net} = \text{Subtotal} \times 0.85 + \text{Shipping} - \text{Discount}$$

### 4.2 Escrow Cooling Period ($T+3$ Days)
1. When a merchant marks a suborder as `delivered`, the escrow maturity timer is locked:
   $$\text{maturity\_date} = \text{delivered\_at} + 3\text{ days}$$
2. During the 3-day window, customer return claims freeze the escrow record.
3. If no return is filed after 72 hours, the background task transitions status from `HELD` to `MATURED`.
4. `MATURED` funds become eligible for batch banking payout via Razorpay Route or standard NEFT/RTGS batch transfer.

---

## 5. Production Launch Checklist for Payments

- [ ] Razorpay Live Account KYC verified and activated.
- [ ] Live Key ID (`rzp_live_...`) and Secret configured in production environment variables.
- [ ] Webhook URL registered in Razorpay Dashboard (`https://api.glamgo.example/api/v1/payments/razorpay/webhook`).
- [ ] Webhook secret configured and validated.
- [ ] Subscribed to events: `payment.captured`, `payment.failed`, `refund.processed`.
- [ ] Automated test verifying test-mode capture, refund, and webhook signature validation passes 100%.
- [ ] Zero payment credentials committed to Git.
