# Inventory — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/inventory_and_mrp/inventory.html
**FusionAI status:** Partial
**Effort to complete:** XL
**Business priority:** P1

---

## Odoo 17 Feature Checklist

### Core Features

#### Product Management
- [x] Product list + form (name, type, internal ref, barcode field, sale/cost price) — ✅ Done
- [x] Product types: storable, consumable, service — ✅ Done
- [x] Product categories — ✅ Done (fetchCategories, ProductCategory model)
- [x] On-hand quantity display on product form (via stock quants) — ✅ Done
- [ ] Product variants (size, colour, etc.) — ❌ Missing
- [ ] Units of measure (UoM + UoM category) — ❌ Missing
- [ ] Product packaging — ❌ Missing
- [ ] Serial number / lot tracking — ❌ Missing (no lot model in schema)
- [ ] Expiration date management — ❌ Missing
- [ ] Product image — ❌ Missing (no image field)
- [ ] Internal notes / sales description tabs on product — ❌ Missing

#### Transfers (Pickings)
- [x] Stock picking list with from/to location, origin, scheduled date, state — ✅ Done
- [x] Stock picking form with product moves grid (demand / done columns) — ✅ Done
- [x] Picking types (incoming, outgoing, internal) on dashboard — ✅ Done
- [x] Mark ready (draft/waiting/confirmed → assigned) — ✅ Done
- [x] Validate picking (transactional: updates quants, marks moves done) — ✅ Done
- [x] Auto-creates quant at destination if none exists — ✅ Done
- [x] Routing engine hook post-validate (StockRoutingEngine.handlePickingValidation) — ✅ Done
- [ ] Immediate transfer (bypass reserved qty check) — ❌ Missing
- [ ] Backorder creation when done qty < demand qty — ❌ Missing
- [ ] Return picking (reverse transfer) — ❌ Missing
- [ ] Scrap order — ❌ Missing
- [ ] Batch picking — ❌ Missing
- [ ] Cluster picking — ❌ Missing
- [ ] Wave processing — ❌ Missing
- [ ] Package tracking (physical box → quant) — ❌ Missing
- [ ] Barcode scanner workflow (mobile) — ❌ Missing

#### Inventory & Locations
- [x] Stock quants (on-hand by product × location) — ✅ Done
- [x] Stock locations model — ✅ Done (name, completeName, usage)
- [x] Quants tab (list view) in inventory module — 🟡 Partial (tab exists in UI but no dedicated render function shown; quants fetched and displayed in product form)
- [ ] Multi-warehouse setup — 🟡 Partial (warehouseId on pickings, warehouse on routes, but no warehouse management UI)
- [ ] Inventory adjustments (manual qty correction) — ❌ Missing
- [ ] Cycle counts (planned inventory audits) — ❌ Missing
- [ ] Scrap management — ❌ Missing
- [ ] Inventory aging report — ❌ Missing
- [ ] Putaway rules — ❌ Missing
- [ ] Storage categories — ❌ Missing
- [ ] Consignment management — ❌ Missing
- [ ] Dropshipping route — ❌ Missing

#### Replenishment
- [x] Reordering rules (StockWarehouseOrderpoint CRUD) — ✅ Done (GET/POST/PUT/DELETE /orderpoints)
- [x] ReplenishmentService.runReplenishment() — ✅ Done (POST /replenish/run)
- [x] Stock routes + rules (GET /routes) — ✅ Done (includes push/pull rules via routingEngine)
- [ ] Make-to-order (MTO) route trigger — ❌ Missing
- [ ] Temporary reordering rules — ❌ Missing
- [ ] Inter-warehouse replenishment — ❌ Missing
- [ ] Lead time configuration per vendor/product — ❌ Missing
- [ ] Replenishment UI (frontend screen to view/trigger rules) — ❌ Missing (backend only, no frontend page)

#### Inventory Valuation
- [ ] Automatic inventory valuation (Standard, AVCO, FIFO costing methods) — ❌ Missing
- [ ] Landed costs — ❌ Missing
- [ ] Valuation layer history — ❌ Missing
- [ ] Inventory valuation report — ❌ Missing

#### Shipping & Carriers
- [ ] Delivery carrier configuration — ❌ Missing
- [ ] Third-party shipper integration (DHL, FedEx, UPS, etc.) — ❌ Missing
- [ ] Shipping label printing — ❌ Missing
- [ ] Delivery methods on sale orders — ❌ Missing

### Views / UI
- [x] Dashboard (Overview tab) — ✅ Done (total products, total transfers, to-process metrics; picking-type cards with count)
- [x] Transfers list + form — ✅ Done
- [x] Products list + form — ✅ Done
- [ ] Kanban view for products or pickings — ❌ Missing
- [ ] Graph / pivot reports — ❌ Missing
- [ ] Replenishment UI page — ❌ Missing (no frontend for orderpoints)
- [ ] Locations tree view — ❌ Missing
- [ ] Inventory adjustments screen — ❌ Missing
- [ ] Lot/serial number traceability view — ❌ Missing

