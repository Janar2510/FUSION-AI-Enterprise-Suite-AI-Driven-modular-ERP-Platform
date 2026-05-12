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
3. Build order: **[docs/BUILD_ORCHESTRATION.md](docs/BUILD_ORCHESTRATION.md)** Track B — calendar adapter ✅; CRM settings UI ✅; **`/api/automation` RBAC** ✅; outbox **`email.send`** ✅ (no direct **`sendEmail`** outside relay); workflow actions ✅ + **`UPDATE_RECORD`** blocklist ✅ + **`CRON`** ✅; **`/api/campaigns`** + **`/api/marketing-web` RBAC** ✅ (`marketing.read` / `marketing.write`); next: more module RBAC, richer automation conditions / action types.

## Track B note (automation)

- **`AutomationService`** — **`NOTIFICATION`** → **`timelineEvent`**; **`EMAIL`** → outbox **`email.send`**; **`UPDATE_RECORD`** uses **`runAutomationSkipped`** + model blocklist; **`CRON`** resynced on a timer (**`WORKFLOW_CRON_REFRESH_MS`**).

---

*After substantive work sessions, bump **Last updated** and align rows with `docs/BUILD_ORCHESTRATION.md` Checkpoint.*
