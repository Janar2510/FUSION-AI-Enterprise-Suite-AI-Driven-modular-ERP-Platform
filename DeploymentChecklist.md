# FusionAI Enterprise Suite - Deployment Checklist

## Agent orchestration & knowledge (2026-05-12)

- [ ] **Read first on any long session:** [`BUILD_STATE.md`](BUILD_STATE.md) → [`docs/BUILD_ORCHESTRATION.md`](docs/BUILD_ORCHESTRATION.md) (checkpoint + active track A/B/C).
- [ ] **Doc aliases in place:** [`docs/architecture.md`](docs/architecture.md), [`docs/ai-rules.md`](docs/ai-rules.md) (stable paths for tools expecting `architecture.md` / `ai-rules.md`).
- [ ] **Obsidian (optional):** open **`docs/`** as a vault per [`docs/OBSIDIAN_VAULT.md`](docs/OBSIDIAN_VAULT.md); decide whether `docs/.obsidian/` is committed or gitignored.
- [ ] **Ruflo (optional dev tooling):** run `npm install -g ruflo@latest` then `ruflo init` locally if using Ruflo swarm; not required for production deploy (see `docs/BUILD_ORCHESTRATION.md`).
- [ ] **Orchestration docs:** Keep [`BUILD_STATE.md`](BUILD_STATE.md) and [`docs/BUILD_ORCHESTRATION.md`](docs/BUILD_ORCHESTRATION.md) aligned after major milestones (pause/resume handshake).

### Calendar adapter (Track B, 2026-05-12)
- [ ] Smoke: authenticated `POST /api/calendar/events` with `{ "name": "Test", "start": "<ISO>", "stop": "<ISO>" }` → 201 (same as `POST /api/calendar`)

### CRM module settings + JWT roles (Track B, 2026-05-12)
- [ ] After deploy, **re-login** so access tokens pick up **`roles` = `SpineRole.key`** (e.g. `admin`) from `loadUserPermissions`.
- [ ] Smoke: **`GET /api/settings/crm`** (auth) → 200 JSON (possibly `{}` first load).
- [ ] Smoke: **`PUT /api/settings/crm`** with `{ "multiTeams": true, "leadMining": false, "predictiveScoring": true, "ruleBasedAssignment": false }` → 200; verify rows in `SystemConfig` with keys `crm.multiTeams`, etc.
- [ ] UI: open **CRM → Settings**, toggle features, **Save** → success toast; reload page → values persist.

## Marketing Automation Activities + Audience Targeting (2026-05-11)

### Database Steps
- [ ] Apply migration: `cd api && npx prisma migrate deploy`
  - Creates `campaign_activities` table with FK to `marketing_campaigns`
  - Creates `campaign_participants` table with FK to `marketing_campaigns`
  - Migration `20260511120000_marketing_workflow_engine`: adds `next_action_at` on `campaign_participants`, composite index on `(state, next_action_at)`, creates `campaign_traces` with FKs to campaigns, activities, and participants
- [ ] Confirm migration applied: `cd api && npx prisma migrate status`

### Runtime / ops
- [ ] API process runs with **`api/src/jobs/index.ts`** job bootstrap (includes **`campaignWorkflowRunner`** cron ~30s); without it, launched campaigns will not advance past scheduled `nextActionAt`.
- [ ] **SMTP / outbox** — marketing email uses the same transactional outbox + relay as bulk mail; ensure SMTP (or configured provider) is valid in the target environment or traces will show failures.

