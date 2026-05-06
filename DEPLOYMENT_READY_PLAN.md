# FusionAI Enterprise Suite — Full Application Analysis and Deployment-Ready Plan

**Analysis date:** 2026-05-06  
**Repository:** `FUSION-AI-Enterprise-Suite-AI-Driven-modular-ERP-Platform`  
**Goal:** turn the current Odoo-inspired modular ERP prototype into a working, secure, maintainable, deployment-ready platform where every standalone module shares a common backend data spine for contacts, companies, products, quotes, invoices, documents, activities, and audit history.

---

## 1. Executive Summary

FusionAI already has a large amount of scaffolding: a React/Vite frontend, a Node/Express/Prisma API, a separate FastAPI backend, many module folders, Prisma models, migrations, Dockerfiles, and several planning documents. The app is **not deployment ready yet** because it currently behaves more like several partially overlapping prototypes than one coherent production system.

The most important strategic decision is to **standardize on one primary runtime API and one canonical data model**. The strongest path is:

1. Use the **Node/Express/Prisma API** as the primary production backend because it already has broad route coverage and a large Prisma schema.
2. Keep the **FastAPI backend** only for AI workers, specialized Python services, and optional ML/OCR/document-processing jobs until it is either integrated behind the Node API or retired.
3. Make `Partner` the Odoo-style canonical party record for contacts, companies, customers, vendors, employees, signers, subscribers, and portal users.
4. Make `Product`, `SaleOrder`, `PurchaseOrder`, `AccountMove`, `Document`, `Project`, `Ticket`, `Subscription`, `StockPicking`, and `Activity` first-class shared entities that modules reference rather than duplicating customer/product/document fields.
5. Build each module as a standalone bounded context in the UI and service layer, but connect all modules through the shared backend data spine, cross-module events, documents, and audit timeline.

Current blockers found during analysis:

- Frontend production build fails with many TypeScript errors.
- Node API production build fails with a TypeScript handler return-type error.
- Backend Python tests cannot run because Python dependencies are not installed in the environment.
- Docker Compose config uses PostgreSQL, but Prisma schema is configured as SQLite.
- There are two backend stacks (`api/` Node and `backend/` FastAPI) with overlapping responsibilities.
- Security defaults are not production-safe (`SESSION_SECRET` fallback, broad mock auth in Python backend, limited auth/tenant enforcement).
- Frontend has many module components, but module data contracts are not consistently wired to backend endpoints.
- Testing, migrations, observability, release automation, backups, and deployment hardening are incomplete.

---

## 2. What Exists Today

### 2.1 Frontend

- React 18 + TypeScript + Vite application in `frontend/`.
- Main app routing is centralized in `frontend/src/App.tsx` and module rendering in `frontend/src/pages/ModulePage.tsx`.
- Approximately 45 frontend module directories exist, including CRM, sales, inventory, invoicing, accounting, documents, helpdesk, HR, manufacturing, purchase, POS, subscriptions, project, events, notes, knowledge, spreadsheet, automation, and supply chain.
- State management is mixed across global stores and module-specific Zustand stores.

### 2.2 Node/Express/Prisma API

- Node API lives in `api/`.
- `api/src/index.ts` wires many route modules under `/api/*`.
- Prisma schema contains a broad ERP model set with partners, CRM, sales, products, stock, accounting, purchase, manufacturing, POS, quality, PLM, web/e-commerce, spreadsheet, and more.
- The route layer appears more production-oriented than the Python backend, but it still needs type fixes, auth enforcement, validation, transactional workflows, tests, and deployment cleanup.

### 2.3 FastAPI Backend

- Python backend lives in `backend/`.
- It has module folders for CRM, contact hub, accounting, invoicing, inventory, HR, documents, project, sales, manufacturing, purchase, POS, subscriptions, e-commerce, helpdesk, dashboard, rental, and others.
- `backend/src/main.py` imports routers defensively and exposes mock/auth-like endpoints.
- This backend is useful as an AI/service-worker layer but currently overlaps with the Node API and creates deployment ambiguity.

### 2.4 Infrastructure

- Root `docker-compose.yml` defines Postgres, Node API, and frontend.
- Separate Dockerfiles exist for frontend, Node API, and Python backend.
- `config/env.example` describes environment variables for database, Redis, Qdrant, AI providers, email, storage, monitoring, and frontend URLs.
- Deployment docs exist, but the actual app does not pass production build checks yet.

---

## 3. Verification Results From This Analysis

Commands run from the repository root unless noted otherwise:

| Check | Result | Key finding |
| --- | --- | --- |
| `npm run build` in `frontend/` | Failed | TypeScript build fails with unused imports, missing `ImportMeta.env` typing, test globals included in production typecheck, incompatible component props, missing imports/types in social-marketing, lazy import default mismatch, store type issues, and more. |
| `npm run build` in `api/` | Failed | `api/src/routes/manufacturing.ts` returns an Express `Response` from an async handler typed as `Promise<void>`. |
| `python -m pytest` in `backend/` | Failed due environment | `fastapi` is not installed in this environment, so tests cannot import `fastapi.testclient`. |
| Static architecture scan | Informational | Frontend has many module directories; Node API has many routes; Prisma has a broad model set; Python backend overlaps with Node API. |

