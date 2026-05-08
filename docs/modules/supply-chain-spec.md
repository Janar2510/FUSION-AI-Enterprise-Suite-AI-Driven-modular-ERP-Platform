# Supply Chain — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/inventory_and_mrp/inventory/warehouses_storage/replenishment.html
**FusionAI status:** Partial
**Effort to complete:** XL
**Business priority:** P1

---
## Odoo 17 Feature Checklist

### Core Features
- [x] Reordering Rules (Orderpoints) — create, read, update, delete — ✅ Done
- [x] Min/Max qty thresholds per product per location — ✅ Done
- [x] Stock alert detection (qty on hand < min qty) — ✅ Done (dashboard Critical Alerts)
- [x] Run replenishment (POST /api/inventory/replenish/run) — ✅ Done (via ReplenishmentService)
- [x] Stock Routes — list with rules, source/dest locations — ✅ Done
- [x] Route hierarchy visualization (HierarchyView) — ✅ Done
- [x] Dashboard metrics (total orderpoints, active routes, avg lead time, stock alerts) — ✅ Done
- [ ] Reordering Rules — automatic vs manual mode (auto-create PO/MO vs suggest only) — ❌ Missing
- [ ] Make-to-Order (MTO) route configuration per product — ❌ Missing
- [ ] Master Production Schedule (MPS) dashboard — ❌ Missing
- [ ] Replenishment report (list view of triggered suggestions before confirmation) — ❌ Missing
- [ ] Lead time management — vendor lead time, manufacturing lead time, security lead time — ❌ Missing
- [ ] Multi-warehouse replenishment (inter-warehouse stock transfers) — ❌ Missing
- [ ] Temporary / one-off reordering rules — ❌ Missing
- [ ] Just-in-time logic / demand-driven replenishment — ❌ Missing (avgLeadTime is hardcoded mock)
- [ ] Push / pull rule configuration per route — ❌ Missing (rules stored but no create/edit UI)
- [ ] Putaway rules — assign products to specific bin locations — ❌ Missing
- [ ] Storage category configuration — ❌ Missing
- [ ] Cross-docking operations — ❌ Missing
- [ ] Batch picking — ❌ Missing
- [ ] Cluster picking — ❌ Missing
- [ ] Wave transfer processing — ❌ Missing
- [ ] Stock removal strategies (FIFO / LIFO / FEFO / Closest / Least Packages) — ❌ Missing
- [ ] Lot and serial number management — ❌ Missing
- [ ] Expiration date tracking — ❌ Missing
- [ ] Vendor pricelist import for replenishment — ❌ Missing
- [ ] Third-party carrier integration (DHL, FedEx, UPS, etc.) — ❌ Missing
- [ ] Inventory aging analysis — ❌ Missing
- [ ] Moves history tracking — ❌ Missing
- [ ] Stock valuation (automatic / manual) — ❌ Missing

### Views / UI
- [x] Dashboard — metrics cards + Neural Replenishment control center + Critical Alerts panel — ✅ Done
- [x] List (Rules tab) — Orderpoints editable inline via OdooDataGrid — ✅ Done
- [x] Hierarchy (Flow tab) — Route → Rule → Location tree — ✅ Done
- [x] Orderpoint create modal (OrderpointModal) — ✅ Done
- [ ] Replenishment report view (Odoo-style suggestions table with confirm/cancel) — ❌ Missing
- [ ] Form — Route configuration (edit push/pull rules) — ❌ Missing
- [ ] Form — Putaway rules — ❌ Missing
- [ ] Graph / pivot — stock movement trends, replenishment lead times — ❌ Missing
- [ ] Kanban — pending transfer operations — ❌ Missing
- [ ] MPS dashboard (manual forecast grid) — ❌ Missing
- [ ] Locations management UI — ❌ Missing (locations used but no dedicated management screen)

### Role & Permission Settings
- [ ] Inventory User — can view stock, create transfers — ❌ No RBAC enforced
- [ ] Inventory Manager — can configure routes, putaway rules, orderpoints — ❌ No RBAC enforced
- [ ] Warehouse Manager — full warehouse config access — ❌ No RBAC enforced

