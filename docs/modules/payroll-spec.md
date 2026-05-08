# Payroll — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/hr/payroll.html
**FusionAI status:** Stub
**Effort to complete:** XL
**Business priority:** P1

---
## Odoo 17 Feature Checklist

### Core Features
- [x] Payslip creation (draft → confirmed) — ✅ Done
- [x] Basic wage / deductions / net salary calculation — ✅ Done (simple arithmetic, no rules engine)
- [x] Period (dateFrom / dateTo) — ✅ Done
- [x] Payslip state machine (draft → done) — ✅ Done
- [ ] Salary structure types (Fixed / Hourly) — ❌ Missing
- [ ] Salary rules engine (computation logic with Python-like conditions) — ❌ Missing
- [ ] Salary rule parameters (rule parameters / input types table) — ❌ Missing
- [ ] Contract required before payslip generation — ❌ Missing (no HrContract model)
- [ ] Work entries import onto payslip (sick leave, overtime, etc.) — ❌ Missing
- [ ] Payslip batch (batch generate for all employees in a period) — ❌ Missing
- [ ] SEPA payment file export — ❌ Missing
- [ ] Accounting journal entries from payslip — ❌ Missing
- [ ] Localization / country-specific tax rules — ❌ Missing
- [ ] Salary package configurator — ❌ Missing
- [ ] Benefits & deductions configuration (pre/post-tax) — 🟡 Partial (single `deductions` field only)
- [ ] Company contribution lines — ❌ Missing
- [ ] Multi-company payroll support — ❌ Missing
- [ ] Working schedules integration (hourly payslips) — ❌ Missing
- [ ] Contract expiry / work permit notifications — ❌ Missing
- [ ] Time off deduction on payslip from work entries — ❌ Missing

### Views / UI
- [x] List view with summary KPI cards — ✅ Done
- [x] Form view (payslip detail) — ✅ Done
- [ ] Kanban view — ❌ Missing
- [ ] Graph / pivot reporting view — ❌ Missing
- [ ] Work entries view — ❌ Missing
- [ ] Payslip batch list view — ❌ Missing
- [ ] Salary rules configuration view — ❌ Missing

### Role & Permission Settings
- [ ] Role: Payroll User — create/edit own payslips — ❌ Missing
- [ ] Role: Payroll Officer — manage all payslips, run batch — ❌ Missing
- [ ] Role: Payroll Manager — full access + accounting posting — ❌ Missing

### Module Configuration
- [ ] Enable payroll slips in accounting — ❌ Missing
- [ ] SEPA payment method toggle — ❌ Missing
- [ ] Deferred time off configuration — ❌ Missing
- [ ] Contract/work permit expiry notice periods — ❌ Missing
- [ ] Salary structure types setup — ❌ Missing

### Integrations
- [ ] Calendar — ❌ Not integrated
- [ ] Mail / Chatter — ❌ Missing on payslip form (no ChatterPanel)
- [ ] Accounting module — ❌ No journal entry creation
- [ ] Leaves / Time Off — ❌ Work entries not fed from leave approvals
- [ ] Attendance — ❌ Worked hours not fed into payslip calculation
- [ ] Automation — ❌ Not integrated
- [ ] Claude AI — ❌ Missing (no AiActionsPanel; needs `payroll-anomaly-detect`, `payroll-summary`, `salary-benchmarking` actions)

### API Endpoints
- [x] GET /api/payroll — ✅
- [x] POST /api/payroll — ✅
- [x] PUT /api/payroll/:id — ✅
- [x] PATCH /api/payroll/:id/confirm — ✅
- [x] DELETE /api/payroll/:id — ✅
- [ ] POST /api/payroll/batch — ❌ Missing
- [ ] GET /api/payroll/work-entries — ❌ Missing
- [ ] GET /api/payroll/salary-structures — ❌ Missing
- [ ] POST /api/payroll/:id/post-to-accounting — ❌ Missing
- [ ] GET /api/payroll/:id/sepa-export — ❌ Missing

---
## Missing Features Summary
1. **Salary rules engine** — currently all payslips use a flat `basicWage - deductions` formula; no configurable rules
2. **HrContract model** — payslips cannot be generated without contracts; entire contract lifecycle missing
3. **Work entries** — no mechanism to pull leave/attendance data onto a payslip
4. **Payslip batch** — generating payroll for all employees at once is core Odoo workflow
5. **Accounting posting** — payslips do not create journal entries; blocks real finance usage
6. **SEPA export** — payment file generation absent
7. **Salary structures** — no structure types or rule parameters model
8. **Benefits / deductions table** — only a single numeric deductions field
9. **Chatter** — no messaging on payslip form
10. **AI actions** — no panel; needs anomaly detection, summary generation, benchmarking agents

---
## Recommended Build Order
1. Add HrContract model (Prisma migration + CRUD) and link to employee — L
2. Add salary structure types + basic salary rules table (configurable lines) — XL
3. Add work entry model fed from attendance + approved leaves — L
4. Implement payslip batch generation endpoint and UI — M
5. Add accounting journal entry posting on payslip confirmation — L
6. Add ChatterPanel to payslip form — S
7. Add SEPA export endpoint — M
8. RBAC middleware for payroll routes — M
9. Add AI actions panel (anomaly detect, summary, benchmarking) — M
10. Kanban + graph views — M
