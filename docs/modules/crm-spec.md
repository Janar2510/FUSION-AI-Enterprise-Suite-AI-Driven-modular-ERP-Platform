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
- [x] Partner/contact link — ✅ Partner **`partnerId`** + search/select on lead form (**`partnersApi.list`**); contact fields remain
- [x] Lost reason — ✅ **`PATCH /api/crm/leads/:id/lost`** with optional **`lostReason`**; Mark Lost modal in **`CRMModule`**
- [x] Activities (schedule call, email, meeting with due-date tracking) — ✅ **`GET`/`POST /api/crm/leads/:id/activities`**, **`PATCH`/`DELETE /api/crm/activities/:id`**; **`CrmActivitiesPanel`** on lead form
- [ ] Lead mining / website lead capture — ❌ Missing (setting exists as toggle but no backend)
- [ ] Duplicate detection & merge — ❌ Missing
- [ ] Automated lead assignment (rule-based by territory, salesperson load) — ❌ Missing (toggle exists but not wired)
- [ ] Email integration (leads created from inbound email) — ❌ Missing (chatter is UI-only, no email gateway)
- [ ] Phone logging / VoIP integration — ❌ Missing
- [x] Sales team management — 🟡 Partial (**`CrmTeam`** / **members**; **`GET`/`POST /api/crm/teams`**; leads carry **`teamId`**; UI team filter on analytics bar — assignment rules / full Odoo parity still optional)
- [x] Forecasting view (Odoo 17 revenue forecast by stage) — 🟡 Partial (**weightedPipeline** card + stage breakdown; not Odoo-style forecast columns)
- [x] Pipeline health / report by salesperson — 🟡 Partial (scoped totals + win rate MTD + **`revenueByOwner`** table in analytics bar; not full team / territory reports)
- [ ] Customer portal access — ❌ Missing

### Views / UI
- [x] Kanban view — ✅ Done (per-stage columns with revenue totals, drag-and-drop, **activity badges**: overdue count, next due **`dueAt`**)
- [x] List view — ✅ Done (Opportunity, Contact, Email, Phone, Expected Revenue, Stage columns)
- [x] Form view — ✅ Done (header fields, status bar, Smart Buttons, Chatter stub)
- [x] Graph / pivot reports — 🟡 Partial (**`GET /api/crm/analytics`**, **`GET /api/crm/forecast`**: stage breakdown, **weighted pipeline**, **won/lost MTD**, **`wonLostTrend`** (12 months), **`revenueByOwner`**, **avg probability** and **30-day closing** buckets per forecast stage; **`CrmPipelineAnalyticsBar`** with manager **owner** and **team** scope; **Opportunity funnel** bars from forecast **`stages`**)
- [x] Calendar view (activities, follow-up deadlines) — ✅ **`GET /api/crm/activities/calendar`** (**`crmLeadFilter`**, optional **`user_id`**, **`team_id`**; open activities with **`dueAt`** in range); **`CrmActivitiesCalendar`** at **`/module/crm/activities/calendar`** (toolbar calendar icon; click event → lead form)
- [x] Pipeline forecast (Odoo 17 forecasting column) — 🟡 Partial (**weightedPipeline** = Σ expectedRevenue × probability / 100 on scoped active leads; not per-stage forecast columns)

### Role & Permission Settings
- [x] CRM User — **`GET /api/crm/pipeline`** and **`GET /api/crm/analytics`** use **`crmLeadFilter`** (own + unassigned for sales users; managers see all). UI: **`CrmPipelineAnalyticsBar`** shows **access hint**; managers get **`GET /api/crm/salespeople`** + **View as** (**`user_id`**) and **Team** (**`team_id`**) for pipeline, analytics, forecast, and activities calendar.
- [ ] CRM Team Manager — view all team leads, edit stages; 🟡 Partial (**`team_id`** scoping + team roster API; dedicated **CRM Team Manager** role still optional)
- [x] Sales Manager / Administrator — full pipeline + analytics scope when **`crmLeadFilter`** returns unrestricted predicate; **`admin`** / privileged roles align with existing auth (**`PUT /api/settings/crm`** still separate permissions)

