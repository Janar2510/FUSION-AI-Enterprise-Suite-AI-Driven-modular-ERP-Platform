# Manufacturing — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/inventory_and_mrp/manufacturing.html
**FusionAI status:** Partial
**Effort to complete:** L
**Business priority:** P1

---
## Odoo 17 Feature Checklist

### Core Features
- [x] Manufacturing Orders (MO) — create, list, start, finish — ✅ Done
- [x] Bill of Materials (BoM) — create, list, edit, phantom/kit type — ✅ Done
- [x] Work Centers — create, list, edit, OEE target, capacity — ✅ Done
- [x] Routings / Work Orders — create, link to BoM, auto-generate on MO creation — ✅ Done
- [x] Work Orders per MO (auto-generated from routing) — ✅ Done
- [x] Stock integration on MO completion (consume components, produce FG) — ✅ Done
- [x] Quality check auto-generation on MO creation from Quality Points — ✅ Done
- [x] AI schedule optimization (POST /ai/optimize-schedule) — ✅ Done (simulated)
- [x] AI quality data logging / predictive maintenance trigger — ✅ Done (simulated)
- [x] OEE analysis endpoint (GET /ai/oee-analysis/:wcId) — ✅ Done (simulated)
- [ ] Master Production Scheduling (MPS) dashboard — ❌ Missing
- [ ] Scrap handling during production (scrap move generation) — ❌ Missing
- [ ] Manufacturing backorders (partial production → backorder MO) — ❌ Missing
- [ ] Split / Merge manufacturing orders — ❌ Missing
- [ ] Unbuild orders — ❌ Missing
- [ ] By-product production tracking — ❌ Missing
- [ ] Subcontracting workflows (basic, resupply, dropship) — ❌ Missing
- [ ] Work center time-off / capacity calendar — ❌ Missing
- [ ] Semi-finished product BoM handling — ❌ Missing
- [ ] Product variant BoMs — ❌ Missing
- [ ] Kit assembly / shipping — 🟡 Partial (phantom BOM type exists, no kit picking flow)
- [ ] Manufacturing order cost tracking — ❌ Missing
- [ ] Work order dependencies (parallel / sequential) — ❌ Missing
- [ ] IoT / barcode scanner integration for shop floor — ❌ Missing
- [ ] Tablet-based work order management (shop floor UI) — ❌ Missing
- [ ] Three-step manufacturing workflow (pick + produce + store) — ❌ Missing

### Views / UI
- [x] Dashboard (overview metrics, recent orders, AI schedule panel) — ✅ Done
- [x] List — Manufacturing Orders — ✅ Done
- [x] Form — Manufacturing Orders — ✅ Done
- [x] List — Bills of Material — ✅ Done
- [x] Form — Bills of Material (with component grid) — ✅ Done
- [x] Hierarchy — BoM component tree — ✅ Done
- [x] List — Work Centers — ✅ Done (WorkcenterDashboard)
- [x] Form — Work Centers — ✅ Done
- [x] List — Routings with operations grid — ✅ Done
- [x] Form — Routings — ✅ Done
- [x] List — Quality Checks (inline in Manufacturing tab) — ✅ Done
- [ ] Kanban — Manufacturing Orders by stage — ❌ Missing
- [ ] Gantt — Production scheduling timeline — ❌ Missing
- [ ] Graph / pivot — Production analysis — ❌ Missing
- [ ] Shop Floor real-time tablet view — ❌ Missing
- [ ] Calendar — Work center availability — ❌ Missing

### Role & Permission Settings
- [ ] Manufacturing User — can create/edit MOs, BoMs — ❌ No RBAC enforced
- [ ] Manufacturing Manager — can approve, configure work centers — ❌ No RBAC enforced
- [ ] Shop Floor Operator — tablet-only work order access — ❌ Missing