These failures mean the current application should be considered **prototype / pre-alpha**, not deployable.

---

## 4. Major Gaps, Flaws, and Risks

### 4.1 Architecture Gaps

1. **Two competing backends.**
   - Node/Express/Prisma and FastAPI both expose ERP module concepts.
   - This causes confusion about source of truth, duplicated logic, duplicated models, conflicting API paths, and harder deployment.

2. **No explicit canonical domain spine.**
   - Odoo-like systems work because contacts, companies, products, journals, documents, activities, users, permissions, and chatter are shared foundations.
   - The repo has pieces of this, especially `Partner`, but no enforced platform-level contract for how every module must attach to a customer/company/product/document/timeline.

3. **Module boundaries are unclear.**
   - Many modules are present as folders, but not all have complete backend routes, frontend wiring, validation, tests, or business workflows.
   - Some frontend-only modules appear to be demos rather than production modules.

4. **Cross-module workflow orchestration is incomplete.**
   - Required flows like Lead → Quote → Sales Order → Delivery → Invoice → Payment → Accounting are not fully enforced end-to-end.
   - The app needs event-driven state transitions and audit trails.

5. **No stable API contract layer.**
   - Frontend stores/components should consume typed API clients generated from OpenAPI or shared TypeScript contracts.
   - Current route usage appears ad hoc.

### 4.2 Data and Database Gaps

1. **Prisma database provider conflicts with Docker.**
   - Docker Compose supplies a PostgreSQL `DATABASE_URL`.
   - Prisma schema is configured with `provider = "sqlite"`.
   - This will fail or behave incorrectly in production.

2. **Migration strategy is split.**
   - `api/prisma/migrations` exists, while `backend/migrations` and `backend/scripts/migrations` also exist.
   - There is no single production migration authority.

3. **Missing multi-company / multi-tenant design.**
   - A production ERP must support company boundaries, record rules, accounting periods, fiscal localization, and user permissions.
   - Current schema needs explicit organization/company scoping on all business records.

4. **Insufficient auditability.**
   - ERP records need immutable audit logs for creates, updates, deletes, posting/unposting, payments, document changes, approvals, and AI actions.
   - Add `AuditLog`, `Activity`, `Message/Chatter`, `Attachment`, and `EntityLink` tables as platform primitives.

5. **Documents need a universal attachment model.**
   - Every business object should support attachments and generated documents, including quotes, invoices, purchase orders, HR docs, tickets, projects, and products.

6. **Customer timeline is not universal enough.**
   - A contact/company profile should show CRM notes, emails, quotations, invoices, subscriptions, tickets, projects, documents, calls, meetings, orders, deliveries, payments, and AI summaries.

### 4.3 Frontend Gaps

1. **Build is broken.**
   - TypeScript errors prevent production bundling.

2. **Tests are included in production type checking.**
   - Jest-style tests appear under `src/**/__tests__` while the app uses Vitest, causing type errors.

3. **Inconsistent module naming.**
   - Some route keys use underscores (`field_service`), some hyphens (`email-marketing` in folders), and some plural names (`purchases`). Standardize slugs and route paths.

4. **Mock/demo data likely remains.**
   - Production app must remove hardcoded demo data from module components and route through stores/services.

5. **No consistent loading/error/empty state standard.**
   - Every module needs the same table/list/detail/form behaviors, validation, optimistic updates, error handling, and permission-aware UI.

6. **Accessibility and responsiveness are not verified.**
   - ERP is data-heavy; keyboard navigation, focus handling, mobile/tablet layouts, and screen-reader labels need audit.

### 4.4 API and Backend Gaps

1. **Node API build is broken.**
   - TypeScript error in manufacturing route blocks production build.

2. **Auth and authorization are not production-grade.**
   - Session secret fallback is unsafe.
   - Every route needs authentication, company scoping, permission checks, and audit logging.

3. **Validation is missing or inconsistent.**
   - Route handlers often pass `req.body` directly to Prisma.
   - Add Zod schemas or equivalent validation for every create/update action.

4. **Business transactions need atomicity.**
   - Confirming a quotation, reserving inventory, creating invoices, posting accounting moves, and recording payments must run in database transactions.

5. **No idempotency strategy.**
   - Posting invoices/payments, webhook processing, and AI automations need idempotency keys.

6. **Error responses are not standardized.**
   - Define a consistent API error format with request IDs, codes, messages, field errors, and retry hints.

7. **Background jobs are not integrated.**
   - AI processing, OCR, email sending, stock replenishment, invoice reminders, and imports need queues/workers.

### 4.5 AI Gaps

1. **Agents exist as scaffolding, not reliable product features.**
   - AI should not directly mutate financial or legal records without approval workflows.

2. **No AI governance.**
   - Need prompt/version registry, tool permissions, audit logs, confidence scoring, human approvals, PII redaction, and rollback.

