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
3. Build order: **[docs/BUILD_ORCHESTRATION.md](docs/BUILD_ORCHESTRATION.md)** Track B — calendar adapter ✅; CRM settings UI ✅; **`/api/automation` RBAC** ✅; outbox **`email.send`** for recruitment + planning + campaigns ✅; **workflow rules `EMAIL`** → outbox (**`workflow-automation`** template) ✅; next: grep remaining direct sends, more RBAC, **CRON**/stub actions.

## Track B note (automation)

- **`AutomationService`** — **`NOTIFICATION`** → **`timelineEvent`** (dashboard **recent activity** path); **`EMAIL`** → outbox **`email.send`** → relay **`sendEmail`**.

---

*After substantive work sessions, bump **Last updated** and align rows with `docs/BUILD_ORCHESTRATION.md` Checkpoint.*
