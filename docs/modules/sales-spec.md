# Sales — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/sales/sales.html
**FusionAI status:** Partial
**Effort to complete:** L
**Business priority:** P1

---

## Odoo 17 Feature Checklist

### Core Features
- [x] Quotations (draft) → Sales Orders (confirmed) — ✅ Done (state machine: draft → sent → sale → done → cancel)
- [x] Order lines with qty, unit price, discount, subtotal — ✅ Done
- [x] Invoice creation from confirmed sale order — ✅ Done (Flow C)
- [x] Auto-create delivery picking on confirm — ✅ Done (Flow B via confirmSaleOrder)
- [x] Cancel order — ✅ Done
- [ ] Quotation templates — ❌ Missing (no template model or UI)
- [ ] Optional products on quotations — ❌ Missing
- [ ] Online signature for order confirmation — ❌ Missing
- [ ] Online payment link / portal checkout — ❌ Missing
- [ ] Quotation expiration deadline (validityDate field exists) — 🟡 Partial (field stored, no automatic expiry logic or warning)
- [ ] Separate delivery and invoice addresses — ❌ Missing (single partnerId only)
- [ ] Product variants on order lines — ❌ Missing (productId stored, but no variant selector)
- [ ] PDF quote builder / custom quote layout — 🟡 Partial (generateOrderPdf exists but is basic)
- [ ] Invoicing policy per product (on-order vs. on-delivery) — ❌ Missing (hardcoded create-on-demand)
- [ ] Down payments — ❌ Missing
- [ ] Pro-forma invoices — ❌ Missing
- [ ] Time & materials billing / milestone invoicing — ❌ Missing
- [ ] Pricelist support (multi-level, multi-currency) — ❌ Missing
- [ ] Multi-currency orders — ❌ Missing
- [ ] Return / refund processing — ❌ Missing
- [ ] Loyalty programs, discount codes, gift cards — ❌ Missing
- [ ] Bulk product import on order — ❌ Missing
- [ ] Amazon / eBay connector — ❌ Missing (out of scope MVP)
- [ ] Send quotation by email (portal link) — ❌ Missing

### Views / UI
- [x] List view — ✅ Done (OdooListBase with columns: number, date, customer, total, status)
- [ ] Kanban view — ❌ Missing (viewsAvailable hardcoded to ['list', 'form'])
- [x] Form view — ✅ Done (full form with order lines, totals, status ribbon)
- [ ] Calendar view — ❌ Missing
- [ ] Gantt/timeline view — ❌ Missing
- [ ] Graph / pivot reports — ❌ Missing (no analytics screen)
- [ ] Activity view — ❌ Missing
- [ ] Dashboard (metrics cards) — ❌ Missing (Sales has no dashboard tab; Purchases has one, Sales does not)

### Role & Permission Settings
- [x] Auth guard (requireAuth middleware) — ✅ Done
- [x] Record-level filter (saleOrderFilter per user) — ✅ Done
- [ ] Role: Sales User — can create/edit own quotations, cannot confirm/cancel others — ❌ Not modelled
- [ ] Role: Sales Manager — full access, can override prices, see all orders — ❌ Not modelled
- [ ] Role: Portal User — view-only, sign online — ❌ Not modelled

### Module Configuration (Settings page)
- [ ] Default invoice policy (ordered qty / delivered qty) — ❌ Missing
- [ ] Quotation validity duration (company default) — ❌ Missing
- [ ] Lock confirmed orders — ❌ Missing
- [ ] Sales warning on partner / product — ❌ Missing
- [ ] Margin display on order lines — ❌ Missing
- [ ] Purchase order link on sale order — ❌ Missing

### Integrations
- [x] Accounting — creates AccountMove (out_invoice) with double-entry lines — ✅ Done
- [x] Inventory — auto-creates stock picking on confirm — ✅ Done
- [x] Chatter / Discuss — ChatterPanel rendered in form right panel — ✅ Done
- [ ] Calendar — schedule follow-up activities tied to quotation — ❌ Missing
- [ ] Mail/Discuss — send quotation by email, auto-email on confirm — ❌ Missing (chatter exists but no email dispatch)
- [ ] Automation rules — trigger on SO state change (e.g., send email when confirmed) — ❌ Missing
- [x] Claude AI — AiActionsPanel mounted with `agentKey="lead-scoring"` — 🟡 Partial (one agent key wired, generic panel)
- [ ] Claude AI — "Summarise this order for handover" (context-aware summary) — ❌ Missing
- [ ] Claude AI — "Suggest upsell products based on order lines" — ❌ Missing
- [ ] CRM — link quotation to CRM opportunity — ❌ Missing

### API Endpoints
- [x] GET /api/sales — ✅ exists (paginated, state filter, RBAC filter)
- [x] GET /api/sales/:id — ✅ exists (includes partner, lines, invoices, pickings)
- [x] POST /api/sales — ✅ exists (auto-names via sequence)
- [x] PUT /api/sales/:id — ✅ exists (upserts lines)
- [x] POST /api/sales/:id/confirm — ✅ exists (Flow B+C trigger)
- [x] POST /api/sales/:id/cancel — ✅ exists
- [x] POST /api/sales/:id/invoice — ✅ exists (idempotent via idempotencyKey)
- [x] GET /api/sales/:id/pdf — ✅ exists (PDF download)
- [ ] POST /api/sales/:id/send — ❌ missing (email quotation to customer)
- [ ] POST /api/sales/:id/refund — ❌ missing (credit note / return)
- [ ] GET /api/sales/report/analysis — ❌ missing (aggregated sales analytics)
- [ ] POST /api/sales/:id/downpayment — ❌ missing

### Missing Features Summary
The core quotation-to-invoice-to-delivery flow is complete and production-ready, making Sales the most functional module in FusionAI. The largest gaps are (1) a Kanban view and analytics dashboard that salespeople rely on daily, (2) pricelist and multi-currency support required for any multi-market business, and (3) the ability to email quotations to customers with a portal link and collect online signatures or payment — which is the primary closure mechanism in Odoo's sales workflow.

### Recommended Build Order
1. **First:** Add Kanban view + Sales dashboard (metrics: revenue MTD, open quotations, conversion rate) — highest daily-use impact with moderate effort.
2. **Then:** Pricelist engine (model already referenced in schema), multi-currency, and invoicing policy per product — unlocks serious B2B use cases.
3. **Finally:** Email quotation dispatch with portal link, online signature capture, and customer portal view — completes the customer-facing side of the module.
