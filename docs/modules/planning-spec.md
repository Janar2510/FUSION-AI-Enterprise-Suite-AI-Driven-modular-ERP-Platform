# Planning — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/services/planning.html
**FusionAI status:** Partial
**Effort to complete:** M
**Business priority:** P2

---
## Odoo 17 Feature Checklist

### Core Features
- [x] Planning slot creation (role, hours, start/end date, notes) — ✅ Done
- [x] Employee assignment to planning slots — ✅ Done
- [x] Project linkage on slots — ✅ Done
- [x] Draft → Published lifecycle states — ✅ Done
- [x] Conflict detection on employee double-booking — ✅ Done (409 with conflicting slots)
- [x] AI-assisted resource recommendations by skill + date range — ✅ Done (PlanningIntelligence, matchScore)
- [x] Delete / terminate slot — ✅ Done
- [x] Dashboard stat cards (active slots, total capacity, resources allocated, publish rate) — ✅ Done
- [ ] Open shifts (unassigned slots visible to all employees with matching role) — ❌ Missing
- [ ] Auto Plan feature (auto-assign open shifts based on roles and availability) — ❌ Missing
- [ ] Shift templates (pre-configured role + duration patterns) — ❌ Missing
- [ ] Recurring shifts (repeat every N days/weeks) — ❌ Missing
- [ ] Employee "My Planning" portal view — ❌ Missing
- [ ] Shift switching request (employee requests swap; notification to role-matched peers) — ❌ Missing
- [ ] Unassignment request (employee marks unavailability, configurable threshold days) — ❌ Missing
- [ ] Publication email notifications to assigned employees — ❌ Missing
- [ ] Sales order item linkage on slots — ❌ Missing
- [ ] Time off / public holiday awareness (grey out unavailable employee days) — ❌ Missing (stored in HR/Leaves)
- [ ] Working hours compatibility check during auto-plan — ❌ Missing
- [ ] Active contract date range enforcement — ❌ Missing
- [ ] Material resource support (non-employee: equipment, rooms) — ❌ Missing
- [ ] Progress bar / timesheet integration (actual vs planned hours) — ❌ Missing
- [ ] Role configuration and management UI — ❌ Missing (role is a free-text field, not a managed entity)

### Views / UI
- [x] Timeline / Gantt view (14-day resource grid, prev/next week navigation) — ✅ Done
- [x] List view — ✅ Done
- [x] Form view with conflict warning panel — ✅ Done
- [ ] Schedule by Resource view — ❌ Missing (current timeline only shows employees with assigned slots; no full resource roster)
- [ ] Schedule by Role view — ❌ Missing
- [ ] Schedule by Project view — ❌ Missing
- [ ] Schedule by Sales Order view — ❌ Missing
- [ ] Drag-and-drop slot resizing / moving on Gantt — ❌ Missing (slots are read-only blocks in PlanningTimeline)
- [ ] Diagonal stripe visual for unpublished slots — ❌ Missing (unpublished shown as white/low-opacity only)
- [ ] Greyed background for employee time-off days — ❌ Missing
- [ ] Progress bar overlay on ongoing shifts (timesheet linkage) — ❌ Missing

### Role & Permission Settings
- [ ] Planning Administrator role — ❌ Missing
- [ ] Planning User role — ❌ Missing
- [ ] Employee self-service portal access (My Planning) — ❌ Missing

### Module Configuration
- [ ] Shift switch / unassignment toggle in settings — ❌ Missing
- [ ] Unassignment threshold (days before shift) — ❌ Missing
- [ ] Default planning horizon (advance planning months) — ❌ Missing
- [ ] Role management (create/edit roles with property fields) — ❌ Missing

### Integrations
- [ ] Mail / email notifications on slot publish, switch requests, unassignment — ❌ Missing
- [ ] Calendar integration (slots appear on employee calendar) — ❌ Missing
- [ ] HR / Employees (working hours, roles, contracts from employee profile) — 🟡 Partial (employeeId linked; skills read; no working hours or contract awareness)
- [ ] Timesheets (actual hours vs planned; progress bar on ongoing shifts) — ❌ Missing
- [ ] Project app (project-linked slots, resource allocation tracking) — 🟡 Partial (projectId linked; no project-side planning view)
- [ ] Sales (sales order item linkage; service-to-role mapping) — ❌ Missing
- [ ] Leaves / Time Off (block grayed days for approved leaves) — ❌ Missing
- [ ] Payroll (working hours feed into work entries) — ❌ Missing
- [ ] Claude AI — shift optimization beyond current skill-match, workload balancing, burnout risk flagging — 🟡 Partial (skill-match recommendations exist; no workload/burnout logic)

