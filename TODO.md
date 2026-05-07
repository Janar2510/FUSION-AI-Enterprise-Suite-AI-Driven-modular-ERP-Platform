# FusionAI Enterprise Suite — Build TODO

Mirrors `CLAUDE_CODE_BUILD_PLAN.md`. Tick items as completed.

---

## Immediate Sprint (Week 1) — Phase 0

- [x] Create `docs/adr/` with ADRs 0001–0007
- [x] Run baseline verification → `docs/baseline-verification-2026-05-06.md`
- [x] Fix `api/src/routes/manufacturing.ts` handler return-type
- [x] Sweep all `return res.…` in async `Promise<void>` handlers across `api/`
- [x] Switch Prisma datasource to `postgresql`; rebaseline migrations
- [x] Split frontend tsconfig (app vs test); add `vite-env.d.ts`
- [x] Fix social-marketing missing imports; fix lazy default-export mismatch
- [x] Add production-secret-guard to `api/src/index.ts`
- [x] Normalize module slugs (kebab-case); add `docs/conventions/naming.md`
- [x] Quarantine FastAPI ERP routes under `_deprecated/`
- [x] Verified: `cd api && npm run build` exits 0
- [x] Verified: `cd frontend && npm run build` exits 0
- [x] Stub `core/` folders in api with READMEs (auth, tenancy, audit, timeline, chatter, attachments, outbox, workflow, validation, errors, pdf)
- [x] Write 12 spine models in `schema.prisma` (no migration yet — PR for Phase 1)

**Phase 0 Status: COMPLETE** ✅

---

## Phase 1 — Canonical Data Spine

- [x] Implement `Organization`, `Company`, `User`, `Role`, `Permission`, `UserRole` models (full migration)
- [x] Upgrade existing `Partner` to canonical spine (String IDs, organizationId, companyId, isEmployee, consent fields)
- [x] Upgrade existing `Product` to canonical spine (String IDs, ProductType enum, unitOfMeasure, salesPrice/costPrice)
- [x] Implement `tenantDb()` wrapper in `core/tenancy/`
- [x] Implement `audit()` helper in `core/audit/`
- [x] Implement `emitTimeline()` helper in `core/timeline/`
- [x] Implement `publishEvent()` outbox helper in `core/outbox/`
- [x] Implement `GET /api/partners/:id/profile` — aggregated 360° view
- [x] Seed: 1 org, 1 company, admin user, 25+ partners, 50+ products, sample CRM/sales data
- [ ] `npx prisma migrate dev --name init_spine && npx prisma db seed` — requires local DB (manual step)
- [x] Integration test: `GET /api/partners/:id/profile` — 8/8 passing (`npm test`)
- [x] `npm run lint` (tsc --noEmit) exits 0

**Phase 1 Status: COMPLETE** ✅ (DB migration is a local prerequisite — run when DATABASE_URL is set)

---

## Phase 2 — Auth, Security, RBAC

- [x] Register / login / logout / password reset / email verification  (`routes/auth-credentials.ts`)
- [ ] TOTP MFA (optional), WebAuthn passkeys (optional)  ← WebAuthn stubs already in `routes/auth.ts`
- [x] Password hashing with argon2id  (`core/auth/index.ts`)
- [x] `requireAuth` middleware (Bearer JWT)  (`core/auth/index.ts`)
- [x] `requirePermission(key)` middleware  (`core/auth/index.ts`)
- [ ] Record rules (per-module Prisma `where` filter)
- [x] Zod schemas on every mutation route  (partners POST/PUT; `core/validation/index.ts`)
- [x] Standard error envelope `{ error: { code, message, fields, requestId } }`  (`core/errors/index.ts`)
- [x] Rate limiting (express-rate-limit)  (`middleware/rateLimiter.ts` — global/auth/api tiers)
- [ ] CSRF protection
- [x] Helmet CSP tightened  (`index.ts`)
- [ ] Body size limits; file upload: content-type allowlist + magic-byte + size cap + virus scan hook
- [x] Audit every privileged action, every login/failed-login  (`routes/auth-credentials.ts`)
- [ ] `infra/secrets/README.md` with required keys

**Phase 2 Status: Core security layer DONE** ✅ (remaining items: CSRF, record rules, upload guard)

