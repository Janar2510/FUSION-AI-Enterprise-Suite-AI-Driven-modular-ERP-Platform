# Marketing Automation — Gap Analysis
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
- [ ] Campaign lifecycle states (Draft → Active → Paused → Completed) — ✅ Done (state machine with Launch/Pause/Complete actions; dedicated `POST /api/campaigns/:id/launch` enforces `draft|paused → active` with activity guard; stamps `nextActionAt` on participants from first activity delay)
- [ ] Campaign budget tracking — ✅ Done (budget + spent fields with progress bar)
- [ ] Campaign description — ✅ Done

#### Automation Workflow Engine
- [ ] Visual workflow builder (activity chain) — ❌ Missing (no workflow canvas)
- [ ] Email activity — 🟡 Partial (composition API + real dispatch via transactional `OutboxEvent` / `email.send`, template `marketing-campaign`; relay marks trace `delivered` and increments activity `successCount` on success)
- [ ] SMS activity — 🟡 Partial (`sms.send` outbox path; no provider — relay marks traces `rejected` / `no_sms_provider` and increments `rejectedCount`)
- [ ] Server action activity (internal DB operation) — 🟡 Partial (`campaignServerActions` registry in `campaignWorkflowRunner.ts`; empty by default — unknown actions → trace `rejected` / `unsupported_action`)
- [ ] Multi-activity chaining (sequential + parallel) — 🟡 Partial (sequential chain by `sequence` then `id` in `runCampaignWorkflowTick`; parallel branches not supported)
- [ ] Timed / delayed activity execution — ✅ Done (per-activity `delayValue`/`delayUnit`; `CampaignParticipant.nextActionAt`; cron runner every 30s)
- [ ] Trigger-based execution (on record change, on interaction) — ❌ Missing
- [ ] Activity duration / interval configuration — 🟡 Partial (delay before next step only; no duration window)
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
- [ ] Activity success / rejection statistics — 🟡 Partial (per-activity counters + `CampaignTrace` rows; dashboard wiring still pending)
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
- [ ] Email Marketing module (required dependency in Odoo) — 🟡 Partial (`POST /api/campaigns/:id/activities/:activityId/compose` can import `MassMailing` subject/body into campaign activities)
- [ ] CRM (lead/opportunity targeting) — 🟡 Partial (CRM Lead audience resolution supported; conversion triggers still missing)
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
- [ ] `GET /api/campaigns/:id/activities` — ✅ Done
- [ ] `POST /api/campaigns/:id/activities` — ✅ Done
- [ ] `PUT /api/campaigns/:id/activities/:activityId` — ✅ Done
- [ ] `DELETE /api/campaigns/:id/activities/:activityId` — ✅ Done
- [ ] `POST /api/campaigns/:id/activities/:activityId/compose` — ✅ Done (custom subject/body or existing `MassMailing` import)
- [x] `POST /api/campaigns/:id/launch` — ✅ Done (state-machine: `draft|paused → active`, 422 on empty campaign, 409 on `active|completed`, 404 on unknown id; stamps `startDate` if unset; sets `nextActionAt` on participants from first activity delay)
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
| Workflow Engine | Visual builder, triggers, conditional branching, parallel branches |
| Target Audience | Domain filters, Events targeting (participant tracking ✅) |
| Communication | SMS provider integration; real server-action library |
| Templates | All 6 Odoo pre-built templates |
| Reporting | Link tracker, `GET /traces` API + dashboard, revenue attribution (per-activity counters + `CampaignTrace` ✅) |
| Integrations | Email Marketing (dispatch ✅ compose ✅), CRM, SMS, Events, Claude AI |
| RBAC | All roles |
| Config | Sender settings, unsubscribe handling, provider setup |
| Campaign UX | Kanban view, test mode, smart buttons |

**Current state:** Campaigns support activities, audience resolution, email composition, launch with participant `nextActionAt` scheduling, and a **workflow runner** (`campaignWorkflowRunner`) that processes due participants on a cron, writes **`CampaignTrace`** audit rows, dispatches marketing email through the existing **outbox relay** (real SMTP when configured), and stubs SMS via `sms.send` (no provider yet). Odoo-style visual workflow, triggers, parallel branches, and `GET /api/campaigns/:id/traces` are still out of scope for this slice.

---
## Recommended Build Order

1. **Activity model** — `CampaignActivity` (type: email|sms|server_action, timing offset, template ref); CRUD endpoints
2. **Audience targeting** — 🟡 Partial (`CampaignParticipant` model + allowlisted Partner/CRM Lead filters complete; full domain DSL and Events targeting remain)
3. **Email composition** — ✅ API Done (`MassMailing` import + custom subject/body stored on email activities; frontend editor/preview still pending)
4. **Workflow execution engine** — ✅ Done (`node-cron` runner `api/src/jobs/campaignWorkflowRunner.ts`, `CampaignParticipant.nextActionAt`, `CampaignTrace` persistence, outbox `email.send` / `sms.send`; not Bull/Agenda — uses existing transactional outbox pattern)
5. **Trigger-based branching** — conditional next-activity selection based on open/click/bounce events
6. **Campaign templates** — seed 6 Odoo-equivalent templates (Welcome Flow, Double Opt-in, etc.)
7. **Link tracker** — UTM injection + click-through webhook; persist to `LinkClick` table
8. **Traces dashboard** — per-activity success/rejected stats; participant history timeline
9. **Test mode** — isolated participant group; preview email rendering
10. **Kanban view** — campaign cards with participant counts and activity progress
11. **Claude AI** — email copy generation, segment suggestion, conversion rate prediction
12. **CRM integration** — qualify participants as leads/opportunities on conversion trigger
