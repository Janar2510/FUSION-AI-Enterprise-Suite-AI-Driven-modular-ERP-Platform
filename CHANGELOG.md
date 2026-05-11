# Changelog

All notable changes to FusionAI Enterprise Suite will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),

## [Unreleased] — Marketing Automation Activities — 2026-05-11

### Added
- **Marketing Automation — CampaignActivity model** with activity type (`email`, `sms`, `server_action`), sequence ordering, delay settings, template reference, draft content fields, state, and success/rejected counters.
- **Marketing Automation — CampaignParticipant model** with campaign-scoped target tracking, idempotent unique constraint (`campaignId`, `targetModel`, `targetId`), participant state, contact fields, and metadata support.
- **Campaign activity API** on `api/src/routes/campaigns.ts`:
  - `GET /api/campaigns/:id/activities`
  - `POST /api/campaigns/:id/activities`
  - `PUT /api/campaigns/:id/activities/:activityId`
  - `DELETE /api/campaigns/:id/activities/:activityId`
- **Audience targeting API** on `api/src/routes/campaigns.ts`:
  - `GET /api/campaigns/:id/participants`
  - `POST /api/campaigns/:id/participants/resolve`
  - Supports allowlisted Partner filters (`consentMarketing`, `isCustomer`, `isCompany`, `city`, `search`) and CRM Lead filters (`active`, `type`, `minProbability`, `minExpectedRevenue`, `search`).
- **Campaign email composition API** on `api/src/routes/campaigns.ts`:
  - `POST /api/campaigns/:id/activities/:activityId/compose`
  - Saves custom email subject/body content onto email activities, or imports subject/body from existing Email Marketing `MassMailing` records via `templateMailingId`.
- **Campaign launch API** on `api/src/routes/campaigns.ts`:
  - `POST /api/campaigns/:id/launch`
  - Dedicated state-machine transition that flips a campaign from `draft` or `paused` to `active` and stamps `startDate` (preserved if already set).
  - Returns `404` for unknown campaigns, `409` when the current state is not launchable (e.g. `active`, `completed`), and `422` when the campaign has no activities.
- **Focused API tests** for campaign activity list/create validation, missing-campaign handling, and the launch state machine (draft→active, paused→active, no-activities 422, already-active 409, completed 409, not-found 404).
- **Marketing workflow execution engine** — `CampaignParticipant.nextActionAt` (optional, indexed with `state` for due-participant queries) and **`CampaignTrace`** audit rows (campaign, activity, participant, outbox linkage, status/timestamps); shared delay/chain helpers in `api/src/lib/marketingWorkflow.ts`.
- **`campaignWorkflowRunner`** (`api/src/jobs/campaignWorkflowRunner.ts`) registered from `api/src/jobs/index.ts` — node-cron tick (~30s) processes active campaigns whose participants are due, dispatches marketing email via transactional outbox (`email.send` with `marketing-campaign` template payload), stubs `sms.send` (no SMS provider yet), records unsupported `server_action` in traces; advances participant `lastActivityId` / `nextActionAt` / completion.
- **Campaign launch scheduling** — successful launch, inside a DB transaction, sets participant `nextActionAt` from the first activity’s delay chain (`firstStepScheduledAt`).
- **Outbox relay** — `api/src/jobs/outboxRelay.ts` updates `CampaignTrace` and activity counters when marketing email succeeds, fails, or dead-letters; SMS paths set trace status appropriately.
- **Email template** — `marketing-campaign` in `api/src/core/email/index.ts` for campaign HTML mail (`subjectLine`, `htmlBody`).
- **API tests** — `api/src/__tests__/campaigns.workflow.test.ts` (runner dispatch, chain order, server_action stub).

### Infrastructure
- Added Prisma migration `20260511005000_marketing_campaign_activities`.
- Added Prisma migration `20260511010000_marketing_campaign_participants`.
- Added Prisma migration `20260511120000_marketing_workflow_engine` (`next_action_at` on `campaign_participants`, `campaign_traces` table, FKs and indexes).

### Fixed
- **AI agent golden-set tests** (`api/src/__tests__/ai/agents.eval.test.ts`) — Jest mock for `@anthropic-ai/sdk` uses a constructible class so `core/ai/index` can instantiate the client; test payloads and Prisma stubs aligned with agent implementations (`saleSubscription.findUnique`, `accountMove.findMany`, JSON field names).

## [Unreleased] — Design System Purge: Purple → Amber — 2026-05-11

### Changed
- **Global color purge** — replaced all hardcoded `purple`/`indigo`/`violet` Tailwind classes with `amber`/`orange` across 116 frontend files to match the design token system (`--accent-primary: #f59e0b`, `--accent-secondary: #f97316`)
- `primary-purple` custom class references replaced with `primary-500` (Tailwind amber-500)
- `--color-info` token updated from indigo-500 to amber-500
- `tokens.ts` `info` color aligned to `#f59e0b`
- All hex purple/indigo/violet color literals replaced with amber equivalents

## [Unreleased] — Sprint 20: AI Rollout + Production Hardening — 2026-05-10

### Added
- **AI Agents — 6 new production agents** registered in `api/src/routes/ai-actions.ts`:
  - `optimize_production` (Manufacturing): suggests batch sizes and scheduling optimizations based on current shop floor data.
  - `knowledge-article-draft` (Knowledge): drafts a knowledge base article from a topic, category, and content hints.
  - `recommend_training` (HR): recommends training courses for an employee based on role, skills gap, and department.
  - `analyze_performance` (HR): produces a performance narrative with strengths, areas for improvement, and recommended next steps.
  - `predict_churn` (Subscriptions): predicts churn risk for a subscription based on MRR, days active, and usage signals.
  - `evaluate_vendor` (Purchases): scores a vendor on quality, pricing, reliability, and payment terms using historical order data.
- **RAG Permission Filter** (`api/src/core/rag/index.ts`): new `RagService` class enforces `userId`/`orgId` on all vector index and search operations. Includes `VectorAdapter` interface and `InMemoryVectorAdapter` for dev/test. Prevents cross-tenant document leakage.
- **Golden-set AI evals** (`api/src/__tests__/ai/agents.eval.test.ts`): comprehensive test suite for all 6 new agents; mocks Anthropic SDK and Prisma to validate output shapes and quality gates without real API calls. Acts as a CI gate.
- **ChatterPanel + AiActionsPanel** wired to remaining modules: Appraisals, Fleet, Leaves, Payroll, Rental, Sign.
- **Auth on every route** — `requireAuth` added to previously unprotected routes: `automation`, `calendar`, `campaigns`, `dashboard`, `planning`, `pos`, `settings`, `skills`, `spreadsheet`. eCommerce AI endpoints also now require auth.

### Changed
- `api/src/core/ai/index.ts`: exported `getAgent()` and `listAgents()` functions to allow test introspection of the agent registry.

### Infrastructure
- `DeploymentChecklist.md` updated with Sprint 20 completion status and remaining pre-go-live items.

## [Unreleased] — Sprint 17: Inventory Phase 1 + Payroll Foundation — 2026-05-10

### Added
- **Inventory — Backorder API** (`POST /api/inventory/pickings/:id/backorder`): creates a new picking for remaining (unfinished) move quantities of a `done` picking; sets `backorderId` to source picking.
- **Inventory — Return API** (`POST /api/inventory/pickings/:id/return`): creates a reverse transfer for a `done` picking; reverses source/dest locations; supports optional `moveQtys` body to return partial quantities; sets `returnId`.
- **Inventory — Schema**: `StockPicking.backorderId` and `StockPicking.returnId` nullable FK fields added; migration `sprint17_inventory_backorder_return`.
- **Inventory — ChatterPanel on transfer form** (`InventoryModule.tsx`): `ChatterPanel` with `resourceModel="stock.picking"` added to `rightPanels` of the picking form; renders only when viewing an existing record.
- **Payroll — Payslip API** (`/api/hr/payslips`): full CRUD + state transitions `PATCH /confirm` (draft→done), `PATCH /pay` (done→paid), `PATCH /reset` (→draft); backed by existing `HrPayslip` schema model.
- **Payroll — State pipeline UI** (`PayrollModule.tsx`): added "Register Payment" button for `done→paid` transition; added `paid` state to `STATE_LABELS`; state pipeline breadcrumb (Draft → Confirmed → Paid) visible on the form ribbon.
- **Payroll store** (`payrollStore.ts`): API endpoints updated from `/api/payroll` to `/api/hr/payslips`; `pay()` action added.

