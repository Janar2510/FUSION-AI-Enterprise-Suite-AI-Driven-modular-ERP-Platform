# Recruitment — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/hr/recruitment.html
**FusionAI status:** Partial
**Effort to complete:** M
**Business priority:** P2

---
## Odoo 17 Feature Checklist

### Core Features
- [ ] Applicant pipeline management — ✅ Done (6 stages: New → Qualified → Interview → Offer → Hired → Refused)
- [ ] Drag-and-drop kanban stage transitions — ✅ Done
- [ ] Job position linkage (Applied For field) — ✅ Done
- [ ] Department linkage — ✅ Done
- [ ] Applicant source tracking (LinkedIn / Website / Referral / Other) — ✅ Done
- [ ] Priority / star rating on applicants — 🟡 Partial (field stored, not rendered as stars in UI)
- [ ] Expected salary field — ✅ Done
- [ ] CV / résumé upload and attachment — ❌ Missing
- [ ] CV Digitization / OCR (Do not digitize / On demand / Automatic) — ❌ Missing
- [ ] Configurable stage email templates (auto-send on stage entry) — ❌ Missing
- [ ] Stage requirements / SLA documentation per stage — ❌ Missing
- [ ] Hired stage flag with hire-date tracking — ❌ Missing
- [ ] Referral point allocation per stage — ❌ Missing
- [ ] Interview survey (send questionnaire to applicant) — ❌ Missing
- [ ] SMS messaging to applicants — ❌ Missing
- [ ] Salary package configurator (offer expiry days) — ❌ Missing
- [ ] Online job posting (via Website app) — ❌ Missing
- [ ] Kanban color-coded status dots (Ready / Blocked / In Progress) — ❌ Missing
- [ ] Refused pipeline column — ❌ Missing (filtered out of kanban)
- [ ] Multi-position filtering per stage — ❌ Missing
- [ ] Chatter / internal messaging on applicant record — ❌ Missing

### Views / UI
- [ ] Kanban view — ✅ Done
- [ ] List view — ✅ Done
- [ ] Form view — ✅ Done
- [ ] Calendar view — ❌ Missing
- [ ] Graph / Analytics view — ❌ Missing (no reporting at all)
- [ ] Activity view — ❌ Missing
- [ ] Pivot / reporting view — ❌ Missing

### Role & Permission Settings
- [ ] Recruitment user role — ❌ Missing (no RBAC implemented)
- [ ] Recruitment manager role — ❌ Missing
- [ ] Referral user access restrictions — ❌ Missing
- [ ] Team-level visibility scoping — ❌ Missing

### Module Configuration
- [ ] Settings → Enable/disable Interview Surveys — ❌ Missing
- [ ] Settings → Enable/disable SMS — ❌ Missing
- [ ] Settings → CV Digitization mode selection — ❌ Missing
- [ ] Settings → Salary offer expiry days — ❌ Missing
- [ ] Settings → Online job posting toggle — ❌ Missing
- [ ] Custom stage creation / editing / deletion UI — ❌ Missing (stages are hardcoded)

### Integrations
- [ ] Calendar — ❌ Missing (interview scheduling not linked)
- [ ] Mail / Chatter — ❌ Missing
- [ ] Surveys (interview questionnaires) — ❌ Missing
- [ ] Documents (résumé storage) — ❌ Missing
- [ ] Referrals (point allocation) — ❌ Missing
- [ ] Website (job board posting) — ❌ Missing
- [ ] Automation module — ❌ Missing
- [ ] Claude AI (3 actions: screen applicant, draft rejection email, rank shortlist) — ❌ Missing
- [ ] SMS / IAP credits — ❌ Missing

### API Endpoints
- [ ] GET /api/recruitment — ✅ Done (paginated, includes job + department)
- [ ] GET /api/recruitment/:id — ✅ Done
- [ ] POST /api/recruitment — ✅ Done
- [ ] PUT /api/recruitment/:id — ✅ Done
- [ ] DELETE /api/recruitment/:id — ✅ Done (hard delete, no soft-archive)
- [ ] GET /api/recruitment?job_id= (filter by job) — ❌ Missing
- [ ] GET /api/recruitment?stage= (filter by stage) — ❌ Missing
- [ ] POST /api/recruitment/:id/send-survey — ❌ Missing
- [ ] POST /api/recruitment/:id/send-email — ❌ Missing
- [ ] GET /api/recruitment/analysis (reporting) — ❌ Missing

---
## Missing Features Summary

**Critical gaps (block real use):**
1. No email template automation on stage change — recruiters cannot send templated responses
2. No résumé/attachment upload — applicant records are incomplete
3. Refused column hidden from kanban — no rejected pipeline visibility
4. Stages are hardcoded — cannot be configured per job position
5. No chatter / internal notes on applicant
6. No Calendar view for interview scheduling

**Functional but shallow:**
- Priority field exists in the data model but renders as a plain number, not star widget
- DELETE is hard delete — should be soft archive (`active: false`)
- No pagination UI exposed; only 200-record limit

**Analytics missing entirely:**
- Source analysis, time-in-stage, team performance, conversion funnel — all absent

---
## Recommended Build Order

1. **Soft archive** (`active: false`) instead of hard delete — 1 day
2. **Refused kanban column** — restore hidden stage — 0.5 day
3. **Résumé file upload** on form (S3 / local presigned URL) — 2 days
4. **Chatter panel** on applicant form (shared Discuss component) — 1 day
5. **Stage email templates** — send on stage transition — 2 days
6. **Priority star widget** in kanban card and form — 0.5 day
7. **Calendar view** — interview scheduling with linked events — 3 days
8. **Graph / reporting view** — source analysis + funnel — 3 days
9. **Stage configuration UI** (create / edit / delete stages, job-scoped) — 2 days
10. **Interview survey integration** — link to Surveys module — 2 days
11. **Claude AI actions** — screen applicant, draft rejection email, rank shortlist — 2 days
12. **RBAC** — Recruitment User / Manager roles — 1 day
