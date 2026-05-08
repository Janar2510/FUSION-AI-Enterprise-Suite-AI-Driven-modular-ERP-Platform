# Accounting — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/finance/accounting.html
**FusionAI status:** Partial
**Effort to complete:** L
**Business priority:** P1

---
## Odoo 17 Feature Checklist

### Core Features
- [x] Double-entry bookkeeping (debit/credit validation on post) — ✅ Done
- [x] Customer invoices (out_invoice move type) — ✅ Done
- [x] Vendor bills (in_invoice move type) — ✅ Done
- [x] Miscellaneous journal entries (entry move type) — ✅ Done
- [x] Invoice posting workflow (draft → posted) — ✅ Done
- [x] Payment registration against posted invoices — ✅ Done
- [x] Manual reconciliation endpoint — ✅ Done
- [x] Journal management (CRUD, default account) — ✅ Done
- [x] Chart of accounts (CRUD, code/type/hierarchy) — ✅ Done
- [x] Invoice PDF generation — ✅ Done
- [x] Tax engine (rate-based, per-line) — 🟡 Partial (flat 15% sim in UI, real engine in api/src/core/tax/)
- [ ] Bank synchronisation / automatic import — ❌ Missing
- [ ] Bank reconciliation models (auto-match rules) — ❌ Missing
- [ ] Batch payments — ❌ Missing
- [ ] SEPA / direct debit support — ❌ Missing
- [ ] Invoice follow-up / dunning management — ❌ Missing
- [ ] EPC QR codes on invoices — ❌ Missing
- [ ] Snailmail integration — ❌ Missing
- [ ] Electronic invoicing / EDI — ❌ Missing
- [ ] Cash discounts and early-payment tax reduction — ❌ Missing
- [ ] Cash-basis accounting method — ❌ Missing
- [ ] Accrual vs cash-basis toggle — ❌ Missing
- [ ] Deferred revenues and expenses (automated) — ❌ Missing
- [ ] Asset and fixed-asset management — ❌ Missing
- [ ] Vendor bill OCR digitisation — ❌ Missing
- [ ] Multi-company / branch accounting — ❌ Missing
- [ ] Fiscal positions (tax and account mapping) — ❌ Missing
- [ ] Withholding tax / VAT verification (VIES) — ❌ Missing
- [ ] Tax units and tax group management — ❌ Missing
- [ ] AvaTax / TaxCloud integration — ❌ Missing
- [ ] Inventory valuation (Standard / AVCO / FIFO) — ❌ Missing
- [ ] Landed costs — ❌ Missing
- [ ] Budget management and analytic accounting — ❌ Missing
- [ ] Year-end closing procedure — ❌ Missing
- [ ] Audit trail / data inalterability report — ❌ Missing
- [ ] Fiduciary mode (editable sequences, quick encoding) — ❌ Missing
- [ ] Internal transfers — ❌ Missing
- [ ] Multi-currency exchange gain/loss accounting — ❌ Missing

### Views / UI
- [x] Dashboard — ✅ Done (MetricGrid: receivables, payables, bank balance, unposted)
- [x] List view — ✅ Done (OdooListBase with search)
- [x] Form view — ✅ Done (OdooFormBase with status ribbon, ChatterPanel, AiActionsPanel)
- [ ] Kanban view — ❌ Missing
- [ ] Graph / pivot view — ❌ Missing
- [ ] Calendar view — ❌ Missing
- [ ] Bank reconciliation view — ❌ Missing
- [ ] Aged receivable / aged payable report views — ❌ Missing
- [ ] General ledger / trial balance views — ❌ Missing
- [ ] Financial report builder (balance sheet, P&L, cash flow) — ❌ Missing

### Role & Permission Settings
- [x] requireAuth middleware on all routes — ✅ Done
- [ ] Accountant role (full access) — ❌ Missing (no RBAC on module level)
- [ ] Billing role (invoice-only access) — ❌ Missing
- [ ] External accountant portal access — ❌ Missing
- [ ] Bank account validation permission — ❌ Missing
- [ ] Multi-company access scoping — ❌ Missing

### Module Configuration
- [ ] Fiscal localisation (100+ country templates) — ❌ Missing
- [ ] Default payment terms configuration — ❌ Missing (PaymentTerm model exists in schema but not wired to accounting UI)
- [ ] Default journals per move type — 🟡 Partial (journal selection in form, no default config screen)
- [ ] Tax report period settings — ❌ Missing
- [ ] Cash rounding configuration — ❌ Missing
- [ ] Invoice sequence prefix customisation — ❌ Missing

