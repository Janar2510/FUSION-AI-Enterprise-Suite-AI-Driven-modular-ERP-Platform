# Notes — Gap Analysis
**Odoo 17 docs:** https://www.odoo.com/documentation/17.0/applications/productivity/to_do.html
**FusionAI status:** Partial
**Effort to complete:** S
**Business priority:** P3

---
## Odoo 17 Feature Checklist

### Core Features
- [x] Create note with title — ✅ Done
- [x] Note body (text content) — 🟡 Partial (plain textarea; Odoo uses rich Odoo Editor with slash commands)
- [x] Three-stage pipeline (To Do / Doing / Done) — ✅ Done (STAGES constant maps: new / in_progress / done)
- [x] Stage progression via form status bar — ✅ Done (stage buttons in statusRibbon)
- [x] Delete note — ✅ Done (DELETE /notes/:id)
- [x] Sequence ordering — ✅ Done (sequence field in schema, sorted on fetch)
- [ ] Custom stages (add / fold / delete personal stages) — ❌ Missing (stages are hardcoded in frontend)
- [ ] Note color coding — 🟡 Partial (color field in schema, not rendered visually in cards)
- [ ] Tags / labels — ❌ Missing (no tag model or UI)
- [ ] Assignees / sharing — ❌ Missing (no assignee field; Odoo sharing auto-shares with assignees)
- [ ] Activity scheduling (activity type, due date, assignee, notes) — ❌ Missing
- [ ] Deadline / due date field — ❌ Missing
- [ ] Rich text / Odoo Editor with slash commands — ❌ Missing (plain textarea only)
- [ ] Convert to project task — ❌ Missing (no integration with Project module)
- [ ] Quick-create from command palette (Ctrl+K) — ❌ Missing

### Views / UI
- [x] Kanban board with drag-and-drop — ✅ Done (@hello-pangea/dnd)
- [x] List view — ✅ Done (OdooListBase showing name + stage badge)
- [x] Form view — ✅ Done (OdooFormBase with textarea body)
- [x] Search / filter by title — ✅ Done (client-side searchTerm filter)
- [ ] Stage column counter — ✅ Done (count badge shown per stage)
- [ ] Activity view — ❌ Missing
- [ ] Kanban card color band — ❌ Missing (color field exists in DB, not applied to card)
- [ ] Collaborator avatar display — ❌ Missing
- [ ] Graph / pivot view — ❌ Missing

### Role & Permission Settings
- [ ] Personal vs. shared notes distinction — ❌ Missing (all notes are global; no user scoping)
- [ ] Note visibility (private to creator) — ❌ Missing

### Module Configuration
- [ ] Stage configuration page (admin) — ❌ Missing
- [ ] Default stage setting — ❌ Missing

### Integrations
- [ ] Project — "Convert to Task" action on note — ❌ Missing
- [ ] Calendar — attach note deadline to calendar — ❌ Missing
- [ ] Discuss — link note in channel message — ❌ Missing
- [ ] Claude AI — AI drafting / summarisation of note body — ❌ Missing
- [ ] Automation — trigger automation from note stage change — ❌ Missing

### API Endpoints
- [x] GET  /notes (ordered by sequence) — ✅
- [x] POST /notes — ✅
- [x] PUT  /notes/:id — ✅
- [x] DELETE /notes/:id — ✅
- [ ] GET  /notes?userId= (personal scoping) — ❌
- [ ] POST /notes/:id/convert-to-task — ❌
- [ ] GET  /notes/stages (configurable stages) — ❌
- [ ] POST /notes/stages — ❌

---
## Missing Features Summary

| Gap | Severity |
|-----|----------|
| Notes not scoped per user (all users see all notes) | High |
| No rich text editor (slash commands, media embed) | Medium |
| Color coding not visually applied to kanban cards | Low |
| No tags | Medium |
| No assignees / sharing | Medium |
| No activity scheduling | Low |
| No "Convert to Task" integration | Low |
| No Claude AI drafting | Low |
| Stages hardcoded — no admin configuration | Low |

---
## Recommended Build Order

1. **User scoping** — add `userId` to Note schema + filter GET /notes by authenticated user (1 day)
2. **Color band on kanban cards** — map color int to Tailwind class and render left border (0.5 days)
3. **Tags** — add Tag model + many-to-many on Note, tag chips in form + kanban card (2 days)
4. **Assignees** — add `assignees` relation to Note, avatar display in card, share logic (1 day)
5. **Rich text editor** — integrate TipTap or similar with `/` slash commands (2 days)
6. **Due date** — add deadline field + visual indicator on kanban card when overdue (1 day)
7. **Activity scheduling** — reuse Activity model from HR/CRM, surface on note form (1 day)
8. **Convert to Task** — POST /notes/:id/convert-to-task that creates a ProjectTask (1 day)
9. **Claude AI drafting** — AI sidebar button to suggest / expand note body (1 day)
