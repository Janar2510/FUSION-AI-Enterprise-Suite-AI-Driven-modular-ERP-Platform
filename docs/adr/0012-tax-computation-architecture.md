# ADR-0012 — Tax Computation Architecture

**Status:** Accepted  
**Date:** 2026-05-07

## Context
Tax is currently hardcoded as 20% flat rate in `flow.service.ts` and `routes/sales.ts`. This breaks VAT compliance for EU VAT (tiered), US sales tax (jurisdiction-based), zero-rate exports, and tax-exempt customers.

## Decision
Introduce a structured tax engine:

1. **`AccountTax` model** — already partially exists; extend with: `{ name, amount, amountType (percent|fixed), priceInclude, taxGroupId, active, countryCode? }`.

2. **`AccountTaxGroup` model** — groups taxes for display on invoices (e.g., "VAT 20%", "VAT 0%").

3. **Tax application logic** in `core/tax/index.ts`:
   - `computeTax(lines, partnerTaxClass?)` — given line items with `taxIds[]`, compute per-line and total tax.
   - Products carry `taxIds[]`; partners can override with a tax class (for B2B reverse charge, export, etc.).
   - Tax-inclusive prices: `priceInclude = true` means `priceUnit` already contains tax (strip it before computing).

4. **Seeded default taxes** (migration `20260507_taxes`):
   - `TAX_VAT20` — 20% standard VAT (EU)
   - `TAX_VAT0` — 0% (exports/zero-rated)
   - `TAX_EXEMPT` — 0% (tax-exempt partners)

## Consequences
- **Good:** Correct legal compliance from Phase 4 onward.
- **Good:** Extensible to multi-jurisdiction without architectural changes.
- **Bad:** Existing seeded data has hardcoded 20% — one-time migration script needed to backfill.
- **Hard rule:** Tax computation never happens in the frontend. Backend-only.

## Implementation
`api/src/core/tax/index.ts` — `computeTax(lines: LineItem[], taxMap: TaxMap): TaxResult`.
Applied in: `flow.service.ts` `newQuotation()`, `saleRoutes POST /`, `purchaseRoutes POST /`.
