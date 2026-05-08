# Expenses — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/finance/expenses.html
**FusionAI status:** Partial
**Effort to complete:** M
**Business priority:** P2

---
## Odoo 17 Feature Checklist

### Core Features
- [x] Expense CRUD (create, read, update, delete) — ✅ Done
- [x] Expense states: draft, reported, approved, done, refused — ✅ Done
- [x] Employee link — ✅ Done
- [x] Unit price and quantity fields (total = qty × unit) — ✅ Done
- [x] Payment mode: employee (own_account) or company (company_account) — ✅ Done
- [x] Approve expense action — ✅ Done
- [x] Refuse expense action — ✅ Done
- [x] Receipt attachment (URL field, display in form) — 🟡 Partial (receipt URL field exists and displayed; no upload mechanism)
- [x] Description / notes field — ✅ Done
- [ ] Expense categories as product records (with GL account per category) — ❌ Missing (name is free text; no product/category model linked)
- [ ] Fixed-cost categories (e.g. parking flat $75) — ❌ Missing
- [ ] Variable-rate categories (e.g. mileage $0.30/unit with UoM) — ❌ Missing
- [ ] Unit of Measure on expense lines — ❌ Missing
- [ ] Expense reports (grouping multiple expenses into a single report for approval) — ❌ Missing (individual expenses only; Odoo has hr.expense.sheet)
- [ ] Expense report submit workflow (employee submits report, not individual expenses) — ❌ Missing
- [ ] Manager-level approval on expense report (vs individual record) — 🟡 Partial (approve/refuse per expense, no report-level flow)
- [ ] Accounting team post-to-accounts step — ❌ Missing (approved → done state exists but no journal entry creation)
- [ ] Re-invoice expenses to customers (analytic account link) — ❌ Missing
- [ ] Receipt upload (file/image, not just URL) — ❌ Missing
- [ ] Tax on expenses — ❌ Missing (no tax field in HrExpense model)
- [ ] Multi-currency expense — ❌ Missing
- [ ] Analytic account / cost centre tagging — ❌ Missing
- [ ] Expense product list configuration UI — ❌ Missing
- [ ] Employee reimbursement journal entry generation — ❌ Missing

### Views / UI
- [x] Dashboard metric cards (total, approved, pending, record count) — ✅ Done
- [x] List view (OdooListBase with search) — ✅ Done
- [x] Form view (OdooFormBase with approve/refuse status ribbon) — ✅ Done
- [ ] Kanban view (by state) — ❌ Missing
- [ ] Graph / pivot view (expenses by category, by employee, over time) — ❌ Missing
- [ ] Expense report list/form views — ❌ Missing
- [ ] My Expenses vs All Expenses filter — ❌ Missing (list shows all expenses; no employee-scope filter)

### Role & Permission Settings
- [x] Approve / refuse actions gated on state (UI-level guard) — 🟡 Partial (form buttons check state, no server-side role check)
- [ ] Employee role (own expenses only) — ❌ Missing
- [ ] Manager role (approve team expenses) — ❌ Missing
- [ ] Accounting role (post to GL, reimburse) — ❌ Missing
- [ ] HR Manager role (full access) — ❌ Missing

### Module Configuration
- [ ] Expense categories (products with account, UoM, default price) — ❌ Missing
- [ ] GL account per expense category — ❌ Missing
- [ ] Tax configuration for expense types — ❌ Missing
- [ ] Re-invoicing policy (at cost / sales price / no) — ❌ Missing
- [ ] Unit of Measure activation — ❌ Missing

### Integrations
- [x] HR module (employee list lookup) — ✅ Done
- [ ] Accounting / journals (post expense to GL on approval) — ❌ Missing
- [ ] Payroll (reimbursement via payslip) — ❌ Missing
- [ ] Sales / Projects (re-invoice to customer via analytic account) — ❌ Missing
- [ ] Calendar (expense submission deadlines) — ❌ Missing
- [ ] Email (manager approval notifications, reimbursement confirmation) — ❌ Missing
- [ ] Claude AI: categorise expense from description/receipt — ❌ Missing
- [ ] Claude AI: policy violation detection (over-limit, duplicate) — ❌ Missing
- [ ] Claude AI: expense report summary for manager — ❌ Missing
- [ ] Automation rules (auto-approve below threshold, escalation) — ❌ Missing

### API Endpoints
- [x] GET /api/hr/expenses — ✅
- [x] POST /api/hr/expenses — ✅
- [x] PUT /api/hr/expenses/:id — ✅
- [x] DELETE /api/hr/expenses/:id — ✅
- [x] PATCH /api/hr/expenses/:id/approve — ✅
- [x] PATCH /api/hr/expenses/:id/refuse — ✅
- [ ] GET /api/hr/expense-reports — ❌ (no expense report / hr.expense.sheet model)
- [ ] POST /api/hr/expense-reports — ❌
- [ ] POST /api/hr/expense-reports/:id/submit — ❌
- [ ] POST /api/hr/expense-reports/:id/approve — ❌
- [ ] POST /api/hr/expense-reports/:id/post — ❌ (accounting post step missing)
- [ ] POST /api/hr/expense-reports/:id/register-payment — ❌
- [ ] GET /api/hr/expense-categories — ❌
- [ ] POST /api/hr/expenses/:id/receipt-upload — ❌

---
## Missing Features Summary

**Critical gaps (module is partially functional but lacks the core Odoo workflow):**
1. Expense reports (hr.expense.sheet) — Odoo groups expenses into a report for manager approval; FusionAI approves individual lines only
2. Accounting posting step — approved expenses never create a journal entry; no GL impact
3. Expense categories as product records — expenses have free-text names; no GL account, UoM, or price defaults
4. Role-based access — any authenticated user can approve/refuse any expense

**High-value gaps:**
- Receipt file upload (not just URL)
- Tax field on expenses
- Re-invoice to customer (analytic account)
- My Expenses vs All Expenses scope filter
- Email notifications at each workflow step

**Nice-to-have:**
- Mileage/variable-rate categories, multi-currency, payroll reimbursement, Claude AI categorisation

---
## Recommended Build Order

1. **Expense categories model** — products with GL account, UoM, default price (M)
2. **Tax field on HrExpense** — add to model, API, and form UI (S)
3. **Expense report model** (hr_expense_sheet) — group expenses into a report entity (M)
4. **Expense report workflow** — submit → manager approve → accounting post (M)
5. **GL journal entry on post** — create account.move when report is posted (M)
6. **Role-based access** — Employee / Manager / Accountant scopes (M)
7. **Receipt file upload** — replace URL field with file upload endpoint (S)
8. **My Expenses filter** — employee-scoped list view (S)
9. **Re-invoice to customer** — analytic account link + sales order line creation (L)
10. **Email notifications** — approval request, approval confirmation, reimbursement (M)
11. **Claude AI: expense categorisation** — auto-suggest category from description (M)
12. **Graph/pivot views** — expenses by category, employee, period (M)
