konntinue# Marketing Automation — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/marketing/marketing_automation.html
**FusionAI status:** Stub
**Effort to complete:** XL
**Business priority:** P2

---
## Odoo 17 Feature Checklist

### Core Features

#### Campaign Management
- [ ] Campaign creation (from scratch) — ✅ Done (CRUD with name, type, state, budget, dates, description)
- [ ] Campaign creation from templates — ❌ Missing (Odoo has 6 pre-built templates; FusionAI has no templates)
- [ ] Campaign lifecycle states (Draft → Active → Paused → Completed) — ✅ Done (state machine with Launch/Pause/Complete actions)
- [ ] Campaign budget tracking — ✅ Done (budget + spent fields with progress bar)
- [ ] Campaign description — ✅ Done

#### Automation Workflow Engine
- [ ] Visual workflow builder (activity chain) — ❌ Missing (no workflow canvas)
- [ ] Email activity — ❌ Missing (campaign type "email" exists but no email composition or dispatch)
- [ ] SMS activity — ❌ Missing
- [ ] Server action activity (internal DB operation) — ❌ Missing
- [ ] Multi-activity chaining (sequential + parallel) — ❌ Missing
- [ ] Timed / delayed activity execution — ❌ Missing
- [ ] Trigger-based execution (on record change, on interaction) — ❌ Missing
- [ ] Activity duration / interval configuration — ❌ Missing
- [ ] Conditional branching based on participant interaction — ❌ Missing

#### Target Audience
- [ ] Target record type selection (Contacts, Leads, Opportunities, Event Registrations) — 🟡 Partial (Partners/CRM Leads supported via `POST /api/campaigns/:id/participants/resolve`; Event Registrations still missing)
- [ ] Domain-based audience filter — 🟡 Partial (allowlisted Partner/CRM Lead filters implemented; no arbitrary Odoo-style domain DSL yet)
- [ ] Participant tracking (distinct from total target) — ✅ Done (`CampaignParticipant` model + unique campaign/target tracking)
- [ ] Test mode / isolated participant group — ❌ Missing
- [ ] Participant list view — 🟡 API Done (`GET /api/campaigns/:id/participants`; frontend view missing)

#### Campaign Templates (Odoo pre-built)
- [ ] Tag Hot Contacts — ❌ Missing
- [ ] Welcome Flow — ❌ Missing
- [ ] Double Opt-in — ❌ Missing
- [ ] Commercial Prospection — ❌ Missing
- [ ] Schedule Calls — ❌ Missing
- [ ] Prioritize Hot Leads — ❌ Missing

#### Reporting & Analytics
- [ ] Link tracker / click metrics — ❌ Missing
- [ ] Traces dashboard (per-activity results) — ❌ Missing
- [ ] Participants report — ❌ Missing
- [ ] Activity success / rejection statistics — ❌ Missing
- [ ] Campaign performance aggregation — 🟡 Partial (leads, conversions, conversion rate, ROI shown in form right panel and dashboard KPIs)
- [ ] Revenue attribution — ❌ Missing

### Views / UI
- [ ] List view — ✅ Done (campaign list with type, status badge, leads, conv., budget/spent bar)
- [ ] Kanban view — ❌ Missing (Odoo shows campaigns as Kanban cards; FusionAI has list only)
- [ ] Form view — ✅ Done (name, type, state, budget, spent, leads, conversions, dates, description; Launch/Pause/Complete actions)
- [ ] Calendar view — ❌ Missing
- [ ] Graph / reporting view — ❌ Missing
- [ ] Workflow canvas (visual activity builder) — ❌ Missing
- [ ] Dashboard KPIs (leads, conversions, conv. rate, spend) — ✅ Done (4-card summary strip)
- [ ] Activity card with Success/Rejected stats — ❌ Missing
- [ ] Smart buttons (participant count, test engagement) — ❌ Missing

### Role & Permission Settings
- [ ] Marketing Manager (full access) — ❌ Missing
- [ ] Marketing User (own campaigns only) — ❌ Missing
- [ ] Read-only viewer — ❌ Missing
- [ ] Campaign approval workflow — ❌ Missing