### New API Endpoints (smoke-test after deploy)
- [ ] `GET /api/campaigns/:id/activities` (auth required) → 200 activity list
- [ ] `POST /api/campaigns/:id/activities` `{ name, type, sequence, delayValue, delayUnit }` → 201
- [ ] `PUT /api/campaigns/:id/activities/:activityId` → 200
- [ ] `DELETE /api/campaigns/:id/activities/:activityId` → 200 `{ success: true }`
- [ ] `POST /api/campaigns/:id/activities/:activityId/compose` with `{ "templateMailingId": 1 }` → 200 activity with imported `subject`, `body`, `templateRef`
- [ ] `POST /api/campaigns/:id/activities/:activityId/compose` with `{ "subject": "Welcome", "bodyHtml": "<p>Hello</p>" }` → 200 activity with custom content
- [ ] `GET /api/campaigns/:id/participants` (auth required) → 200 participant list
- [ ] `POST /api/campaigns/:id/participants/resolve` with `targetModel: "partner"` → 201
- [ ] `POST /api/campaigns/:id/participants/resolve` with `targetModel: "crm_lead"` → 201
- [ ] `POST /api/campaigns/:id/launch` on a `draft` campaign with ≥1 activity → 200 with `state: "active"` and a populated `startDate`
- [ ] `POST /api/campaigns/:id/launch` on a campaign with zero activities → 422 `{ "error": "Cannot launch a campaign with no activities" }`
- [ ] `POST /api/campaigns/:id/launch` on an already `active` or `completed` campaign → 409 (no state change)
- [ ] `POST /api/campaigns/:id/launch` on an unknown id → 404
- [ ] `POST /api/campaigns/:id/launch` on a `paused` campaign with activities → 200 with `state: "active"` (resume path)

### Workflow runner (after deploy, optional DB checks)
- [ ] Launch a campaign with an **email** activity and resolved participants → participants get `nextActionAt` (or `null` for immediate first step per product rules); after cron + outbox relay, `campaign_traces` rows exist and activity counters move when SMTP succeeds.

### Verification
- [x] Focused test: `npm --prefix api test -- --testPathPatterns=campaigns.activities`
- [x] Focused test: `npm --prefix api test -- --testPathPatterns=campaigns.workflow`
- [x] API TypeScript check: `npm --prefix api run lint`

## Sprint 20 — AI Rollout + Production Hardening (2026-05-10)

### AI Agents Wired (Sprint 20)
- [x] `optimize_production` agent — Manufacturing module, registered in `ai-actions.ts`
- [x] `knowledge-article-draft` agent — Knowledge module, registered in `ai-actions.ts`
- [x] `recommend_training` agent — HR module, registered in `ai-actions.ts`
- [x] `analyze_performance` agent — HR module, registered in `ai-actions.ts`
- [x] `predict_churn` agent — Subscriptions module, registered in `ai-actions.ts`
- [x] `evaluate_vendor` agent — Purchases module, registered in `ai-actions.ts`

### RAG Permission Filter
- [x] `api/src/core/rag/index.ts` — `RagService` enforces `userId`/`orgId` on all index and search operations
- [x] `VectorAdapter` interface defined; `InMemoryVectorAdapter` provided for dev/test

### Golden-Set AI Evals (CI Gate)
- [x] `api/src/__tests__/ai/agents.eval.test.ts` — covers all 6 new agents with mocked Anthropic client
- [ ] Run: `cd api && npx jest --testPathPattern=ai/agents.eval.test` — must exit 0 before deploy

### Auth on Every Route (Sprint 20 Audit)
Routes that now require `requireAuth` (added this sprint):
- [x] `automation.ts` — `router.use(requireAuth)` + **`requirePermission('automation.read'|'automation.write')`** per route (2026-05-12)
- [x] `calendar.ts` — `router.use(requireAuth)`
- [x] `campaigns.ts` — `router.use(requireAuth)`
- [x] `dashboard.ts` — `router.use(requireAuth)`
- [x] `ecommerce.ts` — AI endpoints only (`/ai/recommendations`, `/ai/cart-abandonment`, `/ai/cart-abandonment/recover`)
- [x] `planning.ts` — `router.use(requireAuth)`
- [x] `pos.ts` — `router.use(requireAuth)`
- [x] `settings.ts` — `router.use(requireAuth)`
- [x] `skills.ts` — `router.use(requireAuth)`
- [x] `spreadsheet.ts` — `router.use(requireAuth)`

