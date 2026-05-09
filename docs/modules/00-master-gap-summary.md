# FusionAI — Master Module Gap Summary
**Generated:** 2026-05-09
**Modules analysed:** 41
**Source:** Odoo 17 feature parity research

---

## Overview

| Metric | Count |
|---|---|
| Complete | 0 |
| Functional (Partial with working core flows) | 18 |
| Partial (stub UI, some backend) | 16 |
| Stub (UI mock only, no real backend) | 7 |
| P1 Revenue-critical | 13 |
| P2 Operational | 19 |
| P3 Nice-to-have | 9 |
| Total S effort | 3 |
| Total M effort | 14 |
| Total L effort | 17 |
| Total XL effort | 7 |

**Status definitions used in specs:**
- **Partial** — core data model and API exist, significant features missing
- **Stub** — UI renders mock/hardcoded data, little or no backend

---

## Shared Infrastructure Gaps
*Cross-cutting features missing from most or all modules — build these FIRST before rebuilding individual modules*

- **Module Settings page** — every module needs a `/settings` sub-nav page with configurable options; fewer than 5 modules have any settings UI, and those that do have non-functional toggles (CRM, Purchases, Inventory)
- **Role-per-module RBAC** — zero modules enforce server-side role checks. Every route is protected only by `requireAuth` (authenticated = full access). Need role definitions with read/write/delete/admin controls per module and per record scope
- **Calendar integration layer** — CRM, HR, Leaves, Maintenance, Fleet, Planning, Recruitment, Events, and Field Service all need calendar events wired; a shared `POST /calendar/events` adapter is required instead of each module reimplementing
- **Mail/Discuss chatter** — ChatterPanel component exists and works in Accounting, Manufacturing, Project, Helpdesk, Timesheets, HR, and Sales; missing from Appraisals, Attendance, Fleet, Leaves, Maintenance, Payroll, PLM, Purchases, Rental, and Sign
- **Automation rules engine** — no module has a working automation trigger system; all spec "Automation" rows are `❌ Missing`. Needed by at least 30 modules for stage-change emails, escalation, recurring creation
- **Claude AI action dispatcher** — AIPanel/AiActionsPanel component exists but is wired with hardcoded `agentKey` strings and mock responses in most modules; only Manufacturing, Helpdesk, Timesheets, and Project make real AI calls. Need a shared dispatcher that routes `agentKey` to real Claude API calls
- **Email outbox relay** — `api/src/core` has an outbox relay module but it is not wired to any module-level email send action (invoices, notifications, chatter, sign requests, recruitment stage emails, event confirmations)
- **PDF generation service** — Accounting has a working `/moves/:id/pdf` endpoint; Sales has a basic PDF; every other module needing printable documents (Invoicing, Rental, Sign, Expenses, Payroll) has no PDF endpoint
- **File / attachment upload** — Documents module has upload working; all other modules (Sign, Recruitment, Expenses, Discuss, Attendance) need file upload but must implement it independently without a shared service
- **Public / portal access layer** — no module exposes an unauthenticated or customer-facing portal route; required by Invoicing (customer portal), Sign (public signing page), eCommerce (account pages), Helpdesk (ticket submission), and Surveys (public survey-taking)

---

## P1 — Revenue Critical (build first)
*Modules that directly generate or track revenue — blockers for production use*

| Module | Status | Effort | Top 3 missing features |
|---|---|---|---|
| Sales | Partial | L | Kanban + analytics dashboard, pricelist/multi-currency, email quotation with portal link + online signature |
| Accounting | Partial | L | Financial reports (balance sheet / P&L / trial balance), real multi-rate tax engine wired to UI, bank reconciliation |
| Invoicing | Partial | L | All backend API routes (zero server-side implementation), invoice form UI, merge-vs-standalone architecture decision |
| CRM | Partial | L | Activities model (call/email/meeting scheduling), graph/forecast view, real Chatter persistence + Mark Lost with reason |
| Inventory | Partial | XL | Backorder creation + return pickings, inventory adjustments screen, inventory valuation journal entries (COGS) |
| Purchases | Partial | M | ChatterPanel on PO forms, purchase approval threshold workflow, blanket orders + call-for-tenders |
| Manufacturing | Partial | L | Manufacturing backorders + scrap handling, Kanban/Gantt scheduling views, MPS dashboard |
| Payroll | Stub | XL | HrContract model (prerequisite), salary rules engine, work entries feed from attendance + leaves |
| HR (Employees) | Partial | M | Private info tab (emergency contact, bank account for payroll), contract model, RBAC middleware |
| Leaves (Time Off) | Partial | L | HrLeaveType configurable model, leave allocation + balance tracking, team calendar overview |
| Quality | Partial | M | Quality Alerts module, Quality Points management UI, tolerance bounds + auto-trigger at stock pickings |
| Timesheets | Partial | M | User-scoping filter (privacy bug), weekly grid view, approval workflow |
| Supply Chain | Partial | XL | Replenishment suggestion report + confirm flow, auto-create RFQs/MOs on replenishment, lead time configuration |