3. **No RAG/data permission model.**
   - Vector search must honor user/company permissions and data retention rules.

4. **No evaluation suite.**
   - Add automated tests for AI outputs on representative ERP workflows.

### 4.6 Security Gaps

1. **Secrets management is not production ready.**
   - No placeholder secret should be accepted at startup in production.

2. **RBAC/ABAC missing across routes.**
   - ERP requires role and record-level access controls.

3. **No tenant isolation guarantee.**
   - If multi-tenant SaaS is intended, every query must be scoped by organization/company.

4. **No rate limiting or abuse controls.**
   - Add rate limiting, upload limits, API quotas, brute-force protection, and bot controls.

5. **File upload security incomplete.**
   - Add content-type validation, antivirus scanning, object storage policies, signed URLs, malware quarantine, and retention rules.

6. **Compliance gaps.**
   - Need privacy policy support, data export/delete workflows, consent tracking, data retention, auditability, and regional accounting/tax considerations.

### 4.7 DevOps and Deployment Gaps

1. **No passing production build.**
   - Cannot deploy until `frontend` and `api` builds pass.

2. **No CI/CD pipeline documented as executable config.**
   - Need GitHub Actions or equivalent for lint, tests, builds, migrations, image scanning, and deployment gates.

3. **No production compose/Kubernetes manifests with secrets and health checks.**
   - Current compose is development-level.

4. **No observability stack.**
   - Add structured logs, metrics, traces, dashboards, alerting, uptime checks, and error tracking.

5. **No backup/restore proof.**
   - Production readiness requires tested database backups and restore drills.

6. **No release/versioning policy.**
   - Need semantic versioning, changelog discipline, migration compatibility, and rollback plans.

---

## 5. Recommended Target Architecture

### 5.1 Platform Shape

```text
React/Vite Frontend
  ├─ Standalone module UIs
  ├─ Shared shell: auth, navigation, notifications, global search
  ├─ Shared components: list, kanban, form, chatter, attachments, timeline
  └─ Typed API client generated from OpenAPI/contract

Node/Express/Prisma API (primary ERP API)
  ├─ Auth/session/JWT/passkeys
  ├─ RBAC + record rules + company scoping
  ├─ Core platform services
  │   ├─ Partner/contact service
  │   ├─ Product/catalog service
  │   ├─ Document/attachment service
  │   ├─ Activity/chatter/timeline service
  │   ├─ Audit log service
  │   └─ Workflow/event service
  ├─ Module services
  │   ├─ CRM, Sales, Inventory, Accounting, Invoicing, Purchase, etc.
  │   └─ Each module owns its routes but references shared core IDs
  └─ Queue publishers for async work

Python/FastAPI AI Worker Layer (optional but recommended)
  ├─ AI agents and orchestration
  ├─ OCR/document parsing
  ├─ Embeddings/vector search
  ├─ Forecasting/recommendations
  └─ No direct final-write access to financial records without approval

Infrastructure
  ├─ PostgreSQL primary database
  ├─ Redis cache/queue/session support
  ├─ Object storage for documents
  ├─ Qdrant or pgvector for embeddings
  ├─ Background workers
  └─ Observability/security stack
```

### 5.2 Modular App Principle

The user idea is correct: **build each module as a standalone application experience**, but connect them with shared backend primitives.

Each module should have:

- Its own UI route, navigation, dashboard, list, kanban, forms, detail pages, settings, and tests.
- Its own service methods and API routes.
- Its own domain rules.
- No duplicated contact/company/product/document data.
- Required links to shared entities:
  - `partnerId` for contact/company/customer/vendor/person.
  - `productId` for products/services/assets.
  - `documentId`/`attachmentId` for files.
  - `activityId`/`messageId` for timeline/chatter.
  - `companyId`/`organizationId` for tenant/company scoping.
  - `createdBy`, `updatedBy`, `assignedTo`, and audit fields.

### 5.3 Canonical Customer Profile Flow

A customer/company record should be the central source of truth. The profile should show all module activity:

```text
Partner / Company Profile
  ├─ Identity: company, contacts, addresses, tax IDs, language, tags
  ├─ CRM: leads, opportunities, activities, calls, meetings
  ├─ Sales: quotations, orders, pricelists, subscriptions
  ├─ Inventory: deliveries, returns, serial/lot movements
  ├─ Accounting: invoices, credit notes, payments, statement, aging
  ├─ Documents: contracts, signed PDFs, purchase orders, files
  ├─ Helpdesk: tickets, SLA, satisfaction, history
  ├─ Projects: tasks, milestones, timesheets
  ├─ E-commerce/POS: carts, web orders, retail orders, loyalty
  ├─ Marketing: email campaigns, consent, segments, engagement
  ├─ Notes/chatter: all comments, mentions, notifications
  └─ AI: summary, risk, next best action, duplicate detection
```

Required implementation detail: every module event should write to a shared `TimelineEvent` or `Activity` model so the partner profile becomes the single user-facing history.

---

## 6. Deployment-Ready Roadmap

