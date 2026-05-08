# Documents — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/productivity/documents.html
**FusionAI status:** Partial
**Effort to complete:** L
**Business priority:** P2

---
## Odoo 17 Feature Checklist

### Core Features
- [x] File upload (single and multi-file) — ✅ Done (DocumentManager, /api/v1/documents/upload)
- [x] File download — ✅ Done (/api/v1/documents/:id/download)
- [x] File delete — ✅ Done (/api/v1/documents/:id DELETE)
- [x] Document metadata (title, description, keywords, categories, tags) — ✅ Done (Document type)
- [x] Document type classification (PDF, image, Word, Excel, PPT, text) — ✅ Done (document_type field)
- [x] AI classification (invoice/contract/receipt detection) — ✅ Done (is_invoice, is_contract, is_receipt flags)
- [x] OCR text extraction — ✅ Done (ocr_text, ocr_confidence, ocr_language fields)
- [x] Processing status tracking (pending/processing/completed/failed) — ✅ Done
- [x] Version tracking (version number, parent_document_id) — ✅ Done (DocumentVersion type)
- [x] Document sharing (share token, can_view/download/comment flags) — ✅ Done (DocumentShare type, /share endpoint)
- [x] Tagging system — ✅ Done (tags array, filter by tags)
- [x] Annotations (highlight, comment, note, stamp, drawing) — ✅ Done (DocumentAnnotation type)
- [x] WebSocket real-time updates — ✅ Done (document_processed, document_uploaded events)
- [x] Pagination / load more — ✅ Done (offset-based in store)
- [ ] Hierarchical workspaces (parent/sub-workspaces) — 🟡 Partial (DocumentCollection has parent_collection_id in types but no UI)
- [ ] PDF splitting / merging — ❌ Missing (no API endpoint)
- [ ] Document locking — ❌ Missing (no lock/unlock mechanism)
- [ ] File request (ask user to upload by due date) — ❌ Missing
- [ ] Email alias upload — ❌ Missing
- [ ] Trash / 30-day retention — ❌ Missing (hard delete only)
- [ ] Document preview (thumbnail/in-browser viewer) — 🟡 Partial (DocumentViewer component exists but preview_url logic unimplemented)
- [ ] Inline document editing — ❌ Missing

### Views / UI
- [x] Grid view — ✅ Done (DocumentManager viewMode='grid')
- [x] List view — ✅ Done (DocumentManager viewMode='list')
- [x] Upload modal with drag-and-drop — ✅ Done (showUploadModal)
- [x] Filter panel (type, classification, status, date range) — ✅ Done (showFilters)
- [x] Search bar — ✅ Done (searchQuery)
- [ ] Kanban view — ❌ Missing (only grid/list)
- [ ] Document detail / form view — 🟡 Partial (DocumentViewer exists but is incomplete)
- [ ] Activity view — ❌ Missing
- [ ] Workspace sidebar navigation — ❌ Missing (no workspace tree in UI)

### Role & Permission Settings
- [x] is_public / is_encrypted flags — ✅ Done (on Document model)
- [x] Per-document share permissions (can_view, can_edit, can_download, can_share, can_comment) — ✅ Done (DocumentShare)
- [x] DocumentPermission type (user-level grants) — ✅ Done (type defined)
- [ ] Group-based workspace access (Read Group / Write Group) — ❌ Missing (no RBAC wired to workspaces)
- [ ] "Own documents only" restriction — ❌ Missing
- [ ] Portal user access — ❌ Missing

### Module Configuration
- [ ] Accounting centralization (auto-move accounting docs to designated workspace) — ❌ Missing
- [ ] Journal synchronization — ❌ Missing
- [ ] Default workspace assignment — ❌ Missing
- [ ] Email domain / alias configuration — ❌ Missing
- [ ] HR / Payroll centralization — ❌ Missing

### Integrations
- [ ] Calendar / Activity scheduling — ❌ Missing (DocumentWorkflow type defined but not wired)
- [ ] Mail / Chatter on documents — ❌ Missing
- [x] Automation / Workflow rules — 🟡 Partial (DocumentWorkflow type defined; no UI or API)
- [x] Claude AI (OCR + classification processing) — ✅ Done (/process endpoint triggers AI pipeline)
- [ ] Accounting (generate vendor bill / invoice from document) — ❌ Missing
- [ ] HR applicant creation from document — ❌ Missing
- [ ] Purchase receipt from document — ❌ Missing
- [ ] Sign module integration — ❌ Missing
- [ ] Spreadsheet creation from Documents — ❌ Missing

### API Endpoints
- [x] GET /api/v1/documents — ✅ (with full filter params)
- [x] POST /api/v1/documents/upload — ✅
- [x] GET /api/v1/documents/:id/download — ✅
- [x] DELETE /api/v1/documents/:id — ✅
- [x] POST /api/v1/documents/:id/share — ✅
- [x] POST /api/v1/documents/:id/process — ✅
- [x] PUT /api/v1/documents/:id — ✅
- [ ] GET /api/v1/documents/:id/preview — ❌
- [ ] POST /api/v1/documents/split — ❌
- [ ] POST /api/v1/documents/merge — ❌
- [ ] GET /api/v1/documents/:id/versions — ❌ (type exists, endpoint missing)
- [ ] GET /api/v1/documents/:id/annotations — ❌ (type exists, endpoint missing)
- [ ] POST /api/v1/documents/request — ❌
- [ ] DELETE /api/v1/documents/:id (soft delete / trash) — ❌ (hard delete only)
- [ ] GET /api/v1/workspaces — ❌
- [ ] POST /api/v1/workspaces — ❌

---
## Missing Features Summary
1. **Workspace UI** — DocumentCollection types are defined but there is no workspace sidebar, creation flow, or workspace-scoped views in the frontend
2. **PDF split/merge** — no API or UI; Odoo core feature
3. **Document locking** — concurrent edit protection absent
4. **File requests** — cannot ask an external or internal user to upload a file by deadline
5. **Trash / soft delete** — deletes are permanent; no 30-day retention
6. **Preview/viewer** — DocumentViewer.tsx exists but preview_url generation is not implemented
7. **Accounting/HR automation** — cannot create vendor bills, invoices, or HR applicants from documents
8. **Group-based RBAC on workspaces** — permission flags exist on Document model but no workspace-level access control
9. **Activity / Chatter** — no messaging or scheduled activities on documents
10. **Email alias upload** — users cannot email files directly into a workspace

## Recommended Build Order
1. Workspace API (GET/POST /api/v1/workspaces) + sidebar UI (M)
2. Soft delete / trash endpoint + 30-day retention (S)
3. DocumentViewer preview (pdf.js or iframe for PDFs, img for images) (M)
4. Annotations API (GET/POST /api/v1/documents/:id/annotations) + viewer overlay (L)
5. Versions API (GET /api/v1/documents/:id/versions) (S)
6. PDF split/merge endpoint (serverside pdf-lib) (M)
7. Accounting integration (create bill/invoice from OCR-extracted invoice doc) (L)
8. File request flow (email trigger + due date) (M)
9. Group-based workspace RBAC (M)
10. Chatter/Activity thread on documents (M)
