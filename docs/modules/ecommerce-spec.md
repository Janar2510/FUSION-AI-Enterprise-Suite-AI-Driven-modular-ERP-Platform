# eCommerce — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/websites/ecommerce.html
**FusionAI status:** Partial
**Effort to complete:** L
**Business priority:** P1

---
## Odoo 17 Feature Checklist

### Core Features

#### Products & Catalog
- [ ] Product catalog with categories — 🟡 Partial (products fetched from `GET /api/products`; category shown but no dedicated eCommerce category tree)
- [ ] Product detail page — ❌ Missing (no PDP; only grid cards with "Add to Cart")
- [ ] Product images — ❌ Missing (`image_url` field exists in type but placeholder icon shown)
- [ ] Product variants (size, color) — ❌ Missing
- [ ] Product attributes / attribute values — ❌ Missing
- [ ] Product filtering & faceted search — ❌ Missing (text search only)
- [ ] Price lists / multi-currency — ❌ Missing
- [ ] Cross-selling / upselling — 🟡 Partial (AI recommendations panel exists and calls real API)
- [ ] Product reviews & ratings — ❌ Missing
- [ ] Stock availability display — ❌ Missing (stock field exists in `WebProduct` type but not rendered)

#### Shopping Cart
- [ ] Session-based cart — ✅ Done (localStorage session ID, server-side `WebCart`)
- [ ] Add to cart — ✅ Done
- [ ] Quantity update in cart — ❌ Missing (quantity display only, no increment/decrement controls)
- [ ] Remove item from cart — ❌ Missing
- [ ] Cart subtotal / tax calculation — ✅ Done (10% flat tax on backend)
- [ ] Discount codes / promo application — ❌ Missing (discount_amount field exists but unused)
- [ ] Cart persistence across sessions — ❌ Missing (new session on checkout)
- [ ] Abandoned cart recovery — ❌ Missing

#### Checkout
- [ ] Single-page checkout — 🟡 Partial (name + email only, no address, phone, or shipping fields)
- [ ] Shipping address form — ❌ Missing
- [ ] Billing address form — ❌ Missing
- [ ] Multiple shipping methods — ❌ Missing
- [ ] Delivery date selection — ❌ Missing
- [ ] Order confirmation email — ❌ Missing
- [ ] Order confirmation page — 🟡 Partial ("Access Granted" modal shows order number)

#### Payments
- [ ] Payment provider integration (Stripe / PayPal / etc.) — ❌ Missing (simulation mode only)
- [ ] Credit card form — ❌ Missing
- [ ] Invoice generation on checkout — ❌ Missing (SaleOrder is created but no invoice)
- [ ] Refund handling — ❌ Missing

#### Customer Accounts
- [ ] Customer registration / login — ❌ Missing
- [ ] Order history — ❌ Missing
- [ ] Saved addresses — ❌ Missing
- [ ] Wishlist — ❌ Missing
- [ ] Account dashboard — ❌ Missing

#### Order Management
- [ ] Web order created on checkout — ✅ Done (`WebOrder` + `SaleOrder` created)
- [ ] Order status tracking — ❌ Missing (no order status page or email updates)
- [ ] Return / refund request — ❌ Missing
- [ ] Back-office order list for operators — ❌ Missing

#### Analytics & Performance
- [ ] Sales performance dashboard — ❌ Missing
- [ ] Conversion funnel reporting — ❌ Missing
- [ ] Top products report — ❌ Missing
- [ ] Revenue over time chart — ❌ Missing
- [ ] AI recommendations engine — ✅ Done (`POST /api/ecommerce/ai/recommendations` with real product data)

### Views / UI
- [ ] Storefront / product grid — ✅ Done (responsive 4-col grid, search, category badge)
- [ ] Product detail page (PDP) — ❌ Missing
- [ ] Cart drawer — ✅ Done (slide-in cart panel with item list and totals)
- [ ] Checkout form — 🟡 Partial (name + email, simulated payment block)
- [ ] Order confirmation modal — 🟡 Partial (modal with order number)
- [ ] Customer account pages — ❌ Missing
- [ ] Admin: product manager — ❌ Missing (managed through Inventory/Products module)
- [ ] Admin: order list — ❌ Missing

