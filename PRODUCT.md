# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Everyday Beauty Consumers:** Customers in urban Indian neighborhoods (starting with Mumbai / Bandra West) booking verified at-home salon treatments, scheduling appointments at local partner salons, or buying authentic skincare, haircare, fragrance, and colour products online.
- **Salon Owners:** Studio founders and parlour operators managing branches, staff rosters, service menus, chair availability schedules, and appointment bookings.
- **Product Sellers & Beauty Brands:** Verified merchants listing multi-variant SKUs (`SellerListing`), managing stock ledgers across product sizes/shades, packing and shipping customer suborders, handling return requests, and tracking `T+7` post-delivery escrow payouts.
- **Independent Beauty Specialists:** Verified at-home practitioners managing service pricing, calendar availability, booking requests, and treatment earnings.
- **Platform Administrators:** Internal operators moderating partner applications, user governance, bookings, multi-vendor orders, catalog integrity, and audit trails via Command Centre.

## Product Purpose

Unify at-home beauty services, local salon bookings, and direct multi-vendor beauty commerce in one platform—giving consumers one account across all three experiences while equipping salon owners, independent specialists, and product sellers with verified demand, inventory control, fulfillment tracking, and settled payouts.

## Positioning

Unlike single-purpose salon directories or unverified cosmetics marketplaces, GlamGo pairs three consumer vertical experiences (`At-Home Services`, `Salons & Parlours`, `Beauty Store`) with canonical per-variant, per-seller inventory reservations, atomic multi-vendor split checkout, and `T+7` return-window-aligned seller escrow inside one application.

## Operating Context

- **Guest Discovery & Unified Conversion:** Unauthenticated visitors browse home treatments, partner salons, product variants, and partner capabilities directly before signing in for booking confirmation or payment checkout.
- **Role Portals:** Partners access `Professional`, `Salon Owner`, and `Product Seller` operational tools inside Partner Studio (`/partner` / `#partner`); prospective partners submit registration drafts for admin approval.
- **Payment & Settlement Workflow:** Online purchases initialize Razorpay checkout after inventory reservation, confirm only on verified gateway evidence, track fulfillment per seller suborder (`pending -> packed -> in_transit -> delivered`), reconcile returns idempotently, and mature seller escrow 7 days post-delivery.

## Capabilities and Constraints

- **Preserved Architecture:** Retain vanilla ES-module SPA (`index.html`, `src/app.js`, `src/api.js`, `styles.css`, Vite build) connected to FastAPI + PostgreSQL backend without breaking existing routes, cart composite keys (`productId::variant::listingId`), OOS/refund badges, or fulfillment gating.
- **Factual Claims Only:** Surface only verified platform pricing, live catalog counts, and implemented workflows (fixed upfront rates, `T+7` escrow maturity, multi-variant listings); never invent commission percentages, fake reviews, or unverified metrics.
- **Visual Authority (User-Confirmed):** Preserve GlamGo's warm ivory, cream, espresso, champagne, and terracotta editorial identity (`#F7F4EF`, `#EFEAE1`, `#1E1C1A`, `#C5A059`, `#B86B52`) while improving visual hierarchy, removing glow/slop artifacts, fixing duplicate imagery, and delivering responsive layout fidelity from `320px` to `1440px`.

## Brand Commitments

- **Brand Name:** GlamGo (`GLAMGO` wordmark paired with minimal 3-dot geometric mark).
- **Palette:** `#F7F4EF` ivory ground, `#EFEAE1` soft cream alternate band, `#1E1C1A` espresso ink/dark band, `#C5A059` champagne accent, `#B86B52` terracotta interactive highlight.
- **Typography:** `Cormorant Garamond` display serif paired with `Manrope` sans-serif body and UI controls.
- **Existing Photography Assets:** `public/assets/*.webp` local product and editorial visuals plus verified Unsplash photography with clean footer credit attribution.

## Product Principles

1. **One Gateway for Every Customer:** Consumers booking treatments, salon owners evaluating chair software, and brand sellers onboarding SKUs immediately see what GlamGo offers them from the first visit—never buried below the fold or hidden behind consumer login copy.
2. **Real Product Workflows as Proof:** Replace vague luxury adjectives with interactive, honest views of real capabilities (upfront prices, booking calendars, per-variant stock, suborder tracking, `T+7` escrow).
3. **Zero Context Drop on Sign-In & Deep Links:** Preserving selected portal role, cart items, variants, addresses, and deep-link hashes (`#partner`, `#admin`, `#product/...`) across reloads and authentication.
4. **Equal Craft Desktop-to-Mobile:** Consistent gutters, generous section breathing room, >=44px primary touch targets where feasible, non-overlapping notifications, and zero horizontal overflow (`320px–1440px`).
