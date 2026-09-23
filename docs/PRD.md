# Covet — Product Requirements Document

**Product:** Covet — a curated multi-vendor e-commerce marketplace
**Version:** 1.0 · **Date:** July 2026 · **Status:** Design complete → Build phase
**Companion docs:** `DESIGN_SYSTEM.md` (tokens/components) · `CLAUDE.md` (build conventions)

---

## 1. Overview

Covet is a **multi-vendor marketplace**: many independent sellers list products under one
storefront, one cart, and one checkout (model: Etsy/Amazon). One design language serves
four audiences — **Storefront** (shoppers), **Customer dashboard**, **Seller/Vendor
dashboard**, and **Admin dashboard**.

The full UI already exists as high-fidelity mockups (52 screens). This PRD defines what the
functional Next.js application must do so those screens become a working product.

### Goals
- Let shoppers discover products across thousands of sellers and check out once.
- Let sellers manage their own catalog, orders, coupons, and reporting in isolation.
- Let admins oversee vendors, customers, catalog, orders, and platform earnings.
- Reproduce the mockups exactly using the design tokens — premium, 2026, not template.

### Non-goals (explicitly out of scope)
Auctions · Publication House / Authors / Creators · chat-with-vendor (replaced by an **AI
support agent**) · Cash on Delivery (**Stripe-only**) · Google Maps address picker ·
currency / language switchers.

### Success metrics
- Checkout completion rate; cart-to-order conversion.
- Seller onboarding time (register → first product live).
- Order fulfillment SLA (confirmed → shipped).
- Search-to-product-view and product-view-to-add-to-cart rates.
- Support-ticket first-response time (AI agent deflection rate).

---

## 2. Personas & roles

| Role | Who | Sees |
|---|---|---|
| **Guest** | Unauthenticated shopper | Storefront, browse, cart; must sign in to checkout |
| **Customer** | Registered shopper | Storefront + customer dashboard (own orders/data) |
| **Vendor** | Independent seller | Vendor dashboard — **only their own** products/orders/earnings |
| **Admin** | Platform operator | Admin dashboard — all vendors, customers, catalog, orders, platform earnings |

Role-based access is enforced **on the server**; every vendor query is scoped to the
authenticated vendor id.

---

## 3. The marketplace rules (invariants — never break)

1. Every product visibly shows **which seller** it comes from.
2. Carts **group items under a seller header**.
3. Orders **split by seller** (one customer order fans out to per-seller sub-orders).
4. Sellers only ever see **their own data**.

---

## 4. Scope by area & screen

Screens below map to the delivered mockups. Each data view ships **four states**:
default / loading (skeleton) / empty / error.

### 4.1 Storefront (shopper-facing)
- **Home** — utility bar, header (mega-menu, search, wishlist, account, cart popover),
  hero/promo slider, Flash Deal (live countdown), Featured Products, category tiles,
  Featured Deals, wide promo banner, Top Sellers, Deal of the Day + Latest, New Arrivals,
  Best-Selling/Top-Rated (tabbed), brand logos, category rails, trust badges, footer.
- **Category / search results** — filter sidebar (price, category, brand), sort, grid,
  quick-view modal, product cards with seller.
- **Store (vendor storefront)** — banner, seller card (logo, rating, orders, **Ask AI
  Support**), All-Products toolbar (search/sort/filter), filter sidebar, product grid.
- **Product detail** — gallery, seller line, price/compare, rating, add-to-cart, quick view.
- **Cart** — items **grouped by seller**, qty edit, per-seller subtotals, proceed to checkout.
- **Checkout** — shipping address, shipping method, payment (**Stripe: card + wallet**),
  order summary; **success** confirmation screen.
- **Auth** — login (email, password), register (name, email, password), plus vendor
  login/register (seller onboarding).

### 4.2 Customer dashboard
Profile info · My Orders (list) · Order details (tabs: summary, track) · Wishlist ·
Inbox (**AI support agent**) · My Address (add/edit) · Support Ticket (list + add-ticket
modal) · Track Order. Account sidebar shell; customer sees only their own data.

### 4.3 Vendor / Seller dashboard
- **Dashboard** — business analytics (order-status stat cards), Vendor Wallet
  (withdrawable balance, commission, tax, collected cash), Earning Statistics chart,
  Most-Rated / Top-Selling products, Top Delivery Man.
- **Catalog** — Product List, Add Product, Edit Product, Product Reviews.
- **Orders** — Order List (status sub-nav + summary), Order Details (seller-grouped items,
  status change, invoice).
- **Marketing** — Coupons (setup form + list + view modal).
- **Reports** — Order Report, Product Report, Transaction Report (charts + tables).
- **Account** — Profile, Change Password.

