# core/chatter

Message thread and Activity service. Every business record (sale order, invoice, ticket, etc.) has a chatter — a thread of messages, internal notes, and scheduled activities.

Key exports:
- `postMessage(ownerType, ownerId, authorId, body, isInternal)` — writes a `Message`
- `scheduleActivity(ownerType, ownerId, assignedToId, type, summary, dueAt)` — writes an `Activity`
- `completeActivity(activityId, userId)` — marks activity done and emits timeline event

See ADR-0004 and Phase 4 module checklist in `CLAUDE_CODE_BUILD_PLAN.md`.
