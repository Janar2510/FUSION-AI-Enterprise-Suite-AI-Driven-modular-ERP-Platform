# Spreadsheet — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/productivity/spreadsheet.html
**FusionAI status:** Partial
**Effort to complete:** XL
**Business priority:** P3

---
## Odoo 17 Feature Checklist

### Core Features
- [x] Create / open / delete spreadsheets — ✅ Done (CRUD via /api/spreadsheets)
- [x] Grid with 26 columns × 1000 rows — ✅ Done (SpreadsheetModule.tsx, react-virtualized MultiGrid)
- [x] Formula bar (fx) — ✅ Done (formula input, `=` prefix detection)
- [x] Cell value entry and editing — ✅ Done (updateCell in store)
- [x] Formula evaluation — 🟡 Partial (FormulaService.processDataBuffer exists server-side; client calls evaluateFormula from store; actual formula engine scope unknown)
- [x] Bold / italic cell formatting — 🟡 Partial (buttons rendered in toolbar; bold/italic applied via CSS class on cell; no full formatting persistence)
- [x] Text alignment (left / center / right) — 🟡 Partial (alignment buttons rendered; align stored on cell; not persisted to server on individual cell save)
- [x] Save / load spreadsheet data as JSON — ✅ Done (data stored as JSON string in DB, parsed on GET)
- [ ] Odoo data pivot tables (link live ERP data) — ❌ Missing (no pivot integration)
- [ ] Graph / chart insertion from ERP data — ❌ Missing
- [ ] List view linked to ERP model — ❌ Missing
- [ ] Menu data insertion (navigate to records) — ❌ Missing
- [ ] Global filters (date range, record filters shared across pivot/graph) — ❌ Missing
- [ ] Standard spreadsheet functions library (SUM, IF, VLOOKUP, etc.) — 🟡 Partial (FormulaService exists but completeness is unknown; no confirmed parity with XLSX functions)
- [ ] Default templates — ❌ Missing
- [ ] Custom template creation — ❌ Missing
- [ ] Multi-sheet (tabs) support — ❌ Missing (single flat grid only)
- [ ] Cell formatting (number format, date format, currency, %) — ❌ Missing
- [ ] Cell background / font colour — ❌ Missing
- [ ] Column/row resize — ❌ Missing (fixed widths 40px / 120px)
- [ ] Column/row insert / delete — ❌ Missing
- [ ] Freeze panes — 🟡 Partial (fixedColumnCount=1 / fixedRowCount=1 is structural; user cannot toggle)
- [ ] Copy / paste cells — ❌ Missing
- [ ] Merge cells — ❌ Missing
- [ ] Conditional formatting — ❌ Missing
- [ ] Sorting / filtering per column — ❌ Missing
- [ ] Named ranges — ❌ Missing
- [ ] Comments on cells — ❌ Missing
- [ ] XLSX import / export — ❌ Missing

### Views / UI
- [x] Kanban listing of spreadsheets — ✅ Done (renderKanban)
- [x] Grid editor view — ✅ Done (renderForm with MultiGrid)
- [x] Toolbar (bold, italic, align) — 🟡 Partial (buttons present; some actions lack persistence)
- [x] Formula bar — ✅ Done
- [x] Status bar — ✅ Done (bottom bar with sync status)
- [ ] Sheet tabs (multi-sheet) — ❌ Missing
- [ ] Ribbon / full formatting toolbar — ❌ Missing
- [ ] Right-click context menu — ❌ Missing
- [ ] List view of all spreadsheets — ❌ Missing (kanban only on index)

### Role & Permission Settings
- [ ] Per-spreadsheet access control — ❌ Missing (no RBAC; any authenticated user can read/write)
- [ ] Share spreadsheet with groups or users — ❌ Missing
- [ ] Read-only view mode — ❌ Missing

### Module Configuration
- [ ] Partner linkage (partnerId stored but no UI picker) — 🟡 Partial (partnerId on Spreadsheet model; no UI)
- [ ] Default template selection — ❌ Missing

### Integrations
- [ ] Calendar — ❌ Missing
- [ ] Mail / Chatter — ❌ Missing
- [ ] Automation rules — ❌ Missing
- [ ] Claude AI (3 actions: generate content, analyse data, explain formula) — ❌ Missing (no AI integration in spreadsheet)
- [ ] Documents module (create spreadsheet from Documents) — ❌ Missing
- [ ] Accounting pivot (GL entries, P&L live data) — ❌ Missing
- [ ] CRM / Sales pivot — ❌ Missing
- [ ] Inventory pivot — ❌ Missing

### API Endpoints
- [x] GET /api/spreadsheets — ✅ (paginated, search by name)
- [x] GET /api/spreadsheets/:id — ✅ (with partner, FormulaService processing)
- [x] POST /api/spreadsheets — ✅
- [x] PUT /api/spreadsheets/:id — ✅
- [x] DELETE /api/spreadsheets/:id — ✅
- [ ] POST /api/spreadsheets/:id/export (XLSX) — ❌
- [ ] POST /api/spreadsheets/:id/share — ❌
- [ ] GET /api/spreadsheets/templates — ❌

---
## Missing Features Summary
1. **Odoo data integration** — the defining Odoo Spreadsheet feature (pivot/graph/list from live ERP data) is completely absent; this is the core differentiator vs. a plain grid editor
2. **Multi-sheet tabs** — single flat sheet only; cannot organise data across tabs
3. **Full formula library** — FormulaService completeness is unclear; no SUM aggregation rows, no VLOOKUP, no cross-sheet refs
4. **XLSX import/export** — cannot round-trip with Excel or Google Sheets
5. **Cell formatting** — no number/date/currency format, no background colour, no font colour
6. **Column/row operations** — no resize, insert, delete
7. **Copy/paste** — no clipboard integration
8. **Global filters** — no shared date/record filters across pivot views
9. **Templates** — no default or custom template system
10. **RBAC** — no access control per spreadsheet

## Recommended Build Order
1. Multi-sheet tabs (add `sheets` array to data model) (M)
2. XLSX export via `xlsx` npm package (S)
3. XLSX import (drag-drop file → parse to internal format) (M)
4. Full formula library audit + complete FormulaService (L)
5. Cell formatting (number, date, currency, colour) (M)
6. Column/row insert/delete + resize (M)
7. Copy/paste clipboard support (M)
8. Odoo data pivot (connect to any ERP model endpoint → render as pivot table) (XL)
9. Graph insertion from pivot data (L)
10. Global filters panel (L)
11. Per-spreadsheet RBAC + share link (M)
12. Claude AI integration (formula explain, data analysis, auto-fill) (M)
