# ERP Architecture Gap Analysis — FusionAI Enterprise Suite
**Date:** 2026-05-07  
**Auditor:** Automated codebase audit (pathfinder + manual review)  
**Against:** CLAUDE_CODE_BUILD_PLAN.md Section 15 (Hard Rules) + Standard B2B ERP patterns

---

## Executive Summary

15 architectural gaps identified. 5 are critical for B2B ERP credibility.  
All are now tracked in `TODO.md` with target phases.

---

## Gap Register

| # | Gap | Status Before | Priority | Linked ADR/Phase |
|---|-----|--------------|----------|-----------------|
| G-01 | Document sequence numbering | PARTIAL — count-based race condition | **P0 CRITICAL** | ADR-0008, Phase 5b |
| G-02 | Timeline event emission in routes | PARTIAL — helper exists, not called | P1 HIGH | Phase 5b |
| G-03 | Outbox event background processor | PARTIAL — no worker/job | P1 HIGH | ADR-0009, Phase 6 |
| G-04 | Chatter (Messages/Activities) in module forms | MISSING — schema only | P2 MEDIUM | Phase 4 DoD |
| G-05 | PDF generation for quotes/invoices | MISSING — no library | **P0 CRITICAL** | ADR-0010, Phase 6 |
| G-06 | Transactional email service | MISSING — no library | **P0 CRITICAL** | ADR-0011, Phase 6 |
| G-07 | Tax computation engine | MISSING — hardcoded 20% | **P0 CRITICAL** | ADR-0012, Phase 4 |
| G-08 | Payment terms on invoices | MISSING — no model | P2 MEDIUM | Phase 4 |
| G-09 | Customer pricelist | PARTIAL — vendor only | P2 MEDIUM | Phase 4 |
| G-10 | Bank reconciliation workflow | MISSING — no BankStatement model | P3 LOW | Phase 6 |
| G-11 | Accounting period locking | MISSING — no period model | P2 MEDIUM | Phase 4 |
| G-12 | Frontend AI Actions review panel | PARTIAL — mock UI only | P1 HIGH | Phase 5 |
| G-13 | Real-time updates (WebSocket/SSE) | MISSING — no socket setup | P3 LOW | Phase 7 |
| G-14 | RBAC record-level row filtering | MISSING — role-only, no row filter | **P0 CRITICAL** | ADR-0013, Phase 2 |
| G-15 | Stock valuation + COGS entries | MISSING — no GL posting on pick | P2 MEDIUM | Phase 4 |

---

## Gap Details

### G-01 — Document Sequence Numbering (FIXED 2026-05-07)
**Before:** `const count = await prisma.saleOrder.count(); name = 'SO' + count` — race condition under concurrency.  
**After:** `IrSequence` model + `core/sequence/nextval()` using `SELECT ... FOR UPDATE`. Atomic, gapless, configurable prefix/padding.  
**Sequences seeded:** SO, INV, RINV, BILL, RBILL, PO, WH/IN, WH/OUT, WH/INT, CRM, TKT, CUST, VEND.

### G-02 — Timeline Event Emission
**Issue:** `core/timeline/index.ts` has `emitTimeline()` but none of the Phase-3 route handlers call it on state transitions (SO confirm, invoice post, payment register, picking validate, etc.).  
**Impact:** Partner 360° profile shows empty timeline; AI customer summary agent has no data.  
**Fix:** Wire `emitTimeline()` into `flow.service.ts` for every state transition. See Phase 5b tasks in TODO.md.

### G-03 — Outbox Event Processor  
**Issue:** `OutboxEvent` rows written but no background consumer reads and relays them.  
**Impact:** Cross-module triggers (CRM → Sales notify, Sales → Inventory, Accounting → email) never fire.  
**Fix:** Add `api/src/jobs/outboxRelay.ts` with `node-cron` (or Bull) picking up unprocessed events.  
**ADR:** ADR-0009 — Background Job Architecture.

### G-04 — Chatter in Module Forms
**Issue:** `ChatterMessage` model exists in schema. No React `<Chatter>` component in any module form.  
**Impact:** Cannot log internal notes, post to customer (Odoo-style chatter), or see activities in context.  
**Fix:** Build `frontend/src/shared/chatter/ChatterPanel.tsx` + wire into helpdeskModule, salesModule, accountingModule forms.

### G-05 — PDF Generation
**Issue:** `api/src/core/pdf/` is empty. No `pdfkit`, `puppeteer`, or `@react-pdf/renderer` in api/package.json.  
**Impact:** Cannot email or download invoices/quotes as PDF — B2B blocker.  
**Fix:** Add `pdfkit` + `api/src/core/pdf/index.ts` with `generateInvoicePdf(moveId)` and `generateQuotePdf(orderId)`. Save as `Attachment`.  
**ADR:** ADR-0010 — PDF Generation Strategy.

### G-06 — Transactional Email Service
**Issue:** No `nodemailer`, `sendgrid`, `resend`, or other email library. No `core/email/` service.  
**Impact:** Cannot send order confirmations, invoice PDFs, password resets, payment reminders.  
**Fix:** Add `nodemailer` + `api/src/core/email/index.ts` with `sendTemplate(to, template, vars)`. Templates: invoice, order-confirm, password-reset, payment-reminder.  
**ADR:** ADR-0011 — Email Delivery Strategy.