### Fixed
- **Inventory — TypeScript**: corrected `productUomQty` → `productQty` and added required `locationId`/`locationDestId`/`qtyDone` fields in backorder/return move creation.

### Notes
- `HrContract` model and full CRUD + `open`/`close` endpoints already existed from a prior sprint; verified complete.
- Inventory adjustments (`POST /api/inventory/adjustments`) already existed; verified complete.
- Contracts smart button on employee form in `HRModule.tsx` already navigates to Payroll module.



### Added
- **Leaves — Team Calendar API** (`GET /api/hr/leaves/calendar?month=YYYY-MM`): returns all `validate`-state leaves for the given month as structured calendar events (title, start, end, employeeName, leaveTypeName, leaveTypeColor).
- **Leaves — Team Calendar UI** (`LeavesModule.tsx`): new "Team Calendar" tab with a full monthly grid; month navigation with ChevronLeft/ChevronRight; per-day leave cards colour-coded by `HrLeaveType.color`; fetches from the calendar API on tab switch or month change.
- **Manufacturing — Kanban view** (`ManufacturingModule.tsx`): production orders rendered as Kanban columns (Draft / In Progress / Done / Cancelled); added `'kanban'` to `viewsAvailable` for the orders view; `renderOrdersKanban()` function.

### Fixed
- **Portal (`portal.ts`)**: corrected field references `invoice.invoiceDate` → `invoice.date`, `invoice.invoiceDateDue` → `invoice.dueDate` to match `AccountMove` schema (TypeScript error resolved).
- **Prisma client regenerated**: picked up `SaleOrder.pricelistId` from `sprint15_sale_order_pricelist` migration; sales.ts TypeScript errors resolved.

### Notes
- Manufacturing: backorder (`POST /orders/:id/backorder`), scrap (`POST /orders/:id/scrap`), and ChatterPanel were already implemented in the codebase; verified complete.
- Leaves: `HrLeaveType`, `HrLeaveAllocation`, and all CRUD + approve/refuse endpoints were already implemented; team calendar was the only missing piece.



### Added
- **Pricelist engine** (`api/src/core/pricelist.service.ts`): `computeLinePrice(productId, partnerId, qty, pricelistId)` resolves unit price via active `PricelistLine` records (fixed price or % discount, quantity breaks, date ranges); falls back to `product.salesPrice`.
- **Sales order — pricelist wiring**: `POST /api/sales` and `PUT /api/sales/:id` now call `calculateTotalsWithPricelist`, auto-resolving unit prices from the partner's default pricelist (or explicit header pricelist).
- **`GET /api/sales/pricelists`**: lists active pricelists for the order-form selector.
- **`GET /api/sales/line-price`**: returns resolved unit price for a single product+qty+pricelist combination (used by frontend live-preview).
- **Sales form — pricelist selector**: dropdown added to sale order form header; fetches `/api/sales/pricelists` on mount; selected `pricelistId` is sent with order save.
- **`SaleOrder.pricelistId`** schema field: optional FK to `Pricelist`; migration `sprint15_sale_order_pricelist` created.
- **Portal access layer** (`api/src/routes/portal.ts`, `GET /api/portal/invoices/:token`): ADR-0015 implementation — HMAC-SHA256 signed short-lived tokens; `POST /api/portal/token` (auth required) generates tokens; `GET /api/portal/invoices/:token` (public) returns safe invoice view. Mounted before global `requireAuth` guard.

### Architecture
- ADR-0014 implemented: Invoicing module retains its own API; `InvoicingDashboard` remains. Portal access layer is the bridge for external customer invoice views.
- ADR-0015 implemented: Portal token mechanism live at `/api/portal/*`.

---

## [Unreleased] — Sprint 14: Accounting Reports + CRM Activities + Mark Lost Modal — 2026-05-10

### Added
- **CRM "Mark Lost" modal**: button in `CRMModule.tsx` now opens a modal with an optional reason text field; calls `PATCH /api/crm/leads/:id/lost` on confirm; updates local form state.
- **`PATCH /api/crm/leads/:id/lost`** endpoint: sets `active: false` and optionally `lostReason` on the lead.
- (Accounting financial reports and CRM activities were already implemented in prior sprints — verified complete.)

---

## [Unreleased] — Sprint 13: Critical Bug Fixes + Architectural ADRs — 2026-05-10

### Fixed
- **`GET /api/settings/users` route shadow**: `GET /:module` was registered before `/users`, swallowing user-list calls. Moved `/users` first.
- **Helpdesk SLA reset**: `PATCH /api/helpdesk/tickets/:id/sla-reset` was listed as complete in TODO.md but handler was missing. Implemented: resets `slaDeadline` to `now + slaHours` and clears `slaExceeded`.
- **`invoicing` module invisible**: not registered in `ModulePage.tsx` route switch. Added `case 'invoicing'` → `<InvoicingDashboard />`.

### Architecture (ADRs)
- `docs/adr/0014-invoicing-accounting-consolidation.md` — Invoicing module UI merges into Accounting views.
- `docs/adr/0015-portal-access-layer.md` — `/api/portal/*` with short-lived HMAC-SHA256 tokens.
- `docs/adr/0016-file-storage-strategy.md` — MinIO (S3-compatible) as primary file storage.
- `docs/adr/0017-websocket-auth.md` — JWT in WS handshake query parameter.
- `docs/adr/0018-email-provider.md` — Wire `core/email/index.ts` to configured SMTP env vars.

---



### Added
- **Sign module — full persistence**: new `sign_requests` + `sign_signers` Prisma models; CRUD API at `/api/sign/requests` including signer-submit (`PUT /:id/sign`) and add-signer (`POST /:id/signers`); frontend `signStore` rewritten to use real API instead of in-memory state.
- **Invoicing store — `fetchPayments` / `fetchCreditNotes`**: the two missing fetch actions were added so the payment and credit-note lists hydrate on mount.
- **HR store — private employee info**: `HrEmployeePrivate` interface + `fetchEmployeePrivate` / `updateEmployeePrivate` actions wired to `GET /PUT /api/hr/employees/:id/private`.
- **Quality — Control Points tab**: new "Control Points" tab in Quality module; inline `toleranceMin` / `toleranceMax` editor per point (measure-type points only); saves via existing `updatePoint` API action.
- **Notes — tag chip input**: `tags: string[]` field added to frontend `Note` type; chip-input in form (Enter/comma to add, Backspace to remove); tag chips rendered on kanban cards.

### Schema
- Migration `sprint12_sign_module`: `sign_requests`, `sign_signers` tables.

---

## [Unreleased] — Sprint 11: Security Fixes & Module Completions — 2026-05-10

### Security
- **Invoicing routes**: added `requireAuth` to all `/api/invoicing/*` endpoints (previously fully unauthenticated)
- **Quality routes**: added `requireAuth` to all `/api/quality/*` endpoints
- **HR Timesheets privacy**: `GET /api/hr/timesheets` now requires `hr.read` permission for full list; callers without that permission must supply `employee_id` — prevents cross-employee data leaks

### Added
- **Invoicing — Products endpoint**: `GET /api/invoicing/products` for catalog line-item selection
- **Invoicing — Payments CRUD**: `POST /PUT /DELETE /api/invoicing/payments` with auto-upsert of default BNK journal
- **Invoicing — Credit Notes CRUD**: `GET /POST /PUT /api/invoicing/credit-notes`
- **HR — Department CRUD**: `PUT /DELETE /api/hr/departments/:id`
- **HR — Employee private info**: `GET /PUT /api/hr/employees/:id/private` (gated behind `hr.read` permission) exposing gender, birthday, marital status, emergency contact, work/mobile phone
- **HR — Timesheets weekly grid**: `GET /api/hr/timesheets/weekly?weekStart=` — aggregates hours per employee per day
- **HR — Timesheets update/delete**: `PUT /DELETE /api/hr/timesheets/:id`
- **Quality — Measure auto-evaluation**: `PATCH /api/quality/checks/:id/measure` evaluates pass/fail against `QualityPoint.toleranceMin/Max`