### ChatterPanel + AiActionsPanel Wired (Sprint 20)
- [x] Appraisals (`AppraisalsModule.tsx`)
- [x] Fleet (`FleetModule.tsx`)
- [x] Leaves (`LeavesModule.tsx`)
- [x] Payroll (`PayrollModule.tsx`)
- [x] Rental (`RentalModule.tsx`)
- [x] Sign (`SignMain.tsx`)
- PLM was wired in Sprint 18

### Production Hardening — Still Required Before Go-Live
- [ ] `prisma migrate reset && npx prisma db seed` — verified on clean DB (run before deploy)
- [ ] Backup + restore drill executed (document result)
- [ ] Branch protection on `main` enabled in GitHub repository settings
- [ ] Playwright E2E suite passes all 5 critical flows:
  1. Login → Dashboard → CRM lead create
  2. Sales order → Invoice → Payment
  3. Manufacturing order → Confirm → Produce
  4. Helpdesk ticket → SLA breach alert
  5. HR leave request → Approval workflow

### New API Endpoints Added This Sprint (smoke-test after deploy)
- [ ] `POST /api/ai/run` with `{ "agentKey": "optimize_production", ... }` → 200
- [ ] `POST /api/ai/run` with `{ "agentKey": "knowledge-article-draft", ... }` → 200
- [ ] `POST /api/ai/run` with `{ "agentKey": "recommend_training", ... }` → 200
- [ ] `POST /api/ai/run` with `{ "agentKey": "analyze_performance", ... }` → 200
- [ ] `POST /api/ai/run` with `{ "agentKey": "predict_churn", ... }` → 200
- [ ] `POST /api/ai/run` with `{ "agentKey": "evaluate_vendor", ... }` → 200

### Environment Variables Required
- `ANTHROPIC_API_KEY` — required for all AI agents (was already required since Sprint 10)

---

## Sprint 12 — Persistence & Frontend Wiring: Pre-Deployment Notes (2026-05-10)

### Database Steps
- [ ] Apply migration: `cd api && npx prisma migrate deploy`
  - Creates `sign_requests` and `sign_signers` tables
- [ ] Confirm migration applied: `cd api && npx prisma migrate status`

### New API Endpoints (smoke-test after deploy)
- [ ] `GET /api/sign/requests` (auth required) → 200 paginated list
- [ ] `POST /api/sign/requests` `{ documentTitle, signers: [{ name, email }] }` → 201
- [ ] `PUT /api/sign/requests/:id/sign` `{ signerId, signatureData }` → 200
- [ ] `POST /api/sign/requests/:id/signers` `{ name, email, role }` → 201

### Frontend Changes
- **Sign module**: fully wired to backend — no remaining in-memory state.
- **Invoicing**: payment and credit-note lists now fetch on mount.
- **HR**: private employee info fetched/saved via dedicated endpoints.
- **Quality**: new "Control Points" tab with inline tolerance editor.
- **Notes**: tag chip input in note editor; tags visible on kanban cards.

---

## Sprint 11 — Security Fixes & Module Completions: Pre-Deployment Notes (2026-05-10)

### ⚠️ Critical Security Notes
- Invoicing and Quality routes were **unauthenticated** before this sprint — all existing sessions remain valid; no user action needed.
- HR timesheet endpoint now enforces `hr.read` permission for full-list access. Ensure HR managers have this permission in the DB before deploying.

### Database Steps
- [ ] Apply migration: `cd api && npx prisma migrate deploy`
  - Adds `toleranceMin/toleranceMax` to `quality_points`
  - Adds `tags TEXT[]` to `notes`
  - Creates `bank_statements` and `bank_statement_lines` tables
- [ ] Confirm migration applied: `cd api && npx prisma migrate status`

### New API Endpoints (smoke-test after deploy)
- [ ] `GET /api/invoicing/products` → 200 paginated product list
- [ ] `POST /api/invoicing/payments` `{ invoiceId, amount, paymentDate }` → 201
- [ ] `GET /api/invoicing/credit-notes` → 200 paginated list
- [ ] `GET /api/hr/employees/:id/private` (requires `hr.read` token) → 200
- [ ] `GET /api/hr/timesheets/weekly?weekStart=2026-05-05` → 200 grid
- [ ] `PUT /api/hr/departments/:id` `{ name: "Engineering" }` → 200
- [ ] `PATCH /api/quality/checks/:id/measure` `{ measureValue: 5.2 }` → 200 with state=pass/fail

