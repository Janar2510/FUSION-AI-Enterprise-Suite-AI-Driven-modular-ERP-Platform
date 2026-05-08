# Appraisals — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/hr/appraisals.html
**FusionAI status:** Partial
**Effort to complete:** L
**Business priority:** P2

---
## Odoo 17 Feature Checklist

### Core Features
- [x] Appraisal record creation with employee — ✅ Done
- [x] Overall rating (1–5 stars) — ✅ Done
- [x] Deadline date — ✅ Done
- [x] Final interview date — ✅ Done
- [x] Manager feedback text — ✅ Done
- [x] Employee self-evaluation text — ✅ Done
- [x] State machine (new → pending → done / cancel) — ✅ Done
- [x] Delete appraisal — ✅ Done
- [ ] Automated appraisal scheduling (6-month initial, then annual) — ❌ Missing
- [ ] Customizable appraisal plans / timelines — ❌ Missing
- [ ] Configurable feedback templates (Employee template: My Work / My Future / My Feelings; Manager template) — ❌ Missing
- [ ] Multiple rating criteria / custom evaluation scales — ❌ Missing (only a single `overallRating` number)
- [ ] Goal-setting with targets and progress tracking — ❌ Missing
- [ ] Skills / competencies assessment (linked to HrSkill model) — ❌ Missing
- [ ] 360-degree feedback (request feedback from peers) — ❌ Missing
- [ ] Survey integration for 360 feedback — ❌ Missing
- [ ] Drag-and-drop reordering of rating criteria — ❌ Missing
- [ ] Appraisal plan configuration (months between appraisals) — ❌ Missing
- [ ] Confirmation date tracking — ❌ Missing

### Views / UI
- [x] List view with KPI cards (total, avg rating, completed) — ✅ Done
- [x] Form view (employee, rating, dates, feedback fields) — ✅ Done
- [ ] Kanban view — ❌ Missing
- [ ] Calendar view (appraisal deadlines / interviews) — ❌ Missing
- [ ] Graph / pivot reporting view (performance analysis) — ❌ Missing
- [ ] Goals list view — ❌ Missing
- [ ] Skills progression view — ❌ Missing
- [ ] 360 Feedback survey responses view — ❌ Missing

### Role & Permission Settings
- [ ] Role: Employee — can complete own self-evaluation, view own appraisals — ❌ Missing (no scoping)
- [ ] Role: Appraisal User / Manager — can create/manage appraisals, request 360 feedback — ❌ Missing
- [ ] Role: HR Manager — full configuration access — ❌ Missing

### Module Configuration
- [ ] Appraisal plan intervals (months for initial and subsequent appraisals) — ❌ Missing
- [ ] Feedback template editor (custom sections / questions) — ❌ Missing
- [ ] Evaluation scale editor (custom rating labels with drag-and-drop) — ❌ Missing
- [ ] Enable 360-degree feedback toggle — ❌ Missing

### Integrations
- [ ] Calendar — ❌ Missing (deadline / final interview should create calendar events)
- [ ] Mail / Chatter — ❌ Missing on appraisal form (no ChatterPanel)
- [ ] Surveys module — ❌ Missing (required for 360 feedback)
- [ ] HR / Skills module — ❌ Missing (appraisal should update employee skills)
- [ ] Automation — ❌ Not integrated
- [ ] Claude AI — ❌ Missing (no AiActionsPanel; needs `appraisal-summary`, `skill-gap-analysis`, `performance-coaching-plan` actions)

### API Endpoints
- [x] GET /api/appraisals — ✅
- [x] POST /api/appraisals — ✅
- [x] PUT /api/appraisals/:id — ✅
- [x] DELETE /api/appraisals/:id — ✅
- [ ] GET /api/appraisals/goals — ❌ Missing
- [ ] POST /api/appraisals/:id/goals — ❌ Missing
- [ ] GET /api/appraisals/:id/feedback-requests — ❌ Missing (360 feedback)
- [ ] POST /api/appraisals/:id/feedback-requests — ❌ Missing
- [ ] GET /api/appraisals/report — ❌ Missing (performance analysis)
- [ ] PATCH /api/appraisals/:id/confirm — ❌ Missing (no confirm transition, only manual state dropdown)

---
## Missing Features Summary
1. **Configurable feedback templates** — structured templates (My Work / My Future / My Feelings) not built; single free-text fields only
2. **Goal-setting module** — goals with targets, due dates, and progress tracking completely absent
3. **360-degree feedback** — peer feedback requests and survey integration not built
4. **Skills assessment** — appraisal cannot update employee skill levels; no link to HR skills
5. **Automated scheduling** — appraisals must be created manually; no cron-based auto-scheduling
6. **Multiple rating criteria** — only a single numeric `overallRating`; no per-dimension scores
7. **Chatter** — no messaging thread on appraisal form
8. **Calendar integration** — deadlines and interview dates not pushed to calendar
9. **RBAC** — all appraisal routes are open; employee scoping absent
10. **AI actions** — no panel; needs performance coaching plan generator, skill gap analysis, and appraisal summary agents — the highest-value FusionAI differentiator for this module

---
## Recommended Build Order
1. Add ChatterPanel to appraisal form — S
2. Add `PATCH /api/appraisals/:id/confirm` state transition endpoint — S
3. Add configurable evaluation criteria (multiple rating dimensions per appraisal) — M
4. Add Goal model (`HrAppraisalGoal`) with CRUD and link to appraisal form — L
5. Link appraisal completion to HR skills model (update skill levels on appraisal done) — M
6. Add feedback templates configuration (sections + questions stored in DB) — L
7. Add 360-degree feedback request model + survey integration — L
8. Add automated appraisal scheduling (cron job, configurable intervals) — M
9. RBAC: Employee / Manager role scoping on appraisal routes — M
10. Add AI actions panel (skill-gap-analysis, performance-coaching-plan, appraisal-summary) — M
11. Kanban + calendar + graph views — M
