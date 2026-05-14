# CRM — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/sales/crm.html
**FusionAI status:** Partial
**Effort to complete:** L (1 week)
**Business priority:** P1 (revenue-critical)

---

## Odoo 17 Feature Checklist

### Core Features
- [x] Lead creation (manual) — ✅ Done
- [x] Opportunity creation — ✅ Done
- [x] Lead → Opportunity conversion (Qualify) — ✅ Done
- [x] Kanban pipeline with drag-and-drop stage moves — ✅ Done
- [x] Mark Won / Mark Lost — ✅ Done (Lost sets active=false; no "lost reason" dialog)
- [x] Create quotation from opportunity — ✅ Done (Flow A → SaleOrder)
- [x] Expected revenue & probability fields — ✅ Done
- [x] Priority stars (0–3) — ✅ Done
- [x] Tags on leads — ✅ Done (stored + rendered on kanban cards)
- [x] Partner/contact link — 🟡 Partial (contactName text only; no Many2one partner picker on form)
- [x] Lost reason — ✅ **`PATCH /api/crm/leads/:id/lost`** with optional **`lostReason`**; Mark Lost modal in **`CRMModule`**
- [x] Activities (schedule call, email, meeting with due-date tracking) — ✅ **`GET`/`POST /api/crm/leads/:id/activities`**, **`PATCH`/`DELETE /api/crm/activities/:id`**; **`CrmActivitiesPanel`** on lead form
- [ ] Lead mining / website lead capture — ❌ Missing (setting exists as toggle but no backend)
- [ ] Duplicate detection & merge — ❌ Missing
- [ ] Automated lead assignment (rule-based by territory, salesperson load) — ❌ Missing (toggle exists but not wired)
- [ ] Email integration (leads created from inbound email) — ❌ Missing (chatter is UI-only, no email gateway)
- [ ] Phone logging / VoIP integration — ❌ Missing
- [ ] Sales team management — ❌ Missing (Multi Teams toggle exists but no team model/backend)
- [x] Forecasting view (Odoo 17 revenue forecast by stage) — 🟡 Partial (**weightedPipeline** card + stage breakdown; not Odoo-style forecast columns)
- [x] Pipeline health / report by salesperson — 🟡 Partial (scoped totals + win rate MTD in analytics bar; no per-owner breakdown table)
- [ ] Customer portal access — ❌ Missing

### Views / UI
- [x] Kanban view — ✅ Done (per-stage columns with revenue totals, drag-and-drop, **activity badges**: overdue count, next due **`dueAt`**)
- [x] List view — ✅ Done (Opportunity, Contact, Email, Phone, Expected Revenue, Stage columns)
- [x] Form view — ✅ Done (header fields, status bar, Smart Buttons, Chatter stub)
- [x] Graph / pivot reports — 🟡 Partial (**`GET /api/crm/analytics`**: stage breakdown, **weighted pipeline**, **won/lost MTD**, win rate; **`CrmPipelineAnalyticsBar`**; no dedicated funnel chart yet)
- [ ] Calendar view (activities, follow-up deadlines) — ❌ Missing
- [x] Pipeline forecast (Odoo 17 forecasting column) — 🟡 Partial (**weightedPipeline** = Σ expectedRevenue × probability / 100 on scoped active leads; not per-stage forecast columns)

### Role & Permission Settings
- [x] CRM User — **`GET /api/crm/pipeline`** and **`GET /api/crm/analytics`** use **`crmLeadFilter`** (own + unassigned for sales users; managers see all). UI: **`CrmPipelineAnalyticsBar`** shows **access hint** (manager vs salesperson) from **`useAuth`**. Full role selector still TBD.
- [ ] CRM Team Manager — view all team leads, edit stages; ❌ Missing (no team-scoped filter yet)
- [x] Sales Manager / Administrator — full pipeline + analytics scope when **`crmLeadFilter`** returns unrestricted predicate; **`admin`** / privileged roles align with existing auth (**`PUT /api/settings/crm`** still separate permissions)

### Module Configuration (Settings page)
- [x] Multi Teams — ✅ persisted via **`PUT /api/settings/crm`** as **`crm.multiTeams`** (`GET /api/settings/crm` hydrates CRM Settings)
- [x] Lead Mining — ✅ **`crm.leadMining`**
- [x] Predictive Lead Scoring — ✅ **`crm.predictiveScoring`**
- [x] Rule-Based Assignment — ✅ **`crm.ruleBasedAssignment`**
- [ ] Pipeline stage CRUD (add/rename/delete stages) — 🟡 Partial (**Edit** modal: rename, sequence, folded kanban via **`PATCH /api/crm/stages/:id`**; add/delete stages still missing)
- [ ] Default probability per stage — ❌ Missing
- [ ] Automated actions / custom email templates — ❌ Missing