### Phase 0 — Freeze Scope and Pick the Production Backend (2–3 days)

**Outcome:** one clear backend strategy and a buildable baseline.

Tasks:

- Decide that `api/` is the production ERP API, unless there is a strong reason to choose FastAPI instead.
- Document FastAPI as AI/worker-only for now.
- Create an architecture decision record: `docs/adr/0001-primary-backend.md`.
- Remove or quarantine duplicate mock endpoints from production routing.
- Fix Node API build error.
- Fix frontend TypeScript build errors enough to produce a production bundle.
- Split frontend `tsconfig` into app and test configs.
- Add `npm run typecheck`, `npm run test`, and `npm run build` to CI.

Exit criteria:

- `cd api && npm run build` passes.
- `cd frontend && npm run build` passes.
- A single API base URL is configured for frontend production.
- Docker image builds succeed locally.

### Phase 1 — Database and Canonical Domain Spine (1–2 weeks)

**Outcome:** all modules share the same core entities.

Tasks:

- Change Prisma datasource to PostgreSQL or change Docker/database strategy to SQLite for local only. Recommended: PostgreSQL.
- Normalize migrations under Prisma as production source of truth.
- Add or verify core shared models:
  - `Organization` / `Company`
  - `User`
  - `Role`, `Permission`, `UserRole`
  - `Partner`
  - `PartnerAddress`
  - `PartnerContactMethod`
  - `Product`, `ProductCategory`, `Uom`, `Tax`
  - `Attachment`, `Document`, `DocumentVersion`
  - `Activity`, `Message`, `TimelineEvent`
  - `AuditLog`
  - `WorkflowEvent` / `OutboxEvent`
- Add `companyId`/`organizationId` to all business records.
- Add indexes for all foreign keys and common searches.
- Add soft-delete/archival strategy.
- Add seed data for a realistic end-to-end demo company.

Exit criteria:

- Clean migration from empty database.
- Seed command creates demo data.
- Partner profile can query related CRM, sales, invoices, tickets, documents, projects, and activities.

### Phase 2 — Auth, Security, and Record Rules (1–2 weeks)

**Outcome:** production users can safely log in and access only allowed records.

Tasks:

- Replace default `SESSION_SECRET` fallback with required production secret validation.
- Implement authentication consistently: session or JWT, not a mix without reason.
- Add password hashing, passkeys if desired, email verification, password reset, MFA option.
- Add RBAC roles: Admin, Manager, Sales, Accountant, Inventory, HR, Support, Employee, Portal Customer.
- Add record rules and company scoping middleware.
- Add Zod validation schemas for all API inputs.
- Add rate limiting and brute-force protection.
- Add CSRF protection if cookie sessions are used.
- Add audit logs for all mutations.
- Add file upload security and signed object URLs.

Exit criteria:

- No production startup with placeholder secrets.
- Every protected route requires auth and company scope.
- Mutation audit log exists.
- Security smoke tests pass.

### Phase 3 — Core Odoo-Like Business Flows (2–4 weeks)

**Outcome:** platform behaves as a connected ERP rather than isolated screens.

Implement these workflows first:

#### 3.1 CRM to Sales

```text
Lead → Opportunity → Quotation → Sales Order
```

Requirements:

- Convert lead to partner/company or link to existing partner.
- Create quotation from opportunity.
- Quote lines use product catalog.
- Quote PDF is generated and attached.
- Quote state changes are audited.
- Confirmed quote becomes sales order.

#### 3.2 Sales to Inventory

```text
Sales Order → Delivery Order → Stock Reservation → Shipment/Delivery
```

Requirements:

- Confirmed sales order creates stock picking/delivery.
- Reservable products check stock availability.
- Delivery updates quantities.
- Backorders supported.
- Customer timeline shows delivery events.

#### 3.3 Sales to Invoicing and Accounting

```text
Sales Order → Invoice → Posted Accounting Move → Payment → Reconciliation
```

Requirements:

- Invoice created from delivered or ordered quantities, depending config.
- Accounting move lines generated atomically.
- Invoice PDF generated and attached.
- Payment records reconcile against invoice.
- Partner balance and aging are correct.

#### 3.4 Purchase to Inventory to Vendor Bill

```text
Purchase RFQ → Purchase Order → Receipt → Vendor Bill → Payment
```

Requirements:

- Vendor is a `Partner` with `isVendor`.
- Products have vendor pricelists.
- Receipts update inventory.
- Vendor bill creates accounting moves.

#### 3.5 Helpdesk / Project / Timesheets

```text
Ticket → Task → Timesheet → Invoiceable Service Line
```

Requirements:

- Tickets link to partner.
- Escalated ticket can create project task.
- Timesheets can become invoiceable lines.
- Customer profile shows all related service history.

Exit criteria:

- End-to-end demo can be completed from a browser without database edits.
- Every workflow has backend integration tests and frontend happy-path tests.

### Phase 4 — Module Completion Strategy (4–8 weeks)

Prioritize modules by dependency order:

