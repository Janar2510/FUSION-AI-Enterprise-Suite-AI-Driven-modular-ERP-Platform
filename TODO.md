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

- [ ] Implement `Organization`, `Company`, `User`, `Role`, `Permission`, `UserRole` models (full migration)
- [ ] Upgrade existing `Partner` to canonical spine (String IDs, organizationId, companyId, isEmployee, consent fields)
- [ ] Upgrade existing `Product` to canonical spine (String IDs, ProductType enum, unitOfMeasure, salesPrice/costPrice)
- [ ] Implement `tenantDb()` wrapper + ESLint rule for raw Prisma calls
- [ ] Implement `audit()` helper in `core/audit/`
- [ ] Implement `emitTimeline()` helper in `core/timeline/`
- [ ] Implement `publishEvent()` outbox helper in `core/outbox/`
- [ ] Implement `GET /api/partners/:id/profile` — aggregated 360° view
- [ ] Seed: 1 org, 1 company, 5 users, 25 partners, 50 products, sample CRM/sales/invoice/ticket
- [ ] `npx prisma migrate reset && npx prisma db seed` works end-to-end
- [ ] Integration test: `GET /api/partners/:id/profile` returns ≥1 of each module section

**Exit criteria:** All Phase 1 checklist items above green.

---

## Phase 2 — Auth, Security, RBAC

- [ ] Register / login / logout / password reset / email verification
- [ ] TOTP MFA (optional), WebAuthn passkeys (optional)
- [ ] Password hashing with argon2id
- [ ] `requireAuth` middleware (session cookie + JWT)
- [ ] `requirePermission(key)` middleware
- [ ] Record rules (per-module Prisma `where` filter)
- [ ] Zod schemas on every mutation route
- [ ] Standard error envelope `{ error: { code, message, fields, requestId } }`
- [ ] Rate limiting (express-rate-limit)
- [ ] CSRF protection
- [ ] Helmet CSP tightened
- [ ] Body size limits; file upload: content-type allowlist + magic-byte + size cap + virus scan hook
- [ ] Audit every privileged action, every login/failed-login
- [ ] `infra/secrets/README.md` with required keys

**Exit criteria:** All Phase 2 checklist items above green.

---

## Phase 3 — End-to-End Business Flows

- [ ] **Flow A:** Lead → Qualified → Opportunity → Won → Quotation → Sent → Accepted → SaleOrder(CONFIRMED)
- [ ] **Flow B:** SaleOrder(CONFIRMED) → StockPicking(DRAFT → READY → DONE) → SaleOrder(DELIVERED)
- [ ] **Flow C:** SaleOrder(DELIVERED) → Invoice(DRAFT → POSTED) → Payment(REGISTERED) → Reconciled
- [ ] **Flow D:** RFQ → PO(CONFIRMED) → Receipt(DONE) → VendorBill(POSTED) → Payment
- [ ] **Flow E:** Ticket → Task → Timesheet → SaleOrderLine(billable)
- [ ] All 5 flows have backend integration tests
- [ ] All 5 flows have Playwright E2E tests
- [ ] All 5 flows write TimelineEvents visible in partner profile
- [ ] Posted invoices cannot be mutated (DB-level + service-level)
- [ ] Idempotency keys on all confirm/post/pay endpoints

**Exit criteria:** All Phase 3 checklist items above green.

---

## Phase 4 — Module Completion

Priority order: partners → products → crm → sales → accounting → inventory → purchase → helpdesk → project → timesheets → hr → manufacturing → quality → plm → pos → ecommerce → website → subscriptions → marketing → events → surveys → discuss → notes → knowledge → calendar → spreadsheet → automation → studio → rental → field-service

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

- [ ] `AiAction` table: agentKey, userId, entityType, entityId, tool, input, output, confidence, approvedById, approvedAt, appliedAt, rolledBackAt
- [ ] Approval workflow primitive (no AI auto-post to finance/legal)
- [ ] Document intelligence agent (OCR + classification + extraction, ≥0.85 confidence gate)
- [ ] Partner deduplication agent
- [ ] Customer summary agent (cached, regenerated on timeline event)
- [ ] Next-best-action agent
- [ ] Lead scoring agent (nightly batch)
- [ ] Quote drafter agent (status DRAFT only, user sends)
- [ ] Invoice anomaly detector (flag-only, never auto-edit)
- [ ] Stock reorder recommender (user confirms)
- [ ] Helpdesk triage agent (category + priority + suggested reply)
- [ ] RAG enforces permission filters (test included)
- [ ] Evals golden set per agent; CI runs on prompt/agent changes

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
