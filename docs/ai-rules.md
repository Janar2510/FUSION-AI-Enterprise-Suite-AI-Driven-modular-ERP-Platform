# AI rules (canonical index)

FusionAI uses layered instructions. This file points to them so tools and humans can find a **single path** without duplicating long policy text.

## Repository rules for coding agents

| Source | Purpose |
| --- | --- |
| [AGENT_RULES.md](./AGENT_RULES.md) | Agent behavior: safety, tools, patterns, BaseAgent expectations |
| Root [CLAUDE.md](../CLAUDE.md) | Skills table + `skillkit read` usage; project marketing skills |
| `.cursor/rules` / user Cursor rules | Editor-specific constraints (TypeScript, surgical diffs, design tokens) |

## When building product code

1. Prefer **surgical diffs** — one feature or fix per focused change unless the user expands scope.
2. **Do not invent** public APIs or Prisma models without an agreed spec (see `docs/modules/*-spec.md`).
3. Match existing patterns in `api/src` and `frontend/src` (naming, folders, error handling).
4. After meaningful changes, update [CHANGELOG.md](../CHANGELOG.md) and [DeploymentChecklist.md](../DeploymentChecklist.md) when deployment or ops are affected.

## Skills: how to choose (task → skill)

**Do not load “all skills.”** For each task:

1. State the task in one line (e.g. “optimize signup form”, “add SEO schema”).
2. Match to the **narrowest** skill from `CLAUDE.md` / `.claude/skills/` (e.g. `signup-flow-cro`, `schema-markup`).
3. Read that skill once, then implement. If no skill fits, proceed with normal engineering judgment and note the gap in `docs/BUILD_ORCHESTRATION.md` (missing capability / MCP).

## If a skill or MCP is missing

Log it under **Outbound requests** in [BUILD_ORCHESTRATION.md](./BUILD_ORCHESTRATION.md) so the user can add tooling without losing context.