### Integrations
- [ ] Calendar — activities on leads should create Calendar events; ❌ Missing
- [ ] Mail / Discuss — chatter messages, log notes, automated emails on stage change; 🟡 Partial (**`ChatterPanel`** on lead form → **`/api/messaging/chatter`**, **`ownerType=crm.lead`**; stage-change emails not wired)
- [ ] Automation rules — trigger on lead stage change, won/lost, probability threshold; ❌ Missing
- [x] Claude AI — AIInsightsPanel with recommendations, predictions, alerts; 🟡 Partial (mock data only, not calling real AI endpoint)
- [ ] Sales module — ✅ New Quotation button links to SaleOrder (Flow A complete)
- [ ] Marketing — no integration with Email Marketing or campaigns; ❌ Missing
- [ ] Website — lead capture form from website; ❌ Missing

### Claude AI — 3 Specific AI Actions
1. **Lead scoring** — score new leads 0–100 based on company size, industry, interaction history; surface top 10 leads to focus on today
2. **Next best action** — for each open opportunity, suggest the single most impactful next step (e.g. "send proposal", "call within 24h") with reasoning
3. **Win/Loss analysis** — after marking lost, ask Claude to summarise why deals in this stage are lost and recommend pipeline improvements

### API Endpoints
- [x] GET /api/crm/stages — ✅ exists
- [x] PATCH /api/crm/stages/:id — ✅ update **name**, **sequence**, **foldedKanban**
- [x] GET /api/crm/pipeline — ✅ kanban payload (**`crmLeadFilter`**); each lead includes **`activitySummary`** (`openCount`, `overdueCount`, `nextDueAt`); **`activities`** not included in JSON
- [x] GET /api/crm/analytics — ✅ scoped metrics + **`weightedPipeline`**, **`wonThisMonth`**, **`lostThisMonth`**, **`stageBreakdown`**
- [x] GET /api/crm/leads — ✅ exists (with type/stage filters, pagination)
- [x] GET /api/crm/leads/:id — ✅ exists
- [x] POST /api/crm/leads — ✅ exists
- [x] PUT /api/crm/leads/:id — ✅ exists
- [x] PATCH /api/crm/leads/:id/stage — ✅ exists (kanban drag)
- [x] POST /api/crm/leads/:id/qualify — ✅ exists
- [x] POST /api/crm/leads/:id/mark-won — ✅ exists
- [x] POST /api/crm/leads/:id/new-quotation — ✅ exists
- [x] DELETE /api/crm/leads/:id — ✅ exists (soft delete via active=false)
- [x] GET **`/api/settings/crm`** — ✅ module-scoped keys (`crm.*` in `SystemConfig`)
- [x] PUT **`/api/settings/crm`** — ✅ requires auth; **`settings.write`** permission **or** **`admin`** / **`Administrator`** role (JWT Track B 2026-05-12)
- [x] PATCH /api/crm/leads/:id/lost — ✅ optional **`lostReason`**, sets **`active: false`**
- [x] GET/POST /api/crm/leads/:id/activities — ✅ list + create activity
- [x] PATCH/DELETE /api/crm/activities/:id — ✅ mark done + delete
- [ ] POST /api/crm/leads/:id/merge — ❌ missing
- [ ] GET /api/crm/teams — ❌ missing
- [ ] GET /api/crm/forecast — ❌ missing

---

### Missing Features Summary
CRM has a functional kanban pipeline, lead lifecycle flows, Sales integration, **activities API + UI**, **Mark Lost with reason**, **pipeline + analytics scoped by `crmLeadFilter`**, **activity summary on kanban cards** (overdue / next due), **weighted forecast + won/lost MTD** in the analytics bar, and **persisted chatter** on the lead form via the shared messaging chatter endpoint. Remaining high-impact gaps: **lost-reason presets** (dropdown vs free text only), **calendar view** for activities, **funnel / per-owner revenue chart**, **`GET /api/crm/forecast`**, and **partner Many2one** on the form.

### Recommended Build Order
1. ~~**Kanban + calendar UX** — overdue/open activity indicators on cards~~ ✅ **(badges on cards)**; optional **calendar view** fed by **`CrmActivity`** — next
2. ~~**Forecast / analytics depth** — weighted pipeline + won/lost MTD~~ ✅; **win/loss over time**, **revenue by owner**, **funnel chart** — next (extend **`/api/crm/analytics`** or **`/api/crm/forecast`**)
3. **CRM RBAC** — **access hint** in analytics ✅; surface **CRM User / Team Manager / Sales Manager** in dedicated UI and **team-scoped** filters