### 4.4 Admin dashboard
- **Dashboard** — platform-wide analytics, charts (earnings line, order donut), panels.
- **People** — Vendor List, Add Vendor, Customer List, Customer Review.
- **Catalog** — In-house Product List, Vendor Product List, Add Product, Product Details.
- **Orders** — All Orders.
- **Reports** — Earning Report (admin/vendor tabs + donut), Order Report, Product Report,
  Product Stock (status badges + pagination).

---

## 5. Functional requirements

### 5.1 Catalog & discovery
- Products belong to exactly one seller; a product carries seller ref, category, price,
  compare-at, discount, stock, rating, reviews, images, type (physical/digital).
- Browse by category (mega-menu + rails), filter (price/category/brand), sort
  (relevance, price, rating, newest), full-text search across products/brands/sellers.
- Quick-view modal without leaving the listing.

### 5.2 Cart & checkout
- Add/remove/update qty; cart persists (localStorage for guests, server for logged-in).
- Cart and order **group by seller**; subtotals computed per seller and combined.
- Checkout collects shipping/billing, shipping method, and payment.
- **Stripe only** (Checkout or PaymentIntents). No COD paths anywhere.
- Placing an order fans out into per-seller sub-orders, each independently trackable.

### 5.3 Orders & fulfillment
- Status lifecycle: Pending → Confirmed → Packaging → Out for delivery → Delivered;
  plus Canceled / Returned / Failed to deliver.
- Payment status: Paid / Unpaid / Refunded.
- Customer: view/track own orders, cancel where allowed, download invoice.
- Vendor: see own sub-orders, change status, print invoice, verification code.
- Status → color via `StatusBadge` tokens (design system §2/§8).

### 5.4 Seller operations
- Vendor onboarding (register → store setup guide).
- CRUD products (with variations, gallery, SEO, digital file upload); items may require
  admin approval (Approved/Pending/Denied).
- Coupons (discount-on-purchase, free delivery, first-order) with limits and date ranges.
- Wallet: earnings, withdrawable balance, withdrawal requests, commission/tax breakdown.
- Reports scoped to the vendor's own data.

### 5.5 Admin operations
- Manage vendors (list, add, approve), customers, and reviews.
- Manage in-house + vendor catalog; approve/deny products.
- Oversee all orders; platform earning/commission/tax reporting.
- Product stock oversight (In-Stock / Soon Stock Out / Out of Stock).

### 5.6 Support
- **AI support agent** inbox replaces per-vendor chat (customer & order context aware).
- Support tickets: create (modal), list, statuses (Open/Pending/Answered/Closed),
  priorities (Low/Medium/High/Urgent).

### 5.7 Accounts & auth
- Role-based auth: customer / vendor / admin; route groups gated in middleware/layout.
- Profile management, address book, change password.

---

## 6. Non-functional requirements

- **Stack:** Next.js (App Router) + TypeScript, Tailwind + shadcn/ui, lucide-react,
  react-chartjs-2. Server Components by default; Client Components only for interactivity.
- **Design fidelity:** all styling from `DESIGN_SYSTEM.md` tokens; no hardcoded values.
  Fonts Sora + Instrument Sans only.
- **Data integrity:** validate all input with zod; type everything; scope vendor data
  server-side.
- **States:** every view has default/loading/empty/error (`loading.tsx`, `error.tsx`,
  skeletons).
- **Responsive:** desktop-first (1440px+), fully responsive down to mobile; hit targets
  ≥44px; container tokens for width/padding.
- **Accessibility:** semantic HTML, labeled controls, visible focus ring, adequate contrast.
- **Performance:** server-render listings, lazy-load below-the-fold, optimize images.
- **Security:** Stripe for payments (no card data stored), auth on every mutation.

---

## 7. Content & brand

Real content only — real product names, sellers, prices, categories. No lorem ipsum, no
placeholder "Product 1", no emoji in UI. Brand wordmark "Covet" (Sora 800) + iris period.
Primary iris `#6544E0` used as accent, not flood.

---

## 8. Release phases (suggested)

1. **Foundations** — tokens in `globals.css`/Tailwind, shadcn components restyled, shells
   (storefront header/footer, dashboard rail/sidebar/topbar), auth.
2. **Storefront + cart + checkout** — browse, search, product, cart (seller-grouped),
   Stripe checkout, order success.
3. **Customer dashboard** — orders, tracking, wishlist, address, tickets, AI inbox.
4. **Vendor dashboard** — catalog CRUD, orders, coupons, wallet, reports.
5. **Admin dashboard** — people, catalog oversight, all orders, platform reports.

---

## 9. Open questions

- Product approval flow — auto-approve trusted vendors, or all products admin-reviewed?
- Payout schedule and minimum withdrawal threshold for vendor wallets.
- AI support agent — model/provider, escalation-to-human path, data scope.
- Shipping — flat per seller, weight-based, or carrier-integrated?
- Tax/VAT calculation source (manual rates vs. tax service).
