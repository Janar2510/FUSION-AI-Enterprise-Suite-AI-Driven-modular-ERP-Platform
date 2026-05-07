# ADR-0010 — PDF Generation Strategy

**Status:** Accepted  
**Date:** 2026-05-07

## Context
B2B customers expect downloadable, branded PDF invoices, quotes, and purchase orders. Currently no PDF capability exists in the platform.

## Decision
Use **pdfkit** (pure Node.js, no browser/Chromium dependency) for programmatic PDF generation in the API. Generated PDFs are saved as `Attachment` records (with a `storageKey` pointing to the file). Signed URLs are returned to the frontend for download.

For complex layouts (e.g., branded quote templates), a future ADR may introduce Chromium-headless via Puppeteer as an optional upgrade path.

Initial document types:
1. Customer Invoice (`account.move.out_invoice`)
2. Sales Quotation / Order Confirmation (`sale.order`)
3. Purchase Order (`purchase.order`)
4. Vendor Bill (`account.move.in_invoice`)

## Consequences
- **Good:** No external service dependency. Works offline.
- **Good:** Sub-100ms generation for typical single-page invoices.
- **Bad:** Complex branding/templating requires custom pdfkit code; not WYSIWYG.
- **Future:** Add `POST /api/accounting/moves/:id/pdf` and `POST /api/sales/:id/pdf` endpoints.

## Implementation
`api/src/core/pdf/index.ts` — `generateInvoicePdf(moveId)`, `generateOrderPdf(orderId)`.
