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
- [ ] Lost reason (dropdown popup when clicking Mark Lost) — ❌ Missing
- [ ] Activities (schedule call, email, meeting with due-date tracking) — ❌ Missing
- [ ] Lead mining / website lead capture — ❌ Missing (setting exists as toggle but no backend)
- [ ] Duplicate detection & merge — ❌ Missing
- [ ] Automated lead assignment (rule-based by territory, salesperson load) — ❌ Missing (toggle exists but not wired)
- [ ] Email integration (leads created from inbound email) — ❌ Missing (chatter is UI-only, no email gateway)
- [ ] Phone logging / VoIP integration — ❌ Missing
- [ ] Sales team management — ❌ Missing (Multi Teams toggle exists but no team model/backend)
- [ ] Forecasting view (Odoo 17 revenue forecast by stage) — ❌ Missing
- [ ] Pipeline health / report by salesperson — ❌ Missing
- [ ] Customer portal access — ❌ Missing

### Views / UI
- [x] Kanban view — ✅ Done (per-stage columns with revenue totals, drag-and-drop)
- [x] List view — ✅ Done (Opportunity, Contact, Email, Phone, Expected Revenue, Stage columns)
- [x] Form view — ✅ Done (header fields, status bar, Smart Buttons, Chatter stub)
- [ ] Graph / pivot reports — ❌ Missing (no Win/Loss bar chart, no revenue funnel graph)
- [ ] Calendar view (activities, follow-up deadlines) — ❌ Missing
- [ ] Pipeline forecast (Odoo 17 forecasting column) — ❌ Missing

### Role & Permission Settings
- [ ] CRM User — view/create/edit own leads; ❌ Not enforced beyond `crmLeadFilter` (salesperson ID check exists in backend but not surfaced in UI role selector)
- [ ] CRM Team Manager — view all team leads, edit stages; ❌ Missing
- [ ] Sales Manager / Administrator — full access + configuration; ❌ Missing (settings page exists but roles not tied to actual access control)

### Module Configuration (Settings page)
- [x] Multi Teams — ✅ persisted via **`PUT /api/settings/crm`** as **`crm.multiTeams`** (`GET /api/settings/crm` hydrates CRM Settings)
- [x] Lead Mining — ✅ **`crm.leadMining`**
- [x] Predictive Lead Scoring — ✅ **`crm.predictiveScoring`**
- [x] Rule-Based Assignment — ✅ **`crm.ruleBasedAssignment`**
- [ ] Pipeline stage CRUD (add/rename/delete stages) — 🟡 Partial (read-only table shown, Edit button noop)
- [ ] Default probability per stage — ❌ Missing
- [ ] Automated actions / custom email templates — ❌ Missing

### Integrations
- [ ] Calendar — activities on leads should create Calendar events; ❌ Missing
- [ ] Mail / Discuss — chatter messages, log notes, automated emails on stage change; 🟡 Partial (Chatter UI stub present, no real message persistence/send)
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
- [ ] POST /api/crm/leads/:id/mark-lost — ❌ missing (currently done via PUT active=false, no lost reason)
- [ ] GET/POST /api/crm/activities — ❌ missing
- [ ] POST /api/crm/leads/:id/merge — ❌ missing
- [ ] GET /api/crm/teams — ❌ missing
- [ ] GET /api/crm/forecast — ❌ missing

---

### Missing Features Summary
CRM is the most complete of the four modules, with a fully functional kanban pipeline, lead lifecycle flows, and a Sales integration. The three most impactful gaps are: (1) **Activity scheduling** — Odoo's activity model is central to salesperson workflow and drives follow-up discipline; (2) **Graph/forecast view** — the pipeline revenue forecast and win/loss bar charts are the primary management tools for pipeline reviews; (3) **Lost reason + real Chatter** — the current "Mark Lost" silently sets active=false with no reason captured, and the Chatter only renders UI with no message persistence.

### Recommended Build Order
1. First: Real Chatter message persistence (reuse ChatterPanel from Sales; POST /api/messages endpoint) + Mark Lost with reason picker
2. Then: Activities model (schedule call/meeting/email with due dates, reminder badges on kanban cards)
3. Finally: Forecast/Graph view (pipeline by stage chart, win/loss rate over time, revenue by salesperson)