### AI Features (FusionAI Differentiator)
- [x] AI demand forecasting per product (30-day horizon, exponential smoothing) — ✅ Done (GET /ai/forecast/:productId)
- [x] AI reorder optimisation (recommend order/reduce actions) — ✅ Done (POST /ai/optimize-reorders)
- [x] Vendor intelligence service (updates stats post-receipt, linked to purchases) — ✅ Done
- [ ] Claude AI — "Detect slow-moving stock and suggest promotions or write-offs" — ❌ Missing
- [ ] Claude AI — "Generate reorder quantities based on seasonal trends" — ❌ Missing
- [ ] Claude AI — "Summarise inventory health for weekly ops review" — ❌ Missing

### Role & Permission Settings
- [x] Auth guard (requireAuth middleware) — ✅ Done
- [ ] Role: Inventory User — can validate pickings, cannot adjust quants directly — ❌ Not modelled
- [ ] Role: Inventory Manager — full access, can configure routes/rules, adjust quants — ❌ Not modelled
- [ ] Role: Warehouse Manager — multi-warehouse oversight — ❌ Not modelled

### Module Configuration (Settings page)
- [ ] Storage locations (enable/disable multi-location) — ❌ Missing
- [ ] Multi-step routes (1-step / 2-step / 3-step receipts and deliveries) — ❌ Missing (structure exists in routing engine but not configurable via settings)
- [ ] Lot and serial number tracking (enable per product) — ❌ Missing
- [ ] Expiration dates (enable per product) — ❌ Missing
- [ ] Inventory valuation method — ❌ Missing
- [ ] Reservation method (at confirmation / manual / before scheduled date) — ❌ Missing

### Integrations
- [x] Sales — stock picking auto-created on SO confirm; sale order marked done on picking validate — ✅ Done
- [x] Purchases — receipt picking auto-created on PO confirm; vendor stats updated post-validate — ✅ Done
- [ ] Manufacturing — components consumed via MO picking, finished goods receipt — ❌ Missing
- [ ] Accounting — inventory valuation journal entries on picking validation — ❌ Missing (no valuation moves created)
- [ ] Discuss / Mail — chatter on pickings for team communication — ❌ Missing (no ChatterPanel in picking form)
- [ ] Calendar — schedule transfer dates on calendar — ❌ Missing
- [ ] Automation rules — trigger on low stock, transfer validated, etc. — ❌ Missing
- [ ] Shipping carrier API — auto-generate tracking number on delivery validate — ❌ Missing

### API Endpoints
- [x] GET /api/inventory/picking-types — ✅ exists
- [x] GET /api/inventory/pickings — ✅ exists (paginated, state + pickingTypeId filter)
- [x] GET /api/inventory/pickings/:id — ✅ exists
- [x] POST /api/inventory/pickings — ✅ exists
- [x] POST /api/inventory/pickings/:id/ready — ✅ exists
- [x] POST /api/inventory/pickings/:id/validate — ✅ exists (transactional quant update + routing hook)
- [x] GET /api/inventory/quants — ✅ exists (productId + locationId filter)
- [x] POST /api/inventory/replenish/run — ✅ exists
- [x] GET /api/inventory/orderpoints — ✅ exists
- [x] POST /api/inventory/orderpoints — ✅ exists
- [x] PUT /api/inventory/orderpoints/:id — ✅ exists
- [x] DELETE /api/inventory/orderpoints/:id — ✅ exists
- [x] GET /api/inventory/routes — ✅ exists (includes rules with locations)
- [ ] POST /api/inventory/pickings/:id/return — ❌ missing
- [ ] POST /api/inventory/pickings/:id/scrap — ❌ missing
- [ ] POST /api/inventory/pickings/:id/backorder — ❌ missing
- [ ] POST /api/inventory/adjustments — ❌ missing (manual inventory correction)
- [ ] GET /api/inventory/report/stock-valuation — ❌ missing
- [ ] GET /api/inventory/report/aging — ❌ missing
- [ ] GET /api/inventory/lots — ❌ missing (lot/serial tracking)

### Missing Features Summary
Inventory has the strongest backend of the three modules — quant management, routing engine, replenishment service, AI forecasting, and vendor intelligence are all wired — but it is missing most of the operational features that warehouse teams need daily: backorder creation, return pickings, lot/serial tracking, inventory adjustments, and the full replenishment UI. The complete absence of inventory valuation (no COGS journal entries on picking validation) means the accounting books will diverge from physical stock, making this a blocking gap for any company that uses accrual accounting.

### Recommended Build Order
1. **First:** Backorder creation when done qty < demand, and return picking (reverse transfer) — these two are triggered constantly in real operations and block the module from being used in production.
2. **Then:** Inventory adjustment screen + manual quant correction API, and ChatterPanel on transfer forms — closes the most common daily workflows.
3. **Finally:** Inventory valuation journal entries on validate (AVCO/Standard cost), lot/serial number tracking, and the replenishment frontend UI — brings the module to full P1 ERP parity.
