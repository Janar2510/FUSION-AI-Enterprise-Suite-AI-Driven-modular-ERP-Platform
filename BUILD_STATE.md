# Build state — read first

**Canonical detail:** [`docs/BUILD_ORCHESTRATION.md`](docs/BUILD_ORCHESTRATION.md)  
**Architecture index:** [`docs/architecture.md`](docs/architecture.md)  
**AI rules index:** [`docs/ai-rules.md`](docs/ai-rules.md)

## Snapshot

| Field | Value |
| --- | --- |
| **Phase** | Track **B** — shared infrastructure (with RuFlo parallel agents optional) |
| **Last updated** | 2026-05-12 |

## Next actions (queues)

1. Parallel dev: **[docs/RUFLO_AGENTS.md](docs/RUFLO_AGENTS.md)** — `ruflo agent spawn` / `ruflo swarm` + Cursor for implementation.
2. User: Open **`docs/`** as an Obsidian vault ([docs/OBSIDIAN_VAULT.md](docs/OBSIDIAN_VAULT.md)).
3. Build order: **[docs/BUILD_ORCHESTRATION.md](docs/BUILD_ORCHESTRATION.md)** Track B — calendar adapter ✅; CRM settings UI ✅; **`/api/automation` RBAC** ✅; outbox **`email.send`** for recruitment + planning + campaigns ✅; workflow actions **`EMAIL`** / **`NOTIFICATION`** / **`UPDATE_RECORD`** + **`CRON`** bootstrap ✅; next: grep remaining direct sends, more RBAC, cron hot-reload / more actions.

## Track B note (automation)

- **`AutomationService`** — **`NOTIFICATION`** → **`timelineEvent`**; **`EMAIL`** → outbox **`email.send`**; **`UPDATE_RECORD`** guarded by **`runAutomationSkipped`** (no middleware loops); **`CRON`** via **`startWorkflowCronSchedules`** (restart to pick up schedule edits).

---

*After substantive work sessions, bump **Last updated** and align rows with `docs/BUILD_ORCHESTRATION.md` Checkpoint.*
