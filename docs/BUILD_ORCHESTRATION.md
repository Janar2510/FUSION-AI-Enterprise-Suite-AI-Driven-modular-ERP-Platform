# Build orchestration — FusionAI Enterprise Suite

**Purpose:** Single plan the lead agent follows across sessions. After debugging or side tasks, **resume here** — do not silently change phase without updating this file and root `BUILD_STATE.md`.

## How to use (agents)

1. **Session start:** Read `BUILD_STATE.md` (root), then this file, then `docs/architecture.md` for links.
2. **During work:** Pick **one** active track (A, B, or C). Note blockers in **Interrupt log**.
3. **Session end:** Update **Checkpoint** below and `BUILD_STATE.md` (phase, next tasks, last-known-good commit if any).
4. **Skill selection:** Match **current task → one skill** per `docs/ai-rules.md`; do not fan out to every skill.

---

## Tracks (A / B / C)

These map the earlier strategy: tooling + platform, shared infrastructure, then revenue-deep modules.

### Track A — Tooling, Ruflo, Obsidian, MCP

| Step | Status | Notes |
| --- | --- | --- |
| Obsidian: open `docs/` as vault (see `docs/OBSIDIAN_VAULT.md`) | ☐ | Local GUI step; `.obsidian/` may be created by Obsidian |
| Ruflo CLI: install/init in this repo | ✅ | PATH: `export PATH="$HOME/.npm-global/bin:$PATH"` if `command not found`. If init warns “already initialized”, **No** keeps `.claude/`; use `ruflo init --force` only to replace config |
| RuFlo **spawn / swarm** recipes (different agent types + skills) | ✅ | See **[RUFLO_AGENTS.md](./RUFLO_AGENTS.md)** — `ruflo agent spawn`, `ruflo swarm start`, task↔skill mapping |
| Claude Mem / MCP: confirm `user-claude-mem` search works for this project | ☐ | Optionally set `CLAUDE_MEM_RUNTIME=server-beta` for full-text context |
| Missing skills / MCPs logged | ☐ | Use **Outbound requests** section |

### Track B — Sprint 1 shared infrastructure (from gap summary)

Ordered for leverage (edit checkboxes as you complete).

- [x] Email outbox relay wired to known “send” paths that should use it (**`email.send`** via **`publishEvent`** for recruitment stage change, planning shift notify, campaigns; Prisma **`eventKey`** + JSON **`payload`** aligned). **Audit:** **`sendEmail`** is only invoked from **`api/src/jobs/outboxRelay.ts`** (implementation in **`api/src/core/email/index.ts`**).
- [x] Module settings **pattern** — CRM pilot: **Settings** UI ↔ **`GET` / `PUT /api/settings/crm`** (`crm.*` keys). Accounting (or second module) still optional as follow-up pilot.
- [x] **`/api/automation`** RBAC — `requirePermission('automation.read')` / `requirePermission('automation.write')`; spine permissions `automation.read` / `automation.write` (`roles.ts` + idempotent **`seed-roles`**)
- [ ] Role-per-module RBAC on remaining high-risk routes (**done:** campaigns, marketing-web, **`POST /api/settings`**, **`GET /api/settings/users`**; **`/api/automation`**; **`/api/ai`** **`ai.run`** + **`ai.approve`** guards; extend: automation condition depth, etc.)
- [x] Shared calendar adapter — `POST /api/calendar/events` (same payload as `POST /api/calendar`; module integration path)
- [ ] Minimal automation rules engine (trigger + action MVP — **partial:** Prisma **`$use`** middleware invokes **`AutomationService`** on create/update (non-Workflow models); **`EMAIL`** / **`NOTIFICATION`** / **`UPDATE_RECORD`** implemented (**`UPDATE_RECORD`** model blocklist for sensitive tables); **`CRON`** via **`workflowCronBootstrap`** with periodic DB resync (**`WORKFLOW_CRON_REFRESH_MS`**); deeper items: richer conditions, expand action types)

### Track C — P1 revenue-critical depth

Do **not** start until Track B foundations are underway or explicitly deprioritized by the user.

