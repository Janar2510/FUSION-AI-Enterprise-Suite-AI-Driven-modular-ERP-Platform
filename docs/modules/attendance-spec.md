# Attendance — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/hr/attendances.html
**FusionAI status:** Partial
**Effort to complete:** L
**Business priority:** P2

---
## Odoo 17 Feature Checklist

### Core Features
- [x] Check-in / check-out recording — ✅ Done
- [x] Worked hours calculation — ✅ Done
- [x] Employee association — ✅ Done
- [x] Active (currently checked-in) indicator — ✅ Done (checkOut null = active)
- [ ] One-click check-in / check-out button for current user — ❌ Missing (must create a record manually via form)
- [ ] Kiosk mode (dedicated hardware entry point) — ❌ Missing
- [ ] IP address & browser capture on check-in — ❌ Missing
- [ ] GPS coordinates capture — ❌ Missing
- [ ] Check-in mode tracking (database vs kiosk vs mobile) — ❌ Missing
- [ ] Overtime management — ❌ Missing (no tolerance thresholds, no extra-hours calculation)
- [ ] Extra hours display at check-out — ❌ Missing
- [ ] Overtime start date configuration — ❌ Missing
- [ ] Error detection (checked in >24 h, span >16 h) — ❌ Missing
- [ ] Error entries flagged in red — ❌ Missing (no validation logic)
- [ ] Time off deduction from accrued overtime — ❌ Missing
- [ ] "At Work" real-time filter — 🟡 Partial (frontend can filter checkOut=null, but no dedicated filter in UI)

### Views / UI
- [x] List view — ✅ Done
- [x] Form view — ✅ Done
- [x] KPI summary cards (total check-ins, total hours, currently in) — ✅ Done
- [ ] Gantt chart view (default in Odoo) — ❌ Missing
- [ ] Calendar view — ❌ Missing
- [ ] Graph / line chart (attendance over time) — ❌ Missing
- [ ] Pivot table view — ❌ Missing
- [ ] "My Attendances" personal dashboard — ❌ Missing
- [ ] Pre-built filters (My Team, At Work, Errors, 7-day / monthly) — ❌ Missing (search is name-only)
- [ ] Grouping by city / country / IP address — ❌ Missing

### Role & Permission Settings
- [ ] Role: Administrator — full access — ❌ Missing (no RBAC)
- [ ] Role: Non-Admin — no app access by default — ❌ Missing
- [ ] Role: Approver — can view/edit specific employee records they approve — ❌ Missing

### Module Configuration
- [ ] Enable "Attendances from Backend" toggle — ❌ Missing
- [ ] Overtime tolerance in favour of company (minutes) — ❌ Missing
- [ ] Overtime tolerance in favour of employee (minutes) — ❌ Missing
- [ ] Display extra hours at check-out toggle — ❌ Missing
- [ ] Overtime calculation start date — ❌ Missing

### Integrations
- [ ] Calendar — ❌ Not integrated
- [ ] Mail / Chatter — ❌ Missing on attendance records
- [ ] Leaves / Time Off — ❌ Extra hours cannot be deducted from leave balance
- [ ] Payroll — ❌ Worked hours not fed into payslip work entries
- [ ] Automation — ❌ Not integrated
- [ ] Claude AI — ❌ Missing (needs `attendance-anomaly-detect`, `overtime-forecast`, `attendance-summary` actions)

### API Endpoints
- [x] GET /api/attendance — ✅
- [x] POST /api/attendance — ✅
- [x] PUT /api/attendance/:id — ✅
- [x] DELETE /api/attendance/:id — ✅
- [ ] POST /api/attendance/check-in — ❌ Missing (one-click endpoint for current user)
- [ ] POST /api/attendance/check-out — ❌ Missing
- [ ] GET /api/attendance/overtime — ❌ Missing
- [ ] GET /api/attendance/errors — ❌ Missing (entries >24 h or >16 h span)

---
## Missing Features Summary
1. **One-click check-in/out** — the most-used Odoo attendance feature; completely absent
2. **Kiosk mode** — dedicated PIN/badge-based entry point for shop-floor workers
3. **Overtime engine** — no tolerance thresholds, extra-hours accumulation, or overtime display
4. **Error detection** — entries with no check-out after 24 h or spans >16 h not flagged
5. **Gantt view** — default Odoo view; provides team-level daily visibility
6. **GPS / IP metadata** — context data on check-in not captured
7. **Approver role** — managers cannot be scoped to only their team's records
8. **Pre-built filters** — "My Team", "At Work", "Errors" filters missing from list view
9. **Leave integration** — overtime hours cannot be converted to leave credit
10. **AI actions** — no panel; needs anomaly detection and overtime forecasting agents

---
## Recommended Build Order
1. Add `POST /api/attendance/check-in` and `POST /api/attendance/check-out` endpoints — S
2. Add one-click check-in/out button to module header for current user — S
3. Add error detection logic (>24 h open, >16 h span) with red flag in list view — S
4. Implement overtime calculation with configurable tolerance settings — M
5. Add Gantt view component for team attendance overview — L
6. Add "My Attendances" personal view with pre-built filters — M
7. Add IP address capture on check-in API — S
8. RBAC with Approver role scoped to team — M
9. Feed worked hours into payroll work entries — M
10. Add AI actions panel (anomaly detect, overtime forecast, summary) — M