### Module Configuration
- [ ] Warehouse multi-step routes (1 / 2 / 3-step inbound & outbound) — ❌ Not configurable from UI
- [ ] Default removal strategy (FIFO / FEFO etc.) — ❌ Missing
- [ ] Security lead time (purchasing / manufacturing) — ❌ Missing
- [ ] Annual inventory day — ❌ Missing
- [ ] Barcode scanner integration — ❌ Missing

### Integrations
- [x] Inventory module (reads /api/inventory/orderpoints + routes) — ✅ Done
- [x] Inventory — replenishment run via /api/inventory/replenish/run — ✅ Done
- [ ] Purchase module — replenishment auto-creates draft RFQs — ❌ Missing (ReplenishmentService exists but unknown depth)
- [ ] Manufacturing module — replenishment creates draft MOs for manufactured products — ❌ Missing
- [ ] Calendar — delivery date forecasting — ❌ Missing
- [ ] Mail / Automation — notify on critical stock alert or failed replenishment — ❌ Missing
- [ ] Claude AI — 3 suggested actions: Predict Stockout Risk, Optimize Min/Max Levels, Suggest Vendor for Replenishment — ❌ Missing (no AiActionsPanel in supply chain module)

### API Endpoints
- [x] GET /api/inventory/orderpoints — ✅ (paginated, includes product + location)
- [x] POST /api/inventory/orderpoints — ✅
- [x] PUT /api/inventory/orderpoints/:id — ✅
- [x] DELETE /api/inventory/orderpoints/:id — ✅
- [x] POST /api/inventory/replenish/run — ✅ (triggers ReplenishmentService)
- [x] GET /api/inventory/routes — ✅ (includes rules + locations)
- [ ] POST /api/inventory/routes — ❌
- [ ] PUT /api/inventory/routes/:id — ❌
- [ ] GET /api/inventory/putaway-rules — ❌
- [ ] POST /api/inventory/putaway-rules — ❌
- [ ] GET /api/inventory/replenishment-report — ❌ (pending suggestions)
- [ ] POST /api/inventory/replenishment-report/confirm — ❌
- [ ] GET /api/inventory/moves-history — ❌
- [ ] GET /api/inventory/aging — ❌
- [ ] GET /api/inventory/forecast/:productId — ❌ (demand-driven forecast)
- [ ] GET /api/inventory/locations — ❌ (dedicated locations CRUD)
- [ ] POST /api/inventory/locations — ❌

---
## Missing Features Summary
FusionAI covers the most visible supply chain UI (orderpoints CRUD, route hierarchy, dashboard). The backend depth is unknown beyond the orderpoints table and route listing. Critical missing pieces: replenishment suggestion report (user-confirm flow before PO/MO creation), MPS, lead time configuration, multi-warehouse, putaway rules, FIFO/FEFO removal strategies, lot/serial/expiry tracking, all picking strategy types (batch/cluster/wave), and Claude AI actions. The avgLeadTime is a hardcoded mock (12 days). No RBAC.

## Recommended Build Order
1. Replenishment suggestion report — list pending replenishments, confirm individually or in bulk — P1
2. Replenishment → auto-create draft Purchase RFQs for buy-route products — P1
3. Replenishment → auto-create draft MOs for manufacture-route products — P1
4. Lead time fields on orderpoints (vendor lead time, security days) — P1
5. FIFO / FEFO removal strategy configuration per location — P2
6. Lot and serial number management (receive, move, track) — P2
7. Expiration date tracking + FEFO enforcement — P2
8. Putaway rules UI — P2
9. Route + push/pull rule create/edit UI — P2
10. Multi-warehouse inter-warehouse replenishment — P2
11. MPS dashboard (manual demand forecast grid) — P3
12. MTO route configuration per product — P3
13. Batch / cluster / wave picking — P3
14. Add Claude AI actions (Predict Stockout, Optimize Thresholds, Vendor Suggest) — P2
15. Inventory aging + moves history analytics — P3
