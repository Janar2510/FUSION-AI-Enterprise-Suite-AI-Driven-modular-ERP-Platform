# Sign — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/productivity/sign.html
**FusionAI status:** Partial
**Effort to complete:** M
**Business priority:** P2

---
## Odoo 17 Feature Checklist

### Core Features

#### Document Management
- [ ] PDF upload for signing — ❌ Missing (document_url is hardcoded string; no actual file upload endpoint)
- [ ] PDF template creation — ❌ Missing (SignatureTemplate type defined but no UI)
- [ ] One-time signature requests — ✅ Done (request created, sent to signers)
- [ ] Template-based recurring requests — ❌ Missing (template types defined in types/index.ts but no UI or backend)
- [ ] Document workspace assignment — ❌ Missing
- [ ] Signed document organization / tagging — ❌ Missing (field_tags in Odoo; not implemented)
- [ ] Document download after signing — ❌ Missing (export type defined but no backend)
- [ ] Visual security frame / hash overlay — ❌ Missing

#### Signature Fields
- [ ] Signature field (draw / type / upload) — 🟡 Partial (draw + type supported in SignatureCanvas; upload not implemented despite type definition)
- [ ] Initial field — ❌ Missing (type defined, no UI)
- [ ] Text field — ❌ Missing
- [ ] Multiline text field — ❌ Missing
- [ ] Checkbox field — ❌ Missing
- [ ] Selection / dropdown field — ❌ Missing
- [ ] Date field — ❌ Missing
- [ ] Drag-and-drop field placement on PDF — ❌ Missing (SignaturePage / SignatureField position types defined but not rendered on actual document)
- [ ] Auto-fill from partner contact data — ❌ Missing
- [ ] Adjustable field dimensions — ❌ Missing

#### Multi-party Signing Workflow
- [ ] Multiple signers per request — ✅ Done (signers array with roles, status tracking)
- [ ] Sequential signing order — ❌ Missing (Odoo numbers recipients; FusionAI shows all signers simultaneously)
- [ ] Role-based field assignment — 🟡 Partial (SignerRole enum defined: client, service_provider, employee, hr_manager, witness, other; role shown in UI)
- [ ] Role reassignment — ❌ Missing
- [ ] Witness support — 🟡 Partial (requires_witness field + witness data in type; UI shows "requires witness" but no dedicated witness signing flow)
- [ ] Validity / expiration dates — ✅ Done (due_date field tracked, "expired" status exists)
- [ ] Urgency flag — ✅ Done (is_urgent field)

#### Signing UX
- [ ] Draw signature on canvas — ✅ Done (SignatureCanvas with mouse drawing)
- [ ] Type signature (rendered as text) — ✅ Done (type tab in SignatureCanvas)
- [ ] Upload signature image — ❌ Missing (type defined, not implemented)
- [ ] Signature preview before confirm — ❌ Missing
- [ ] Signing link sent by email — ❌ Missing (no email dispatch)
- [ ] Public signing page (no login required) — ❌ Missing

#### Authentication & Security
- [ ] IP address tracking — 🟡 Partial (ip_address stored in type/store; hardcoded "192.168.1.100" in addSignature action — not real)
- [ ] Geolocation tracking — ❌ Missing
- [ ] Timestamped access log — ❌ Missing (SignatureAuditLog type defined but not persisted)
- [ ] Hash generation / inalterability proof — ❌ Missing
- [ ] SMS verification — ❌ Missing
- [ ] Itsme® identity verification — ❌ Missing (out of scope for MVP)
- [ ] eIDAS / ESIGN compliance proof package — ❌ Missing

#### Notifications & Reminders
- [ ] Auto-reminder emails to pending signers — ❌ Missing (SignatureReminder type defined; no actual dispatch)
- [ ] Deadline reminder — ❌ Missing
- [ ] Signature completion notification — ❌ Missing
- [ ] In-app notification — ❌ Missing (SignatureWebSocketMessage type defined but no WS layer)

