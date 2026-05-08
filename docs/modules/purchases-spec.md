# Purchases — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/inventory_and_mrp/purchase.html
**FusionAI status:** Partial
**Effort to complete:** M
**Business priority:** P1

---

## Odoo 17 Feature Checklist

### Core Features
- [x] Request for Quotation (RFQ) creation — ✅ Done (draft state)
- [x] Confirm RFQ to Purchase Order — ✅ Done (Flow D: state → purchase, auto-creates receipt picking)
- [x] Cancel purchase order — ✅ Done
- [x] Create vendor bill from confirmed PO — ✅ Done (createVendorBill idempotent)
- [x] Post (validate) vendor bill — ✅ Done (postInvoice)
- [x] Register payment against vendor bill — ✅ Done (registerPayment)
- [x] Order lines: product, description, qty, received, billed, unit price, subtotal — ✅ Done
- [x] Vendor reference field — ✅ Done (partnerRef)
- [ ] Blanket orders (framework agreements with date range and max qty) — ❌ Missing
- [ ] Call for tenders (compare multiple vendor quotes for one demand) — ❌ Missing
- [ ] Vendor pricelist import — ❌ Missing
- [ ] Purchase-specific units of measure — ❌ Missing (UoM model missing)
- [ ] Approval workflow (purchase amount threshold → manager approval) — ❌ Missing
- [ ] Multi-currency purchase orders — ❌ Missing
- [ ] Landed costs allocation — ❌ Missing
- [ ] Bill control policy (bill on ordered vs. received) — ❌ Missing (always billed on ordered qty)
- [ ] Temporary / scheduled reordering rules linked to PO — 🟡 Partial (replenishment engine exists in inventory, not surfaced in purchases UI)
- [ ] Vendor performance scoring / lead time tracking — 🟡 Partial (VendorIntelligenceService.updateVendorStats runs post-receipt but not surfaced in UI)

### Views / UI
- [x] Dashboard tab — ✅ Done (metrics: RFQs to approve, confirmed orders, total spend YTD; recent RFQs card, top vendors card)
- [x] List view (Orders tab) — ✅ Done (reference, vendor, date, status, untaxed, total)
- [x] Form view — ✅ Done (4-step progress bar: RFQ → Confirmed → Billed → Paid; action buttons per state)
- [ ] Kanban view — ❌ Missing (viewsAvailable is ['list', 'form'] only)
- [ ] Graph / pivot reports — ❌ Missing (no purchase analytics charts)
- [ ] Calendar view — ❌ Missing
- [ ] Purchase analysis report — ❌ Missing (Odoo has a dedicated PO analysis with group-by filters)
- [ ] Vendor cost analysis report — ❌ Missing

### Role & Permission Settings
- [x] Auth guard (requireAuth middleware) — ✅ Done
- [ ] Role: Purchase User — create RFQs, view own orders, cannot approve — ❌ Not modelled
- [ ] Role: Purchase Manager — approve all orders, override prices, access analytics — ❌ Not modelled
- [ ] Approval threshold per company — ❌ Missing (no purchase.order.approval model)

### Module Configuration (Settings page)
- [ ] Purchase order approval (enable / disable, set amount threshold) — ❌ Missing
- [ ] Default payment terms for vendors — ❌ Missing
- [ ] Default vendor lead time — ❌ Missing
- [ ] Lock confirmed POs — ❌ Missing
- [ ] Purchase warning on vendor / product — ❌ Missing
- [ ] Bill control default (ordered qty / received qty) — ❌ Missing

### Integrations
- [x] Accounting — vendor bills created as AccountMove (in_invoice) with journal entries — ✅ Done
- [x] Inventory — auto-creates stock picking (incoming receipt) on confirm — ✅ Done (confirmPurchaseOrder in flow.service)
- [x] Inventory — VendorIntelligenceService updates vendor stats after receipt validation — ✅ Done (backend only)
- [ ] Discuss / Mail — chatter on purchase orders (no ChatterPanel in purchases form) — ❌ Missing
- [ ] Calendar — schedule expected delivery date on calendar — ❌ Missing
- [ ] Automation rules — trigger on PO state change (e.g., notify manager when order confirmed) — ❌ Missing
- [ ] Manufacturing — trigger PO creation when MO material demand is unmet — ❌ Missing
- [ ] Claude AI — "Compare vendor quotes and recommend the best offer" — ❌ Missing
- [ ] Claude AI — "Summarise outstanding bills and flag overdue payments" — ❌ Missing
- [ ] Claude AI — "Predict lead time based on vendor history" — ❌ Missing

### API Endpoints
- [x] GET /api/purchases — ✅ exists (paginated, state filter)
- [x] GET /api/purchases/:id — ✅ exists (includes partner, lines, pickings)
- [x] POST /api/purchases — ✅ exists (auto-names via sequence nextval)
- [x] PUT /api/purchases/:id — ✅ exists (upserts lines)
- [x] POST /api/purchases/:id/confirm — ✅ exists (Flow D)
- [x] POST /api/purchases/:id/cancel — ✅ exists
- [x] POST /api/purchases/:id/bill — ✅ exists (idempotent)
- [x] POST /api/purchases/:id/post-bill — ✅ exists
- [x] POST /api/purchases/:id/pay-bill — ✅ exists
- [ ] GET /api/purchases/report/analysis — ❌ missing (aggregated spend analytics)
- [ ] POST /api/purchases/:id/approve — ❌ missing (approval workflow)
- [ ] GET /api/purchases/blanket-orders — ❌ missing
- [ ] GET /api/purchases/tenders — ❌ missing
- [ ] POST /api/purchases/:id/send-rfq — ❌ missing (email RFQ to vendor)

### Missing Features Summary
Purchases covers the essential RFQ → PO → receipt → bill → payment cycle reliably, and the dashboard gives useful at-a-glance KPIs. The most impactful gaps are (1) no ChatterPanel on purchase order forms — meaning teams lose all communication history, (2) no approval workflow for orders above a threshold, which is a compliance requirement in most companies, and (3) no blanket-order / call-for-tenders support, which is the primary procurement tool for strategic sourcing in Odoo.

### Recommended Build Order
1. **First:** Add ChatterPanel to purchase order form and wire email dispatch for RFQ send — closes the biggest daily UX gap.
2. **Then:** Approval threshold workflow (purchase.approval.policy setting + POST /approve endpoint + manager notification) — required for any company with financial controls.
3. **Finally:** Blanket orders model + call-for-tenders comparison UI + purchase analysis report with graph view — brings the module to feature parity for mid-market buyers.