### Module Configuration (Settings page)
- [x] Multi Teams — ✅ persisted via **`PUT /api/settings/crm`** as **`crm.multiTeams`** (`GET /api/settings/crm` hydrates CRM Settings)
- [x] Lead Mining — ✅ **`crm.leadMining`**
- [x] Predictive Lead Scoring — ✅ **`crm.predictiveScoring`**
- [x] Rule-Based Assignment — ✅ **`crm.ruleBasedAssignment`**
- [x] Pipeline stage CRUD (add/rename/delete stages) — 🟡 Partial (**`PATCH`** rename/order/folded ✅; **`POST`** create + **`DELETE`** with lead migration ✅ in **CRM Settings** for managers; Odoo **probability per stage** still missing)
- [ ] Default probability per stage — ❌ Missing
- [ ] Automated actions / custom email templates — ❌ Missing

### Integrations
- [x] Calendar — CRM activities with **`dueAt`** create/link **`CalendarEvent`**; **`crm_activities.calendar_event_id`** FK (**`ON DELETE SET NULL`**)
- [ ] Mail / Discuss — chatter messages, log notes, automated emails on stage change; 🟡 Partial (**`ChatterPanel`** on lead form → **`/api/messaging/chatter`**, **`ownerType=crm.lead`**; stage-change emails not wired)
- [ ] Automation rules — trigger on lead stage change, won/lost, probability threshold; ❌ Missing
- [x] Claude AI — AIInsightsPanel with recommendations, predictions, alerts; 🟡 Partial (mock data only, not calling real AI endpoint)
- [x] Sales module — ✅ New Quotation button links to SaleOrder (Flow A complete)
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
- [x] GET /api/crm/analytics — ✅ scoped metrics + **`weightedPipeline`**, **`wonThisMonth`**, **`lostThisMonth`**, **`stageBreakdown`**, **`wonLostTrend`**, **`revenueByOwner`**; optional **`user_id`**, **`team_id`**
- [x] GET /api/crm/salespeople — ✅ list sales users for owner-scope UI (privileged roles)
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
- [x] GET /api/crm/activities/calendar — ✅ query **`from`**, **`to`** (ISO); optional **`user_id`**, **`team_id`**; open activities (**`doneAt` null**) with **`dueAt`** in window; **`crmLeadFilter`** on lead; each row includes **`lead: { id, name }`**
- [ ] POST /api/crm/leads/:id/merge — ❌ missing
- [x] GET **`/api/crm/teams`** — ✅ list teams for org (auth)
- [x] POST **`/api/crm/teams`** — ✅ create team (managers)
- [x] POST **`/api/crm/stages`** — ✅ create stage (managers)
- [x] DELETE **`/api/crm/stages/:id`** — ✅ delete; JSON body **`move_to_stage_id`** when stage has leads
- [x] GET /api/crm/forecast — ✅ **`weightedPipeline`** + per-stage **`stages[]`** (**`leadCount`**, **`opportunityCount`**, **`pipelineValue`**, **`weightedPipeline`**, **`avgProbability`**, **30-day closing** fields); optional **`user_id`** / **`team_id`**; **`CrmPipelineAnalyticsBar`** **Opportunity funnel** chart

---

### Missing Features Summary
CRM has a functional kanban pipeline, lead lifecycle flows, Sales integration, **activities API + UI**, **activities calendar** (**`user_id`** + **`team_id`** scope), **Mark Lost with presets + detail**, **partner picker**, **pipeline + analytics + forecast scoped by `crmLeadFilter`** with optional **`user_id`** and **`team_id`**, **`CrmTeam`** roster + **team filter** in the analytics bar, **stage create/delete** (with lead migration) for managers in **Settings**, **12‑month won/lost trend** and **revenue-by-owner** analytics, **`GET /api/crm/forecast`** with **opportunity funnel** and **enriched stage metrics**, **activity → calendar event** linkage, **activity summary on kanban cards**, and **chatter** on the lead form. Remaining high-impact gaps: **Odoo-style forecast columns / pivots**, **default probability per stage**, and deeper **rule-based assignment**.

### Recommended Build Order
1. ~~**Kanban + calendar UX**~~ ✅; ~~**calendar view**~~ ✅ **`/activities/calendar`**
2. ~~**Forecast / analytics depth** — weighted pipeline, won/lost MTD, **12‑month trend**, **revenue by owner**, **`GET /api/crm/forecast`**, **opportunity funnel** in UI~~ ✅; **Odoo-style forecast columns** / pivot — optional next
3. **CRM RBAC** — manager **owner scope** ✅; **team-scoped** filters (**`team_id`**) ✅; explicit **CRM Team Manager** role UI — optional next
