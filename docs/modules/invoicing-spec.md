# Invoicing — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/finance/accounting/customer_invoices.html
**FusionAI status:** Partial
**Effort to complete:** L
**Business priority:** P1

---
## Odoo 17 Feature Checklist

### Core Features
- [x] Invoice CRUD (create, read, update, delete) — ✅ Done (store + API calls defined)
- [x] Invoice states: draft, sent, paid, overdue, cancelled — ✅ Done (types defined)
- [x] Invoice line items (product, description, qty, unit price, tax, line total) — ✅ Done
- [x] Customer management (name, email, phone, billing/shipping address, tax ID, credit limit) — ✅ Done (types + store actions)
- [x] Product catalog (SKU, unit price, cost, tax, category) — ✅ Done (types + store)
- [x] Payment tracking (method, reference, status) — ✅ Done (Payment type + store)
- [x] Credit notes (CRUD + issue action) — ✅ Done (types + store)
- [x] Recurring invoice templates (daily/weekly/monthly/yearly, start/end date, next date) — ✅ Done (types + store)
- [x] Invoice analytics (total, paid, outstanding, overdue, avg payment time) — ✅ Done (store + InvoiceAnalytics type)
- [x] Customer statement generation — ✅ Done (store action)
- [ ] Invoice form UI (create/edit form component) — ❌ Missing (only dashboard stub rendered; no form component)
- [ ] Customer form UI — ❌ Missing
- [ ] Product catalog UI — ❌ Missing
- [ ] Credit note form UI — ❌ Missing
- [ ] Recurring template form UI — ❌ Missing
- [ ] Invoice send via email — ❌ Missing (sendInvoice() calls /send endpoint but no UI or backend)
- [ ] PDF download / print — ❌ Missing (no PDF endpoint for invoicing module; accounting module has /moves/:id/pdf)
- [ ] Payment terms (net 30, net 60, installment schedules) — ❌ Missing (paymentTermsId field exists but no UI or lookup)
- [ ] Cash discounts and early-payment terms — ❌ Missing
- [ ] Deferred revenues — ❌ Missing
- [ ] Electronic invoicing / EDI — ❌ Missing
- [ ] EPC QR codes — ❌ Missing
- [ ] Snailmail integration — ❌ Missing
- [ ] Incoterms on invoices — ❌ Missing
- [ ] Invoice sequence customisation — ❌ Missing
- [ ] Cash rounding — ❌ Missing
- [ ] Multi-currency support (currencyId field exists, no FX logic) — 🟡 Partial
- [ ] Pricelist integration — ❌ Missing
- [ ] Fiscal position mapping on invoices — ❌ Missing
- [ ] Customer portal / self-service invoice view — ❌ Missing
- [ ] Invoice follow-up / dunning automation — ❌ Missing
- [ ] Batch invoice export (ZIP) — ❌ Missing

### Views / UI
- [x] Dashboard — 🟡 Partial (metrics + recent invoice table; no interactivity beyond list)
- [ ] List view (full CRUD table) — ❌ Missing (stub table in dashboard, no standalone list)
- [ ] Kanban view — ❌ Missing
- [ ] Form view (invoice creation / editing) — ❌ Missing
- [ ] Graph / pivot view (revenue trends) — ❌ Missing
- [ ] Calendar view (due dates) — ❌ Missing
- [ ] Customer list view — ❌ Missing
- [ ] Product catalog view — ❌ Missing
- [ ] Credit notes view — ❌ Missing
- [ ] Recurring templates view — ❌ Missing
- [ ] Aged receivable report view — ❌ Missing
- [ ] Partner ledger view — ❌ Missing

