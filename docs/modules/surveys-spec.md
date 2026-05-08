# Surveys — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/marketing/surveys.html
**FusionAI status:** Partial
**Effort to complete:** L
**Business priority:** P2

---
## Odoo 17 Feature Checklist

### Core Features
- [ ] Survey creation with title and description — ✅ Done
- [ ] Survey lifecycle states (draft / open / closed) — ✅ Done
- [ ] Scoring types (No Scoring / With Answers / Without Answers) — ✅ Done
- [ ] Question CRUD (add / edit / delete questions per survey) — 🟡 Partial (API endpoint POST /:id/questions exists; no UI to manage questions in-app)
- [ ] Multiple question types (multiple choice, open text, rating, matrix, date, etc.) — ❌ Missing (model has `questionType` field but UI does not expose question builder)
- [ ] Answer options per question — ❌ Missing (model: `answers` relation, no UI)
- [ ] Required / optional question flag — 🟡 Partial (field in model, not exposed in UI)
- [ ] Question sequencing / reordering — ❌ Missing
- [ ] Conditional / conditional-display logic — ❌ Missing
- [ ] Survey invitation via email (with customizable template) — ❌ Missing
- [ ] Survey invitation via link (access mode: anyone with link) — ❌ Missing
- [ ] Login requirement toggle for survey access — ❌ Missing
- [ ] Answer deadline field — ❌ Missing
- [ ] Live session mode (real-time interactive) — ❌ Missing
- [ ] Certification mode (is_certification toggle, pass/fail threshold) — ❌ Missing
- [ ] Certificate generation for passing participants — ❌ Missing
- [ ] Test / preview mode (answer your own survey) — 🟡 Partial (button rendered in UI but non-functional — no action connected)
- [ ] Survey response submission by participants — 🟡 Partial (POST /:id/respond API exists; no public-facing survey form)
- [ ] Response tracking (per-participant state: in-progress / done) — 🟡 Partial (SurveyUserInput model has state field, not surfaced in UI)
- [ ] Results dashboard (detailed metrics + graphical per-question breakdown) — ❌ Missing
- [ ] Average score and success ratio calculation — ❌ Missing
- [ ] Activity scheduling on surveys — ❌ Missing
- [ ] Color-coding of surveys for organization — ❌ Missing
- [ ] Related Courses linkage (eLearning) — ❌ Missing
- [ ] Survey duration tracking (average completion time) — ❌ Missing

### Views / UI
- [ ] Kanban / dashboard view — 🟡 Partial (renders as list with stat cards, not true kanban cards per survey)
- [ ] List view — 🟡 Partial (reuses kanban render; no dedicated list)
- [ ] Form view (survey settings) — ✅ Done (title, description, scoring type, state)
- [ ] Question builder view (in-form question editor) — ❌ Missing
- [ ] Results / analytics view — ❌ Missing
- [ ] Activities view — ❌ Missing
- [ ] Public survey-taking form (participant view) — ❌ Missing

### Role & Permission Settings
- [ ] Survey user role — ❌ Missing
- [ ] Survey administrator role — ❌ Missing
- [ ] Public / anonymous participant access — ❌ Missing
- [ ] Require login toggle — ❌ Missing

### Module Configuration
- [ ] Mail template customization for invitations — ❌ Missing
- [ ] Access mode per survey (link / invitation only / authenticated) — ❌ Missing
- [ ] Certification settings (pass score %) — ❌ Missing

### Integrations
- [ ] Calendar — ❌ Missing
- [ ] Mail / email invitation system — ❌ Missing
- [ ] Recruitment (interview questionnaire) — ❌ Missing (Odoo links Surveys ↔ Recruitment)
- [ ] Events (post-track quizzes) — ❌ Missing
- [ ] eLearning / Courses — ❌ Missing
- [ ] Contacts (recipient management) — ❌ Missing
- [ ] Automation module — ❌ Missing
- [ ] Claude AI (3 actions: generate questions from topic, summarize results, identify key insights) — ❌ Missing

### API Endpoints
- [ ] GET /api/surveys — ✅ Done (paginated, includes question + response counts)
- [ ] GET /api/surveys/:id — ✅ Done (includes questions with answers, responses)
- [ ] POST /api/surveys — ✅ Done
- [ ] PUT /api/surveys/:id — ✅ Done
- [ ] DELETE /api/surveys/:id — ❌ Missing (no delete route; store has no deleteSession method either)
- [ ] POST /api/surveys/:id/questions — ✅ Done
- [ ] PUT /api/surveys/:id/questions/:qid — ❌ Missing
- [ ] DELETE /api/surveys/:id/questions/:qid — ❌ Missing
- [ ] POST /api/surveys/:id/respond — ✅ Done (creates SurveyUserInput)
- [ ] GET /api/surveys/:id/results — ❌ Missing (no aggregated results endpoint)
- [ ] POST /api/surveys/:id/invite (send email invitations) — ❌ Missing

---
## Missing Features Summary

**Critical gaps (block real use):**
1. No in-app question builder — cannot create or manage questions through the UI; the form only shows a count
2. No public survey-taking form — participants have no way to respond through the frontend
3. No email invitation flow — cannot distribute surveys to respondents
4. No results / analytics view — responses are collected but never displayed or summarized
5. No DELETE endpoint for surveys
6. Kanban and list views render the same component (code path: `{currentView === 'list' && renderKanban()}`)

**Functional but shallow:**
- Scoring types are stored but never applied to calculate scores on responses
- "Test / View" button renders but has no implemented action
- `SurveyUserInput` state tracking (in-progress/done) is in the model but invisible in the UI

**Certification mode entirely absent:**
- No is_certification toggle, pass threshold, or certificate generation

---
## Recommended Build Order

1. **DELETE /api/surveys/:id** route + store method — 0.5 day
2. **Dedicated list view** (separate from kanban) — 0.5 day
3. **In-app question builder** — add/edit/delete/reorder questions per survey, select question type, configure answer options — 4 days
4. **Public survey-taking form** — step-by-step question display with progress, submit response — 3 days
5. **Results / analytics view** — per-question breakdown (bar/pie charts), response list, avg score, completion rate — 3 days
6. **Score calculation** — apply scoring type to compute pass/fail per response — 1 day
7. **Email invitation** — send survey link to contact list with deadline — 2 days
8. **Access mode** (link / invite only / authenticated) + login requirement toggle — 1 day
9. **Certification mode** — is_certification toggle, pass score %, certificate PDF — 2 days
10. **Live session mode** — real-time question broadcast to participants — 4 days
11. **Recruitment integration** — attach survey to applicant as interview questionnaire — 1 day
12. **Claude AI actions** — generate questions from topic, summarize results, identify key insights — 2 days
