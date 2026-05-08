# Field Service — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/services/field_service.html
**FusionAI status:** Stub
**Effort to complete:** L
**Business priority:** P3

---
## Odoo 17 Feature Checklist

### Core Features
- [x] Field service task creation (name, description, customer, employee, scheduled date) — ✅ Done
- [x] Task state machine (new → planned → done / cancelled) — ✅ Done
- [x] Customer assignment per task — ✅ Done
- [x] Employee assignment per task — ✅ Done
- [x] Address/location capture (street, city, zip) — ✅ Done
- [ ] Kanban view for tasks — ❌ Missing (only List + Form available)
- [ ] Calendar / map view for scheduling — ❌ Missing
- [ ] Worksheets (field data collection forms attached to tasks) — ❌ Missing
- [ ] Product/service lines on tasks (materials used) — ❌ Missing
- [ ] Inventory consumption on task completion — ❌ Missing
- [ ] Route planning / itinerary optimization — ❌ Missing
- [ ] Time tracking / timesheet logging on field tasks — ❌ Missing
- [ ] Billable time and invoicing from field tasks — ❌ Missing
- [ ] Sub-tasks on field service tasks — ❌ Missing
- [ ] Signature capture from customer on task completion — ❌ Missing
- [ ] Photo/attachment uploads from mobile — ❌ Missing
- [ ] Chatter / message log per task — ❌ Missing
- [ ] AI Actions panel on field tasks — ❌ Missing

### Views / UI
- [x] List — ✅ Done
- [x] Form — ✅ Done
- [ ] Kanban — ❌ Missing
- [ ] Calendar (schedule overview) — ❌ Missing
- [ ] Map view (technician locations) — ❌ Missing
- [ ] Graph / pivot reporting — ❌ Missing
- [ ] Activity view — ❌ Missing

### Role & Permission Settings
- [ ] requireAuth middleware on field service routes — ❌ Missing (fs_rental routes have no requireAuth guard)
- [ ] Field Service Manager / Technician role distinction — ❌ Missing
- [ ] Technician can only see their own tasks — ❌ Missing
- [ ] Manager can assign and reassign tasks — ❌ Missing

### Module Configuration
- [ ] Default project for field service tasks — ❌ Missing
- [ ] Worksheet template configuration — ❌ Missing
- [ ] Billability settings (always billable / timesheet-based) — ❌ Missing
- [ ] Time rounding rules — ❌ Missing

### Integrations
- [x] HR module (employee list for assignment) — ✅ Done
- [x] Partner / Contact module (customer lookup) — ✅ Done
- [ ] Planning module (resource scheduling sync) — ❌ Missing
- [ ] Inventory / stock (consume materials on task) — ❌ Missing
- [ ] Invoicing (generate invoice from completed task) — ❌ Missing
- [ ] Timesheets (log hours on field task) — ❌ Missing
- [ ] Project module (field task as project task) — ❌ Missing
- [ ] Calendar (schedule sync for technician) — ❌ Missing
- [ ] Claude AI (AI Actions panel) — ❌ Missing
- [ ] Maps API (Google Maps / OpenStreetMap route planning) — ❌ Missing

### API Endpoints
- [x] GET /api/fs-rental/tasks — ✅ (no auth guard)
- [x] POST /api/fs-rental/tasks — ✅ (no auth guard)
- [x] PUT /api/fs-rental/tasks/:id — ✅ (no auth guard)
- [x] DELETE /api/fs-rental/tasks/:id — ✅ (no auth guard)
- [ ] PATCH /api/fs-rental/tasks/:id/state — ❌ (state transitions handled via PUT, no dedicated endpoint)
- [ ] POST /api/fs-rental/tasks/:id/timesheet — ❌
- [ ] GET /api/fs-rental/tasks/:id/worksheet — ❌
- [ ] POST /api/fs-rental/tasks/:id/worksheet — ❌
- [ ] GET /api/fs-rental/tasks/:id/products — ❌
- [ ] POST /api/fs-rental/tasks/:id/products — ❌ (material consumption)

---
## Missing Features Summary

1. **Authentication guard** — The `fs_rental` router has no `requireAuth` middleware, meaning endpoints are publicly accessible. This is a security gap requiring immediate fix.
2. **Kanban + Calendar views** — Core Odoo Field Service views for dispatch scheduling are absent.
3. **Worksheets** — Field data collection forms (the primary field worker data capture mechanism in Odoo) are entirely missing. Requires a worksheet template model + form fill UI.
4. **Product/material lines** — Field technicians need to log materials consumed per task. Requires linking to Inventory module.
5. **Time tracking** — No timesheet logging from field tasks despite the Timesheets module existing.
6. **Invoicing flow** — No path from completed field task to invoice generation.
7. **Route/itinerary planning** — No scheduling optimization or map integration.
8. **Mobile-oriented features** — Signature capture, photo uploads, and offline-capable form fills are expected for field workers.
9. **AI Actions panel** — Not wired up; field service tasks have no Claude AI assistance.

---
## Recommended Build Order

1. Add `requireAuth` to all `fsRentalRoutes` (critical security fix, 30 min)
2. Add Kanban view for task dispatch board (1 day)
3. Wire ChatterPanel + AiActionsPanel to field task form (half day)
4. Implement timesheet logging on field tasks (1 day, reuse helpdesk pattern)
5. Add product/material lines model + UI (M, 2 days)
6. Worksheet template engine (L, 3–4 days)
7. Calendar view + Planning module sync (L, 3 days)
8. Invoicing integration from completed tasks (M, 2 days)
9. Map/route planning integration (XL, requires Maps API)