### Module Configuration
- [ ] Default sender / reply-to email — ❌ Missing
- [ ] Unsubscribe link injection — ❌ Missing
- [ ] SMS provider setup — ❌ Missing
- [ ] Email Marketing dependency config — ❌ Missing
- [ ] Campaign tag management — ❌ Missing

### Integrations
- [ ] Email Marketing module (required dependency in Odoo) — ❌ Missing (FusionAI has separate email-marketing module but no link to campaign automation)
- [ ] CRM (lead/opportunity targeting) — ❌ Missing
- [ ] SMS Marketing — ❌ Missing
- [ ] Calendar (schedule campaign activities) — ❌ Missing
- [ ] Automation / server actions — ❌ Missing
- [ ] Claude AI (3 actions: generate email copy, suggest audience segment, predict conversion rate) — ❌ Missing
- [ ] Contacts module (audience sourcing) — ❌ Missing
- [ ] Events (event registration targeting) — ❌ Missing

### API Endpoints
- [ ] `GET /api/campaigns` — ✅ Done (paginated list)
- [ ] `POST /api/campaigns` — ✅ Done
- [ ] `PUT /api/campaigns/:id` — ✅ Done
- [ ] `DELETE /api/campaigns/:id` — ✅ Done
- [ ] `GET /api/campaigns/:id/activities` — ❌ Missing
- [ ] `POST /api/campaigns/:id/activities` — ❌ Missing
- [ ] `POST /api/campaigns/:id/launch` — ❌ Missing (currently merged into PUT state change)
- [ ] `GET /api/campaigns/:id/participants` — ✅ Done
- [ ] `POST /api/campaigns/:id/participants/resolve` — ✅ Done (allowlisted Partner/CRM Lead targeting filters)
- [ ] `GET /api/campaigns/:id/traces` — ❌ Missing
- [ ] `GET /api/campaigns/:id/analytics` — ❌ Missing
- [ ] `POST /api/campaigns/:id/test` — ❌ Missing
- [ ] `GET /api/campaigns/templates` — ❌ Missing

---
## Missing Features Summary

| Category | Missing |
|---|---|
| Workflow Engine | The core of the module — visual builder, activities, triggers, timed execution, branching |
| Target Audience | Domain filters, record-type targeting, participant tracking |
| Communication | Email composition/dispatch, SMS, server actions |
| Templates | All 6 Odoo pre-built templates |
| Reporting | Link tracker, traces dashboard, per-activity stats, revenue attribution |
| Integrations | Email Marketing, CRM, SMS, Events, Claude AI |
| RBAC | All roles |
| Config | Sender settings, unsubscribe handling, provider setup |
| Campaign UX | Kanban view, test mode, smart buttons |

**Current state:** A basic campaign ledger — create/edit/delete campaigns with name, type (email/social/multi-channel/content), lifecycle state, budget, spend, leads, and conversions. The conversion rate and ROI are calculated client-side from manually entered numbers. There is no automation engine, no email sending, no audience targeting, and no link tracking. This is a campaign tracking spreadsheet, not a marketing automation platform.

---
## Recommended Build Order

1. **Activity model** — `CampaignActivity` (type: email|sms|server_action, timing offset, template ref); CRUD endpoints
2. **Audience targeting** — 🟡 Partial (`CampaignParticipant` model + allowlisted Partner/CRM Lead filters complete; full domain DSL and Events targeting remain)
3. **Email composition** — integrate with Email Marketing module's template system; compose per-activity email
4. **Workflow execution engine** — background job (Bull/Agenda) that advances participants through activity chain on timer
5. **Trigger-based branching** — conditional next-activity selection based on open/click/bounce events
6. **Campaign templates** — seed 6 Odoo-equivalent templates (Welcome Flow, Double Opt-in, etc.)
7. **Link tracker** — UTM injection + click-through webhook; persist to `LinkClick` table
8. **Traces dashboard** — per-activity success/rejected stats; participant history timeline
9. **Test mode** — isolated participant group; preview email rendering
10. **Kanban view** — campaign cards with participant counts and activity progress
11. **Claude AI** — email copy generation, segment suggestion, conversion rate prediction
12. **CRM integration** — qualify participants as leads/opportunities on conversion trigger