### Permissions Required
- `hr.read` — grants access to full employee private info and unrestricted timesheet listing

---

## Sprint 10 — Shared Infrastructure Layer: Pre-Deployment Notes (2026-05-10)

### Database Steps
- [ ] Run roles seed: `cd api && npx tsx scripts/seed-roles.ts` (use **`tsx`**, not **`ts-node`**, for path-aligned runs)
  - Idempotent upsert of all roles, permissions, and role-permission links. **Re-run after introducing new `PERMISSIONS` keys** (e.g. `automation.read` / `automation.write`).
- [ ] No schema migration needed — `SpineRole`, `SpinePermission`, `SystemConfig`, `ChatterMessage` models already exist.

### Environment Variables
- Ensure `ANTHROPIC_API_KEY` is set — 4 new AI agents call Claude directly.

### New API Endpoints (smoke-test after deploy)
- [ ] `GET /api/settings/crm` → 200 JSON object (module settings namespace)
- [ ] `PUT /api/settings/crm` with `{ "lead_expiry_days": 30 }` → 200 `{ module, saved }`
- [ ] `GET /api/sales/:id/messages` → 200 array
- [ ] `POST /api/sales/:id/messages` with `{ "body": "test" }` → 201
- [ ] `GET /api/helpdesk/:id/messages` → 200 array
- [ ] New AI agents available via `POST /api/ai/run`:
  - `{ "agentKey": "appraisal-coach", ... }`
  - `{ "agentKey": "recruitment-ranker", ... }`
  - `{ "agentKey": "attendance-anomaly", ... }`
  - `{ "agentKey": "planning-optimizer", ... }`

### Permission Guards Added
- `accounting.post` — required to post journal entries
- `accounting.pay` — required to register payments
- `payroll.write` — required to create payslips
- `payroll.delete` — required to delete payslips
- `gdpr.erase` — required to trigger GDPR erasure
- `settings.write` — required to update module settings
- Ensure users have appropriate roles seeded before upgrading to prevent lockout.

### Chatter Endpoints Added to Modules
crm, sales, purchases, invoicing, hr, projects, maintenance, manufacturing, inventory, helpdesk
— each now has `GET|POST /api/<module>/:id/messages`

---

## Sprint 7 — Settings UI & Users API: Pre-Deployment Notes (2026-05-10)

### No Database Migration Required
- Settings Users endpoint reads from the existing `SpineUser` table — no schema changes.

### New API Endpoints (smoke-test after deploy)
- [ ] `GET /api/settings/users` → 200 list of users

### Frontend Changes
- Settings page now has a fifth "Accounting" tab — verify Payment Terms and Pricelists CRUD works end-to-end.
- Settings "Users & Roles" tab now loads live data; no mock users.

---

## Sprint 6 — Bug Fixes & New Entities: Pre-Deployment Notes (2026-05-10)

### Required Database Migration
- [ ] `cd api && npx prisma migrate dev --name sprint6_crm_payment_pricelist`
  - Adds `crm_activities` table with FK to `crm_leads`
  - No destructive changes to existing tables
- [ ] `npx prisma generate` — regenerate client (already done in dev)

### New API Endpoints (smoke-test after deploy)
- [ ] `GET /api/crm/leads/:id/activities` → 200 (empty array OK)
- [ ] `GET /api/payment-terms` → 200 paginated list
- [ ] `GET /api/pricelists` → 200 paginated list
- [ ] `POST /api/pricelists/:id/compute` with `{ productId, qty }` → 200 with `price`

### Notes
- `GET /api/hr/timesheets` now accepts `employee_id` and `project_id` query params — no breaking change for existing callers.

---

## Phase 1 — Canonical Data Spine: Pre-Migration Checklist (2026-05-06)