### Phase 2 Gaps (from ADR-0013 — G-14)
- [ ] Record-level row filtering — `core/auth/recordRules.ts` per-module where-clause filters
- [ ] Add `salespersonId` FK to CrmLead, SaleOrder, HelpdeskTicket (migration needed)

---

## Phase 3 — End-to-End Business Flows

- [x] **Flow A:** Lead → Qualified → Opportunity → Won → Quotation → SaleOrder(CONFIRMED)
- [x] **Flow B:** SaleOrder(CONFIRMED) → StockPicking(DRAFT → READY/assigned → DONE) → SaleOrder(DELIVERED)
- [x] **Flow C:** SaleOrder(DELIVERED) → Invoice(DRAFT → POSTED) → Payment(REGISTERED) → Reconciled
- [x] **Flow D:** RFQ → PO(CONFIRMED) → Receipt(DONE) → VendorBill(POSTED) → Payment
- [x] **Flow E:** Ticket → Task → Timesheet → SaleOrderLine(billable, qtyDelivered++)
- [x] All 5 flows have backend integration tests (25 tests, all green)
- [ ] All 5 flows have Playwright E2E tests
- [ ] All 5 flows write TimelineEvents visible in partner profile
- [x] Posted invoices cannot be mutated (service-level immutability guard + 409)
- [x] Idempotency keys on all confirm/post/pay endpoints (SaleOrder, PurchaseOrder, AccountMove, AccountPayment)

**Phase 3 Status: COMPLETE** ✅ (backend flows + service layer + integration tests done; Playwright E2E + timeline events are Phase 6)

---

## Phase 4a — API Security + Typed Frontend SDK + CI Pipeline

- [x] `requireAuth` wired to all 9 core domain routes (partners, products, crm, sales, accounting, inventory, purchases, helpdesk, projects)
- [x] Typed frontend domain SDK — 8 API modules in `frontend/src/lib/api.ts` (partnersApi, productsApi, crmApi, salesApi, accountingApi, inventoryApi, purchasesApi, helpdeskApi, projectsApi)
- [x] GitHub Actions CI pipeline (`.github/workflows/ci.yml`): api job + frontend job + all-green gate
  - API job: typecheck → prisma:validate → prisma:generate → migrate:deploy → tests (coverage ≥70%) → build
  - Frontend job: lint → typecheck → build
  - Postgres 16 service container; cancel-in-progress concurrency

**Phase 4a Status: COMPLETE** ✅

---

---

## Phase 4a — API Security + Typed Frontend SDK + CI Pipeline ✅ COMPLETE

- [x] `requireAuth` wired on all 9 core domain routes (partners, products, crm, sales, accounting, inventory, purchases, helpdesk, projects)
- [x] Typed frontend domain SDK — `crmApi`, `salesApi`, `accountingApi`, `inventoryApi`, `purchasesApi`, `helpdeskApi`, `projectsApi`, `partnersApi`, `productsApi` in `api.ts`
- [x] `.github/workflows/ci.yml` — lint → typecheck → prisma:validate → test (≥70% coverage gate) → build; `all-green` gate job

## Phase 4b — CRM Flow Integration ✅ COMPLETE

- [x] `crmStore.ts` migrated from raw axios to typed `crmApi`; raw `API_BASE` removed
- [x] Flow A actions added to store: `qualifyLead(id)`, `markWon(id)`, `newQuotation(id)`
- [x] CRM form flow buttons: ✓ Qualify / 🏆 Mark Won / ✗ Mark Lost / 📋 New Quotation (context-aware visibility)
- [x] `crmApi` paths corrected to match actual route structure (`/api/crm/leads/*`)
- [x] `salesApi` base path corrected from `/api/sale` to `/api/sales`

## Phase 4c — Sales + Accounting Flow Integration ✅ COMPLETE

- [x] `salesStore.ts` migrated to `salesApi`; `confirmOrder`/`cancelOrder`/`createInvoice` re-throw on error for UI toasts
- [x] Sales order form: **Confirm Order** / **Create Invoice** / **Cancel** flow buttons (already in SalesModule.tsx; now backed by typed SDK)
- [x] `accountingStore.ts` migrated to `accountingApi`; `registerPayment(id)` action added (calls `POST /api/accounting/moves/:id/pay`)
- [x] Accounting move form: **Post** button + **💳 Register Payment** button (visible for posted invoices/bills where `paymentState !== 'paid'`); 3-step `Draft → Posted → In Payment` progress chevrons
- [x] `purchasesApi` paths fixed: `/api/purchase` → `/api/purchases`; `validateReceipt` removed; `postBill`/`payBill` added
- [x] `helpdeskApi` ticket paths fixed: list/get/create/update now use `/api/helpdesk/tickets/*`; `moveStage` + `pipeline` added
- [x] `accountingApi` completed: `updateMove` + `listAccounts` added

