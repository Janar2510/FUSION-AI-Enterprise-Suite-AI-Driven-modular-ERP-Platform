# Maintenance — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/inventory_and_mrp/maintenance.html
**FusionAI status:** Partial
**Effort to complete:** M
**Business priority:** P2

---
## Odoo 17 Feature Checklist

### Core Features
- [x] Maintenance request creation (name, description, type, priority) — ✅ Done
- [x] Corrective vs preventive maintenance types — ✅ Done
- [x] Priority rating (0–3 stars) — ✅ Done
- [x] Stage pipeline (New → In Progress → Repaired → Scrap) — ✅ Done
- [x] Equipment registry (name, serial, model, category, location, cost) — ✅ Done
- [x] Link request to equipment — ✅ Done
- [x] Request date tracking — ✅ Done
- [ ] Close date / actual completion date — 🟡 Partial (field exists in model, not shown in UI)
- [ ] Scheduled maintenance (preventive with recurrence) — ❌ Missing
- [ ] Maintenance team assignment — ❌ Missing
- [ ] Responsible technician assignment per request — ❌ Missing
- [ ] Equipment category management — ❌ Missing (field in model, no management UI)
- [ ] Equipment vendor / purchase info — ❌ Missing
- [ ] Equipment warranty tracking — ❌ Missing
- [ ] Mean Time Between Failures (MTBF) / Mean Time To Repair (MTTR) reporting — ❌ Missing
- [ ] Block equipment from production when under maintenance — ❌ Missing
- [ ] Spare parts / product consumption per request — ❌ Missing
- [ ] Blocked equipment indicator on Manufacturing work orders — ❌ Missing

### Views / UI
- [x] Kanban view with drag-and-drop stage transitions — ✅ Done
- [x] List view — ✅ Done
- [x] Form view — ✅ Done
- [ ] Calendar view — ❌ Missing (schedule preventive tasks by date)
- [ ] Graph / pivot view — ❌ Missing (MTBF, MTTR, requests per equipment)
- [ ] Equipment form view (separate from requests) — ❌ Missing (equipment only selectable, not editable in UI)

### Role & Permission Settings
- [ ] Maintenance Manager role — ❌ Missing
- [ ] Maintenance Technician role — ❌ Missing
- [ ] Responsible technician field on requests — ❌ Missing

### Module Configuration
- [ ] Maintenance team configuration — ❌ Missing
- [ ] Preventive maintenance scheduling intervals — ❌ Missing
- [ ] Work center integration (link equipment to manufacturing WCs) — ❌ Missing

### Integrations
- [ ] Mail / chatter on request form — ❌ Missing
- [ ] Calendar integration for scheduled preventive tasks — ❌ Missing
- [ ] Automation (auto-create preventive request on schedule) — ❌ Missing
- [ ] Claude AI — AI root cause analysis, predictive failure detection, maintenance schedule optimization — ❌ Missing
- [ ] Manufacturing (block work center when equipment under maintenance) — ❌ Missing
- [ ] Inventory / Stock (spare parts consumption) — ❌ Missing
- [ ] Employees (technician lookup) — ❌ Missing

### API Endpoints
- [x] `GET /api/maintenance/equipment` — ✅
- [x] `POST /api/maintenance/equipment` — ✅
- [x] `GET /api/maintenance/requests` — ✅
- [x] `POST /api/maintenance/requests` — ✅
- [x] `PUT /api/maintenance/requests/:id` — ✅
- [ ] `GET /api/maintenance/equipment/:id` — ❌
- [ ] `PUT /api/maintenance/equipment/:id` — ❌
- [ ] `DELETE /api/maintenance/equipment/:id` — ❌
- [ ] `DELETE /api/maintenance/requests/:id` — ❌
- [ ] `GET /api/maintenance/stats` — ❌ (MTBF, MTTR, open vs closed)
- [ ] `GET /api/maintenance/teams` — ❌
- [ ] `POST /api/maintenance/teams` — ❌

---
## Missing Features Summary

| Gap | Severity | Notes |
|---|---|---|
| Equipment form/edit UI | High | Equipment is currently only readable; no way to create/edit from frontend |
| Scheduled (preventive) recurrence | High | Core value prop of preventive maintenance |
| Close date tracking + duration metrics | Medium | Required for MTTR calculation |
| MTBF / MTTR reporting graph | Medium | KPI view expected by maintenance managers |
| Maintenance team management | Medium | Team → requests assignment model |
| Responsible technician assignment | Medium | Who is doing the work |
| Spare parts / material consumption | Medium | Ties to Inventory for cost tracking |
| Manufacturing block integration | Medium | Safety: prevent use of broken equipment |
| Calendar view | Low | Visualise preventive schedule |
| Mail / chatter | Low | Consistent with rest of ERP modules |
| Equipment warranty / vendor info | Low | Procurement reference |
| Claude AI actions | Low | Root cause suggestions, predictive failure, schedule optimizer |
| RBAC (Manager / Technician) | Low | Parity with Odoo permission model |

---
## Recommended Build Order

1. **Equipment CRUD UI** — add Equipment tab/section to MaintenanceModule with full form; expose `PUT/DELETE /api/maintenance/equipment/:id`
2. **Close date + MTTR** — surface `closeDate` on request form; auto-set on move to "Repaired"; add duration display
3. **Responsible technician field** — employee picker on request form; filter kanban by assignee
4. **Preventive recurrence** — `recurrenceInterval` + `recurrenceUnit` on equipment; cron job that auto-creates requests
5. **Maintenance teams** — `MaintenanceTeam` model; assign team to requests; team filter on kanban
6. **MTBF / MTTR graph view** — `GET /api/maintenance/stats`; Graph view tab with equipment breakdown
7. **Spare parts tab** — `MaintenanceRequestPart` lines on request; deduct from Inventory stock
8. **Calendar view** — preventive tasks shown on shared calendar
9. **Manufacturing integration** — flag `equipment.underMaintenance`; expose to Manufacturing work order checks
10. **Claude AI actions** — (a) analyze failure pattern and suggest root cause, (b) predict next failure from MTBF history, (c) recommend optimal preventive interval
11. **Mail / chatter** — attach Chatter to request form
12. **RBAC** — Maintenance Manager / Technician middleware guards