1. **Platform core:** auth, partners, products, documents, activities, audit.
2. **Revenue core:** CRM, sales, invoicing/accounting, subscriptions.
3. **Operations core:** inventory, purchase, manufacturing, quality, PLM.
4. **Service core:** helpdesk, project, timesheets, field service.
5. **People core:** HR, attendance, recruitment, payroll, appraisals, leaves, expenses.
6. **Channels:** POS, e-commerce, website, email marketing, social marketing, surveys, events.
7. **Productivity:** notes, knowledge, calendar, discuss, spreadsheet, automation, studio.
8. **AI intelligence:** assistants, forecasts, anomaly detection, summaries, automations.

For each module, complete this checklist:

- [ ] Domain model finalized.
- [ ] Shared entity links added.
- [ ] API routes implemented.
- [ ] Input validation added.
- [ ] Auth and permissions added.
- [ ] Audit events added.
- [ ] Timeline events added.
- [ ] Frontend list view implemented.
- [ ] Frontend form/detail view implemented.
- [ ] Loading/error/empty states implemented.
- [ ] Unit tests added.
- [ ] Integration tests added.
- [ ] E2E happy path added.
- [ ] Documentation updated.

### Phase 5 — AI Layer With Guardrails (2–4 weeks, parallel after Phase 2)

**Outcome:** AI improves productivity without corrupting ERP data.

Tasks:

- Define agent registry by module.
- Define tool permissions per role/module.
- Add AI action audit logs.
- Add human approval workflows for high-risk actions.
- Add RAG with permission filtering.
- Add document summarization and OCR pipeline.
- Add customer summary and next-best-action panels.
- Add duplicate partner detection.
- Add invoice anomaly detection.
- Add stock reorder recommendations.
- Add opportunity scoring.
- Add AI evaluation tests.

Rules:

- AI can draft records freely.
- AI can suggest changes freely.
- AI cannot post invoices, reconcile payments, delete records, or send legal/financial documents without explicit user approval.
- All AI-generated content must be marked and traceable.

### Phase 6 — Quality, Testing, and CI/CD (2–3 weeks)

Tasks:

- Add root-level scripts or task runner for all builds/tests.
- Add CI pipeline:
  - Install dependencies.
  - Prisma generate.
  - Typecheck API.
  - Typecheck frontend.
  - Unit tests.
  - Integration tests with Postgres service.
  - Frontend build.
  - API build.
  - Docker build.
  - Dependency and container scans.
- Add Playwright E2E for the key flows.
- Add seed fixtures for test tenants.
- Add contract tests between frontend and API.
- Add coverage thresholds.

Minimum deployment gate:

- API build passes.
- Frontend build passes.
- Backend tests pass or Python worker tests pass if retained.
- Core workflow integration tests pass.
- No critical/high security scan findings.

### Phase 7 — Production Infrastructure (1–3 weeks)

Tasks:

- Create `docker-compose.prod.yml` or Kubernetes manifests.
- Use managed PostgreSQL or hardened Postgres with backups.
- Use Redis for queues/cache/session as needed.
- Use object storage for files.
- Configure TLS/HTTPS.
- Configure domain and reverse proxy.
- Configure health/readiness endpoints.
- Configure graceful shutdown.
- Configure database migrations at deploy time.
- Add rollback plan.
- Add monitoring:
  - application logs
  - error tracking
  - metrics
  - traces
  - uptime checks
  - queue depth
  - database health
- Add backup/restore procedures.

Exit criteria:

- Staging environment deploys from CI.
- Production-like smoke test passes.
- Backup restore has been tested.
- Rollback has been tested.

---

## 7. Detailed Data Spine Design

### 7.1 Required Core Tables / Concepts

| Concept | Purpose | Must be referenced by |
| --- | --- | --- |
| `Organization` | SaaS tenant boundary | Every business record |
| `Company` | Legal company/accounting entity | Accounting, sales, purchase, inventory, HR |
| `Partner` | Contact/company/customer/vendor/person | CRM, sales, invoices, helpdesk, project, subscriptions, POS, e-commerce |
| `Product` | Sellable/buyable/storable/service item | Sales, purchase, inventory, accounting, manufacturing, POS, e-commerce |
| `Attachment` | Physical file/object | Every module |
| `Document` | Managed business document | Quotes, invoices, contracts, HR docs, tickets |
| `Activity` | Scheduled action/call/email/task | CRM, partner profile, projects, helpdesk |
| `Message` / `Chatter` | Threaded record communication | Every module record |
| `TimelineEvent` | Customer/company activity stream | Partner profile and dashboards |
| `AuditLog` | Compliance trail | Every create/update/delete/post action |
| `OutboxEvent` | Reliable async event publication | Cross-module workflows |

### 7.2 Event Examples