### Views / UI
- [ ] List view — ✅ Done (requests grouped by Pending / In Progress / Completed in left panel)
- [ ] Kanban view — ❌ Missing
- [ ] Form / detail view — ✅ Done (right panel: status counters, signer list, sign/reject actions, progress bar)
- [ ] Document viewer (PDF render) — 🟡 Partial (DocumentViewer component exists; shows placeholder "coming soon" in Documents tab)
- [ ] Signature canvas modal — ✅ Done (draw + type)
- [ ] Template builder UI — ❌ Missing
- [ ] Audit trail / history tab — ❌ Missing
- [ ] Analytics dashboard (completion rate, avg time) — ❌ Missing (SignatureAnalytics type defined, not rendered)
- [ ] Share button — 🟡 Partial (button exists, no action wired)

### Role & Permission Settings
- [ ] Sign Requester (create requests) — ❌ Missing (all actions available to all users)
- [ ] Signer (external, email link only) — ❌ Missing
- [ ] Administrator (manage templates, roles) — ❌ Missing
- [ ] Read-only viewer — ❌ Missing

### Module Configuration
- [ ] Default due days — ❌ Missing (SignatureSettings type defined, no UI)
- [ ] Auto-reminder days configuration — ❌ Missing
- [ ] Allowed signature methods toggle — ❌ Missing
- [ ] IP tracking toggle — ❌ Missing
- [ ] Audit logging toggle — ❌ Missing
- [ ] Document retention policy — ❌ Missing
- [ ] Tag management — ❌ Missing

### Integrations
- [ ] Calendar (due date sync) — ❌ Missing
- [ ] Mail (signing invites, reminders) — ❌ Missing
- [ ] Automation (trigger on signature complete) — ❌ Missing
- [ ] Claude AI (3 actions: summarize contract, detect risky clauses, suggest field placement) — ❌ Missing
- [ ] Documents module (workspace storage) — ❌ Missing
- [ ] Contacts / Partners (auto-fill signer info) — ❌ Missing
- [ ] Webhooks (outbound events on sign/reject) — ❌ Missing (SignatureWebhook type defined)

### API Endpoints
- [ ] `GET /api/sign/requests` — ❌ Missing (all data is local Zustand state; no backend persistence)
- [ ] `POST /api/sign/requests` — ❌ Missing
- [ ] `PUT /api/sign/requests/:id` — ❌ Missing
- [ ] `DELETE /api/sign/requests/:id` — ❌ Missing
- [ ] `POST /api/sign/requests/:id/sign` — ❌ Missing
- [ ] `POST /api/sign/requests/:id/reject` — ❌ Missing
- [ ] `POST /api/sign/requests/:id/remind` — ❌ Missing
- [ ] `GET /api/sign/templates` — ❌ Missing
- [ ] `POST /api/sign/documents/upload` — ❌ Missing
- [ ] `GET /api/sign/documents/:id/download` — ❌ Missing

---
## Missing Features Summary

| Category | Missing |
|---|---|
| Backend | Zero API endpoints — all state is client-side Zustand mock data |
| Document Handling | PDF upload, real PDF viewer with field overlay, download signed doc |
| Signing Flow | Upload signature method, sequential order, public signing page, email invites |
| Security | Real IP capture, hash/audit trail, SMS verification |
| Notifications | All reminder and completion emails |
| Templates | Template builder UI and backend |
| Config | All settings (reminder days, retention, allowed methods) |
| RBAC | All roles missing |
| AI | Contract summarization, risk clause detection |

**Current state:** A well-typed frontend mock. The UI is solid (draw/type canvas, request list with status grouping, progress bar, signer management), but there is no backend — all data lives in Zustand with hardcoded sample records. Real IP, hashes, emails, file upload, and PDF field placement are all absent.

---
## Recommended Build Order

1. **Backend persistence** — create Prisma models (`SignRequest`, `Signer`, `SignatureLog`); wire all CRUD endpoints
2. **PDF upload** — `POST /api/sign/documents/upload`; store in object storage (S3/MinIO)
3. **Real signing flow** — persist canvas data to DB; capture real IP; generate timestamp hash
4. **Email invites & reminders** — outbox relay: send signing link on request creation, reminder on due date
5. **Public signing page** — token-based URL so signers can sign without login
6. **PDF field overlay** — render field positions on actual PDF pages (using pdf.js or similar)
7. **Sequential signing order** — enforce numbered signer sequence; notify next signer on previous completion
8. **Audit trail** — persist `SignatureAuditLog` per action; display in History tab
9. **Claude AI** — contract summary, risk clause highlighting
10. **Template builder** — drag-and-drop fields onto PDF template; save for reuse
