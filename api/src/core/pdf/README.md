# core/pdf

PDF generation service for quotes, invoices, purchase orders, and other printable documents.

Key exports:
- `renderQuotePdf(saleOrder)` — generates a PDF buffer for a quotation/order
- `renderInvoicePdf(accountMove)` — generates a PDF buffer for a posted invoice
- `renderPurchaseOrderPdf(purchaseOrder)` — generates a PDF for a PO

Implementation options (pick one, document in ADR):
- `@react-pdf/renderer` — React-based, runs server-side, good for complex layouts
- Chromium headless (via Puppeteer) — full HTML/CSS fidelity, heavier

PDF is saved as an `Attachment` record via `core/attachments` and linked as a `Document`.

See Phase 3 (Section 7.1) in `CLAUDE_CODE_BUILD_PLAN.md`.