---

## P2 — Operational (build second)
*Modules needed for full ERP operations but not directly revenue-blocking*

| Module | Status | Effort | Top 3 missing features |
|---|---|---|---|
| Project | Partial | M | Task edit is broken (no-op in store), task assignees, DELETE endpoints for projects and tasks |
| Discuss | Partial | L | WebSocket inbound messages not injected into store (real-time broken), reactions not persisted, @mentions + notifications |
| Helpdesk | Partial | M | Multi-team model + team-scoped stages, SLA tracking engine, email-to-ticket inbound gateway |
| Attendance | Partial | L | One-click check-in/out endpoint + button, overtime calculation engine, Gantt view |
| Appraisals | Partial | L | Configurable feedback templates, goal-setting module, 360-degree feedback + survey integration |
| Fleet | Partial | M | Contract model + expiry alerts, cost rollup analytics + graph view, accident log type |
| Expenses | Partial | M | Expense report model (hr.expense.sheet), accounting GL posting on approval, expense categories with GL account |
| Calendar | Partial | M | Real calendar grid (month/week/day views — currently a stub), event recurrence rules, Google/Outlook sync |
| Maintenance | Partial | M | Equipment CRUD UI, preventive recurrence + scheduling, MTBF/MTTR reporting |
| Documents | Partial | L | Workspace sidebar UI, soft delete/trash, PDF split/merge |
| Knowledge | Partial | M | WYSIWYG editor (textarea only), article hierarchy/nesting, real Claude AI content generation (setTimeout mock) |
| Planning | Partial | M | Email notifications on shift publish, recurring shifts, auto-plan engine |
| PLM | Partial | M | Apply ECO → actually mutate BoM lines (deferred in code), BoM version archive, ChatterPanel + AiActionsPanel |
| Recruitment | Partial | M | Email template automation on stage change, résumé file upload, chatter on applicant form |
| Subscriptions | Partial | L | Subscription line items + products, recurring plan model (replaces hardcoded strings), automated renewal billing |
| Surveys | Partial | L | In-app question builder UI, public survey-taking form, results/analytics view |
| Events | Partial | L | Event stage pipeline (replace active boolean), ticket tiers + pricing, registration management UI |
| Rental | Partial | L | Duration-based pricing tiers, stock/inventory integration, invoicing from rental order |
| Website | Partial | L | Page content storage + block-based editor (button is stub), navigation menu management, SEO tooling (sitemap, robots.txt) |

---

## P3 — Nice to Have (build last)
*Modules that extend the platform but are not critical for early customers*

| Module | Status | Effort | Top 3 missing features |
|---|---|---|---|
| eCommerce | Partial | L | Real payment gateway (Stripe), product detail page, customer accounts + order history |
| Email Marketing | Partial | XL | Actual SMTP dispatch (currently state-only), mailing lists + contact segmentation, unsubscribe/blacklist (legal requirement) |
| Marketing Automation | Stub | XL | Workflow execution engine (activity chain, triggers, timing), audience targeting/domain filter, email composition + dispatch |
| Social Marketing | Stub | XL | Real platform OAuth + API integration (posts never sent), social account management, image/media upload |
| Sign | Partial | M | Backend persistence (all data is Zustand mock), PDF upload + field overlay on real PDF, email invites + public signing page |
| Notes | Partial | S | User scoping (all users see all notes — privacy bug), rich text editor, tags + assignees |
| Field Service | Stub | L | Authentication guard on routes (security bug — no requireAuth), worksheets engine, timesheet logging + invoicing flow |
| Spreadsheet | Partial | XL | Odoo data pivot integration (core differentiator, entirely missing), multi-sheet tabs, XLSX import/export |
| Studio | Stub | XL | Everything — pure UI mock with hardcoded data, no backend, no field editor, no view editor, no automation builder |

---

## Recommended Sprint Order

### Sprint 1 — Shared Infrastructure (2 weeks)
Build the cross-cutting pieces that all modules depend on. Without these, each module fix creates duplicated patterns.