### Role & Permission Settings
- [ ] Shop Manager role — ❌ Missing
- [ ] Customer (self-service) role — ❌ Missing
- [ ] Guest checkout support — 🟡 Partial (email + name collected but no auth)

### Module Configuration
- [ ] eCommerce settings page — ❌ Missing
- [ ] Tax configuration (currently hardcoded 10%) — ❌ Missing
- [ ] Currency selection — ❌ Missing
- [ ] Shipping carrier configuration — ❌ Missing
- [ ] Payment provider setup — ❌ Missing

### Integrations
- [ ] Inventory (stock sync) — ❌ Missing (stock not decremented on order)
- [ ] Invoicing (auto-invoice on order) — ❌ Missing
- [ ] Sales (SO created on checkout) — ✅ Done
- [ ] Mail (order confirmation email) — ❌ Missing
- [ ] Automation (trigger on purchase) — ❌ Missing
- [ ] Claude AI (3 actions: product descriptions, recommendations, abandoned cart copy) — 🟡 Partial (recommendations only)
- [ ] Website (product pages on site) — ❌ Missing

### API Endpoints
- [ ] `GET /api/products` — ✅ Done (shared with Inventory)
- [ ] `POST /api/ecommerce/cart/:sessionId` — ✅ Done (get/create cart)
- [ ] `POST /api/ecommerce/cart/:sessionId/items` — ✅ Done (add item)
- [ ] `DELETE /api/ecommerce/cart/:sessionId/items/:itemId` — ❌ Missing
- [ ] `PUT /api/ecommerce/cart/:sessionId/items/:itemId` — ❌ Missing (qty update)
- [ ] `POST /api/ecommerce/cart/:sessionId/checkout` — ✅ Done
- [ ] `POST /api/ecommerce/ai/recommendations` — ✅ Done
- [ ] `GET /api/ecommerce/orders` — ❌ Missing
- [ ] `GET /api/ecommerce/orders/:id` — ❌ Missing
- [ ] `POST /api/ecommerce/discount/apply` — ❌ Missing
- [ ] `GET /api/ecommerce/categories` — ❌ Missing
- [ ] `GET /api/ecommerce/products/:id` — ❌ Missing (PDP data)

---
## Missing Features Summary

| Category | Missing |
|---|---|
| Cart UX | Qty controls, remove item, discount codes, cart persistence |
| Checkout | Address fields, shipping methods, real payment gateway |
| Customer Accounts | Login, order history, wishlist, saved addresses |
| Product Catalog | PDP, variants, attributes, images, reviews, stock display |
| Order Management | Status tracking, back-office order list, returns |
| Integrations | Inventory stock sync, invoice creation, email confirmation |
| Analytics | Sales dashboard, conversion funnel, revenue reports |
| Config | Tax config, currency, shipping carriers, payment providers |

**Current state:** A working storefront skeleton — session cart, add-to-cart, flat-tax totals, basic checkout creating a real SaleOrder+WebOrder, and AI product recommendations. Payment is simulated. Everything post-checkout (email, fulfillment, account portal) is missing.

---
## Recommended Build Order

1. **Cart improvements** — remove item endpoint, quantity update, discount code application
2. **Real payment gateway** — Stripe integration (`POST /api/ecommerce/cart/:sessionId/checkout` with Stripe PaymentIntent)
3. **Order confirmation email** — trigger outbox relay on checkout
4. **Product detail page** — PDP route with images, description, variants, stock badge
5. **Inventory sync** — decrement stock on checkout; show "Out of Stock" on PDP
6. **Customer accounts** — registration/login, order history portal
7. **Admin order list** — back-office view for operators
8. **Analytics dashboard** — revenue chart, top products, conversion funnel
9. **Claude AI** — product description generator, email copy for abandoned cart
10. **Invoicing integration** — auto-create draft invoice on order confirmation