### Role & Permission Settings
- [ ] Billing / Invoicing role — ❌ Missing (no auth on /api/v1/invoicing/* routes)
- [ ] Accountant role (view-only on invoices) — ❌ Missing
- [ ] Customer portal access (view own invoices) — ❌ Missing

### Module Configuration
- [ ] Default payment terms — ❌ Missing
- [ ] Invoice prefix / sequence — ❌ Missing
- [ ] Default terms and conditions text — ❌ Missing
- [ ] Default currency — ❌ Missing
- [ ] Tax default for products — ❌ Missing

### Integrations
- [ ] Accounting module (tax rates, payment terms, journals) — 🟡 Partial (paymentTermsId field, no live lookup)
- [ ] Contact Hub (customer sync) — ❌ Missing (invoicing uses own Customer table, not partner store)
- [ ] Sales orders → auto-generate invoice — ❌ Missing
- [ ] Calendar (due date events) — ❌ Missing
- [ ] Email (send invoice, reminders) — ❌ Missing (sendInvoice store action stubs the call)
- [ ] Claude AI: draft invoice from deal description — ❌ Missing
- [ ] Claude AI: payment risk scoring — ❌ Missing
- [ ] Claude AI: dunning message generation — ❌ Missing
- [ ] Automation rules (auto-send on due date, overdue flagging) — ❌ Missing

### API Endpoints
- [ ] GET /api/v1/invoicing/customers — ❌ (no backend route; store calls stub)
- [ ] POST /api/v1/invoicing/customers — ❌
- [ ] PUT /api/v1/invoicing/customers/:id — ❌
- [ ] DELETE /api/v1/invoicing/customers/:id — ❌
- [ ] GET /api/v1/invoicing/products — ❌
- [ ] POST /api/v1/invoicing/products — ❌
- [ ] PUT /api/v1/invoicing/products/:id — ❌
- [ ] DELETE /api/v1/invoicing/products/:id — ❌
- [ ] GET /api/v1/invoicing/invoices — ❌
- [ ] POST /api/v1/invoicing/invoices — ❌
- [ ] PUT /api/v1/invoicing/invoices/:id — ❌
- [ ] DELETE /api/v1/invoicing/invoices/:id — ❌
- [ ] POST /api/v1/invoicing/invoices/:id/send — ❌
- [ ] POST /api/v1/invoicing/invoices/:id/cancel — ❌
- [ ] POST /api/v1/invoicing/payments — ❌
- [ ] POST /api/v1/invoicing/credit-notes — ❌
- [ ] POST /api/v1/invoicing/credit-notes/:id/issue — ❌
- [ ] GET /api/v1/invoicing/recurring-templates — ❌
- [ ] POST /api/v1/invoicing/recurring-templates — ❌
- [ ] GET /api/v1/invoicing/analytics/invoice — ❌
- [ ] POST /api/v1/invoicing/customer-statement — ❌

**Note:** The invoicing module is a standalone frontend-only stub with no backend routes implemented. All store actions target `/api/v1/invoicing/*` endpoints that do not exist in the API. The Accounting module (`/api/accounting/moves`) provides overlapping invoice functionality with real backend support — consider whether Invoicing should be merged into Accounting or built as a dedicated thin layer on top.

---
## Missing Features Summary

**Blocking (module is non-functional without these):**
1. All backend API routes under `/api/v1/invoicing/` — currently zero server-side implementation
2. Invoice form component (create / edit UI) — only a dashboard stub exists
3. Authentication / RBAC on invoicing endpoints

**High-value gaps:**
- Customer and product form UIs
- Credit note and recurring template UIs
- Email delivery of invoices
- PDF download (can reuse accounting module's PDF endpoint)
- Integration with Contact Hub (dedup customers from partners)
- Payment terms UI wired to accounting PaymentTerm records

**Architecture decision needed:**
- Invoicing module duplicates accounting module invoice data model. Recommend consolidating: replace the standalone Invoicing module UI with dedicated views inside the Accounting module, eliminating the orphan `/api/v1/invoicing/` route tree.

---
## Recommended Build Order

1. **Architecture decision: merge or standalone** — resolve before any backend work (S, planning)
2. **Backend route scaffold** — if standalone: implement all CRUD endpoints and wire Prisma (L)
3. **Invoice form component** — create/edit form with line items, tax, totals (M)
4. **Customer form UI** — CRUD for invoicing customers (M)
5. **PDF download** — reuse accounting PDF generator (S)
6. **Email send** — wire sendInvoice to messaging/email service (M)
7. **Recurring templates UI** — form + list view (M)
8. **Credit notes UI** — form + issue flow (M)
9. **Payment terms lookup** — wire paymentTermsId to accounting PaymentTerm records (S)
10. **Analytics views** — graph/pivot for revenue trends (M)
11. **Aged receivable view** — collections dashboard (M)
12. **Customer portal** — self-service invoice access (L)
