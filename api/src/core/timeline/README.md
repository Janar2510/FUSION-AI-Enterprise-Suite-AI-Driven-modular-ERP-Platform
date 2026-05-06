# core/timeline

Immutable event stream anchored to Partner + owner record. Powers the Partner 360° timeline view.

Key exports:
- `emitTimeline(args)` — writes a `TimelineEvent` record (and an `OutboxEvent` for cross-module subscribers)
- Call inside the same transaction as the business mutation where the event originates
- Every partner-relevant action (quote sent, payment received, ticket opened, etc.) must emit a timeline event

See ADR-0004 and Phase 1 in `CLAUDE_CODE_BUILD_PLAN.md`.
