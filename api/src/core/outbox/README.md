# core/outbox

Reliable transactional outbox for cross-module event publishing. Prevents lost events on process crash.

Key exports:
- `publishEvent(orgId, eventKey, payload, tx)` — writes an `OutboxEvent` in the same transaction as the business mutation
- Background job (`jobs/outbox-relay.ts`) polls `OutboxEvent` where `publishedAt IS NULL` and delivers to subscribers

Pattern:
1. Business mutation runs in a Prisma transaction
2. `publishEvent` writes the outbox record inside the same transaction
3. If the transaction commits, the outbox job guarantees delivery
4. If the transaction rolls back, no event is published

See ADR-0004 and Phase 3 in `CLAUDE_CODE_BUILD_PLAN.md`.
