# Project — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/services/project.html
**FusionAI status:** Partial
**Effort to complete:** M
**Business priority:** P1

---
## Odoo 17 Feature Checklist

### Core Features
- [x] Project creation (name, description, start date, deadline) — ✅ Done
- [x] Task creation within projects (name, description, priority, deadline) — ✅ Done
- [x] Task stage pipeline (customizable stages) — ✅ Done
- [x] Kanban drag-and-drop stage movement for tasks — ✅ Done
- [x] Priority field on tasks (normal / high) — ✅ Done
- [x] Kanban state on tasks (normal / blocked / ready) — 🟡 Partial (field in model, not surfaced as visual indicator in UI)
- [x] Sub-task support (parentId field exists) — 🟡 Partial (field in model, no UI for sub-task creation or tree display)
- [x] Chatter / message log per project and task — ✅ Done
- [x] AI Actions panel on tasks (ProjectTask agent) — ✅ Done
- [ ] Task dependencies (task cannot start until predecessor is done) — ❌ Missing
- [ ] Recurring tasks automation — ❌ Missing
- [ ] Personal tasks (tasks not attached to a project) — ❌ Missing
- [ ] Task tags / labels — ❌ Missing
- [ ] Task assignees (multiple users per task) — ❌ Missing (no assignee field surfaced in UI or model)
- [ ] Task hours planned vs actual comparison — ❌ Missing
- [ ] Project profitability / budget tracking — ❌ Missing
- [ ] Project templates — ❌ Missing
- [ ] Burn-down charts / progress metrics — ❌ Missing
- [ ] Private projects (visibility control) — ❌ Missing
- [ ] Project customer assignment — ❌ Missing (no partnerId on ProjectProject model)
- [ ] Task color coding — 🟡 Partial (color field exists in model, not used in UI)
- [ ] Edit task (updateTask in store is a no-op — commented out in ProjectModule) — ❌ Missing

### Views / UI
- [x] List view (projects) — ✅ Done
- [x] List view (tasks) — ✅ Done
- [x] Kanban view (tasks) — ✅ Done
- [x] Form view (projects and tasks) — ✅ Done
- [ ] Calendar view (tasks by deadline) — ❌ Missing
- [ ] Gantt / timeline view (project schedule) — ❌ Missing
- [ ] Graph / pivot view (project analytics) — ❌ Missing
- [ ] Activity view — ❌ Missing
- [ ] Sub-task tree display in task form — ❌ Missing

### Role & Permission Settings
- [x] requireAuth middleware on all project routes — ✅ Done
- [ ] Project Manager / Project User / Portal User role distinction — ❌ Missing
- [ ] Project-level visibility (internal / invited users / public) — ❌ Missing
- [ ] Per-task follower management — ❌ Missing

### Module Configuration
- [ ] Billable tasks / project billing settings — ❌ Missing
- [ ] Time tracking enabled per project — ❌ Missing
- [ ] Sub-task configuration (max depth) — ❌ Missing
- [ ] Project stages configuration (project-level vs shared stage pipeline) — ❌ Missing (stages are global)
- [ ] Automatic activity scheduling — ❌ Missing

### Integrations
- [x] Timesheets (tasks linked to timesheet entries) — ✅ Done
- [x] Helpdesk (create task from ticket) — ✅ Done
- [x] ChatterPanel (mail / messaging) per project and task — ✅ Done
- [x] Claude AI — AI Actions panel on ProjectTask — ✅ Done
- [ ] Calendar (sync task deadlines to calendar events) — ❌ Missing
- [ ] Planning (resource allocation from project tasks) — ❌ Missing
- [ ] Field Service (field task as project sub-task) — ❌ Missing
- [ ] Invoicing (bill project hours to customer) — ❌ Missing
- [ ] Sales (link project to sale order) — ❌ Missing
- [ ] Automation (trigger actions on task state changes) — ❌ Missing

### API Endpoints
- [x] GET /api/projects/stages — ✅
- [x] GET /api/projects — ✅
- [x] GET /api/projects/:id — ✅
- [x] POST /api/projects — ✅
- [x] PUT /api/projects/:id — ✅
- [x] GET /api/projects/:projectId/tasks — ✅
- [x] POST /api/projects/:projectId/tasks — ✅
- [x] PATCH /api/projects/tasks/:id/stage — ✅
- [ ] PUT /api/projects/tasks/:id — ❌ (task edit endpoint missing; store has no-op for edit)
- [ ] DELETE /api/projects/:id — ❌ (no soft-delete endpoint for projects)
- [ ] DELETE /api/projects/tasks/:id — ❌ (no soft-delete endpoint for tasks)
- [ ] GET /api/projects/:id/timesheets — ❌
- [ ] GET /api/projects/:id/budget — ❌
- [ ] GET /api/projects/tasks/:id/subtasks — ❌

---
## Missing Features Summary

1. **Task edit is broken** — `updateTask` in `projectStore.ts` is explicitly a no-op (`// Edit task logic not fully implemented in store yet`). Editing existing tasks is non-functional.
2. **No task assignees** — No user/employee assignment field on tasks; a core Project feature.
3. **No project customer** — `ProjectProject` has no `partnerId` field; cannot associate projects with customers for billing.
4. **No DELETE endpoints** — Projects and tasks cannot be archived or deleted via API.
5. **Sub-tasks display missing** — The `parentId` field exists but there is no UI to create, navigate, or display sub-task trees.
6. **Gantt view** — Critical for project timeline management; completely absent.
7. **Task dependencies** — Prerequisite task linking is missing entirely.
8. **Recurring tasks** — No automation for repeating task generation.
9. **Project profitability** — No budget vs. actual hours/cost comparison.
10. **Stage scoping** — All projects share the same global stage set; Odoo stages are project-specific.

---
## Recommended Build Order

1. Fix task edit endpoint + store action (critical bug, 2h)
2. Add DELETE (soft-archive) endpoints for projects and tasks (1h)
3. Add assignee field (employeeId) to tasks + UI (1 day)
4. Add partnerId (customer) to ProjectProject model + form (half day)
5. Sub-task creation + tree display in task form (M, 2 days)
6. Calendar view for task deadlines (1 day)
7. Per-project stage pipelines (M, 2 days)
8. Task tags / labels (M, 1 day)
9. Task dependencies engine (L, 3 days)
10. Gantt / timeline view (L, 3–5 days — requires Gantt component)
11. Project profitability dashboard (L, 3 days)
12. Invoicing integration (M, 2 days)