> Run these steps **before** deploying Phase 1 to any environment.

### Database Migration
- [ ] `DATABASE_URL` set to a writable PostgreSQL 14+ instance
- [ ] Run: `cd api && npx prisma migrate dev --name init_spine`
- [ ] Verify migration applied: `npx prisma migrate status` shows all applied
- [ ] Run seed: `npm run db:seed` — confirm 1 org, 1 company, admin user created
- [ ] Verify: `psql $DATABASE_URL -c "SELECT count(*) FROM \"Organization\";"` returns 1

### API Smoke Tests
- [ ] `npm run lint` exits 0 (TypeScript: zero errors)
- [ ] `npm test` exits 0 (8/8 integration tests passing)
- [ ] `curl /api/health` returns `200 { status: "ok" }`
- [ ] `curl /api/partners` returns paginated list (seeded data)
- [ ] `curl /api/partners/<seeded-id>/profile` returns 200 with `summary`, `crm`, `sales` keys

### New Environment Variables (Phase 1 — no new required vars)
- `DATABASE_URL` — already required; now targets a schema with `Organization` table
- `SESSION_SECRET`, `JWT_SECRET` — already guarded by production-secret-guard

### Rollback Plan
- Prisma migrations are reversible: `npx prisma migrate resolve --rolled-back <migration-name>`
- `Partner.id` and `Product.id` changed from `Int` → `String (CUID)` — **data migration required** if upgrading an existing populated database (generate CUIDs for existing rows before applying constraint change)

---

## Pre-Deployment Checklist

### ✅ Environment Setup
- [ ] **System Requirements Met**
  - [ ] CPU: 4+ cores (8+ recommended)
  - [ ] RAM: 8GB+ (16GB+ recommended)
  - [ ] Storage: 50GB+ SSD (100GB+ recommended)
  - [ ] OS: Linux (Ubuntu 20.04+), macOS, or Windows with WSL2

- [ ] **Software Dependencies Installed**
  - [ ] Docker 20.10+
  - [ ] Docker Compose 2.0+
  - [ ] Node.js 18+
  - [ ] Python 3.11+
  - [ ] Git 2.30+

- [ ] **Optional Dependencies**
  - [ ] Kubernetes 1.24+ (for production)
  - [ ] Helm 3.0+ (for Kubernetes)
  - [ ] Terraform 1.0+ (for infrastructure)

### ✅ Configuration
- [ ] **Environment Variables Set**
  - [ ] Database connection strings
  - [ ] Redis connection string
  - [ ] Qdrant connection string
  - [ ] AI API keys (OpenAI/Anthropic)
  - [ ] JWT secret keys
  - [ ] CORS origins
  - [ ] External service credentials
  - [ ] API server port (default: 3001)
  - [ ] WebSocket server port (default: 8080)
  - [ ] Frontend proxy configuration for API calls

- [ ] **Security Configuration**
  - [ ] Strong passwords for all services
  - [ ] SSL/TLS certificates configured
  - [ ] Firewall rules configured
  - [ ] Security headers enabled
  - [ ] Rate limiting configured

- [ ] **Database Setup**
  - [ ] PostgreSQL database created
  - [ ] Database user created with proper permissions
  - [ ] Extensions installed (uuid-ossp, pg_trgm)
  - [ ] Initial schema applied

### ✅ Code Quality
- [ ] **Tests Passing**
  - [ ] Unit tests: >80% coverage
  - [ ] Integration tests passing
  - [ ] E2E tests passing
  - [ ] AI agent tests passing
  - [ ] Security tests passing

- [ ] **Code Quality Checks**
  - [ ] Linting passed (ESLint, Black, isort)
  - [ ] Type checking passed (TypeScript, mypy)
  - [ ] Security scan passed
  - [ ] Dependency audit passed
  - [ ] Performance benchmarks met

## Development Environment Deployment

### ✅ Local Development Setup
- [ ] **Repository Cloned**
  ```bash
  git clone <repository-url>
  cd fusionai-enterprise-suite
  ```

