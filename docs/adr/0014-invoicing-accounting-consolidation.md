# ADR-0014: Invoicing Module Consolidation into Accounting

**Status:** Accepted  
**Date:** 2026-05-10  
**Deciders:** Engineering

---

## Context

The platform has two overlapping modules:
- **Accounting** (`/api/accounting`, `AccountingModule.tsx`) — full double-entry bookkeeping, `AccountMove` / `AccountMoveLine` Prisma models, journals, reconciliation, financial reports.
- **Invoicing** (`/api/invoicing`, `InvoicingDashboard.tsx`) — a separate module with its own store (`invoicingStore`) that targets a legacy `/api/v1/invoicing/*` endpoint path and its own `Invoice` / `Customer` types. The backend for this path is effectively unimplemented.

Maintaining two parallel invoicing surfaces creates confusion and doubles maintenance burden.

## Decision

1. **Redirect the Invoicing module UI to the Accounting module.** `InvoicingDashboard.tsx` is kept as a thin shell that imports and renders the Accounting invoice list view (filtered to `moveType: out_invoice`). No separate invoicing store logic is needed for new functionality.

2. **Deprecate the `invoicingStore` legacy API paths.** The store continues to exist for backwards-compatibility during transition but all new writes go through `AccountMove`. The `/api/invoicing/*` Express router will be replaced with 301 redirects to `/api/accounting/moves` with `moveType=out_invoice` where applicable.

3. **Customer portal invoices** are served by the Portal access layer (ADR-0015) at `GET /api/portal/invoices/:token`, returning a read-only projection of `AccountMove`.

## Consequences

- **Positive:** Single source of truth for all financial documents. `AccountMove` already has all required fields (move type, currency, partner, lines, tax amounts, payment status).
- **Negative:** `InvoicingDashboard.tsx` needs to be refactored to use accounting API calls in a follow-up sprint (Sprint 15). Short-term it remains a stub.
- **Risk:** Existing integrations targeting `/api/v1/invoicing/*` paths will break. These are internal only and can be migrated at the same time.