| Event | Producer | Consumers |
| --- | --- | --- |
| `partner.created` | Contacts/CRM | Marketing, duplicate detection, audit, timeline |
| `lead.won` | CRM | Sales, partner timeline, AI summary |
| `quote.sent` | Sales | Documents, timeline, notifications |
| `sale_order.confirmed` | Sales | Inventory, invoicing, project, timeline |
| `stock_picking.done` | Inventory | Sales, accounting, timeline |
| `invoice.posted` | Accounting/Invoicing | Customer portal, payments, timeline, AI anomaly detection |
| `payment.received` | Accounting | Invoicing, partner balance, timeline |
| `ticket.created` | Helpdesk | Partner profile, notifications, AI triage |
| `document.signed` | Sign/Documents | Sales, HR, accounting, timeline |

### 7.3 Customer Profile API

Add one aggregation endpoint:

```http
GET /api/partners/:id/profile
```

Response should include:

- Partner identity and hierarchy.
- Contacts under company.
- Open opportunities.
- Quotations and orders.
- Invoices, payments, credit status.
- Deliveries and returns.
- Tickets and projects.
- Documents and signatures.
- Activities and messages.
- Timeline events.
- AI summary and recommendations.

This endpoint is the heart of the connected Odoo-like experience.

---

## 8. Module-by-Module Gap Plan

### Contacts / Partners

Current direction is good because `Partner` exists. Make it the universal entity.

Needed:

- Company/contact hierarchy.
- Duplicate detection.
- Tags and segmentation.
- Customer/vendor flags.
- Consent and communication preferences.
- Portal user linking.
- Full timeline.
- Data import/export.

### CRM

Needed:

- Lead capture.
- Lead-to-partner conversion.
- Pipeline stages.
- Activities.
- Quote creation from opportunity.
- Lost reasons.
- AI scoring and summary.

### Sales

Needed:

- Quotations and order confirmation.
- Product/pricelist/tax integration.
- PDF generation.
- E-sign integration.
- Delivery and invoice policy.
- Customer portal visibility.

### Products

Needed:

- Product variants.
- Units of measure.
- Taxes.
- Pricelists.
- Vendor pricelists.
- Inventory valuation method.
- Service vs storable behavior.

### Inventory

Needed:

- Warehouses/locations.
- Stock moves.
- Pick/pack/ship.
- Lots/serials.
- Reordering rules.
- Returns.
- Inventory valuation integration.

### Invoicing / Accounting

Needed:

- One source of truth between `invoicing` and `accounting` modules.
- Chart of accounts.
- Journals.
- Taxes.
- Fiscal periods.
- Posted move immutability.
- Payments and reconciliation.
- Aging report.
- Audit compliance.

### Purchase

Needed:

- RFQ flow.
- Purchase orders.
- Vendor bills.
- Receipts.
- Vendor price lists.
- Approval rules.

### Documents / Sign

Needed:

- Object storage integration.
- Document versioning.
- Attachment links to any record.
- OCR and AI summaries.
- Signature requests.
- Signed document audit trail.

### Helpdesk / Project / Timesheets

Needed:

- Partner-linked tickets.
- SLA policies.
- Ticket-to-task conversion.
- Timesheet billing.
- Customer-facing communication history.

### HR / Payroll / Attendance / Leaves

Needed:

- Employee linked to partner/user.
- Manager hierarchy.
- Attendance rules.
- Leave approvals.
- Payroll localization boundary.
- Strict HR permissions.

### Manufacturing / PLM / Quality

Needed:

- BOMs.
- Work orders.
- Manufacturing orders.
- Component reservations.
- Quality points/checks.
- ECO/PLM flows.
- Cost rollups.

### POS / E-commerce / Website

Needed:

- Shared products.
- Shared customers.
- Orders write to sales/accounting.
- Payment integration.
- Tax/shipping rules.
- Customer portal.

### Marketing / Events / Surveys

Needed:

- Consent-aware marketing lists.
- Partner segmentation.
- Campaign tracking.
- Event registration linked to partners.
- Survey answers linked to contacts/tickets/leads.

### Discuss / Notes / Knowledge / Calendar

Needed:

- Record-linked chatter.
- Notifications.
- Mentions.
- Knowledge articles with permissions.
- Calendar activities linked to partners/opportunities/projects.

---

## 9. Claude Skills Needed to Build This Platform

Below is a practical "Claude skills" inventory: create one skill per role/workstream so Claude Code or similar agents can reliably work on isolated parts of the platform. Each skill should include repository conventions, file locations, commands, acceptance criteria, and examples.

### 9.1 Foundation and Architecture Skills

1. **repo-architecture-auditor**
   - Audits module boundaries, duplicate logic, and architecture drift.
   - Outputs ADRs and dependency maps.

2. **erp-domain-architect**
   - Designs Odoo-like domain flows, shared entities, and record lifecycle rules.
   - Owns Partner/Product/Document/Activity/Audit/Event spine design.

3. **module-boundary-designer**
   - Converts each ERP module into a standalone bounded context connected to shared core services.

4. **api-contract-designer**
   - Creates OpenAPI/TypeScript API contracts and versioning rules.

5. **database-schema-architect**
   - Designs Prisma schema changes, indexes, relations, constraints, and migrations.

6. **migration-planner**
   - Creates safe database migration plans, rollback scripts, seed data, and data backfills.