### API Endpoints
- [x] `GET /api/planning` — ✅
- [x] `POST /api/planning` — ✅ (with conflict check)
- [x] `PUT /api/planning/:id` — ✅ (with conflict check)
- [x] `DELETE /api/planning/:id` — ✅
- [x] `GET /api/planning/:id` — ✅
- [x] `GET /api/planning/recommendations` — ✅ (skill-match + date-range)
- [ ] `GET /api/planning/open-shifts` — ❌
- [ ] `POST /api/planning/:id/publish` — ❌ (publish is done via generic PUT)
- [ ] `POST /api/planning/:id/switch-request` — ❌
- [ ] `POST /api/planning/:id/unassign` — ❌
- [ ] `GET /api/planning/templates` — ❌
- [ ] `POST /api/planning/templates` — ❌
- [ ] `POST /api/planning/auto-plan` — ❌
- [ ] `GET /api/planning/stats` — ❌ (utilization rates, coverage gaps)

---
## Missing Features Summary

| Gap | Severity | Notes |
|---|---|---|
| Email notifications on publish | High | Employees must be notified when shifts are published — core workflow |
| Open shifts + employee self-assignment | High | Key Odoo Planning self-service feature |
| Auto Plan (bulk assignment engine) | High | Required for scheduling at scale |
| Recurring shifts | High | One-time slot creation doesn't scale for regular schedules |
| Drag-and-drop Gantt editing | Medium | Timeline is read-only; Odoo Gantt is fully interactive |
| Shift templates | Medium | Reduces data entry for repeated patterns |
| Time-off / leave awareness | Medium | Prevents scheduling employees on approved leave |
| Shift switch / unassignment requests | Medium | Employee self-service for schedule flexibility |
| Role management entity | Medium | Role is free-text; needs managed lookup with properties |
| My Planning portal | Medium | Employee self-service view of own schedule |
| Sales order linkage | Low | Relevant when services drive scheduling |
| Material resources | Low | Schedule non-human resources (rooms, equipment) |
| Timesheet / progress overlay | Low | Actual vs planned comparison |
| Payroll integration | Low | Work entries from published shifts |
| Additional Claude AI capabilities | Low | Workload balancing, burnout detection (skill-match already done) |
| RBAC (Admin / User) | Low | Parity with Odoo permission model |

---
## Recommended Build Order

1. **Email notifications on publish** — when slot state changes to `published`, send email to assigned employee; use existing outbox/relay pattern
2. **Role entity** — `PlanningRole` model with name + properties; replace free-text `role` field with FK; role management UI in settings
3. **Recurring shifts** — add `recurrenceRule` + `recurrenceEnd` fields; backend generates future slots on create; frontend toggle in form
4. **Shift templates** — `PlanningTemplate` model (role, startHour, duration, projectId); template picker on shift form
5. **Open shifts** — slots with `employeeId = null`; `GET /api/planning/open-shifts`; employee portal can self-assign if role matches
6. **Auto Plan** — `POST /api/planning/auto-plan`; assigns open shifts respecting roles, time-off, working hours, contract dates
7. **Drag-and-drop Gantt** — replace read-only `PlanningTimeline` table with full drag-resize capable Gantt (react-beautiful-dnd or Frappe Gantt); persist changes via PUT
8. **Time-off integration** — query `LeaveRequest` model on timeline render; grey out approved leave dates per employee
9. **Shift switch / unassignment requests** — `PlanningShiftRequest` model; email notification to eligible employees
10. **My Planning portal** — employee-scoped route (`GET /api/planning?mine=true`); filtered list + timeline view
11. **Sales order linkage** — add `salesOrderItemId` FK to `PlanningSlot`; link services from Sales to roles
12. **Timesheet overlay** — join `TimesheetEntry` hours against slot; show progress bar on active day in timeline
13. **Extended Claude AI** — (a) detect burnout risk (employee hours > threshold), (b) suggest workload rebalancing, (c) flag coverage gaps by role/date
14. **RBAC** — Planning Admin / User middleware guards
