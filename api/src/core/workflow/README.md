# core/workflow

State machine helpers for ERP document lifecycle (Lead → Opportunity → Won, Quote → Order → Delivered, Invoice → Posted → Paid, etc.).

Key exports:
- `transition(entity, from, to, allowedTransitions)` — validates and applies a state transition
- `assertState(entity, expectedState)` — throws if the entity is not in the expected state
- Every state transition must be wrapped in a Prisma transaction and call `audit()` + `emitTimeline()`

See Phase 3 flows in `CLAUDE_CODE_BUILD_PLAN.md`.