- [ ] **Setup Script Executed**
  ```bash
  chmod +x scripts/setup.sh
  ./scripts/setup.sh
  ```

- [ ] **Environment File Created**
  ```bash
  cp config/env.example .env
  # Edit .env with your configuration
  ```

- [ ] **Dependencies Installed**
  - [ ] Backend: `pip install -r backend/requirements.txt`
  - [ ] Frontend: `npm install` in frontend directory

- [ ] **Database Services Started**
  ```bash
  docker-compose up -d postgres redis qdrant
  ```

- [ ] **Application Started**
  - [ ] Backend: `uvicorn src.main:app --host 0.0.0.0 --port 3001 --reload`
  - [ ] Frontend: `npm run dev` (uses Vite proxy to backend)
  - [ ] WebSocket Server: Running on port 8080

- [ ] **Health Checks Passed**
  - [ ] Backend API: http://localhost:3001/health
  - [ ] Frontend: http://localhost:5173 (Vite dev server)
  - [ ] API Docs: http://localhost:3001/docs
  - [ ] WebSocket: http://localhost:8080/ws/health

## Staging Environment Deployment

### ✅ Staging Setup
- [ ] **Environment Configuration**
  - [ ] Staging environment variables set
  - [ ] Database configured for staging
  - [ ] External services configured
  - [ ] Monitoring configured

- [ ] **Docker Compose Deployment**
  ```bash
  export ENVIRONMENT=staging
  docker-compose -f docker-compose.staging.yml up -d
  ```

- [ ] **Database Migrations**
  ```bash
  docker-compose exec backend alembic upgrade head
  ```

- [ ] **Verification Tests**
  - [ ] All services running
  - [ ] API endpoints responding
  - [ ] Database connectivity
  - [ ] AI agents functioning
  - [ ] WebSocket connections working

## Production Environment Deployment

### ✅ Production Setup
- [ ] **Infrastructure Ready**
  - [ ] Kubernetes cluster configured
  - [ ] Load balancer configured
  - [ ] SSL certificates installed
  - [ ] Domain DNS configured
  - [ ] CDN configured (if applicable)

- [ ] **Secrets Management**
  - [ ] Kubernetes secrets created
  - [ ] Database credentials secured
  - [ ] API keys secured
  - [ ] SSL certificates stored securely

- [ ] **Kubernetes Deployment**
  ```bash
  kubectl create namespace fusionai
  kubectl apply -f infrastructure/kubernetes/
  helm install fusionai ./helm-charts/fusionai-enterprise-suite
  ```

- [ ] **Database Setup**
  - [ ] Production database created
  - [ ] User permissions configured
  - [ ] Backup strategy implemented
  - [ ] Monitoring configured

### ✅ Monitoring & Logging
- [ ] **Application Monitoring**
  - [ ] Prometheus configured
  - [ ] Grafana dashboards imported
  - [ ] Alert rules configured
  - [ ] Metrics collection working

- [ ] **Logging Setup**
  - [ ] ELK stack deployed
  - [ ] Log aggregation configured
  - [ ] Log retention policies set
  - [ ] Error tracking configured (Sentry)

- [ ] **Health Monitoring**
  - [ ] Health check endpoints responding
  - [ ] Uptime monitoring configured
  - [ ] Performance monitoring active
  - [ ] Alert notifications working

### ✅ Security Verification
- [ ] **Network Security**
  - [ ] Firewall rules applied
  - [ ] VPN access configured (if needed)
  - [ ] DDoS protection enabled
  - [ ] WAF configured (if applicable)

- [ ] **Application Security**
  - [ ] Authentication working
  - [ ] Authorization tested
  - [ ] Input validation working
  - [ ] Rate limiting active
  - [ ] Security headers present

- [ ] **Data Security**
  - [ ] Encryption at rest enabled
  - [ ] Encryption in transit enabled
  - [ ] Backup encryption configured
  - [ ] Access logging enabled

## Post-Deployment Verification

