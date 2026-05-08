# Rental — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/sales/rental.html
**FusionAI status:** Partial
**Effort to complete:** L
**Business priority:** P2

---
## Odoo 17 Feature Checklist

### Core Features
- [x] Rental order creation with customer, pickup date, return date — ✅ Done
- [x] Order line items (product, qty, unit price, subtotal) — ✅ Done
- [x] Auto-calculate order total from lines — ✅ Done
- [x] Workflow states: draft → pickup → return → done / cancel — ✅ Done
- [x] Confirm pickup action — ✅ Done
- [x] Register return action — ✅ Done
- [x] Reference number auto-generation (RENTAL/XXXXX) — ✅ Done
- [x] Customer selection from partner list — ✅ Done
- [x] Product selection from inventory catalog — ✅ Done
- [ ] "Can be Rented" product flag — ❌ Missing (all products shown, no rental-specific filter)
- [ ] Rental pricing per duration (hourly, daily, weekly, monthly) — ❌ Missing (flat unit price only)
- [ ] Extra hour / extra day late-return penalties — ❌ Missing
- [ ] Security / padding time between consecutive rentals — ❌ Missing
- [ ] Unavailability / blackout date configuration — ❌ Missing
- [ ] Minimal rental duration enforcement — ❌ Missing
- [ ] Automatic price computation (cheapest applicable rate) — ❌ Missing
- [ ] Pricelist integration — ❌ Missing
- [ ] Digital customer signature on rental agreement (Sign app) — ❌ Missing
- [ ] Printable pickup receipt (PDF) — ❌ Missing
- [ ] Printable return receipt (PDF) — ❌ Missing
- [ ] Tax calculation on rental lines — ❌ Missing (taxes hardcoded 0%)
- [ ] Invoicing / billing from rental order — ❌ Missing
- [ ] Stock availability check before pickup confirmation — ❌ Missing
- [ ] Stock transfer / delivery integration (pick → return as WH moves) — ❌ Missing
- [ ] Rental product availability calendar — ❌ Missing
- [ ] Kanban dashboard with status filters (quotations, pickups, returns) — ❌ Missing (list view only)

### Views / UI
- [x] List view — ✅ Done
- [x] Form view (full order with lines) — ✅ Done
- [ ] Kanban view with sidebar status filters — ❌ Missing
- [ ] Calendar view (pickup/return dates) — ❌ Missing
- [ ] Graph / reporting view — ❌ Missing (revenue by product, utilization)

### Role & Permission Settings
- [ ] Rental User role — ❌ Missing
- [ ] Rental Manager role — ❌ Missing

### Module Configuration
- [ ] Default delay cost settings — ❌ Missing
- [ ] Default padding time between rentals — ❌ Missing
- [ ] Minimal rental duration — ❌ Missing
- [ ] Rental transfers toggle (use stock deliveries/receipts) — ❌ Missing
- [ ] Unavailability dates settings — ❌ Missing

### Integrations
- [ ] Mail / chatter on rental order — ❌ Missing
- [ ] Invoicing / Accounting (generate invoice from rental) — ❌ Missing
- [ ] Inventory / Stock (delivery + receipt for pickup/return) — ❌ Missing (product linked but no stock moves)
- [ ] Sign app (digital signature on rental agreement) — ❌ Missing
- [ ] Calendar (pickup/return schedule visibility) — ❌ Missing
- [ ] Automation (late-return alerts, upcoming pickup notifications) — ❌ Missing
- [ ] Claude AI — AI-assisted rental period pricing suggestions, demand forecasting, utilization optimization — ❌ Missing
- [ ] Sales / Pricelists (pricelist on rental order) — ❌ Missing

### API Endpoints
- [x] `GET /api/fs-rental/rentals` — ✅
- [x] `POST /api/fs-rental/rentals` — ✅ (with nested line creation)
- [x] `PUT /api/fs-rental/rentals/:id` — ✅
- [x] `DELETE /api/fs-rental/rentals/:id` — ✅
- [x] `GET /api/fs-rental/tasks` (Field Service tasks, co-located route) — ✅
- [x] `POST /api/fs-rental/tasks` — ✅
- [x] `PUT /api/fs-rental/tasks/:id` — ✅
- [x] `DELETE /api/fs-rental/tasks/:id` — ✅
- [ ] `GET /api/fs-rental/rentals/:id` — ❌ (single order fetch missing)
- [ ] `PUT /api/fs-rental/rentals/:id/lines` — ❌ (lines not updateable after create)
- [ ] `GET /api/fs-rental/products?rentable=true` — ❌ (rental-flagged product filter)
- [ ] `POST /api/fs-rental/rentals/:id/invoice` — ❌
- [ ] `GET /api/fs-rental/availability?productId=X&from=Y&to=Z` — ❌
- [ ] `GET /api/fs-rental/stats` — ❌ (utilization, revenue)

---
## Missing Features Summary

| Gap | Severity | Notes |
|---|---|---|
| Duration-based pricing tiers | Critical | Core differentiator of Odoo Rental vs plain Sales; flat price is insufficient for time-based billing |
| Stock / inventory integration | High | Pickup should create stock move out; return creates stock move in |
| Invoicing from rental order | High | Revenue recognition requires invoice generation |
| "Can be Rented" product flag + filter | High | Prevents renting non-rental items |
| Late return penalties (extra day/hour) | Medium | Revenue protection for overdue returns |
| Rental agreement PDF + digital signature | Medium | Legal / compliance requirement for many rental businesses |
| Kanban view with status sidebar | Medium | Primary Odoo Rental dashboard view |
| Product availability check + calendar | Medium | Prevent double-booking same asset |
| Tax on rental lines | Medium | Tax engine already exists in platform |
| Padding / security time between rentals | Low | Operational buffer between rentals of same asset |
| Pricelist integration | Low | Customer-specific rental pricing |
| Claude AI actions | Low | Price optimization, demand forecast, utilization insights |
| RBAC (Rental Manager / User) | Low | Parity with Odoo permission model |
| Mail / chatter | Low | Consistent with rest of ERP |

---
## Recommended Build Order

1. **"Can be Rented" product flag** — add `canBeRented: Boolean` to Product schema; filter product picker in rental UI; add `GET /api/fs-rental/products?rentable=true`
2. **Duration-based pricing** — add `RentalPricingRule` model (productId, durationUnit: hour/day/week/month, price); auto-select cheapest rate when dates are set
3. **Stock integration** — on "Confirm Pickup" create stock move out; on "Register Return" create stock move in; availability check before pickup
4. **Tax calculation** — apply tax engine to rental order lines (same pattern as Sales/Invoicing)
5. **Invoicing** — `POST /api/fs-rental/rentals/:id/invoice` creates an invoice from rental order; link to Accounting
6. **Late return penalties** — compare actual return datetime vs planned; auto-add penalty line at configured rate
7. **Kanban view** — add kanban view with sidebar filters (Quotation / Pickup / Return / Done)
8. **Product availability calendar** — `GET /api/fs-rental/availability`; show blocked dates on date pickers in form
9. **Rental agreement PDF** — generate PDF receipt (pickup + return); add digital signature request via Sign module
10. **Padding time** — `securityTime` setting; block `[returnDate, returnDate + padding]` in availability
11. **Claude AI actions** — (a) suggest optimal pricing for requested period based on demand, (b) forecast utilization for next 30 days, (c) flag overdue returns
12. **Mail / chatter** — attach Chatter to rental order form
13. **RBAC** — Rental Manager / User middleware guards