- **Email outbox relay wired** — wire existing `api/src/core` relay to all module send actions (ChatterPanel, invoice send, sign invites, recruitment stage emails)
- **Module settings system** — settings page template + API pattern that all modules can adopt; start with Accounting, CRM, Purchases, Inventory
- **Role-per-module RBAC** — role definition middleware (HR User / Officer / Manager, Sales User / Manager, Accounting / Billing, etc.) that can be applied to any route with a single decorator
- **Calendar integration adapter** — shared `POST /api/calendar/events` helper that modules call instead of each implementing calendar sync independently
- **Automation rules engine (basic)** — trigger/action model with at least: stage-change, record-create, record-update triggers; email-send and webhook-call actions
- **Claude AI action dispatcher** — replace all hardcoded `agentKey` stubs with a real dispatcher that routes to Claude API; ensures all modules benefit immediately

### Sprint 2 — P1 Quick Wins (1 week)
P1 modules with S or M effort — fastest ROI relative to engineering time.

- **Purchases** (M) — ChatterPanel on PO form, purchase approval workflow endpoint
- **HR / Employees** (M) — private info tab, archive/unarchive toggle, department PUT endpoint, fix AI agent key
- **Quality** (M) — Quality Alerts CRUD, Quality Points management UI, tolerance bounds for Measure type
- **Timesheets** (M) — user-scoping fix (privacy bug), isBillable field, weekly grid view
- **Notes** (S) — user scoping fix (privacy bug), color band on cards, tags

### Sprint 3 — P1 Core (2–3 weeks)
Remaining P1 modules with L or XL effort. These are the revenue engine.

- **Sales** (L) — Kanban + dashboard, pricelist engine, email quotation with portal link
- **Accounting** (L) — financial reports API (balance sheet / P&L / trial balance / aged AR/AP), real tax engine wired to invoice UI, move cancel/reset endpoint
- **CRM** (L) — activities model, Mark Lost with reason, real Chatter message persistence, graph/forecast view
- **Invoicing** (L) — architecture decision (merge into Accounting or build standalone), then backend routes, invoice form UI
- **Leaves (Time Off)** (L) — HrLeaveType model, allocation + balance tracking, team calendar overview
- **Manufacturing** (L) — backorders + scrap handling, Kanban/Gantt views
- **Inventory** (XL, phase 1) — backorder creation, return pickings, inventory adjustments, ChatterPanel on transfers
- **Supply Chain** (XL, phase 1) — replenishment suggestion report, auto-create RFQs on replenishment
- **Payroll** (XL, phase 1) — HrContract model, salary structure types, work entries feed

### Sprint 4 — P2 Modules (3–4 weeks)
Group by effort for sprint sizing.

**M-effort P2 (1 sprint):**
- Project — fix task edit no-op, DELETE endpoints, task assignees, sub-task UI
- Fleet — contract model + expiry alerts, cost rollup graph
- Expenses — expense report model, GL posting, categories with GL account
- Calendar — real calendar grid (month/week/day), recurrence rules
- Maintenance — equipment CRUD UI, preventive recurrence, MTBF/MTTR graph
- Knowledge — WYSIWYG editor swap (TipTap/Quill), article nesting, real Claude AI call
- Planning — email notifications on publish, recurring shifts
- PLM — apply ECO → mutate BoM lines, BoM version archive, ChatterPanel

**L-effort P2 (1–2 sprints):**
- Discuss — WS inbound fix, persist reactions, @mentions
- Helpdesk — multi-team model, SLA engine
- Attendance — one-click check-in/out, overtime engine, Gantt view
- Appraisals — feedback templates, goal-setting model, 360-degree feedback
- Documents — workspace UI, soft delete, document viewer
- Recruitment — email stage templates, résumé upload, chatter, calendar view
- Subscriptions — line items, recurring plan model, renewal billing
- Surveys — question builder UI, public taking form, results analytics
- Events — stage pipeline, ticket tiers, registration management UI
- Rental — duration pricing, stock integration, invoicing
- Website — content storage, block editor, navigation menus

### Sprint 5 — P3 Modules (ongoing)
Build in parallel with P2 or as dedicated workstreams.

- **eCommerce** — Stripe payment gateway, PDP, customer accounts
- **Email Marketing** — SMTP dispatch, mailing lists, unsubscribe/blacklist
- **Sign** — backend persistence, PDF upload + field overlay, email invites
- **Field Service** — security fix (requireAuth), worksheets, timesheet integration
- **Marketing Automation** — workflow engine, audience targeting, email dispatch
- **Social Marketing** — social account OAuth, platform API integrations (Facebook, LinkedIn, Twitter)
- **Spreadsheet** — multi-sheet tabs, XLSX import/export, Odoo data pivots
- **Studio** — phased: backend models, field editor, view editor, automation builder
- **Notes** — rich text editor, tags, assignees (mostly complete after Sprint 2)