### G-07 — Tax Computation Engine  
**Issue:** Tax hardcoded as `amountUntaxed * 0.2` in `flow.service.ts` and `routes/sales.ts`. No `Tax` model.  
**Impact:** VAT/sales tax compliance broken for all jurisdictions. Cannot support zero-rate, reduced-rate, or tax-exempt customers.  
**Fix needed:**
1. Add `AccountTax` model to schema: `{ name, amount, type (percent|fixed), taxGroup, active }`
2. Add `taxIds` FK on `ProductCategory` and `Partner` (for tax classes)
3. Compute tax in `calculateTotals()` using product taxIds + partner tax class
**ADR:** ADR-0012 — Tax Computation.

### G-08 — Payment Terms
**Issue:** `dueDate` on `AccountMove` exists but no `PaymentTerm` model. All invoices default to immediate due.  
**Fix:** Add `PaymentTerm { name, line: [{days, dayType, percentageAmount}] }`. Apply on invoice create.

### G-09 — Customer Pricelist
**Issue:** `VendorPricelist` exists but no customer `Pricelist`. All customers pay `product.salesPrice` with no tiered/partner pricing.  
**Fix:** Add `Pricelist { name, currencyCode, partnerId?, lines: [{productId, minQty, price, discount}] }`. Apply in sales order line pricing.

### G-10 — Bank Reconciliation
**Issue:** No `BankStatement` or `BankStatementLine` model.  
**Fix (Phase 6):** Add models + `POST /api/accounting/bank-statements/:id/match` reconciliation endpoint.

### G-11 — Accounting Period Locking
**Issue:** No `AccountingPeriod` model. No check in posting routes that the target date is in an open period.  
**Fix:** Add `AccountingPeriod { companyId, dateStart, dateStop, locked }`. Check in `postInvoice()` and `registerPayment()`.

### G-12 — Frontend AI Actions Panel (PARTIAL — built 2026-05-07)
**Issue:** `AIAssistantPanel.tsx` in Discuss module is hardcoded mock data. No binding to real `GET /api/ai/actions`.  
**Fix:** Replace mock data with real `aiActionsApi.list()` calls + approve/reject buttons. Wire into partner profile and helpdesk form sidebars.

### G-13 — Real-time Updates
**Issue:** No WebSocket or SSE. Users must refresh to see new messages, stage changes.  
**Fix (Phase 7):** Add `socket.io` or Server-Sent Events to api. Broadcast events from `emitTimeline()`.

### G-14 — RBAC Record-Level Filtering (SECURITY)
**Issue:** `requirePermission('key')` checks role but no per-row filtering. Salesperson A sees Salesperson B's leads.  
**Impact:** Multi-tenant data leakage risk. Regulatory/legal liability.  
**Fix:** Add `core/auth/recordRules.ts` — per-module `whereClause(user)` functions applied by route handlers.  
**ADR:** ADR-0013 — Record-Level Access Control.

### G-15 — Stock Valuation + COGS
**Issue:** `validatePicking()` marks stock moves DONE but creates no accounting entries.  
**Impact:** Inventory asset account and COGS are never updated. P&L is wrong.  
**Fix (Phase 4 accounting DoD):** On picking validation, create `AccountMove` entries: Dr COGS / Cr Inventory Asset per move line using product cost price.

---

## New Items Added to TODO.md

- [ ] G-01: IrSequence model + nextval() ← **DONE** (2026-05-07)
- [ ] G-02: Wire emitTimeline() into flow.service.ts ← Phase 5b 
- [ ] G-03: api/src/jobs/outboxRelay.ts ← Phase 6
- [ ] G-04: Chatter component + form integration ← Phase 4 DoD
- [ ] G-05: PDF service (pdfkit) + invoice/quote endpoints ← Phase 6
- [ ] G-06: Email service (nodemailer) + templates ← Phase 6
- [ ] G-07: AccountTax model + tax computation ← Phase 4 accounting
- [ ] G-08: PaymentTerm model + invoice due-date calc ← Phase 4 accounting
- [ ] G-09: Customer Pricelist model + sales line pricing ← Phase 4 sales
- [ ] G-10: BankStatement model + reconciliation ← Phase 6
- [ ] G-11: AccountingPeriod model + period lock check ← Phase 4 accounting
- [ ] G-12: Frontend AI Actions panel (real data) ← Phase 5
- [ ] G-13: Real-time (SSE/WebSocket) ← Phase 7
- [ ] G-14: Record-level RBAC (row filters) ← Phase 2 security
- [ ] G-15: COGS accounting entries on picking validate ← Phase 4 inventory

---

## New ADRs Required

| ADR | Title | Status |
|-----|-------|--------|
| ADR-0008 | Document Sequence Strategy (IrSequence model) | Proposed |
| ADR-0009 | Background Job Architecture (outbox relay) | Proposed |
| ADR-0010 | PDF Generation Strategy | Proposed |
| ADR-0011 | Email Delivery Strategy | Proposed |
| ADR-0012 | Tax Computation Architecture | Proposed |
| ADR-0013 | Record-Level Access Control | Proposed |

See `docs/adr/` for full ADR files.