- [ ] CRM: activities + pipeline analytics (see `docs/modules/crm-spec.md`)
- [ ] Accounting: reporting / tax UX (see spec)
- [ ] Invoicing: server routes + UI wired to backend
- [ ] (Add/remove from `docs/modules/00-master-gap-summary.md` as priorities shift)

---

## Ruflo (CLI)

[Ruflo](https://github.com/ruvnet/ruflo) is a Claude Code orchestration toolkit (skills, agents, hooks). **It is not required** to compile or run FusionAI — it assists development workflows.

**Recipes for multiple agents / swarms:** **[RUFLO_AGENTS.md](./RUFLO_AGENTS.md)** (`ruflo agent spawn`, `ruflo swarm`, task↔Fusion track mapping).

**Install (pick one):**

```bash
# Global CLI, then init in this repo (ruflo on npm, e.g. 3.7.x-alpha)
npm install -g ruflo@latest
cd /path/to/FUSION-AI-Enterprise-Suite-AI-Driven-modular-ERP-Platform
ruflo init              # default
# or:  ruflo init wizard           (interactive)
# or:  ruflo init --minimal | --full | --force
# or:  ruflo init skills --all   |   ruflo init hooks --minimal
# or:  ruflo init --only-claude  |   ruflo init --skip-claude
# or:  ruflo init check          (verify initialized)
```

`npx ruflo@latest init --help` resolves to the same `init` usage; the first run may take several minutes while npm downloads the package. If `npx ruflo` stalls in CI sandboxes, run the same commands locally (interactive prompts may appear).

**If `zsh: command not found: ruflo` after `npm install -g`:** npm installed the binary, but your **global bin directory is not on `PATH`**. Common when `npm config get prefix` is something like `~/.npm-global` instead of `/usr/local`. Fix:

```bash
# One-time check where the shim was installed:
npm config get prefix              # e.g. /Users/you/.npm-global
ls "$(npm config get prefix)/bin/ruflo"   # should exist

# Add to ~/.zshrc (use your actual prefix from above):
export PATH="$(npm config get prefix)/bin:$PATH"

# Then: source ~/.zshrc   and run   ruflo init
```

**Workarounds without editing PATH:** run `npx ruflo init` from the repo, or call the shim directly: `"$(npm config get prefix)/bin/ruflo" init`.

**`RuFlo appears to be already initialized`:** the repo already has `.claude/` (e.g. `settings.json`). Choose **No** at the prompt to **keep** the current config (typical). To **replace** everything with a fresh Ruflo layout, run `ruflo init --force` and confirm when asked.

Mark **Track A → Ruflo** complete when `.claude` / Ruflo hooks are present **or** the user declines Ruflo and documents that decision here.

---

## Checkpoint (live)

_Update every session end or significant milestone._

| Field | Value |
| --- | --- |
| **UTC date** | 2026-05-12 |
| **Active track** | **B** — shared infrastructure (see checklist above) |
| **Current task** | Track B: **`/api/ai`** RBAC (**`ai.run`** vs **`ai.approve`**) + seed **`ai.approve`** on AI manager roles — **done**. Next: automation — richer conditions / action types. |
| **Next three tasks** | 1) Automation — richer conditions and action types … 2) Track C prep after B stabilizes … 3) Remaining route hardening if any gaps |
| **Blocked by** | — |
| **Last known good** | `npx jest src/core/__tests__/outbox.test.ts` — pass; workflow **EMAIL** → outbox; **NOTIFICATION** → **`TimelineEvent`** |

---

## Interrupt log

_Use for debugging derailments — then return to **Checkpoint** and keep the active track._

| Date (UTC) | What broke | Fix / PR / commit | Resumed track |
| --- | --- | --- | --- |
| | | | |

---

## Outbound requests (skills / MCP / human)

_Use when an agent capability is missing._

| Needed | Why | Owner |
| --- | --- | --- |
| | | |

---

## Agreement (orchestrator role)

The lead agent **sequences** tracks, keeps **Checkpoint** honest, asks the user only when blocked on product priority or secrets, and **always** resumes the build after interrupts by reading this file and `BUILD_STATE.md`.
