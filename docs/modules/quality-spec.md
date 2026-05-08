# Quality — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/inventory_and_mrp/quality.html
**FusionAI status:** Partial
**Effort to complete:** M
**Business priority:** P1

---
## Odoo 17 Feature Checklist

### Core Features
- [x] Quality Checks — create, list, update, delete — ✅ Done
- [x] Quality Points (control points) — create, list, update, delete — ✅ Done
- [x] Test types — Pass/Fail, Measure — ✅ Done
- [x] Measure value capture — ✅ Done
- [x] Inspector notes — ✅ Done
- [x] Link quality check to Manufacturing Order — ✅ Done
- [x] Link quality check to Stock Picking (receipt/transfer) — ✅ Done (schema field exists)
- [x] Auto-generate quality checks on MO creation from Quality Points — ✅ Done (in manufacturing route)
- [x] Pass / Fail action buttons on check form — ✅ Done
- [x] Pass rate dashboard metric — ✅ Done
- [x] Pending checks kanban dashboard — ✅ Done
- [ ] Instructions quality check type — ❌ Missing (only passfail + measure)
- [ ] Picture quality check type (photo capture) — ❌ Missing (picture field exists in schema, no UI)
- [ ] Quality Alerts — create, track, escalate — ❌ Missing
- [ ] Failure locations (where defect originated) — ❌ Missing
- [ ] Auto-trigger quality checks at stock receipt / delivery — ❌ Missing (no picking hook)
- [ ] Quality Point configuration: frequency (all / random / periodically) — ❌ Missing
- [ ] Quality Point configuration: trigger (Manufacturing / Receipts / Deliveries) — ❌ Missing
- [ ] Tolerance / specification limits for Measure type (min/max) — ❌ Missing (auto-fail if out of tolerance)
- [ ] Corrective action workflow on failed checks — ❌ Missing
- [ ] Quality teams — assign checks to teams — ❌ Missing (teamId field exists in schema, no UI)
- [ ] Work order-linked quality checks (inline in work order tablet view) — ❌ Missing

### Views / UI
- [x] Dashboard (kanban-style) — pass rate, passed, failed, pending metrics + pending check cards — ✅ Done
- [x] List — Quality Checks with product, test type, status, quality point — ✅ Done
- [x] Form — Quality Check with test type selector, measure input, notes, document links — ✅ Done
- [x] List — Quality Points (accessible via fetchPoints) — 🟡 Partial (no dedicated UI tab, only via store)
- [ ] Form — Quality Points configuration UI — ❌ Missing (no UI to create/edit points)
- [ ] List — Quality Alerts — ❌ Missing
- [ ] Form — Quality Alert with escalation steps — ❌ Missing
- [ ] Graph / pivot — quality trends, failure rates by product/workcenter — ❌ Missing
- [ ] Kanban — Quality Alerts by severity — ❌ Missing

### Role & Permission Settings
- [ ] Quality User — can perform checks, create alerts — ❌ No RBAC enforced
- [ ] Quality Manager — can configure quality points, view all teams — ❌ No RBAC enforced
- [ ] Quality Team assignment — ❌ No UI

### Module Configuration
- [ ] Default quality team — ❌ Not configurable
- [ ] Quality check frequency (every order / random / periodic) — ❌ Missing
- [ ] Triggers configuration (Manufacturing / Receipts / Deliveries / All) — ❌ Missing
- [ ] Tolerance levels for measure checks — ❌ Missing
- [ ] Email notifications on check failure / quality alert — ❌ Missing

### Integrations
- [x] Manufacturing — auto-create checks on MO, link MO on check form — ✅ Done
- [x] Inventory / Picking — check schema has pickingId, picking link shown on form — 🟡 Partial (no auto-trigger at picking)
- [ ] Inventory — auto-generate checks at stock receipt or delivery — ❌ Missing
- [ ] Manufacturing Work Orders — inline checks in work order execution — ❌ Missing
- [ ] Mail / Chatter on Quality Checks and Alerts — ❌ Missing
- [ ] Calendar — schedule periodic quality audits — ❌ Missing
- [ ] Maintenance — trigger maintenance request from failed quality check — ❌ Missing
- [ ] Claude AI — 3 suggested actions: Root Cause Analysis, Predict Failure Risk, Suggest Corrective Action — ❌ Missing (no AiActionsPanel on quality forms)

### API Endpoints
- [x] GET /api/quality/points — ✅ (paginated)
- [x] POST /api/quality/points — ✅
- [x] PUT /api/quality/points/:id — ✅
- [x] DELETE /api/quality/points/:id — ✅
- [x] GET /api/quality/checks — ✅ (paginated, includes point/product/production/picking)
- [x] POST /api/quality/checks — ✅
- [x] PUT /api/quality/checks/:id — ✅
- [x] DELETE /api/quality/checks/:id — ✅
- [ ] GET /api/quality/alerts — ❌
- [ ] POST /api/quality/alerts — ❌
- [ ] PUT /api/quality/alerts/:id — ❌
- [ ] GET /api/quality/stats — ❌ (aggregate pass rate, failure trends)
- [ ] POST /api/quality/checks/:id/correct — ❌ (corrective action)

---
## Missing Features Summary
The core check execution flow (create point → auto-generate checks on MO → pass/fail) works end-to-end. Major gaps: Quality Alerts module entirely missing, no UI for Quality Points management, Instructions and Picture check types missing, no tolerance bounds for Measure type, no auto-checks at stock picking, no corrective action workflow, no Claude AI actions, no RBAC.

## Recommended Build Order
1. Quality Points management UI (list + form views in Quality module) — P1
2. Quality Alerts — create, track, escalate, close — P1
3. Tolerance bounds for Measure check type (auto-fail outside limits) — P1
4. Auto-generate quality checks at stock receipts / deliveries — P1
5. Instructions and Picture check types — P2
6. Add ChatterPanel + AiActionsPanel to check and alert forms — P2
7. Corrective action workflow on failed checks — P2
8. Quality teams assignment and RBAC — P2
9. Graph/pivot analytics — failure rates, trends by product/workcenter — P3
10. Maintenance module trigger from failed check — P3