### Schema (migration `20260510052915_sprint11_schema_additions`)
- `quality_points`: added `toleranceMin DOUBLE PRECISION`, `toleranceMax DOUBLE PRECISION`
- `notes`: added `tags TEXT[] DEFAULT '{}'`
- `bank_statements` + `bank_statement_lines` tables created

---

## [Unreleased] — Sprint 10: Shared Infrastructure Layer — 2026-05-10

### Added
- **RBAC permission catalogue** (`api/src/core/auth/roles.ts`): canonical `ROLES` and `PERMISSIONS` constants covering all 20+ modules; `DEFAULT_ROLE_PERMISSIONS` mapping used by seed script.
- **Database seed script** (`api/scripts/seed-roles.ts`): idempotent upsert of `SpineRole`, `SpinePermission`, and `SpineRolePermission` join rows.
- **Permission guards on sensitive routes**:
  - Accounting: `POST /moves/:id/post`, `POST /moves/:id/pay` → `accounting.post` / `accounting.pay`.
  - Payroll: `POST /` → `payroll.write`, `DELETE /:id` → `payroll.delete`.
  - GDPR: `POST /erase` → `gdpr.erase`.
  - Settings: `PUT /api/settings/:module` → `settings.write`.
- **AI agents** (registered in `ai-actions.ts`):
  - `appraisalCoach` — performance summary + development plan from appraisal data.
  - `recruitmentRanker` — ranked candidate shortlist from JD + CVs.
  - `attendanceAnomaly` — pattern detection on attendance records.
  - `planningOptimizer` — shift coverage optimisation against demand forecast.
- **Shared Chatter factory** (`api/src/core/chatter/index.ts`): `createChatterRouter(ownerType)` generates `GET /:id/messages` + `POST /:id/messages` sub-router.
- **Chatter wired to 10 modules**: helpdesk, crm, sales, purchases, invoicing, hr, projects, maintenance, manufacturing, inventory — each gains `GET|POST /api/<module>/:id/messages`.
- **Module-scoped settings API** (`GET /api/settings/:module`, `PUT /api/settings/:module`): reads/writes `SystemConfig` rows prefixed `<module>.<key>` with JSON auto-parse.

### Changed
- `settings.ts` now imports `requirePermission` for the `PUT /:module` endpoint.
- `ai-actions.ts` imports 4 new AI agents at startup.

## [Unreleased] — Sprint 9: Security hardening + Test suite green — 2026-05-10

### Added
- **Upload guard middleware** (`api/src/middleware/uploadGuard.ts`):
  - Content-type allowlist (JPEG, PNG, GIF, WebP, SVG, PDF, XLSX, XLS, CSV).
  - Magic-byte verification — confirms declared MIME matches actual file content, preventing MIME-spoofing attacks.
  - Per-file size cap (10 MB default, configurable via `UPLOAD_MAX_BYTES`).
  - ClamAV virus-scan stub: no-op by default; enable with `ENABLE_VIRUS_SCAN=true` and wire in `clamscan` (see comment in source).
  - `multer` (memoryStorage) wraps all three: single/array/fields helpers exported.
  - `handleMulterError` normalises `MulterError` into the standard error envelope (413 on size exceed).
- **`infra/secrets/README.md`**: comprehensive reference listing all required/optional env variables for API + frontend, with generation commands (`openssl rand -hex 64`), rotation policy, and a pre-deploy checklist.
- **11 security middleware tests** (`api/src/core/__tests__/security.middleware.test.ts`): CSRF bypass/block scenarios + upload guard accept/reject/spoof/size-limit cases.
- **Test auth helper** (`api/src/__tests__/helpers.ts`): `authHeader()` generates a signed test JWT for supertest requests.

### Fixed
- **248/248 tests green**: `flows.integration.test.ts` and `partners.profile.test.ts` were returning 401 because `requireAuth` was active. Both files now `jest.mock('../core/auth')` to bypass auth in unit/integration tests that already mock Prisma.

### Changed
- Express body limits tightened: `express.json({ limit: '1mb' })` (was 10 MB), `express.urlencoded({ limit: '256kb' })` (was unlimited).
- OpenAPI 3.1 spec extended for Sprint 8 endpoints: `GET /api/dashboard/recent-activity`, `GET/POST /api/accounting/bank/statements`, match/unmatch/suggestions endpoints; **Dashboard** tag added.

---
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] — Sprint 8: Live Dashboard + Bank Reconciliation — 2026-05-10

### Added
- **Dashboard live KPIs** (`Dashboard.tsx`): replaced hardcoded stats with real data from `GET /api/dashboard`; added secondary KPI row (Leads, Invoices, Purchase Orders, Projects) and a Top Opportunities card.
- **Dashboard recent activity** (`GET /api/dashboard/recent-activity`): new endpoint returning the last 15 `TimelineEvent` records; wired into the Dashboard activity panel with owner-type icons and time-ago formatting.
- **Bank Reconciliation** (architectural gap G-10):
  - Prisma models `BankStatement` and `BankStatementLine` in `schema.prisma` (mapped to `bank_statements` / `bank_statement_lines`).
  - REST API `api/src/routes/bank-reconciliation.ts` mounted at `/api/accounting/bank`: full CRUD for statements (`GET/POST/GET/:id/DELETE/:id`), line matching (`POST /statements/:id/match`), unmatching (`DELETE /statements/:id/match/:lineId`), and AI-assisted match suggestions (`GET /statements/:id/suggestions`).
  - **Bank tab** in `AccountingModule.tsx`: two-panel `BankReconciliationPanel` component — left column lists statements, right column shows lines with green/red reconciliation status, per-line suggestion drawer, match/unmatch actions, and a progress bar.
- Prisma client regenerated after schema changes.

## [Unreleased] — Sprint 7 Hotfix: Amber/Orange Design Token Alignment — 2026-05-10