### 9.2 Backend Skills

7. **node-express-prisma-backend-engineer**
   - Implements typed Express routes, services, Prisma transactions, pagination, filtering, and errors.

8. **fastapi-ai-worker-engineer**
   - Maintains Python FastAPI AI/OCR/ML worker endpoints and queue consumers.

9. **auth-rbac-security-engineer**
   - Implements auth, RBAC, record rules, company scoping, MFA/passkeys, and route guards.

10. **validation-zod-engineer**
    - Adds request/response validation schemas and safe parsing for every API mutation.

11. **workflow-transaction-engineer**
    - Implements atomic business flows: quote confirmation, delivery, invoice posting, payments, purchase receipts, manufacturing reservations.

12. **event-driven-integration-engineer**
    - Implements outbox events, timeline events, cross-module listeners, and idempotency.

13. **document-storage-engineer**
    - Implements uploads, object storage, signed URLs, versioning, antivirus hooks, and attachment links.

14. **reporting-analytics-engineer**
    - Builds dashboards, KPIs, financial reports, aging, stock reports, sales forecasts.

### 9.3 Frontend Skills

15. **react-vite-typescript-fixer**
    - Fixes TypeScript build errors, tsconfig separation, missing types, import cleanup, and strictness issues.

16. **frontend-module-builder**
    - Builds standalone module UIs with list/kanban/form/detail/settings patterns.

17. **shared-ui-system-engineer**
    - Builds reusable components: DataGrid, Kanban, Form, Modal, Chatter, AttachmentPanel, Timeline, ActivityWidget.

18. **frontend-api-client-engineer**
    - Creates typed API clients, hooks, React Query integration, error handling, optimistic updates.

19. **frontend-state-zustand-engineer**
    - Normalizes stores, cache invalidation, loading/error states, and module state patterns.

20. **accessibility-responsive-ui-auditor**
    - Checks keyboard navigation, ARIA labels, color contrast, responsive layouts, and data-table usability.

### 9.4 Module-Specific ERP Skills

21. **contacts-partners-module-engineer**
    - Owns companies, contacts, customer/vendor flags, dedupe, profile aggregation, tags, consent.

22. **crm-module-engineer**
    - Owns leads, opportunities, stages, activities, lead scoring, quote conversion.

23. **sales-module-engineer**
    - Owns quotations, sales orders, pricing, taxes, PDF quote generation, quote-to-order flow.

24. **products-catalog-module-engineer**
    - Owns products, variants, UoM, categories, taxes, pricelists, vendor pricelists.

25. **inventory-module-engineer**
    - Owns warehouses, locations, stock moves, pickings, lots/serials, reorder rules, returns.

26. **accounting-invoicing-module-engineer**
    - Owns chart of accounts, journals, invoices, move lines, posting, payments, reconciliation, aging.

27. **purchase-module-engineer**
    - Owns RFQs, purchase orders, receipts, vendor bills, approvals.

28. **documents-sign-module-engineer**
    - Owns documents, attachments, OCR, e-signature, document versions, signed audit trails.

29. **helpdesk-module-engineer**
    - Owns tickets, SLAs, customer history, escalation, ticket-to-task conversion.

30. **project-timesheets-module-engineer**
    - Owns projects, tasks, milestones, timesheets, billable time.

31. **hr-workforce-module-engineer**
    - Owns employees, recruitment, leaves, attendance, payroll boundaries, appraisals.

32. **manufacturing-quality-plm-engineer**
    - Owns BOMs, manufacturing orders, work orders, quality checks, ECOs, cost rollups.

33. **pos-ecommerce-module-engineer**
    - Owns POS orders, web carts, checkout, payments, taxes, customer linkage.

34. **marketing-events-surveys-engineer**
    - Owns campaigns, consent, segmentation, events, surveys, engagement tracking.

35. **knowledge-discuss-productivity-engineer**
    - Owns discuss, notes, knowledge, calendar, activity links, internal collaboration.

36. **spreadsheet-automation-studio-engineer**
    - Owns spreadsheet formulas, automations, no-code/studio customization safely.

### 9.5 AI Skills

37. **ai-agent-orchestrator-engineer**
    - Designs agent registry, routing, tools, memory, permissions, and module coordination.

38. **ai-rag-permission-engineer**
    - Implements vector search with tenant/record-level permission filtering.

39. **ai-document-intelligence-engineer**
    - Implements OCR, extraction, invoice/document parsing, summarization, classification.

40. **ai-sales-crm-assistant-engineer**
    - Implements lead scoring, call summaries, next best action, quote drafting.

41. **ai-accounting-control-engineer**
    - Implements invoice anomaly detection, expense categorization, reconciliation suggestions with approvals.

42. **ai-inventory-forecasting-engineer**
    - Implements demand forecasting, reorder recommendations, stockout risk, vendor suggestions.

43. **ai-evaluation-safety-engineer**
    - Creates eval datasets, hallucination checks, approval gates, and AI audit reports.

### 9.6 Quality, Deployment, and Operations Skills