## Phase 4d — Inventory + Purchases + Helpdesk Flow UI ✅ COMPLETE

- [x] `inventoryStore` wired to `inventoryApi`; `markReady(id)` / `validatePicking(id)` actions added
- [x] Inventory picking form: **Mark Ready** / **Validate** flow buttons (Flow B)
- [x] Purchases store wired to `purchasesApi`; `confirmPO`, `createBill`, `postBill`, `payBill` actions added
- [x] PO form: **Confirm** / **Create Bill** / **Post Bill** / **Pay Bill** flow buttons (Flow D)
- [x] Wire Flow E (Helpdesk: createTask / addTimesheet) to HelpdeskModule form

---

## Phase 4 — Module Completion (remaining)

Priority order: partners → products → sales → accounting → inventory → purchase → helpdesk → project → timesheets → hr → manufacturing → quality → plm → pos → ecommerce → website → subscriptions → marketing → events → surveys → discuss → notes → knowledge → calendar → spreadsheet → automation → studio → rental → field-service

Per-module DoD (copy to `docs/module-checklists/<module>.md`):
- [ ] Domain model finalized (Prisma)
- [ ] Linked to spine (orgId, companyId, partnerId, productId)
- [ ] API routes + Zod validation + auth checks
- [ ] Audit + Timeline events emitted
- [ ] Outbox events for cross-module triggers
- [ ] List / Kanban / Form UI
- [ ] Search + filters; loading/error/empty states
- [ ] Permission-aware UI
- [ ] Mobile-responsive + a11y (axe-core pass)
- [ ] Unit + integration + E2E tests
- [ ] Module checklist file ticked
- [ ] User 1-pager doc

---

## Phase 5 — AI Layer

- [x] `AiAction` table: agentKey, userId, entityType, entityId, tool, input, output, confidence, approvedById, approvedAt, appliedAt, rolledBackAt
- [x] Approval workflow primitive (no AI auto-post to finance/legal) — approve/reject/apply/rollback endpoints
- [x] Helpdesk triage agent (category + priority + suggested reply) — `core/ai/agents/helpdeskTriage.ts`
- [x] Customer summary agent (cached, regenerated on timeline event) — `core/ai/agents/customerSummary.ts`
- [x] `@anthropic-ai/sdk` installed; `core/ai/index.ts` agent runner + registry
- [x] `POST /api/ai/run`, `GET /api/ai/actions`, approve/reject/apply/rollback endpoints
- [x] `aiActionsApi` typed SDK in `frontend/src/lib/api.ts`
- [x] Lead scoring agent — `core/ai/agents/leadScoring.ts` (score 0-100, tier hot/warm/cold)
- [x] Invoice anomaly detector — `core/ai/agents/invoiceAnomaly.ts` (flag-only, never auto-edits)
- [x] Stock reorder recommender — `core/ai/agents/stockReorder.ts` (user confirms)
- [x] `AiActionsPanel` React component — approve/reject/run UI wired into HelpdeskModule
- [x] `emitTimeline()` wired into all Phase-3 state transitions (confirmSO, validatePicking, postInvoice, registerPayment, confirmPO)
- [x] IrSequence model + `core/sequence/nextval()` — atomic SO/INV/PO/TKT numbering
- [x] 6 new ADRs (0008–0013) — sequences, jobs, PDF, email, tax, record-RBAC
- [x] ERP architecture gap analysis — `docs/erp-architecture-gaps-2026-05-07.md`
- [ ] Document intelligence agent (OCR + classification + extraction, ≥0.85 confidence gate)
- [ ] Partner deduplication agent
- [ ] Next-best-action agent
- [ ] Quote drafter agent (status DRAFT only, user sends)
- [ ] RAG enforces permission filters (test included)
- [ ] Evals golden set per agent; CI runs on prompt/agent changes