### Integrations
- [x] Inventory / products (line item auto-fill from product) — ✅ Done
- [x] Contact Hub / partners — ✅ Done
- [x] ChatterPanel (messages + timeline) — ✅ Done
- [x] AI Actions panel (invoice-anomaly agent) — ✅ Done
- [ ] Sales orders → auto-generate invoice — ❌ Missing
- [ ] Purchase orders → auto-generate vendor bill — ❌ Missing
- [ ] Calendar (payment due date reminders) — ❌ Missing
- [ ] Email (invoice delivery, follow-ups) — ❌ Missing
- [ ] Claude AI: cash-flow forecast action — ❌ Missing
- [ ] Claude AI: fraud / anomaly detection action — 🟡 Partial (agent key wired, no real AI call)
- [ ] Claude AI: tax optimisation suggestion action — ❌ Missing
- [ ] Bank sync providers (Salt Edge, Ponto, Enable Banking) — ❌ Missing
- [ ] Silverfin reporting — ❌ Missing

### API Endpoints
- [x] GET /api/accounting/accounts — ✅
- [x] POST /api/accounting/accounts — ✅
- [x] GET /api/accounting/journals — ✅
- [x] POST /api/accounting/journals — ✅
- [x] GET /api/accounting/moves — ✅
- [x] GET /api/accounting/moves/:id — ✅
- [x] POST /api/accounting/moves — ✅
- [x] PUT /api/accounting/moves/:id — ✅
- [x] POST /api/accounting/moves/:id/post — ✅
- [x] POST /api/accounting/moves/:id/pay — ✅
- [x] POST /api/accounting/moves/:id/reconcile — ✅
- [x] GET /api/accounting/payments — ✅
- [x] GET /api/accounting/moves/:id/pdf — ✅
- [ ] DELETE /api/accounting/moves/:id (cancel/reset) — ❌
- [ ] GET /api/accounting/reports/balance-sheet — ❌
- [ ] GET /api/accounting/reports/profit-loss — ❌
- [ ] GET /api/accounting/reports/cash-flow — ❌
- [ ] GET /api/accounting/reports/trial-balance — ❌
- [ ] GET /api/accounting/reports/aged-receivable — ❌
- [ ] GET /api/accounting/reports/aged-payable — ❌
- [ ] GET /api/accounting/reports/general-ledger — ❌
- [ ] GET /api/accounting/taxes — ❌
- [ ] POST/PUT /api/accounting/taxes — ❌
- [ ] GET /api/accounting/bank-statements — ❌
- [ ] POST /api/accounting/bank-statements/reconcile — ❌

---
## Missing Features Summary

**Critical gaps (blocking production use):**
1. Financial reports (balance sheet, P&L, cash flow, trial balance, aged AR/AP, general ledger) — zero backend implementation
2. Real multi-rate tax engine wired to invoice UI (UI uses hardcoded 15%)
3. Bank reconciliation (no bank statements, no matching rules)
4. Move cancel/reset-to-draft endpoint
5. RBAC: Accountant and Billing roles missing

**High-value gaps:**
- Invoice follow-up / dunning automation
- Sales order → invoice and PO → vendor bill automation
- Fiscal positions and localisation
- Deferred revenues / expenses
- Budget and analytic accounting

**Nice-to-have:**
- OCR for vendor bills, EDI/e-invoicing, SEPA, EPC QR, snailmail

---
## Recommended Build Order

1. **Cancel/reset-to-draft endpoint** — unblocks edit-after-mistake workflow (S)
2. **Tax engine wired to invoice UI** — replace 15% flat rate with real tax records (M)
3. **Financial reports API** — balance sheet, P&L, trial balance (L)
4. **Financial reports UI** — report builder views with graph/pivot (L)
5. **Aged AR / AP report** — critical for collections (M)
6. **RBAC: Accountant & Billing roles** — required for multi-user production (M)
7. **Sales order → invoice automation** — closes the sales cycle (M)
8. **Fiscal positions** — needed for multi-jurisdiction tax compliance (M)
9. **Bank reconciliation** — statement import, matching rules, reconciliation UI (XL)
10. **Deferred revenues/expenses** — accrual accounting completeness (L)
11. **Invoice follow-up / dunning** — accounts receivable automation (M)
12. **Budget and analytic accounting** — management reporting (L)
