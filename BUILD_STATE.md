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
3. Build order: **[docs/BUILD_ORCHESTRATION.md](docs/BUILD_ORCHESTRATION.md)** Track B — calendar adapter ✅; CRM settings UI ✅; **`/api/automation` RBAC** ✅; outbox **`email.send`** ✅; workflow actions ✅ + **`UPDATE_RECORD`** blocklist ✅ + **`CRON`** ✅ + **`SEQUENCE`** / **`WEBHOOK`** ✅ (retries + HMAC); optional Postgres **`AUTOMATION_WEBHOOK_QUEUE`** + DLQ ✅; **`/api/campaigns`** + **`/api/marketing-web` RBAC** ✅; **`POST /api/settings`** + **`GET /api/settings/users`** require **`settings.write`** ✅; **`/api/ai`** **`ai.run`** / **`ai.approve`** guards ✅; structured **`Workflow.condition`** JSON + **`__previous`** + **`evaluateWorkflowCondition`** ✅; Track C: CRM depth, pipeline analytics (see gap summary).

## Track B note (automation)

- **`AutomationService`** — **`NOTIFICATION`** → **`timelineEvent`**; **`EMAIL`** → outbox **`email.send`**; **`UPDATE_RECORD`** uses **`runAutomationSkipped`** + model blocklist; **`SEQUENCE`** runs nested **`actions`**; **`WEBHOOK`** posts JSON (**`record`** without **`__previous`**), optional **`X-Fusion-Webhook-Signature`**, retries on **5xx**/network; **`CRON`** resynced on a timer (**`WORKFLOW_CRON_REFRESH_MS`**).

---

*After substantive work sessions, bump **Last updated** and align rows with `docs/BUILD_ORCHESTRATION.md` Checkpoint.*
