# Ruflo agents + Fusion skills (local workflow)

Use **[Ruflo](https://github.com/ruvnet/ruflo)** for **extra terminals / swarms** beside Cursor. It does not replace the IDE agent; it orchestrates **parallel** `agent spawn` / `swarm` runs when you want many workstreams (e.g. API + UI + specs).

**CLI:** ensure `ruflo` is on `PATH` (`export PATH="$HOME/.npm-global/bin:$PATH"` — see [BUILD_ORCHESTRATION.md § Ruflo](./BUILD_ORCHESTRATION.md#ruflo-cli)).

---

## 1. Health check

```bash
cd /path/to/FUSION-AI-Enterprise-Suite-AI-Driven-modular-ERP-Platform
ruflo doctor           # optional diagnostics
ruflo init check       # confirms .claude presence
```

---

## 2. Start orchestration (daemon / memory — optional)

```bash
ruflo start             # or: ruflo start --help for flags
```

Use when you want the full RuFlo runtime (memory, swarm hooks). For **lightweight** work, you can skip this and only use `agent spawn` below.

---

## 3. Spawn single agents (different “skills” via agent type + task)

RuFlo maps work to **agent types** (`-t`) and an initial **task** string. Pair that with **project skills** in Cursor/Claude Code (see root `CLAUDE.md` / `npx skillkit read <name>` for marketing, CRO, etc.).

| Fusion workstream | Suggested `ruflo agent spawn` | Pair with project skill (examples) |
| --- | --- | --- |
| API / Prisma / routes | `ruflo agent spawn -t coder -p anthropic --task "Sketch role-per-module middleware in api/src/core/auth; apply to one CRM route only"` | Frappe/Express patterns from your global skills if applicable |
| Frontend / React | `ruflo agent spawn -t coder --task "Add module settings shell for CRM from docs/BUILD_ORCHESTRATION Track B"` | `ui-ux-pro-max`, or `page-cro` for conversion |
| Research / specs | `ruflo agent spawn -t researcher --task "Summarize docs/modules/crm-spec.md gaps vs current routes"` | — |
| Security / review | `ruflo agent spawn -t researcher --task "Review requireAuth + RBAC gaps on api/src/routes"` | workspace `007` / security rules if installed |

**Examples:**

```bash
# Terminal A — backend-focused
ruflo agent spawn -t coder -n fusion-api \
  --task "Read api/src/core/outbox and propose one route that enqueues email.send via publishEvent"

# Terminal B — frontend-focused
ruflo agent spawn -t coder -n fusion-web \
  --task "Read frontend ModuleDashboard pattern; list modules missing ChatterPanel per docs/modules/00-master-gap-summary.md"

# List / stop
ruflo agent list
ruflo agent stop <id>   # see ruflo agent stop --help
```

**Providers / models:** `-p anthropic` (default), `openrouter`, `ollama`; `-m` for model override.

---

## 4. Swarm (multi-agent mesh)

For **coordinated** parallel work (RuFlo V3 advertises 15-agent mesh):

```bash
ruflo swarm init --help          # pick --v3-mode if available
ruflo swarm start -o "Track B: shared infra" -s development
ruflo swarm status
ruflo swarm stop
```

Use **swarm** when one meta-objective splits into many tasks; use **separate `agent spawn`** when humans want clear ownership per terminal.

---

## 5. Map to this repo’s build tracks

| Track | What to run in Ruflo | What to run in Cursor |
| --- | --- | --- |
| **B** Shared infra (outbox, settings, RBAC, calendar) | `coder` tasks aimed at `api/src`, `docs/modules/00-master-gap-summary.md` | Same files; use `docs/ai-rules.md` to pick **one** skill per task |
| **C** CRM / Accounting / Invoicing depth | `researcher` spec diff + `coder` implementation passes | Competitor/feature specs under `docs/modules/` |

Live checklist: **[BUILD_ORCHESTRATION.md](./BUILD_ORCHESTRATION.md)**.

---

## 6. Notes

- Deprecated npm warnings (`uuid@9`, `boolean`, etc.) come from RuFlo dependencies; safe to ignore for CLI use unless you fork RuFlo.
- **Skills** bundled under `.claude/skills/` (Corey Haines–style packs) are for **Claude Code** contexts; RuFlo agents use `-t` + `--task` — combine both for speed.
- Prefer **small tasks** per agent (`--task "one file / one endpoint"`); merge in Git or Cursor after review.

---

*Bump `BUILD_STATE.md` when you rotate primary track or finish a swarm milestone.*
