# Architecture (canonical index)

This file is the **stable entry point** for agents and humans. Deep design lives in linked documents; keep this page as a small map.

## Primary documents

| Topic | Location |
| --- | --- |
| System design (layers, components, principles) | [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) |
| Module specs index | [MODULE_SPECS.md](./MODULE_SPECS.md) |
| Cross-module gap summary (backlog) | [modules/00-master-gap-summary.md](./modules/00-master-gap-summary.md) |
| Naming conventions | [conventions/naming.md](./conventions/naming.md) |
| Agent / AI orchestration rules | [AGENT_RULES.md](./AGENT_RULES.md) |
| AI implementation checklist (ops) | [AI_Implementation_Checklist.md](../AI_Implementation_Checklist.md) |

## Architecture Decision Records (ADRs)

Decisions live under [docs/adr/](./adr/). Start with:

- [0001 — Primary backend (Node + Express + Prisma)](./adr/0001-primary-backend-node-express-prisma.md)
- [0004 — Canonical domain spine](./adr/0004-canonical-domain-spine.md)
- [0005 — Module bounded context + shared spine](./adr/0005-module-bounded-context-shared-spine.md)

## Runtime shape (short)

- **API:** Node + Prisma (`api/`) — authoritative ERP HTTP API.
- **Frontend:** React + Vite (`frontend/`) — SPA against the API.
- **AI:** Agents and RAG patterns under `api/src/core/ai` and related routes; see ADRs and `docs/AGENT_RULES.md`.

## Related

- Live build plan and resume checkpoints: [BUILD_ORCHESTRATION.md](./BUILD_ORCHESTRATION.md) and root `BUILD_STATE.md`.
- AI/agent rules index: [ai-rules.md](./ai-rules.md).
