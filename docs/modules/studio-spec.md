# Studio — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/studio.html
**FusionAI status:** Stub
**Effort to complete:** XL
**Business priority:** P3

---
## Odoo 17 Feature Checklist

### Core Features
- [ ] Toggle Studio mode from within any app — ❌ Missing (no in-app Studio toggle; Studio is a standalone route)
- [ ] Add / modify fields on any model — ❌ Missing (UI shows mock static list; no field editor)
- [ ] Create / modify views (list, kanban, form, graph, calendar) — ❌ Missing (mock items only)
- [ ] Create custom models from scratch — ❌ Missing
- [ ] Automation rules builder — ❌ Missing (mock item shown but not functional)
- [ ] PDF report designer — ❌ Missing (mock item shown but not functional)
- [ ] Approval workflow rules — ❌ Missing
- [ ] Security / access rules editor — ❌ Missing
- [ ] Build a new app from scratch — ❌ Missing
- [ ] Widget customisation — ❌ Missing
- [ ] Export / import customisations — ❌ Missing

### Views / UI
- [x] Studio dashboard with customisation listing — 🟡 Partial (StudioDashboard.tsx renders a mock list with 5 hardcoded items)
- [x] Metric summary cards (total customisations, views, automations, active) — 🟡 Partial (MetricGrid with computed counts from mock data)
- [x] Type badges (view, field, automation, report) — 🟡 Partial (hardcoded icon/color map)
- [ ] Field editor panel (add, rename, delete, set required/readonly) — ❌ Missing
- [ ] View editor (drag-and-drop fields into layout) — ❌ Missing
- [ ] Model tree / app list sidebar — ❌ Missing
- [ ] Automation rule builder (trigger / condition / action) — ❌ Missing
- [ ] PDF report template editor — ❌ Missing
- [ ] Approval chain designer — ❌ Missing
- [ ] Security matrix (CRUD per model per group) — ❌ Missing
- [ ] "New Customisation" flow — ❌ Missing (button exists but is non-functional)

### Role & Permission Settings
- [ ] Studio access restricted to administrators / developers — ❌ Missing (no RBAC guard on Studio route)
- [ ] Per-user Studio permissions — ❌ Missing
- [ ] Published vs. draft customisation states — 🟡 Partial (status field exists in mock data; not persisted)

### Module Configuration
- [ ] Studio-generated module export (ZIP) — ❌ Missing
- [ ] Import studio customisations — ❌ Missing
- [ ] Version / changelog for customisations — ❌ Missing

### Integrations
- [ ] Calendar — ❌ Missing
- [ ] Mail / Chatter — ❌ Missing
- [ ] Automation rules engine (shared with Server Actions) — ❌ Missing
- [ ] Claude AI (3 actions: generate field set from description, suggest view layout, write automation logic) — ❌ Missing
- [ ] All ERP modules (Studio modifies any installed module's views/models) — ❌ Missing

### API Endpoints
- [ ] GET /api/studio/customisations — ❌ (no API; data is hardcoded in component state)
- [ ] POST /api/studio/customisations — ❌
- [ ] PUT /api/studio/customisations/:id — ❌
- [ ] DELETE /api/studio/customisations/:id — ❌
- [ ] GET /api/studio/models — ❌ (list all ERP models available for customisation)
- [ ] GET /api/studio/models/:model/fields — ❌
- [ ] POST /api/studio/models/:model/fields — ❌
- [ ] GET /api/studio/models/:model/views — ❌
- [ ] PUT /api/studio/models/:model/views/:viewType — ❌
- [ ] POST /api/studio/automation — ❌
- [ ] POST /api/studio/reports — ❌
- [ ] GET /api/studio/export — ❌

---
## Missing Features Summary
1. **Everything functional is missing** — StudioDashboard.tsx is a pure UI stub with 5 hardcoded mock items and zero backend wiring; the entire feature set needs to be built
2. **No in-app Studio toggle** — Odoo Studio activates from within any running module; FusionAI has only a standalone route
3. **No field editor** — the primary Odoo Studio action (add/remove fields on a model) is absent
4. **No view editor** — cannot drag fields into a layout or switch view types
5. **No model builder** — cannot create new data models without writing code
6. **No automation builder** — no trigger/condition/action rule editor
7. **No PDF report designer** — no template editor for printable documents
8. **No API** — all data is static React component state; there is no persistence layer
9. **No RBAC** — Studio route is unguarded; any user can navigate to it
10. **No Claude AI integration** — no AI-assisted field suggestion, layout generation, or automation authoring

## Recommended Build Order
Studio is the most complex module. A phased approach is essential:

**Phase 1 — Backend foundation (L)**
1. Prisma models: `StudioCustomisation` (model, type, definition JSON, status)
2. Full CRUD API: GET/POST/PUT/DELETE /api/studio/customisations
3. Model introspection endpoint: GET /api/studio/models (list Prisma models + fields via reflection)

**Phase 2 — Field editor (XL)**
4. GET /api/studio/models/:model/fields — return field schema
5. POST /api/studio/models/:model/fields — add virtual/custom field (store in customisation JSON)
6. Field editor UI panel (type selector, label, required, readonly, default)

**Phase 3 — View editor (XL)**
7. GET /api/studio/models/:model/views — return current list/kanban/form layout
8. PUT /api/studio/models/:model/views/:type — save modified layout JSON
9. Drag-and-drop view canvas (fields palette → drop into form/list/kanban layout)

**Phase 4 — Automation builder (L)**
10. POST /api/studio/automation — save trigger/condition/action rule
11. Automation builder UI (event picker, domain filter, action type)

**Phase 5 — Report designer (L)**
12. POST /api/studio/reports — save PDF report template
13. Report template editor UI (field tokens + layout)

**Phase 6 — Polish (M)**
14. Admin RBAC guard on Studio route
15. In-app Studio toggle button (render Studio overlay on any module)
16. Claude AI integration (describe → generate field set / automation rule)
17. Export customisations as JSON bundle
