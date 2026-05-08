# Timesheets — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/services/timesheets.html
**FusionAI status:** Partial
**Effort to complete:** M
**Business priority:** P1

---
## Odoo 17 Feature Checklist

### Core Features
- [x] Timesheet entry creation (date, employee, project, task, description, hours) — ✅ Done
- [x] Timesheet entry editing — ✅ Done
- [x] Timesheet entry deletion — ✅ Done
- [x] Project and task filtering (task list dynamically filtered by selected project) — ✅ Done
- [x] Employee selection per entry — ✅ Done
- [x] Hours input (decimal, 0.25 step) — ✅ Done
- [x] Chatter / message log per entry — ✅ Done
- [x] AI Actions panel on timesheet entry (HrTimesheet agent) — ✅ Done
- [ ] Timer / start-stop real-time time capture — ❌ Missing
- [ ] Billable / non-billable flag per entry — ❌ Missing (field not in TimesheetEntry interface; API supports it via helpdesk flow)
- [ ] Overtime detection and alerts — ❌ Missing
- [ ] Auto-create timesheet entry on Time Off validation — ❌ Missing (Odoo 17 key feature)
- [ ] Weekly timesheet grid view (fill in hours per project/task per day) — ❌ Missing
- [ ] Timesheet approval workflow (submit → manager approve / refuse) — ❌ Missing
- [ ] My timesheets vs All timesheets separation — ❌ Missing
- [ ] Timesheet validation by manager — ❌ Missing
- [ ] Reported hours vs planned hours comparison — ❌ Missing

### Views / UI
- [x] List view — ✅ Done
- [x] Form view — ✅ Done
- [ ] Weekly grid view (fill hours by day × project/task matrix) — ❌ Missing (core Odoo timesheets UX)
- [ ] Graph / pivot view (hours by employee / project / period) — ❌ Missing
- [ ] Calendar view (timesheets plotted on calendar) — ❌ Missing
- [ ] Kanban view — ❌ Missing (not typical but absent)

### Role & Permission Settings
- [ ] Employee can only see and edit their own timesheets — ❌ Missing (fetchTimesheets fetches all without user-scoping)
- [ ] HR Manager / Timesheet Manager can see all — ❌ Missing
- [ ] Timesheet approver role — ❌ Missing
- [ ] Read-only view for approved entries — ❌ Missing

### Module Configuration
- [ ] Minimum time increment setting (e.g. 15 min rounds) — ❌ Missing
- [ ] Default billability per project — ❌ Missing
- [ ] Time Off integration toggle — ❌ Missing
- [ ] Overtime policy configuration — ❌ Missing
- [ ] Payroll integration settings — ❌ Missing

### Integrations
- [x] Project module (project + task selection) — ✅ Done
- [x] HR module (employee selection) — ✅ Done
- [x] Helpdesk (time logged via /tickets/:id/timesheet) — ✅ Done
- [x] ChatterPanel (messaging on entries) — ✅ Done
- [x] Claude AI — AI Actions panel (HrTimesheet agent) — ✅ Done
- [ ] Time Off / Leaves module (auto-create entry on approval) — ❌ Missing
- [ ] Payroll (use timesheet hours in payslip computation) — ❌ Missing
- [ ] Invoicing (billable hours → customer invoice line) — ❌ Missing
- [ ] Planning (planned hours vs actual timesheet comparison) — ❌ Missing
- [ ] Calendar (show timesheet blocks on calendar) — ❌ Missing
- [ ] Automation (trigger on timesheet submission / approval) — ❌ Missing

### API Endpoints
- [x] GET /api/hr/timesheets — ✅ (via HR routes)
- [x] POST /api/hr/timesheets — ✅
- [x] PUT /api/hr/timesheets/:id — ✅
- [x] DELETE /api/hr/timesheets/:id — ✅
- [x] POST /api/helpdesk/tickets/:id/timesheet — ✅ (billable flow via helpdesk)
- [ ] GET /api/hr/timesheets?employee=me — ❌ (no current-user scoping)
- [ ] POST /api/hr/timesheets/:id/approve — ❌
- [ ] POST /api/hr/timesheets/:id/refuse — ❌
- [ ] GET /api/hr/timesheets/summary?groupBy=project — ❌ (no aggregate endpoint)
- [ ] GET /api/projects/:id/timesheets — ❌ (no project-scoped timesheet listing)
- [ ] POST /api/hr/timesheets/timer/start — ❌
- [ ] POST /api/hr/timesheets/timer/stop — ❌

---
## Missing Features Summary

1. **No user-scoping** — `fetchTimesheets` fetches all entries regardless of logged-in user. Every employee can see every other employee's timesheets. Requires adding user-based record filter similar to `helpdeskTicketFilter`.
2. **`isBillable` field absent from model** — The `TimesheetEntry` interface and UI have no billable flag; the helpdesk API timesheet endpoint supports it but the standalone module does not expose it.
3. **Weekly grid view** — The signature Odoo Timesheets UX (fill in hours per day across projects) is entirely missing. This is the primary data-entry method for most users.
4. **Timer functionality** — Real-time start/stop timer for live time capture is not present.
5. **Approval workflow** — No submit → approve / refuse flow; required for payroll and billing sign-off.
6. **Time Off integration** — Odoo 17 auto-generates timesheet entries when time-off is validated; FusionAI has no such hook between the Leaves module and Timesheets.
7. **Reporting/analytics** — No graph or pivot view; no aggregate API endpoint for hours-by-project or hours-by-employee summaries.
8. **Payroll/invoicing bridge** — Approved timesheet hours have no pathway to payslips or customer invoices.

---
## Recommended Build Order

1. Add user-scoping filter to GET /api/hr/timesheets (critical privacy fix, 2h)
2. Add `isBillable` field to TimesheetEntry model, interface, and form UI (1 day)
3. Weekly grid view component (L, 3–4 days — custom date-matrix component)
4. Timer start/stop endpoints + floating timer UI widget (M, 2 days)
5. Approval workflow (submit → approve / refuse) + role guards (M, 2–3 days)
6. Graph/pivot reporting view with hours-by-project summary (M, 2 days)
7. Time Off → Timesheet auto-creation hook (M, 1–2 days)
8. Payroll integration (aggregate approved hours → payslip line) (L, 3 days)
9. Invoicing integration (billable hours → draft invoice line) (M, 2 days)