### ✅ Functionality Tests
- [ ] **Core Features**
  - [ ] User authentication/registration
  - [ ] Dashboard loading and data display
  - [ ] Module navigation working
  - [ ] AI chat functionality
  - [ ] Real-time updates working

- [ ] **Module Testing**
  - [ ] All 23 modules accessible
  - [ ] Module data CRUD operations
  - [ ] AI agent responses working
  - [ ] Module-specific features functional
  - [ ] **Implemented Modules Verified**:
    - [ ] CRM module: `/api/v1/crm/*` endpoints working
    - [ ] Sales module: `/api/v1/sales/*` endpoints working
    - [ ] HR module: `/api/v1/hr/*` endpoints working
    - [ ] Project module: `/api/v1/project/*` endpoints working
    - [ ] Inventory module: `/api/v1/inventory/*` endpoints working
    - [ ] Accounting module: `/api/v1/accounting/*` endpoints working
    - [ ] Helpdesk module: `/api/v1/helpdesk/*` endpoints working
    - [ ] Manufacturing module: `/api/v1/manufacturing/*` endpoints working
    - [ ] Purchase module: `/api/v1/purchase/*` endpoints working
    - [ ] Subscriptions module: `/api/v1/subscriptions/*` endpoints working

- [ ] **API Testing**
  - [ ] All API endpoints responding
  - [ ] Authentication endpoints working
  - [ ] AI endpoints functional
  - [ ] WebSocket connections stable

### ✅ Performance Verification
- [ ] **Response Times**
  - [ ] API response time < 200ms (p95)
  - [ ] UI render time < 1 second
  - [ ] Database query performance acceptable
  - [ ] AI agent response time < 2 seconds

- [ ] **Load Testing**
  - [ ] Concurrent user load tested
  - [ ] Database connection pool adequate
  - [ ] Memory usage within limits
  - [ ] CPU usage acceptable

- [ ] **Scalability**
  - [ ] Auto-scaling configured
  - [ ] Resource limits set appropriately
  - [ ] Monitoring thresholds configured
  - [ ] Alert rules for scaling events

### ✅ Backup & Recovery
- [ ] **Backup Systems**
  - [ ] Database backups automated
  - [ ] File storage backups configured
  - [ ] Configuration backups scheduled
  - [ ] Backup verification tests passed

- [ ] **Recovery Testing**
  - [ ] Database restore tested
  - [ ] Application recovery tested
  - [ ] Disaster recovery plan documented
  - [ ] Recovery time objectives met

## Go-Live Checklist

### ✅ Final Verification
- [ ] **All Tests Passing**
  - [ ] Unit tests: 100% passing
  - [ ] Integration tests: 100% passing
  - [ ] E2E tests: 100% passing
  - [ ] Performance tests: All metrics met
  - [ ] Security tests: All vulnerabilities addressed

- [ ] **Documentation Complete**
  - [ ] API documentation updated
  - [ ] User guides created
  - [ ] Admin documentation complete
  - [ ] Troubleshooting guides available

- [ ] **Team Readiness**
  - [ ] Support team trained
  - [ ] Monitoring dashboards accessible
  - [ ] Escalation procedures defined
  - [ ] On-call rotation established

- [ ] **Business Readiness**
  - [ ] User acceptance testing complete
  - [ ] Data migration completed (if applicable)
  - [ ] Go-live communication sent
  - [ ] Rollback plan prepared

### ✅ Launch Day
- [ ] **Pre-Launch**
  - [ ] Final system checks completed
  - [ ] Monitoring dashboards active
  - [ ] Support team on standby
  - [ ] Communication channels open

- [ ] **Launch**
  - [ ] DNS cutover completed
  - [ ] Application accessible to users
  - [ ] Monitoring active
  - [ ] Initial user feedback collected

- [ ] **Post-Launch**
  - [ ] System stability confirmed
  - [ ] Performance metrics reviewed
  - [ ] User feedback addressed
  - [ ] Success metrics tracked

## Maintenance Checklist

### ✅ Daily Tasks
- [ ] **System Health**
  - [ ] Check system status and alerts
  - [ ] Review error logs
  - [ ] Verify backup completion
  - [ ] Monitor performance metrics