---

## Critical Bugs Found
*Security issues, broken flows, or data integrity problems found during research*

| Module | Bug | Severity |
|---|---|---|
| Field Service | All `fs_rental` routes have no `requireAuth` middleware — endpoints are publicly accessible without authentication | High |
| Notes | All notes are globally visible to all authenticated users — no user scoping; `GET /notes` returns every user's notes | High |
| Timesheets | `GET /api/hr/timesheets` returns all employees' timesheets to any authenticated user — no record-level scoping | High |
| Sign | IP address is hardcoded `"192.168.1.100"` in `addSignature` store action — no real IP capture | High |
| Sign | All sign request data lives in Zustand client state only — no backend persistence; refreshing the page loses all requests | High |
| Project | `updateTask` in `projectStore.ts` is explicitly a no-op (`// Edit task logic not fully implemented in store yet`) — task editing is silently broken | High |
| Invoicing | All `/api/v1/invoicing/*` routes referenced in the store do not exist in the API — module is completely non-functional | High |
| Events | `DELETE /api/events/:id` route is registered in the store but not on the Express router — delete silently fails | Medium |
| Discuss | WebSocket inbound messages are connected but not injected into the message store — real-time messaging is broken | Medium |
| Manufacturing | AI schedule optimization uses `simulated` responses — not calling real Claude API despite `agentKey` being set | Medium |
| Rental | `GET /api/fs-rental/rentals/:id` (single record) is missing — cannot fetch a specific rental order | Medium |
| eCommerce | Tax is hardcoded at `10%` flat; no integration with the tax engine in `api/src/core/tax/` | Medium |
| Accounting | Invoice UI applies a hardcoded `15%` flat tax instead of reading from the real tax engine records | Medium |
| Supply Chain | `avgLeadTime` displayed on dashboard is a hardcoded mock value (`12 days`) — not computed from real data | Low |
| Studio | Studio route has no RBAC guard — any authenticated user can navigate to and interact with Studio | Low |

---

## Key Architectural Decisions Needed

1. **Invoicing vs Accounting consolidation** — The `Invoicing` module and `Accounting` module both model customer invoices with separate data stores and separate API route trees (`/api/v1/invoicing/` vs `/api/accounting/moves`). The Invoicing module has zero backend implementation. Decision needed: merge Invoicing views into Accounting (recommended — eliminates duplication) or build Invoicing as a thin read-layer over Accounting data.

2. **Field Service + Rental shared router** — Both Field Service and Rental share the `fs_rental` Express router and route prefix. This is an unusual coupling that makes RBAC and feature toggles harder. Decision: split into separate routers (`/api/field-service/` and `/api/rental/`) or keep co-located with careful namespacing.

3. **Payroll prerequisites gate** — Payroll depends on HrContract, which depends on HR/Employees, which depends on Accounting (bank accounts for reimbursement). Payroll cannot be meaningful without these. Recommend blocking Payroll sprint behind HR contract + Accounting banking completion.

4. **Studio architecture** — Studio (no-code model + view editor) is entirely a UI mock. Building it requires either: (a) a JSON-overlay approach (store customisations as JSON patches applied at render time — no Prisma migrations needed) or (b) a proper meta-model (Prisma model per custom field — requires schema generation). Decision blocks all Studio development.

5. **Public / portal access layer** — Multiple modules need unauthenticated or customer-facing routes (Sign public signing page, Surveys participant form, eCommerce customer accounts, Helpdesk portal tickets, Invoicing customer view). Currently the API enforces `requireAuth` on every route. Decision: add a separate `portal` route tree with token-based auth, or add guest/token middleware to existing routes.

6. **Email infrastructure choice** — The outbox relay in `api/src/core` is built but not wired to any module. Before Sprint 1, decide on the email provider (SendGrid / SES / SMTP relay) and configure env vars so all modules can use the same sender. This unblocks: Sign invites, Recruitment stage emails, Accounting dunning, Planning shift notifications, Event confirmations.

7. **File storage for uploads** — Multiple modules need file upload (Sign PDFs, Recruitment CVs, Documents, Expenses receipts, Attendance photos). Currently only Documents module has upload working. Decision: S3 / MinIO / local filesystem — then build a shared upload service all modules call. Blocks Sign, Recruitment, Expenses receipt upload.

8. **WebSocket authentication** — The WS server exists but inbound messages are not injected into the client store (Discuss real-time is broken). Before fixing Discuss, decide on WS auth strategy (JWT in initial handshake vs per-message token) to ensure the fix is secure and reusable across modules that will need real-time (Discuss, Planning, Sign status updates).