### Module Configuration
- [ ] Default BoM type (normal / phantom) — ❌ Not configurable from UI
- [ ] Manufacturing steps (1-step / 2-step / 3-step) — ❌ Missing
- [ ] Scrap location configuration — ❌ Missing
- [ ] Lock confirmed manufacturing orders — ❌ Missing
- [ ] Unlocking mechanism for locked MOs — ❌ Missing

### Integrations
- [x] Inventory (stock quant updates on MO done) — ✅ Done
- [x] Quality module (auto quality checks on MO create) — ✅ Done
- [x] ChatterPanel (activity timeline on MO form) — ✅ Done
- [x] AI Actions panel on MO form — ✅ Done
- [ ] Calendar integration for work center scheduling — ❌ Missing
- [ ] Maintenance module (trigger maintenance from shop floor) — ❌ Missing
- [ ] Purchase module (buy subcontracted components) — ❌ Missing
- [ ] Claude AI — 3 suggested actions: Optimize Schedule, Predict Defects, Suggest BoM Improvements — 🟡 Partial (optimize exists, others missing)

### API Endpoints
- [x] GET /api/manufacturing/boms — ✅
- [x] GET /api/manufacturing/boms/:id — ✅
- [x] POST /api/manufacturing/boms — ✅
- [x] PUT /api/manufacturing/boms/:id — ✅
- [x] GET /api/manufacturing/orders — ✅ (paginated, state filter)
- [x] GET /api/manufacturing/orders/:id — ✅
- [x] POST /api/manufacturing/orders — ✅ (auto work orders + quality checks)
- [x] PUT /api/manufacturing/orders/:id — ✅
- [x] POST /api/manufacturing/orders/:id/start — ✅
- [x] POST /api/manufacturing/orders/:id/done — ✅ (stock moves)
- [x] GET /api/manufacturing/workcenters — ✅
- [x] POST /api/manufacturing/workcenters — ✅
- [x] PUT /api/manufacturing/workcenters/:id — ✅
- [x] DELETE /api/manufacturing/workcenters/:id — ✅
- [x] GET /api/manufacturing/routings — ✅
- [x] POST /api/manufacturing/routings — ✅
- [x] PUT /api/manufacturing/routings/:id — ✅
- [x] DELETE /api/manufacturing/routings/:id — ✅
- [x] POST /api/manufacturing/ai/optimize-schedule — ✅ (simulated)
- [x] POST /api/manufacturing/ai/log-quality-data — ✅ (simulated)
- [x] GET /api/manufacturing/ai/oee-analysis/:wcId — ✅ (simulated)
- [ ] POST /api/manufacturing/orders/:id/scrap — ❌
- [ ] POST /api/manufacturing/orders/:id/backorder — ❌
- [ ] POST /api/manufacturing/orders/:id/split — ❌
- [ ] POST /api/manufacturing/orders/:id/merge — ❌
- [ ] POST /api/manufacturing/unbuild — ❌
- [ ] GET /api/manufacturing/mps — ❌ (Master Production Schedule)

---
## Missing Features Summary
Critical gaps vs Odoo 17: backorders, scrap handling, MPS, subcontracting, unbuild, split/merge, Gantt/calendar views, shop floor tablet UI, work center time-off, product variant BoMs, three-step manufacturing workflow, RBAC. AI schedule optimization is simulated (not Claude-powered).

## Recommended Build Order
1. Manufacturing backorders (partial completion flow) — P1
2. Scrap handling during production — P1
3. Kanban view for MOs + Gantt scheduling timeline — P1
4. Work order dependency management (parallel / sequential) — P2
5. Master Production Scheduling dashboard — P2
6. Product variant BoMs + semi-finished products — P2
7. Subcontracting workflows — P3
8. Unbuild orders + split/merge MOs — P3
9. Shop floor tablet UI — P3
10. Three-step manufacturing + work center calendar — P3
11. Replace simulated AI with real Claude AI actions — P2
