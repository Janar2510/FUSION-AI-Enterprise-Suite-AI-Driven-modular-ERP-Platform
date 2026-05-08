# Helpdesk — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/services/helpdesk.html
**FusionAI status:** Partial
**Effort to complete:** M
**Business priority:** P2

---
## Odoo 17 Feature Checklist

### Core Features
- [x] Ticket creation (name, description, customer, deadline, priority) — ✅ Done
- [x] Stage-based ticket pipeline (configurable stages) — ✅ Done
- [x] Drag-and-drop Kanban stage movement — ✅ Done
- [x] Priority field (normal / high) — ✅ Done
- [x] Kanban state (normal / blocked / ready) — 🟡 Partial (field exists in model, not surfaced in UI selector)
- [x] Create project task from ticket — ✅ Done
- [x] Log time on ticket-linked task — ✅ Done
- [x] Chatter / message log per ticket — ✅ Done
- [x] AI Actions panel (helpdesk-triage agent) — ✅ Done
- [ ] Multi-team management (separate pipelines per team) — ❌ Missing
- [ ] Automatic ticket assignment (round-robin / load balancing) — ❌ Missing
- [ ] Time Off integration (skip assignment during absence) — ❌ Missing
- [ ] SLA (Service Level Agreements) tracking — ❌ Missing
- [ ] Customer satisfaction ratings (CSAT) — ❌ Missing
- [ ] Merge duplicate tickets — ❌ Missing
- [ ] Email-to-ticket ingestion (inbound mail gateway) — ❌ Missing
- [ ] Website portal form for customer ticket submission — ❌ Missing
- [ ] SMS notification on stage transitions — ❌ Missing
- [ ] Auto-close tickets after inactivity — ❌ Missing
- [ ] After-sales / warranty workflows — ❌ Missing
- [ ] Billable time tracking (isBillable flag per timesheet) — 🟡 Partial (API supports it, not exposed in UI)

### Views / UI
- [x] Kanban — ✅ Done
- [x] List — ✅ Done
- [x] Form — ✅ Done
- [ ] Calendar view (tickets by deadline) — ❌ Missing
- [ ] Graph / reporting view — ❌ Missing
- [ ] Activity view — ❌ Missing

### Role & Permission Settings
- [x] requireAuth middleware on all ticket routes — ✅ Done
- [x] Record-level filter (helpdeskTicketFilter) — ✅ Done
- [ ] Helpdesk Manager / Helpdesk User role distinction — ❌ Missing
- [ ] Team-scoped visibility (private / company / public) — ❌ Missing
- [ ] Portal user ticket access — ❌ Missing

### Module Configuration
- [ ] Configurable stage management (per-team) — ❌ Missing (stages are global, not team-scoped)
- [ ] Email template per stage transition — ❌ Missing
- [ ] SLA policy configuration — ❌ Missing
- [ ] CSAT survey settings — ❌ Missing
- [ ] Automatic assignment rules — ❌ Missing

### Integrations
- [x] Project module (create task from ticket) — ✅ Done
- [x] Timesheets (log hours on ticket task) — ✅ Done
- [x] ChatterPanel (mail / messaging) — ✅ Done
- [x] Claude AI — helpdesk-triage agent (3 actions via AiActionsPanel) — ✅ Done
- [ ] Calendar (schedule follow-up activities) — ❌ Missing
- [ ] Time Off module (assignment awareness) — ❌ Missing
- [ ] Website / portal integration — ❌ Missing
- [ ] SMS gateway (IAP) — ❌ Missing
- [ ] Invoicing / billing integration for billable support hours — 🟡 Partial (isBillable field exists in API)

### API Endpoints
- [x] GET /api/helpdesk/stages — ✅
- [x] GET /api/helpdesk/tickets — ✅
- [x] GET /api/helpdesk/tickets/:id — ✅
- [x] POST /api/helpdesk/tickets — ✅
- [x] PUT /api/helpdesk/tickets/:id — ✅
- [x] PATCH /api/helpdesk/tickets/:id/stage — ✅
- [x] DELETE /api/helpdesk/tickets/:id (soft-delete) — ✅
- [x] POST /api/helpdesk/tickets/:id/create-task — ✅
- [x] POST /api/helpdesk/tickets/:id/timesheet — ✅
- [x] GET /api/helpdesk/pipeline (kanban grouped view) — ✅
- [ ] GET /api/helpdesk/teams — ❌
- [ ] POST /api/helpdesk/teams — ❌
- [ ] GET /api/helpdesk/sla-policies — ❌
- [ ] GET /api/helpdesk/tickets/:id/rating — ❌ (CSAT)

---
## Missing Features Summary

1. **Multi-team support** — Odoo Helpdesk is fundamentally team-scoped; FusionAI has a single global pipeline. Requires `HelpdeskTeam` model + stage scoping per team.
2. **SLA tracking** — No deadline enforcement, no breach alerting. Requires `SlaPolicy` model + background cron job.
3. **CSAT ratings** — Customer satisfaction surveys sent after ticket closure. Requires survey/email integration.
4. **Automatic assignment** — Round-robin or load-balanced assignment to team members. Requires assignment service.
5. **Email-to-ticket** — Inbound mail gateway to auto-create tickets from emails. Requires mail relay integration (outbox/inbox service).
6. **Portal access** — Customer self-service portal for ticket submission and status tracking.
7. **Calendar/Graph views** — Reporting dashboard showing ticket trends and timelines.
8. **Kanban state UI** — The `kanbanState` field (normal/blocked/done) exists in the model but has no visual indicator on kanban cards.

---
## Recommended Build Order

1. Expose `kanbanState` indicator on Kanban cards (quick win, 1–2h)
2. Add Calendar view for tickets by deadline (1 day)
3. Implement multi-team model + team-scoped stages (M, 2–3 days)
4. SLA policy engine + breach alerts (L, 3–4 days)
5. Email-to-ticket inbound gateway (L, depends on mail infra)
6. CSAT rating flow (M, 2 days)
7. Portal / website form (XL, requires public-facing UI layer)