### Fixed
- **Full UI design consistency**: remapped Tailwind `primary` palette from purple (#7c3aed) to amber (#f59e0b) and `secondary` from pink to orange (#f97316), aligning with `tokens.css` CSS custom properties already used by `TopBar` and `SubNav`. Every module using `text-primary-*`, `bg-primary-*`, gradient buttons, and glow shadows now renders in amber/orange instead of purple/pink.
- **`dark-900`** updated from `#0f172a` → `#0a0f1e` to match `--bg-base` in `tokens.css`.
- **`glass.active`** updated to `rgba(245,158,11,0.15)` (amber), eliminating residual purple active states.
- **`boxShadow.glow*`** and **`keyframes.glow`** updated to amber rgba values.

## [Unreleased] — Sprint 7: Settings UI & Users API — 2026-05-10

### Added
- **Settings Accounting tab**: new tab in `Settings.tsx` with inline CRUD management for Payment Terms and Pricelists, calling the Sprint 6 backend API endpoints (`/api/payment-terms`, `/api/pricelists`).
- **`GET /api/settings/users`**: new endpoint in `settings.ts` returning a list of platform users from `SpineUser`; used by the Settings Users tab.

### Changed
- **Settings Users tab**: replaced `mockUsers` hardcoded array with a live `useQuery` hook calling `GET /api/settings/users`; `role` field is now optional with a graceful `'User'` fallback.

## [Unreleased] — Sprint 6: Bug Fixes & New Entities — 2026-05-10

### Added
- **CRM Activities** (`crm_activities` table): new Prisma model `CrmActivity` with full CRUD endpoints (`GET/POST /api/crm/leads/:id/activities`, `PATCH /api/crm/activities/:id/done`, `DELETE /api/crm/activities/:id`).
- **Payment Terms API** (`/api/payment-terms`): full CRUD for `PaymentTerm` and nested `PaymentTermLine` records; protected by `requireAuth`.
- **Pricelists API** (`/api/pricelists`): full CRUD for `Pricelist` and `PricelistLine` records, plus `POST /api/pricelists/:id/compute` endpoint for live price calculation.

### Fixed
- **B-03 Timesheets privacy**: `GET /api/hr/timesheets` now filters by optional `employee_id` and `project_id` query parameters, preventing exposure of all timesheet records.
- **CRM routes type safety**: replaced `(prisma as any).activity` workaround with correctly-typed `prisma.crmActivity` calls after adding the model to schema.
- **payment-terms.ts build**: fixed duplicate `OR` key in Prisma `where` clause (TS1117); restructured into a single `AND` array.

## [Unreleased] — Sprint 5: P2 Module Completions — 2026-05-10

### Added
- **Schema (Prisma)** — 5 new models: `HelpdeskTeam`, `AppraisalGoal`, `MrpEcoLine`, `MailMessageReaction`, `HrRecruitmentStage`; back-relations added to `HelpdeskTicket`, `HrAppraisal`, `MrpEco`, `MrpBomLine`, `MailMessage`, `HrApplicant`, `HrEmployee`, `Product`
- **Discuss** — `useDiscussSocket` hook (`frontend/src/modules/discuss/hooks/useDiscussSocket.ts`) wires socket.io client to store; WS server now persists each message to `MailMessage` before broadcasting; reaction add/remove now calls `POST/DELETE /api/messaging/channels/:id/messages/:messageId/reactions`
- **Attendance** — `requireAuth` added; `POST /check-in` (guards double check-in), `POST /check-out` (computes `workedHours`), `GET /status/:employeeId`, `GET /analytics/overtime` (worked vs standard hours per period)
- **Helpdesk** — `HelpdeskTeam` CRUD (`GET/POST/PUT/DELETE /api/helpdesk/teams`); `GET /tickets` and `/stages` now accept `teamId` filter; `PATCH /tickets/:id/sla-reset` endpoint
- **Appraisals** — `requireAuth` added; `PATCH /:id/confirm` and `PATCH /:id/done` state transitions; full `AppraisalGoal` CRUD nested under appraisals (`GET/POST/PUT/DELETE /:id/goals/:goalId`)
- **PLM** — ECO `PUT /:id` now implements real BoM mutation when `stage=done`: iterates `ecoLines` and creates/deletes/updates `MrpBomLine` records; `PATCH /:id/approve` and `PATCH /:id/reject`; full `MrpEcoLine` CRUD (`GET/POST/PUT/DELETE /:id/lines`)
- **Recruitment** — `HrRecruitmentStage` CRUD; `GET /pipeline` for Kanban view; `PATCH /:id/stage` with `publishEvent` outbox hook; `PATCH /:id/resume` to store resume URL; applicants list now filterable by `stageId`
- **Surveys** — Public routes (no auth): `GET /public/:id` and `POST /public/:id/submit`; `PATCH /:id/publish` and `PATCH /:id/close`; `SurveyQuestion` CRUD with nested `SurveyAnswer` creation; `DELETE /questions/:qId`, `DELETE /answers/:aId`; `GET /:id/results` analytics endpoint
- **Calendar** — `CalendarGrid.tsx` component replaces stub: real month/week/day grid, current-time indicator, event chips, today highlighting, amber accent design tokens; `CalendarModule.tsx` wired to grid with create-at-slot support and list/form views preserved

### Fixed
- `publishEvent` call in recruitment route now includes `organizationId` from `req.user.orgId` (was missing required param)

---

## [Unreleased] — Phase 4c: Sales + Accounting Flow Integration — 2026-05-07

### Added
- **Sales store migrated to typed `salesApi`** (`salesStore.ts`) — replaced all raw `axios` calls; `API_BASE` constant removed; `confirmOrder`/`cancelOrder` now re-throw on error for UI toast handling
- **Accounting store migrated to typed `accountingApi`** (`accountingStore.ts`) — replaced all raw `axios` calls; `API_BASE` constant removed
- **`registerPayment(id, data?)` action** added to `useAccountingStore` — calls `POST /api/accounting/moves/:id/pay` (Phase 3 Flow C)
- **"💳 Register Payment" button** added to `AccountingModule.tsx` form view — appears only for `posted` invoices/bills where `paymentState !== 'paid'`; triggers `registerPayment` and returns to list
- **3-step progress chevrons in AccountingModule** — status ribbon now shows `Draft → Posted → In Payment` with correct active/past state colouring

### Fixed
- **`purchasesApi` base path** in `api.ts` — corrected `/api/purchase` → `/api/purchases` across all CRUD + flow actions; `validateReceipt` removed (no such endpoint); added `postBill` and `payBill` methods
- **`helpdeskApi` ticket paths** in `api.ts` — list/get/create/update now use `/api/helpdesk/tickets/*`; added `moveStage` and `pipeline` methods
- **`accountingApi`** in `api.ts` — added `updateMove` and `listAccounts` methods that were missing from the typed SDK

---

## [Unreleased] — Phase 4b: CRM Flow Integration — 2026-05-07

### Added
- **CRM store migrated to typed `crmApi`** (`crmStore.ts`) — replaced all raw `axios` calls with the domain SDK from `api.ts`; `API_BASE` constant removed
- **Flow A actions in CRM store** — `qualifyLead(id)`, `markWon(id)`, `newQuotation(id)` added to `useCRMStore`, triggering Phase 3 backend endpoints
- **CRM form action buttons** — Lead detail form now shows context-aware Phase 3 flow buttons:
  - **✓ Qualify** — converts a Lead → Opportunity (shown only for `type !== 'opportunity'`)
  - **🏆 Mark Won** — calls `POST /api/crm/leads/:id/mark-won` (shown for active records)
  - **✗ Mark Lost** — marks lead inactive (shown for active records)
  - **📋 New Quotation** — calls `POST /api/crm/leads/:id/new-quotation` and navigates to the new Sale Order (shown only for Won leads in final pipeline stage)
- **`crmApi` paths corrected** in `api.ts` — paths now match actual CRM routes (`/api/crm/leads/*`); added `moveStage`, `delete`, `pipeline` methods
- **`salesApi` paths corrected** in `api.ts` — corrected base path from `/api/sale` to `/api/sales`

---

## [Unreleased] — Phase 4a: API Security + Typed Frontend SDK + CI Pipeline — 2026-05-07

### Added
- **Auth middleware on all 9 core domain routes** — `requireAuth` wired via `router.use()` on `partners`, `products`, `crm`, `sales`, `accounting`, `inventory`, `purchases`, `helpdesk`, `projects`; all domain endpoints now require a valid JWT
- **Typed frontend domain SDK** (`frontend/src/lib/api.ts`) — 8 fully typed API modules replacing generic `modulesApi` calls:
  - `partnersApi` — list, get, profile, create, update, archive
  - `productsApi` — list, get, create, update, archive
  - `crmApi` — CRUD + qualify, markWon, markLost, newQuotation, stages
  - `salesApi` — CRUD + confirm, deliver, invoice, cancel
  - `accountingApi` — moves CRUD + postMove, payMove, reconcileMove, journals
  - `inventoryApi` — pickings list/get + markReady, validate, locations, moves
  - `purchasesApi` — CRUD + confirm, validateReceipt, createBill, cancel
  - `helpdeskApi` — CRUD + createTask, addTimesheet, resolve, stages
  - `projectsApi` — CRUD + listTasks, createTask, updateTask, addTimesheet, stages
- **GitHub Actions CI pipeline** (`.github/workflows/ci.yml`):
  - `api` job: typecheck → prisma:validate → prisma:generate → migrate:deploy → test (with coverage ≥70% gate) → build
  - `frontend` job: lint → typecheck → build
  - `all-green` gate job: both jobs must pass; blocks merges to `main`/`develop`
  - Postgres 16 service container for integration test isolation
  - `concurrency` group with cancel-in-progress for fast feedback on stacked PRs

---

## [Unreleased] — Phase 3: End-to-End Business Flows — 2026-05-07 ✅ ALL TESTS PASSING

### Added
- **`api/src/core/flow.service.ts`** — Central service layer for all 5 business flows; state-machine logic isolated from routes; Prisma transactions, idempotency guards, and immutability guards
- **Flow A** — Lead → Qualify (`POST /api/crm/leads/:id/qualify`) → Mark Won (`POST /api/crm/leads/:id/mark-won`) → Create Quotation (`POST /api/crm/leads/:id/new-quotation`) → Confirm Sale Order (auto-creates delivery picking)
- **Flow B** — Picking state machine: `POST /api/inventory/pickings/:id/ready` (draft→assigned), `POST /api/inventory/pickings/:id/validate` (assigned→done, marks SO delivered)
- **Flow C** — Invoice lifecycle: `POST /api/sale/:id/invoice` (creates draft), `POST /api/accounting/moves/:id/post` (immutability guard), `POST /api/accounting/moves/:id/pay` (idempotent payment), `POST /api/accounting/moves/:id/reconcile`; `GET /api/accounting/payments`
- **Flow D** — Purchase cycle: `POST /api/purchase/:id/confirm` (RFQ→PO + creates receipt picking), `POST /api/purchase/:id/bill` (vendor bill), `POST /api/purchase/:id/post-bill`, `POST /api/purchase/:id/pay-bill`
- **Flow E** — Helpdesk→Billable: `POST /api/helpdesk/tickets/:id/create-task` (ticket→project task), `POST /api/helpdesk/tickets/:id/timesheet` (billable timesheet, increments `qtyDelivered` on SaleOrderLine)
- **`AccountPayment` model** — new Prisma model with idempotency key, journal/partner/move FK, payment type/state
- **Schema additions** — `idempotencyKey`, `organizationId` on SaleOrder/PurchaseOrder/AccountMove/CrmLead; `isBillable`, `qtyDelivered`, `qtyInvoiced` on SaleOrderLine; `isBillable`, `billedAmount`, `saleOrderLineId` on HrTimesheet; `projectId`, `projectTaskId`, `saleOrderId` on HelpdeskTicket; `saleOrderLineId` on ProjectTask; `purchaseOrderId`, `postedAt` on AccountMove
- **Migration** — `api/prisma/migrations/20260507155357_phase2_auth_rbac/` + Phase 3 migration SQL deployed via `prisma migrate deploy`
- **`api/src/__tests__/flows.integration.test.ts`** — 25 integration tests covering all 5 flows: state transitions, idempotency, 404/409/422 error scenarios

### Changed
- `uuid` import replaced with Node.js built-in `crypto.randomUUID()` in `core/errors/index.ts` (eliminates ESM/CJS incompatibility in Jest)
- `POST /api/accounting/moves/:id/post` — returns 409 (was 400) when journal entry is already posted
- Jest config — added `transformIgnorePatterns` to handle ESM node_modules

---

## [Unreleased] — Phase 2: Auth, Security & RBAC — 2026-05-07 ✅ VERIFIED

### Fixed (2026-05-07 post-verification)
- **`pg_hba.conf`** — Changed Postgres.app TCP auth from `trust` (requires macOS GUI dialog) to `md5` (password-based) for `127.0.0.1/32` and `::1/128` host entries; required for Prisma connections from subprocesses/agents
- **`api/.env`** — Added missing `REFRESH_SECRET` environment variable used by refresh-token signing
- **Auth endpoints verified**: `POST /api/auth/register` → 200, `POST /api/auth/login` → 200 + JWT, `GET /api/auth/me` → 200 user object, unauthenticated `/me` → 401, duplicate register → 409, wrong password → 401

## [Unreleased] — Phase 2: Auth, Security & RBAC — 2026-05-07

### Added
- **`core/auth/index.ts`** — argon2id password hashing (`hashPassword`/`verifyPassword`), JWT access tokens (15 min, HS256), JWT refresh tokens (30 days), `requireAuth` middleware, `optionalAuth` middleware, `requirePermission(key)` middleware, `requireRole(role)` middleware, `loadUserPermissions()` loader
- **`core/errors/index.ts`** — Standard error envelope `{ error: { code, message, fields?, requestId } }`, `AppError` class with factory methods (`notFound`, `unauthorized`, `forbidden`, `conflict`, `validation`, `tenantMismatch`), `errorHandler` Express middleware (handles ZodError, AppError, Prisma P2002), `requestIdMiddleware` (UUID per request)
- **`core/validation/index.ts`** — `validate(schema)` middleware, `validateQuery(schema)` middleware, `parseBody(req, schema)` inline helper, reusable schemas: `PaginationSchema`, `IdParamSchema`, `EmailSchema`, `PasswordSchema`
- **`routes/auth-credentials.ts`** — `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/refresh`, `GET /api/auth/me`; httpOnly cookie for refresh token rotation; constant-time password verification path
- **`middleware/rateLimiter.ts`** — `globalLimiter` (300 req/15 min), `authLimiter` (20 req/15 min), `apiLimiter` (100 req/1 min)
- **Partners POST/PUT** — now validated with `CreatePartnerSchema` / `UpdatePartnerSchema` (Zod)
- **Tag flattening** — `flattenTags()` helper ensures `tags` arrays return clean `{ id, name }` objects instead of raw join-table rows

### Changed
- `index.ts` — wired `requestIdMiddleware`, `globalLimiter`, `authLimiter`, `apiLimiter`, tightened Helmet CSP, replaced generic error handler with centralized `errorHandler`
- `package.json` — added `argon2`, `jsonwebtoken`, `zod`, `express-rate-limit`, `uuid` + type packages

---

## [Unreleased] — Phase 1: Canonical Data Spine — 2026-05-06

### Added

#### 🏗️ Canonical Data Models (schema.prisma)
- `Organization` — top-level tenant root with slug, status, and plan fields
- `SpineCompany` — legal entity per org (VAT, fiscal year, currency, country)
- `SpineUser` + `SpineRole` + `SpineUserRole` — SSO-ready identity spine replacing ad-hoc user fields
- `Permission` + `RolePermission` — fine-grained RBAC building blocks
- `AuditLog` — immutable append-only audit trail (before/after JSON diffs, IP, user-agent)
- `OutboxEvent` — transactional outbox for reliable event publishing (topic, payload, status, attempts)
- `TimelineEvent` — chronological activity feed per record (model + recordId routing)
- `Activity` — scheduled follow-up tasks (call, email, meeting) linked to partners

#### 🔑 Partner & Product Schema Upgrades
- `Partner.id` migrated from `Int` → `String @default(cuid())` for global uniqueness
- `Product.id` migrated from `Int` → `String @default(cuid())`
- Added `organizationId`, `companyId` multi-tenancy fields to `Partner` and `Product`
- Added `ProductType` enum: `STORABLE | CONSUMABLE | SERVICE`
- Renamed `salePrice` → `salesPrice` on `Product`; added `unitOfMeasure`, `barcode` fields
- Updated all FK references from `Int` to `String` across `LoyaltyCard`, `WebCart`, etc.

#### ⚙️ Core Helpers (`api/src/core/`)
- `core/tenancy/index.ts` — `tenantDb(organizationId)` Prisma proxy that auto-scopes all reads and injects `organizationId` into creates across tenant-owned models
- `core/audit/index.ts` — `audit()` helper: writes `AuditLog` rows with computed diffs; never throws
- `core/timeline/index.ts` — `emitTimeline()` helper: writes `TimelineEvent` rows; never throws
- `core/outbox/index.ts` — `publishEvent()` helper: writes `OutboxEvent` rows with optional transaction context; never throws

#### 🔭 360° Partner Profile API
- `GET /api/partners/:id/profile` — parallel-fetched aggregated view including addresses, contacts, CRM leads, sale orders, purchase orders, invoices, helpdesk tickets, timeline, activities, and documents
- Summary KPIs: `saleTotal`, `purchaseTotal`, `openLeads`, `openTickets`, `invoiceCount`
- Graceful fallback via `safeFind()` helper for optional/future Prisma models

#### 🌱 Seed Improvements (`api/prisma/seed.ts`)
- Seeds `Organization`, `SpineCompany`, `SpineRole` (admin), `SpineUser` (admin@fusionai.com)
- All partner/product seed rows now carry correct `organizationId` + `companyId`
- Employee IDs in leave/expense/attendance/payslip rows derived from captured create results (no more hardcoded IDs)

#### 🧪 Integration Tests
- `api/src/__tests__/partners.profile.test.ts` — 8 Jest tests covering 200/404 responses, KPI computation, and response shape for the new profile endpoint
- Jest + ts-jest + supertest added to `devDependencies`; `npm test` script wired

### Changed

#### 🔧 Route ID Type Fixes
- `src/routes/partners.ts` — replaced all `parseInt(id)` with string IDs; `findUnique` → `findFirst`
- `src/routes/products.ts` — same pattern
- `src/routes/auth.ts` — `parseInt(partnerId)` → `String(partnerId)` for WebAuthn registration
- `src/routes/pos.ts` — loyalty card lookup now uses string partnerId
- `src/routes/purchases.ts` — partner connect uses `String(partnerId)`
- `src/routes/ecommerce.ts` — `salePrice` → `salesPrice`; product count map keyed by `string`

### Fixed
- TypeScript build (`npm run lint`) exits 0 with 0 errors after Prisma client regeneration

## [1.0.4] - 2025-09-24

### Fixed

#### 🔧 Project Module Database Integration
- **Async Database Session**: Fixed Project API using wrong database dependency (`get_db` instead of `get_async_session`)
- **Dashboard Endpoint**: Resolved 500 error in `/api/v1/project/dashboard` endpoint
- **Analytics Endpoint**: Fixed async result handling in project analytics queries
- **SQLAlchemy 2.0 Compatibility**: Ensured proper async/await patterns throughout Project service

#### 🚀 HR Module Improvements
- **API Prefix Correction**: Fixed HR module API prefix from `/api/hr/*` to `/api/v1/hr/*`
- **Database Patterns**: Corrected async DB patterns in HR service for SQLAlchemy 2.0 compatibility
- **Frontend Integration**: Updated HR store to use correct API endpoints

#### 🌐 Frontend API Configuration
- **Vite Proxy Configuration**: Fixed API base URL to use Vite proxy instead of hardcoded `:8000` port
- **Backend Communication**: Ensured frontend properly communicates with backend on port 3001

### Added

#### 🎫 Helpdesk Module Implementation
- **Complete Helpdesk System**: Full customer support management with ticket tracking, agent management, and knowledge base
- **Database Tables**: Created 7 helpdesk tables (`support_agents`, `tickets`, `ticket_responses`, `ticket_activities`, `support_teams`, `team_members`, `knowledge_base`)
- **API Endpoints**: Complete RESTful API with CRUD operations for tickets, responses, agents, and knowledge base
- **Dashboard Integration**: Helpdesk dashboard with metrics, analytics, and ticket management
- **Service Layer**: Comprehensive business logic for ticket management, analytics, and support operations
- **Type Safety**: Full TypeScript integration with comprehensive type definitions

#### 🏭 Manufacturing Module Implementation
- **Complete Manufacturing System**: Full production management with quality control, inventory tracking, and supply chain coordination
- **Database Tables**: Created 10 manufacturing tables (`production_orders`, `products`, `work_centers`, `routings`, `routing_operations`, `production_operations`, `bills_of_material`, `bom_items`, `inventory_items`, `material_requirements`, `quality_checks`)
- **API Endpoints**: Complete RESTful API with CRUD operations for production orders, products, work centers, and quality checks
- **Dashboard Integration**: Manufacturing dashboard with production metrics, quality statistics, and inventory analytics
- **Service Layer**: Comprehensive business logic for production planning, quality control, and inventory management
- **Type Safety**: Full TypeScript integration with comprehensive type definitions

#### 💰 Purchase Module Implementation
- **Complete Purchase System**: Full procurement management with vendor relations, purchase order tracking, and invoice management
- **Database Tables**: Created 8 purchase tables (`vendors`, `purchase_orders`, `purchase_order_items`, `purchase_receipts`, `purchase_receipt_items`, `invoices`, `payments`, `products`)
- **API Endpoints**: Complete RESTful API with CRUD operations for vendors, purchase orders, invoices, and payments
- **Dashboard Integration**: Purchase dashboard with procurement metrics, vendor statistics, and spending analytics
- **Service Layer**: Comprehensive business logic for vendor management, purchase order processing, and financial tracking
- **Type Safety**: Full TypeScript integration with comprehensive type definitions

#### 💳 Subscriptions Module Implementation
- **Complete Subscription System**: Full subscription management with billing cycles, plan management, and customer lifecycle tracking
- **Database Tables**: Created 7 subscription tables (`subscription_plans`, `plan_addons`, `customers`, `subscriptions`, `subscription_addons`, `payments`, `usage_records`)
- **API Endpoints**: Complete RESTful API with CRUD operations for plans, customers, subscriptions, payments, and usage tracking
- **Dashboard Integration**: Subscription dashboard with MRR/ARR metrics, churn analysis, and revenue analytics
- **Service Layer**: Comprehensive business logic for subscription lifecycle, billing, and customer management
- **Type Safety**: Full TypeScript integration with comprehensive type definitions

#### ✅ Verified Working Subscription Endpoints
- `GET /api/v1/subscriptions/health` - Health check endpoint
- `GET /api/v1/subscriptions/dashboard` - Subscription dashboard with metrics and statistics
- `GET /api/v1/subscriptions/analytics?period_days=30` - Subscription analytics for specified period
- `GET /api/v1/subscriptions/plans` - Paginated subscription plans list with filters
- `POST /api/v1/subscriptions/plans` - Create new subscription plan
- `GET /api/v1/subscriptions/customers` - Paginated customers list with filters
- `POST /api/v1/subscriptions/customers` - Create new customer
- `GET /api/v1/subscriptions/subscriptions` - Paginated subscriptions list with filters
- `POST /api/v1/subscriptions/subscriptions` - Create new subscription
- `GET /api/v1/subscriptions/payments` - Paginated payments list with filters
- `POST /api/v1/subscriptions/payments` - Create new payment
- `GET /api/v1/subscriptions/usage-records` - Paginated usage records list with filters
- `POST /api/v1/subscriptions/usage-records` - Create new usage record

#### ✅ Verified Working Purchase Endpoints
- `GET /api/v1/purchase/health` - Health check endpoint
- `GET /api/v1/purchase/dashboard` - Purchase dashboard with metrics and statistics
- `GET /api/v1/purchase/analytics?period_days=30` - Purchase analytics for specified period
- `GET /api/v1/purchase/vendors` - Paginated vendors list with filters
- `POST /api/v1/purchase/vendors` - Create new vendor
- `GET /api/v1/purchase/vendors/{id}` - Get specific vendor details
- `GET /api/v1/purchase/purchase-orders` - Paginated purchase orders list with filters
- `POST /api/v1/purchase/purchase-orders` - Create new purchase order
- `GET /api/v1/purchase/purchase-orders/{id}` - Get specific purchase order details
- `PUT /api/v1/purchase/purchase-orders/{id}` - Update purchase order
- `DELETE /api/v1/purchase/purchase-orders/{id}` - Delete purchase order
- `GET /api/v1/purchase/purchase-orders/{id}/items` - Get purchase order items
- `POST /api/v1/purchase/purchase-orders/{id}/items` - Add item to purchase order
- `GET /api/v1/purchase/invoices` - Paginated invoices list with filters
- `POST /api/v1/purchase/invoices` - Create new invoice

#### ✅ Verified Working Manufacturing Endpoints
- `GET /api/v1/manufacturing/health` - Health check endpoint
- `GET /api/v1/manufacturing/dashboard` - Manufacturing dashboard with metrics and statistics
- `GET /api/v1/manufacturing/analytics?period_days=30` - Manufacturing analytics for specified period
- `GET /api/v1/manufacturing/production-orders` - Paginated production orders list with filters
- `POST /api/v1/manufacturing/production-orders` - Create new production order
- `GET /api/v1/manufacturing/production-orders/{id}` - Get specific production order details
- `PUT /api/v1/manufacturing/production-orders/{id}` - Update production order
- `DELETE /api/v1/manufacturing/production-orders/{id}` - Delete production order
- `GET /api/v1/manufacturing/products` - Paginated products list with filters
- `POST /api/v1/manufacturing/products` - Create new product
- `GET /api/v1/manufacturing/quality-checks` - Paginated quality checks list with filters
- `POST /api/v1/manufacturing/quality-checks` - Create new quality check

#### ✅ Verified Working Helpdesk Endpoints
- `GET /api/v1/helpdesk/health` - Health check endpoint
- `GET /api/v1/helpdesk/dashboard` - Helpdesk dashboard with metrics and statistics
- `GET /api/v1/helpdesk/analytics?period_days=30` - Helpdesk analytics for specified period
- `GET /api/v1/helpdesk/tickets` - Paginated tickets list with filters
- `POST /api/v1/helpdesk/tickets` - Create new support ticket
- `GET /api/v1/helpdesk/tickets/{id}` - Get specific ticket details
- `PUT /api/v1/helpdesk/tickets/{id}` - Update ticket
- `DELETE /api/v1/helpdesk/tickets/{id}` - Delete ticket
- `GET /api/v1/helpdesk/tickets/{id}/responses` - Get ticket responses
- `POST /api/v1/helpdesk/tickets/{id}/responses` - Create ticket response
- `GET /api/v1/helpdesk/knowledge-base` - Get knowledge base articles
- `POST /api/v1/helpdesk/knowledge-base` - Create knowledge base article

#### 📊 Project Module Implementation
- **Complete Project System**: Full project management with task tracking, time entries, and analytics
- **Database Tables**: Created 7 project tables (`projects`, `project_tasks`, `project_milestones`, `project_resources`, `project_time_entries`, `project_comments`, `project_documents`)
- **API Endpoints**: Complete RESTful API with CRUD operations for projects, tasks, and time entries
- **Dashboard Integration**: Project dashboard with metrics, analytics, and recent activity
- **Frontend Components**: React components with Zustand state management for project management
- **Type Safety**: Full TypeScript integration with comprehensive type definitions

#### ✅ Verified Working Endpoints
- `GET /api/v1/project/dashboard` - Project dashboard with metrics and recent activity
- `GET /api/v1/project/analytics?period_days=30` - Project analytics for specified period
- `GET /api/v1/project/projects` - Paginated projects list with filters
- `POST /api/v1/project/projects` - Create new project
- `GET /api/v1/project/projects/{id}` - Get specific project details
- `PUT /api/v1/project/projects/{id}` - Update project
- `DELETE /api/v1/project/projects/{id}` - Delete project
- `GET /api/v1/project/tasks` - Paginated tasks list with filters
- `POST /api/v1/project/tasks` - Create new task
- `GET /api/v1/project/time-entries` - Paginated time entries with filters
- `POST /api/v1/project/time-entries` - Create new time entry

### Technical Details
- **Database**: PostgreSQL with proper foreign key relationships and indexes
- **Backend**: FastAPI with async/await patterns and proper error handling
- **Frontend**: React with Framer Motion animations and responsive design
- **State Management**: Zustand with comprehensive loading and error states
- **API Integration**: Proper async database session handling for SQLAlchemy 2.0
- **Module Integration**: Project module fully integrated with existing ERP architecture

## [1.0.3] - 2025-09-23

### Added

#### 🎯 Sales Module Implementation
- **Complete Sales System**: Full sales management with quotation generation, order processing, and revenue forecasting
- **Quote Management**: Comprehensive quote creation, tracking, and status management with AI-powered optimization
- **Order Processing**: Complete order lifecycle from quote conversion to delivery with status tracking
- **Revenue Tracking**: Automated revenue recording and analytics with period-based reporting
- **Sales Analytics**: Real-time sales metrics, conversion rates, and performance analytics
- **AI Sales Agent**: Specialized AI agent for sales forecasting, quote optimization, and customer behavior analysis
- **Dashboard**: Comprehensive sales dashboard with metrics, charts, and recent activity
- **Database Integration**: Full PostgreSQL integration with proper relationships to CRM contacts

#### 🚀 Technical Implementation
- **Backend**: FastAPI with SQLAlchemy 2.0 async operations
- **Database Tables**: `sales_quotes`, `sales_quote_items`, `sales_orders`, `sales_order_items`, `sales_revenue`
- **API Endpoints**: Complete RESTful API with CRUD operations for all sales entities
- **Frontend**: React components with Zustand state management and glassmorphism UI
- **Type Safety**: Full TypeScript integration with comprehensive type definitions
- **Status Management**: Quote status (draft, sent, viewed, accepted, rejected, expired) and Order status (pending, confirmed, processing, shipped, delivered, cancelled, returned)

#### ✅ Verified Working Endpoints
- `GET /api/v1/sales/dashboard` - Sales dashboard with metrics and recent activity
- `GET /api/v1/sales/analytics?period_days=30` - Sales analytics for specified period
- `GET /api/v1/sales/quotes` - Paginated quotes list with filters
- `POST /api/v1/sales/quotes` - Create new sales quote
- `GET /api/v1/sales/quotes/{id}` - Get specific quote details
- `PATCH /api/v1/sales/quotes/{id}/status` - Update quote status
- `GET /api/v1/sales/orders` - Paginated orders list with filters
- `POST /api/v1/sales/orders` - Create order from accepted quote
- `GET /api/v1/sales/orders/{id}` - Get specific order details
- `PATCH /api/v1/sales/orders/{id}/status` - Update order status
- `POST /api/v1/sales/revenue` - Record revenue for orders

### Technical Details
- **Database**: PostgreSQL with proper foreign key relationships to CRM contacts
- **Backend**: FastAPI with async/await patterns and proper error handling
- **Frontend**: React with Framer Motion animations and responsive design
- **State Management**: Zustand with comprehensive loading and error states
- **AI Integration**: SalesAgent with forecasting, optimization, and analytics capabilities
- **Dependencies**: Fixed Pydantic v2 compatibility issues

## [1.0.2] - 2025-09-23

### Fixed

#### 🔧 Critical Backend Fixes
- **Uvicorn Compatibility**: Fixed `TypeError: cannot use a bytes pattern on a string-like object` by downgrading httptools to v0.6.1
- **Database Connection**: Resolved database connection issues by creating CRM tables in correct `fusionai_erp` database
- **Missing CRM Endpoints**: Implemented missing `/api/v1/crm/dashboard` and `/api/v1/crm/analytics` endpoints causing 404 errors
- **Dependency Conflicts**: Updated requirements.txt with specific versions to avoid package conflicts
- **Async Database Operations**: Fixed async/await patterns in CRM service for proper SQLAlchemy 2.0 compatibility

#### 🚀 Infrastructure Improvements
- **WebSocket Server**: Successfully implemented Socket.IO WebSocket server on port 8080
- **API Server**: Fixed FastAPI server running on port 3001 with proper CORS configuration
- **Database Tables**: Created CRM tables (`crm_contacts`, `crm_companies`, `crm_deals`) with proper indexes
- **Frontend Integration**: Verified frontend-backend communication through Vite proxy

#### ✅ Verified Working Endpoints
- `GET /health` - Health check endpoint
- `GET /api/v1/crm/dashboard` - CRM dashboard metrics
- `GET /api/v1/crm/analytics?period=30d` - CRM analytics data
- `GET /api/v1/crm/contacts` - Paginated contacts list
- `POST /api/v1/crm/contacts` - Create new contact
- `GET /ws/health` - WebSocket server health check

### Technical Details
- **Database**: PostgreSQL with `fusionai_erp` database and `fusionai_user` credentials
- **Backend**: FastAPI with SQLAlchemy 2.0 async operations
- **Frontend**: Vite dev server with proxy configuration to backend
- **WebSocket**: Socket.IO server for real-time communication
- **Dependencies**: Fixed version conflicts with uvicorn, httptools, and websockets

## [1.0.1] - 2024-01-16

### Added

#### 🎯 CRM Module Implementation
- **Complete CRM System**: Full customer relationship management with AI-powered insights
- **Contact Management**: Comprehensive contact database with lead scoring and AI analysis
- **Opportunity Tracking**: Sales pipeline management with win probability prediction
- **Interaction History**: Complete interaction tracking with sentiment analysis
- **AI Insights**: Automated lead scoring, churn prediction, and next best action recommendations
- **Analytics Dashboard**: Real-time CRM analytics with pipeline visualization
- **Lead Sources**: Track and analyze lead source performance
- **Follow-up Management**: Automated follow-up reminders and scheduling
- **Custom Fields**: Flexible contact and opportunity customization
- **Social Media Integration**: LinkedIn, Twitter, and Facebook profile linking

#### 🤖 CRM AI Agent
- **Lead Scoring**: AI-powered lead qualification and scoring (0-100 scale)
- **Customer Analysis**: Personality traits, communication preferences, and buying signals
- **Opportunity Prediction**: Win probability calculation and close date prediction
- **Sentiment Analysis**: Interaction sentiment scoring and topic extraction
- **Churn Prediction**: Customer churn risk assessment
- **Next Best Action**: AI recommendations for optimal customer engagement
- **Batch Analysis**: Bulk analysis of contacts, opportunities, and interactions

#### 📊 CRM Features
- **Pipeline Visualization**: Interactive sales pipeline with stage distribution
- **Performance Metrics**: Conversion rates, win rates, and deal size analysis
- **Trend Analysis**: Monthly trends and performance tracking
- **Lead Source Analytics**: Top performing lead sources and conversion rates
- **AI Recommendations**: Intelligent insights and action recommendations
- **Real-time Updates**: Live dashboard updates and notifications

### Technical Implementation
- **Backend**: FastAPI with SQLAlchemy models, comprehensive API endpoints
- **Frontend**: React components with Zustand state management
- **Database**: PostgreSQL with optimized queries and relationships
- **AI Integration**: LangChain-based CRM agent with specialized tools
- **API Endpoints**: 15+ RESTful endpoints for complete CRM functionality
- **Type Safety**: Full TypeScript implementation with comprehensive types

## [1.0.0] - 2024-01-15

### Added

#### 🚀 Core Platform
- **Complete Project Structure**: Full folder structure with frontend, backend, infrastructure, and documentation
- **Modular Architecture**: 23 ERP modules with independent operation and AI integration
- **AI-First Design**: Multi-agent system with specialized AI agents for each module
- **Modern Tech Stack**: React 18, FastAPI, PostgreSQL, Redis, Qdrant, Docker

#### 🎨 Frontend (React + TypeScript)
- **Glassmorphism UI**: Beautiful purple gradient theme with frosted glass effects
- **Component Library**: Reusable components (GlassCard, GradientButton, ModuleCard)
- **Animation System**: Framer Motion animations and transitions
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **State Management**: Zustand for global state, TanStack Query for server state
- **Module System**: Dynamic module loading with React Router
- **WebSocket Integration**: Real-time updates and AI chat
- **Authentication**: JWT-based auth with context providers

#### 🔧 Backend (FastAPI + Python)
- **RESTful API**: Complete API with authentication, modules, AI, and dashboard endpoints
- **Database Integration**: SQLAlchemy ORM with PostgreSQL
- **Caching Layer**: Redis for sessions, caching, and rate limiting
- **Vector Database**: Qdrant for AI embeddings and semantic search
- **AI Agent System**: LangChain-based multi-agent orchestration
- **WebSocket Support**: Real-time communication and updates
- **Security**: JWT authentication, CORS, rate limiting, input validation
- **Monitoring**: Prometheus metrics, structured logging, health checks

#### 🤖 AI Integration
- **Agent Orchestrator**: Central coordinator for all AI agents
- **Specialized Agents**: Accounting, CRM, Inventory, HR, Project, Sales, etc.
- **Vector Store**: Semantic search and document embeddings
- **LLM Integration**: OpenAI and Anthropic API support
- **Memory System**: Conversation context and learning capabilities
- **Tool System**: Extensible tool framework for agent capabilities

#### 📦 ERP Modules
- **Dashboard**: Central command center with analytics and widgets
- **CRM**: Customer relationship management with AI insights
- **Accounting**: Financial management with automated processing
- **Inventory**: Stock management with demand forecasting
- **HR**: Human resources with AI-powered recruitment
- **Project**: Project management with resource optimization
- **Sales**: Sales pipeline with AI-powered lead scoring
- **Purchase**: Procurement with vendor management
- **Helpdesk**: Customer support with AI assistance
- **Marketing**: Campaign management with AI optimization
- **Manufacturing**: Production planning with quality control
- **Documents**: File management with OCR and AI processing
- **Sign**: Digital signature workflow automation
- **Discuss**: Internal communication platform
- **Website**: CMS with e-commerce capabilities
- **Email Marketing**: Campaign automation
- **Social Marketing**: Social media management
- **Subscriptions**: Recurring billing management
- **Rental**: Asset rental management
- **Timesheets**: Time tracking and attendance
- **Planning**: Resource planning and scheduling
- **Field Service**: Mobile workforce management
- **Studio**: No-code customization platform

#### 🐳 Infrastructure & Deployment
- **Docker Configuration**: Multi-stage builds and optimized images
- **Docker Compose**: Complete development and production setup
- **Kubernetes**: Production-ready manifests and Helm charts
- **Monitoring**: Prometheus, Grafana, and ELK stack integration
- **CI/CD**: GitHub Actions workflows for testing and deployment
- **Security**: OWASP compliance, encryption, and audit logging

#### 📚 Documentation
- **System Design**: Comprehensive architecture documentation
- **Deployment Guide**: Step-by-step deployment instructions
- **API Documentation**: OpenAPI/Swagger documentation
- **Module Specifications**: Detailed module documentation
- **Agent Rules**: AI agent development guidelines
- **Memory Guidelines**: User preference management
- **Contributing Guide**: Development and contribution guidelines

#### 🧪 Testing
- **Unit Tests**: Comprehensive test coverage for all components
- **Integration Tests**: API and database integration testing
- **E2E Tests**: End-to-end user workflow testing
- **AI Agent Tests**: Specialized testing for AI functionality
- **Performance Tests**: Load testing and optimization
- **Security Tests**: Vulnerability scanning and penetration testing

#### 🔧 Development Tools
- **Setup Scripts**: Automated environment setup
- **Code Quality**: ESLint, Prettier, Black, isort, mypy
- **Type Safety**: Full TypeScript and Python type checking
- **Hot Reloading**: Fast development iteration
- **Debugging**: Comprehensive logging and error handling

### Technical Specifications

#### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion for smooth transitions
- **State**: Zustand + TanStack Query
- **Routing**: React Router v6
- **HTTP Client**: Axios with interceptors
- **WebSocket**: Socket.io client
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation

#### Backend Architecture
- **Framework**: FastAPI with Python 3.11+
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Caching**: Redis for sessions and caching
- **Vector DB**: Qdrant for AI embeddings
- **AI/ML**: LangChain, OpenAI, Anthropic, Sentence Transformers
- **Background Tasks**: Celery with Redis broker
- **WebSocket**: FastAPI WebSocket support
- **Authentication**: JWT with refresh tokens
- **Validation**: Pydantic models
- **Documentation**: OpenAPI/Swagger

#### AI System
- **Orchestrator**: Central agent coordination
- **Agents**: 10+ specialized AI agents
- **LLM Integration**: OpenAI GPT-4, Anthropic Claude
- **Vector Search**: Semantic similarity search
- **Memory**: Conversation context and learning
- **Tools**: Extensible tool framework
- **Decision Making**: Configurable decision limits
- **Human Oversight**: Approval workflows

#### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Kubernetes with Helm charts
- **Monitoring**: Prometheus + Grafana
- **Logging**: Structured logging with ELK stack
- **Security**: OWASP compliance, encryption
- **Backup**: Automated database and file backups
- **Scaling**: Horizontal and vertical scaling support

### Performance Metrics
- **API Response Time**: < 200ms (p95)
- **UI Render Time**: < 1 second
- **AI Agent Accuracy**: > 95%
- **System Uptime**: > 99.9%
- **Test Coverage**: > 80%
- **Bundle Size**: Optimized with code splitting

### Security Features
- **Authentication**: JWT with refresh tokens
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: API rate limiting and DDoS protection
- **Encryption**: Data encryption at rest and in transit
- **Audit Logging**: Complete audit trail
- **AI Security**: Prompt injection protection
- **CORS**: Configurable cross-origin policies

### Browser Support
- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

### Mobile Support
- **iOS**: 14+
- **Android**: 8.0+
- **Responsive**: Mobile-first design

## [0.9.0] - 2024-01-10

### Added
- Initial project structure
- Basic React frontend setup
- FastAPI backend foundation
- Docker configuration
- Basic AI agent framework

## [0.8.0] - 2024-01-05

### Added
- Project planning and architecture design
- Technology stack selection
- UI/UX design system
- AI integration planning

---

## Development Roadmap

### Version 1.1.0 (Q2 2024)
- [ ] Advanced AI features (multi-modal, voice)
- [ ] Mobile applications (iOS/Android)
- [ ] Advanced analytics and reporting
- [ ] Third-party integrations (Zapier, etc.)
- [ ] White-label customization

### Version 1.2.0 (Q3 2024)
- [ ] Multi-tenancy support
- [ ] Advanced workflow automation
- [ ] Machine learning model training
- [ ] API marketplace
- [ ] Advanced security features

### Version 2.0.0 (Q4 2024)
- [ ] Edge AI processing
- [ ] Federated learning
- [ ] Advanced business intelligence
- [ ] Global deployment support
- [ ] Enterprise features

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## Support

- **Documentation**: [docs.fusionai.com](https://docs.fusionai.com)
- **Issues**: [GitHub Issues](https://github.com/fusionai/enterprise-suite/issues)
- **Community**: [Discord](https://discord.gg/fusionai)
- **Email**: support@fusionai.com

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ by the FusionAI Team**