### ✅ Weekly Tasks
- [ ] **Security Review**
  - [ ] Review security logs
  - [ ] Check for security updates
  - [ ] Verify access controls
  - [ ] Update dependencies

### ✅ Monthly Tasks
- [ ] **Maintenance**
  - [ ] Apply security patches
  - [ ] Review and optimize performance
  - [ ] Update documentation
  - [ ] Capacity planning review

### ✅ Quarterly Tasks
- [ ] **Comprehensive Review**
  - [ ] Security audit
  - [ ] Performance optimization
  - [ ] Disaster recovery testing
  - [ ] Business continuity review

## Emergency Procedures

### ✅ Incident Response
- [ ] **Incident Detection**
  - [ ] Monitoring alerts configured
  - [ ] Escalation procedures defined
  - [ ] Communication channels established
  - [ ] Incident response team identified

- [ ] **Incident Resolution**
  - [ ] Troubleshooting procedures documented
  - [ ] Rollback procedures tested
  - [ ] Recovery procedures validated
  - [ ] Post-incident review process

### ✅ Rollback Plan
- [ ] **Rollback Procedures**
  - [ ] Database rollback procedures
  - [ ] Application rollback procedures
  - [ ] Configuration rollback procedures
  - [ ] Communication plan for rollback

---

## Sign-off

### Deployment Team
- [ ] **Development Team Lead**: _________________ Date: _______
- [ ] **DevOps Engineer**: _________________ Date: _______
- [ ] **Security Team**: _________________ Date: _______
- [ ] **QA Team Lead**: _________________ Date: _______

### Business Team
- [ ] **Product Manager**: _________________ Date: _______
- [ ] **Business Owner**: _________________ Date: _______
- [ ] **End User Representative**: _________________ Date: _______

### Final Approval
- [ ] **Technical Lead**: _________________ Date: _______
- [ ] **Project Manager**: _________________ Date: _______

---

---

## Sprint 5 — P2 Module Completions (2026-05-10)

### Database Migration (Sprint 5 schema additions)
- [ ] Run: `cd api && npx prisma migrate dev --name sprint5_p2_modules`
- [ ] Verify migration applied: `npx prisma migrate status`
- [ ] Confirm new tables created: `helpdesk_teams`, `appraisal_goals`, `mrp_eco_lines`, `mail_message_reactions`, `hr_recruitment_stages`

### API Verification
- [ ] `cd api && npm run build` exits 0 ✅ (verified)
- [ ] `cd frontend && npx tsc --noEmit` exits 0 ✅ (verified)
- [ ] `GET /api/attendance/analytics/overtime` returns JSON with `data` array
- [ ] `POST /api/attendance/check-in` creates open record; second call returns 409
- [ ] `POST /api/attendance/check-out` closes record and sets `workedHours`
- [ ] `GET /api/helpdesk/teams` returns team list
- [ ] `GET /api/appraisals/:id/goals` returns goal list
- [ ] `GET /api/plm/:id/lines` returns ECO lines; applying `stage=done` mutates BoM
- [ ] `GET /api/recruitment/stages` returns stages; `GET /api/recruitment/pipeline` returns Kanban
- [ ] `GET /api/surveys/public/:id` returns survey without auth (state must be `open`)
- [ ] `GET /api/surveys/:id/results` returns analytics (requires auth)

### Frontend Verification
- [ ] Calendar module renders month grid on load (not stub)
- [ ] Week/day view switching works; current-time line visible
- [ ] Clicking a day/slot opens New Event form pre-populated with date
- [ ] Discuss: real-time messages appear without page reload (WS active)
- [ ] Discuss: adding a reaction persists after reload

### Environment Variables (no new vars required for Sprint 5)

**Deployment Status**: ⏳ In Progress / ✅ Complete / ❌ Failed

**Notes**: 
```
Add any additional notes or observations here
```

---

*This checklist ensures a comprehensive and successful deployment of FusionAI Enterprise Suite. All items must be completed and verified before proceeding to the next phase.*