# HR (Employees) — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/hr/employees.html
**FusionAI status:** Partial
**Effort to complete:** M
**Business priority:** P1

---
## Odoo 17 Feature Checklist

### Core Features
- [x] Employee list with create/edit — ✅ Done
- [x] Department management — ✅ Done
- [x] Job positions — ✅ Done
- [x] Manager / Coach assignment — ✅ Done
- [x] Work email & phone — ✅ Done
- [ ] Employee photo/avatar upload — ❌ Missing (initials only)
- [ ] Employee contract management (dedicated view) — ❌ Missing (smart button links to Payroll but no contract model)
- [ ] Onboarding workflow (activity checklist) — ❌ Missing
- [ ] Offboarding workflow — ❌ Missing
- [ ] Certifications / skills tracking — ❌ Missing
- [ ] Employee retention report — ❌ Missing
- [ ] Work permit / visa expiry tracking — ❌ Missing
- [ ] Private information tab (emergency contact, marital status, nationality) — ❌ Missing
- [ ] HR Settings tab (time zone, resource calendar, pin for attendance kiosk) — ❌ Missing
- [ ] Resume (CV) lines on employee form — ❌ Missing
- [ ] Employee number (employeeNumber field exists in schema, not shown in form) — 🟡 Partial
- [ ] Archive / unarchive action — 🟡 Partial (active flag stored but no UI toggle)
- [ ] Departmental hierarchy drill-down — ✅ Done (HierarchyView)

### Views / UI
- [x] Kanban view — ✅ Done
- [x] List view — ✅ Done
- [x] Form view — ✅ Done
- [x] Hierarchy / org-chart view — ✅ Done (custom HierarchyView component)
- [ ] Calendar view (birthdays, contract expiry) — ❌ Missing
- [ ] Activity view — ❌ Missing
- [ ] Graph / reporting view — ❌ Missing

### Role & Permission Settings
- [ ] Role: HR User — can view and create employees but not configure settings — ❌ Missing (no RBAC on HR routes)
- [ ] Role: HR Officer — can manage all employees, departments, jobs — ❌ Missing
- [ ] Role: HR Manager — full access + settings — ❌ Missing

### Module Configuration
- [ ] Working schedules configuration — ❌ Missing
- [ ] Leave policy defaults — ❌ Missing
- [ ] Expense reimbursement settings — ❌ Missing
- [ ] Default language / timezone — ❌ Missing

### Integrations
- [ ] Calendar — ❌ Not integrated (no calendar module link)
- [ ] Mail / Chatter — ✅ Done (ChatterPanel on employee form)
- [ ] Automation — ❌ Not integrated
- [ ] Claude AI — 🟡 Partial (AiActionsPanel present with `customer-summary` agent; should be `hr-employee-summary`, `onboarding-checklist`, `retention-risk` actions)
- [ ] Leaves module — ✅ Done (smart button with leave count)
- [ ] Attendance module — ✅ Done (smart button with attendance count)
- [ ] Payroll module — ✅ Done (smart button for payslips)
- [ ] Recruitment module — ❌ Not linked from employee form
- [ ] Fleet module — ❌ Not integrated

### API Endpoints
- [x] GET /api/hr/employees — ✅
- [x] GET /api/hr/employees/:id — ✅
- [x] POST /api/hr/employees — ✅
- [x] PUT /api/hr/employees/:id — ✅
- [ ] DELETE /api/hr/employees/:id — ❌ Missing
- [ ] PATCH /api/hr/employees/:id/archive — ❌ Missing
- [x] GET /api/hr/departments — ✅
- [x] POST /api/hr/departments — ✅
- [ ] PUT /api/hr/departments/:id — ❌ Missing
- [x] GET /api/hr/jobs — ✅
- [ ] POST /api/hr/jobs — ❌ Missing
- [ ] PUT /api/hr/jobs/:id — ❌ Missing

---
## Missing Features Summary
1. **Employee photo upload** — critical for UX parity, currently shows initials placeholder
2. **Contract model** — smart button exists but no dedicated contract entity/view
3. **Private info tab** — emergency contacts, nationality, marital status, bank account (required for payroll)
4. **Skills / certifications** — no model or UI
5. **Onboarding & offboarding workflows** — activity checklists not built
6. **RBAC** — all HR routes are open; need HR User / Officer / Manager roles
7. **Calendar integration** — no birthday or contract-expiry calendar events
8. **Archive / unarchive toggle** — field exists in DB but no UI action
9. **Department update endpoint** — `updateDepartment` noted as not implemented in store
10. **AI actions** — wrong agent key (`customer-summary`); should add `hr-onboarding-checklist`, `hr-retention-risk-analysis`, `hr-performance-summary`

---
## Recommended Build Order
1. Add archive/unarchive UI action + DELETE /api/hr/employees/:id (30 min)
2. Add PUT /api/hr/departments/:id + updateDepartment in store (30 min)
3. Implement Private Info tab on employee form (emergency contact, nationality, DOB) — M
4. Implement Contract model (HrContract) with Prisma migration + CRUD routes — M
5. Add Skills / Certifications model + resume lines on employee form — L
6. RBAC middleware for HR routes (HR User / Officer / Manager) — M
7. Onboarding / offboarding activity checklist — L
8. Calendar integration (birthday, contract expiry events) — M
9. Fix AI agent keys: replace `customer-summary` with proper HR agents — S
10. Employee photo upload to object storage — S
