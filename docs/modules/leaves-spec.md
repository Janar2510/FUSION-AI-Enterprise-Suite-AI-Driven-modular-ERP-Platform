# Leaves (Time Off) — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/hr/time_off.html
**FusionAI status:** Partial
**Effort to complete:** L
**Business priority:** P1

---
## Odoo 17 Feature Checklist

### Core Features
- [x] Leave request creation — ✅ Done
- [x] Leave types (legal, sick, compensatory, unpaid) — ✅ Done (hardcoded enum, not configurable)
- [x] Date range (from / to) with day count — ✅ Done
- [x] State machine (draft → confirm → validate / refuse) — ✅ Done
- [x] Approve / refuse actions — ✅ Done
- [x] Delete leave request — ✅ Done
- [x] Notes field — ✅ Done
- [ ] Configurable leave type entities (CRUD for leave types in settings) — ❌ Missing (4 types hardcoded)
- [ ] Accrual plans (tenure-based accumulation with milestones) — ❌ Missing
- [ ] Leave allocation model (allocate N days to employee for a type) — ❌ Missing
- [ ] Balance tracking (remaining days per type per employee) — ❌ Missing
- [ ] Half-day / hourly leave requests — ❌ Missing (days only)
- [ ] Attachment support (e.g. sick note upload) — ❌ Missing
- [ ] Public holidays configuration — ❌ Missing
- [ ] Mandatory presence days (restrict leave for specific dates/departments) — ❌ Missing
- [ ] Carry-over rules (rollover / cap / reset at year end) — ❌ Missing
- [ ] Two-level approval workflow (employee approver + HR officer) — 🟡 Partial (single-step approve/refuse exists, no role hierarchy)
- [ ] Time off officer designation per leave type — ❌ Missing
- [ ] Deduct overtime hours from leave balance — ❌ Missing
- [ ] Request additional days beyond allocation — ❌ Missing

### Views / UI
- [x] List view with KPI cards (total, approved, pending, refused) — ✅ Done
- [x] Form view — ✅ Done
- [ ] Calendar / team overview view — ❌ Missing (Odoo's "Overview" colour-coded team calendar)
- [ ] Kanban view — ❌ Missing
- [ ] Graph / pivot reporting view — ❌ Missing
- [ ] "My Time Off" personal dashboard — ❌ Missing (only manager-facing list)
- [ ] Allocation list view — ❌ Missing

### Role & Permission Settings
- [ ] Role: Employee — can submit own leave requests and view own balance — ❌ Missing (no scoping)
- [ ] Role: HR Officer / Time Off Officer — approve, manage allocations — ❌ Missing
- [ ] Role: HR Manager — full configuration access — ❌ Missing

### Module Configuration
- [ ] Leave type configuration (name, approval mode, allocation required, format days/hours) — ❌ Missing
- [ ] Accrual plan configuration — ❌ Missing
- [ ] Public holiday calendars (per working schedule) — ❌ Missing
- [ ] Mandatory days configuration — ❌ Missing

### Integrations
- [ ] Calendar — ❌ Not integrated (approved leaves should block calendar days)
- [ ] Mail / Chatter — ❌ Missing on leave form (no ChatterPanel)
- [ ] Payroll (work entries) — ❌ Approved leaves not fed as work entries to payroll
- [ ] Attendance (overtime deduction) — ❌ Not integrated
- [ ] Planning module — ❌ Not integrated (public holidays don't block planning)
- [ ] Manufacturing module — ❌ Not integrated
- [ ] Automation — ❌ Not integrated
- [ ] Claude AI — ❌ Missing (needs `leave-pattern-analysis`, `absence-risk-alert`, `policy-recommendation` actions)

### API Endpoints
- [x] GET /api/hr/leaves — ✅
- [x] POST /api/hr/leaves — ✅
- [x] PUT /api/hr/leaves/:id — ✅
- [x] PATCH /api/hr/leaves/:id/approve — ✅
- [x] PATCH /api/hr/leaves/:id/refuse — ✅
- [x] DELETE /api/hr/leaves/:id — ✅
- [ ] GET /api/hr/leave-types — ❌ Missing
- [ ] POST /api/hr/leave-types — ❌ Missing
- [ ] GET /api/hr/leave-allocations — ❌ Missing
- [ ] POST /api/hr/leave-allocations — ❌ Missing
- [ ] GET /api/hr/leaves/balance/:employeeId — ❌ Missing
- [ ] GET /api/hr/public-holidays — ❌ Missing

---
## Missing Features Summary
1. **Configurable leave types** — hardcoded enum prevents adding custom leave types; needs `HrLeaveType` model
2. **Allocation model** — without allocations there is no balance to track; fundamental gap
3. **Balance display** — employees cannot see remaining days per type
4. **Accrual plans** — automatic leave accrual not implemented
5. **Team calendar overview** — Odoo's most-used leaves view; completely absent
6. **Half-day / hourly requests** — required for precise leave accounting
7. **Public holidays** — no public holiday model; affects all time-based calculations
8. **Chatter** — no messaging thread on leave request form
9. **Payroll work-entry feed** — approved leaves not converted to work entries for payroll
10. **AI actions** — no panel; needs absence-risk alerting and pattern analysis

---
## Recommended Build Order
1. Add `HrLeaveType` model (Prisma migration + CRUD routes + settings UI) — M
2. Add `HrLeaveAllocation` model with balance tracking — L
3. Add balance display on leave form and employee smart button — M
4. Add `HrPublicHoliday` model (per-schedule public holiday calendars) — M
5. Add team calendar / overview view (colour-coded by employee) — L
6. Add half-day / hourly request support — M
7. Add ChatterPanel to leave form — S
8. Feed approved leaves as work entries into payroll — M
9. RBAC: Employee / Officer / Manager role scoping — M
10. Accrual plans engine — XL
11. AI actions panel (pattern analysis, absence risk, policy recommendations) — M