### Phase 5c — ERP Foundation Gaps (from gap analysis G-01 to G-15)
- [ ] G-03: `api/src/jobs/outboxRelay.ts` — background cron worker (ADR-0009)
- [ ] G-04: `<ChatterPanel>` React component + wire into module forms
- [ ] G-05: `core/pdf/index.ts` — pdfkit invoice/quote generation (ADR-0010)
- [ ] G-06: `core/email/index.ts` — nodemailer transactional emails (ADR-0011)
- [ ] G-07: `AccountTax` model + `core/tax/index.ts` — proper tax computation (ADR-0012)
- [ ] G-08: `PaymentTerm` model + invoice due-date calculation
- [ ] G-09: Customer `Pricelist` model + sales line pricing lookup
- [ ] G-11: `AccountingPeriod` model + period lock check in posting routes
- [ ] G-12: Wire real data into AI Actions panel (currently built; discuss module still uses mock)
- [ ] G-14: Record-level RBAC row filters — `core/auth/recordRules.ts` (ADR-0013)
- [ ] G-15: COGS `AccountMove` entries on picking validation

**Hard rule:** No AI agent can post invoices, reconcile, send legal docs, or delete records.

---

## Phase 6 — Quality, Testing, CI/CD

- [ ] Unit test coverage ≥ 80% on `core/` and Phase-3 module services
- [ ] Integration tests on API + Postgres for all Phase-3 flows
- [ ] OpenAPI generated from Zod + contract test (frontend client matches)
- [ ] Playwright: lead-to-cash, procure-to-pay, ticket-to-invoice, partner profile
- [ ] CI pipeline: lint → typecheck → prisma:validate → test:unit → test:integration → test:e2e → build → scan → evals
- [ ] Branch protection on `main` (green CI + 1 review)
- [ ] commitlint enforced

---

## Phase 7 — Production Infrastructure

- [ ] `infra/docker-compose.prod.yml`: api, frontend(nginx), backend(AI), postgres, redis, qdrant, worker, reverse proxy (TLS)
- [ ] Structured JSON logs (pino) → Loki/Datadog/CloudWatch
- [ ] Prometheus metrics `/metrics` + default dashboards
- [ ] OpenTelemetry traces frontend → api → backend
- [ ] Sentry on frontend + api + backend
- [ ] Uptime monitor on `/health` + `/ready`
- [ ] Postgres: daily logical backups + WAL archiving (PITR)
- [ ] Backup + restore drill executed and documented
- [ ] Rollback runbook: `docs/runbooks/rollback.md`
- [ ] Semver tags; forward-compatible migration strategy
- [ ] GDPR: data export + erasure endpoints
- [ ] Staging: auto-deploy on merge to `main`
- [ ] Production: deploy on tagged release with manual approval

---

## Deployment-Ready Checklist

See Section 12 of `CLAUDE_CODE_BUILD_PLAN.md` for the full definition.
All boxes must be checked before shipping to customers.

### Build & Runtime
- [x] `frontend` production build passes
- [x] `api` production build passes
- [ ] Docker images build reproducibly with non-root user
- [x] Production refuses to start with placeholder secrets

### Database
- [x] Prisma datasource = postgresql
- [ ] `prisma migrate reset && prisma db seed` works on clean DB
- [ ] Backups + tested restore exist
- [ ] All business records carry `organizationId`

### Security
- [ ] Auth on every protected route
- [ ] RBAC + record rules enforced
- [ ] Audit logs on every mutation
- [ ] Rate limiting + CSRF + Helmet on
- [ ] File upload scanned, signed URLs only
- [ ] No critical/high in dependency or container scans
- [ ] Cross-tenant test returns 404

### Product
- [ ] Lead → Quote → Order → Delivery → Invoice → Payment E2E
- [ ] RFQ → PO → Receipt → Bill → Payment E2E
- [ ] Ticket → Task → Timesheet → Billable line E2E
- [ ] Partner profile aggregates every module
- [ ] Chatter + attachments + activities on every business record
- [ ] AI drafts/suggests only — cannot post finance/legal without approval

### Quality
- [ ] CI green on `main`
- [ ] Coverage ≥ 80% on core + Phase-3 services
- [ ] Playwright passes for 5 flows + partner profile
- [ ] OpenAPI contract test passes

### Operations
- [ ] Observability live
- [ ] Backup + restore + rollback runbooks executed
- [ ] Uptime monitor active
- [ ] Module checklists ticked for every shipped module