44. **test-automation-engineer**
    - Builds unit, integration, contract, and E2E tests with fixtures.

45. **playwright-e2e-engineer**
    - Implements browser tests for lead-to-cash, procure-to-pay, ticket-to-invoice, and customer profile flows.

46. **ci-cd-devops-engineer**
    - Builds GitHub Actions or equivalent CI/CD with build/test/deploy gates.

47. **docker-production-engineer**
    - Hardens Dockerfiles, compose files, health checks, non-root users, image size, and runtime config.

48. **kubernetes-platform-engineer**
    - Creates production Kubernetes manifests, ingress, secrets, autoscaling, probes, jobs.

49. **observability-sre-engineer**
    - Adds structured logs, metrics, traces, dashboards, alerts, SLOs, and incident runbooks.

50. **backup-disaster-recovery-engineer**
    - Implements database backups, object storage backups, restore drills, RPO/RTO docs.

51. **security-compliance-auditor**
    - Runs dependency scans, threat modeling, file upload security, privacy/compliance checks.

52. **release-manager**
    - Manages versioning, changelog, migration release notes, staging promotion, rollback.

### 9.7 Suggested Skill Execution Order

1. `repo-architecture-auditor`
2. `erp-domain-architect`
3. `database-schema-architect`
4. `react-vite-typescript-fixer`
5. `node-express-prisma-backend-engineer`
6. `auth-rbac-security-engineer`
7. `contacts-partners-module-engineer`
8. `products-catalog-module-engineer`
9. `crm-module-engineer`
10. `sales-module-engineer`
11. `inventory-module-engineer`
12. `accounting-invoicing-module-engineer`
13. `documents-sign-module-engineer`
14. `event-driven-integration-engineer`
15. `frontend-module-builder`
16. `test-automation-engineer`
17. `playwright-e2e-engineer`
18. `ci-cd-devops-engineer`
19. `docker-production-engineer`
20. `observability-sre-engineer`

---

## 10. Immediate Fix List

Do these before adding more modules:

1. Fix `api/src/routes/manufacturing.ts` TypeScript handler return issue.
2. Decide and fix Prisma database provider mismatch with Docker Compose.
3. Fix frontend TypeScript configuration:
   - Add Vite env typing.
   - Exclude tests from production `tsc`.
   - Use Vitest globals/types or import from `vitest`.
   - Remove unused imports or relax `noUnusedLocals` temporarily only if needed.
4. Fix missing frontend imports/types in social-marketing.
5. Fix lazy import default export mismatch in Contact Hub.
6. Normalize module slugs between menu, routes, folders, and API endpoints.
7. Add production secret validation.
8. Add route-level auth middleware to Node API.
9. Add Zod validation for partner, product, CRM, sales, invoice, and document mutations.
10. Add `GET /api/partners/:id/profile` aggregation endpoint.
11. Add audit and timeline writing for all mutations in core modules.
12. Add CI to prevent future broken builds from being merged.

---

## 11. Definition of Deployment Ready

The app is deployment ready when all items below are true:

### Build and Runtime

- [ ] Frontend production build passes.
- [ ] Node API build passes.
- [ ] Python worker build/tests pass if retained.
- [ ] Docker images build reproducibly.
- [ ] App starts with production-like environment variables.
- [ ] No placeholder secrets are allowed in production.

### Database

- [ ] Prisma provider matches production database.
- [ ] Migrations run cleanly from empty DB.
- [ ] Seed data works.
- [ ] Backups and restores are tested.
- [ ] All business records are tenant/company scoped.

### Security

- [ ] Auth implemented.
- [ ] RBAC implemented.
- [ ] Record rules implemented.
- [ ] Audit logs implemented.
- [ ] Rate limiting implemented.
- [ ] File upload security implemented.
- [ ] Dependency/container scans pass.

### Product Functionality

- [ ] Customer profile aggregates all module data.
- [ ] CRM → Sales → Inventory → Invoice → Payment flow works.
- [ ] Purchase → Receipt → Vendor Bill → Payment flow works.
- [ ] Documents attach to any record.
- [ ] Chatter/timeline works across modules.
- [ ] AI features are approval-gated and audited.

### Quality

- [ ] Unit tests for core services.
- [ ] Integration tests for cross-module workflows.
- [ ] E2E tests for lead-to-cash and procure-to-pay.
- [ ] API contract tests.
- [ ] Monitoring and alerting configured.
- [ ] Deployment rollback tested.

---

## 12. Final Recommendation

Do **not** continue adding more module screens first. The fastest way to make this a working platform is to stabilize the foundation:

1. Make the app build.
2. Pick the primary backend.
3. Fix the database provider/migration strategy.
4. Implement auth, tenant/company scoping, validation, audit, and timeline.
5. Build the universal partner/customer profile.
6. Complete one end-to-end flow: CRM lead → quote → sales order → delivery → invoice → payment.
7. Then repeat the same platform pattern module by module.

This approach matches the Odoo-inspired vision: each module feels standalone, but the customer/company/product/document data flows through every module without re-entry, duplication, or loss of history.
