# core/audit

Append-only audit log service. Every mutation on every business entity must call `audit()`.

Key exports:
- `audit(args)` — writes an `AuditLog` record with before/after snapshots, actor, IP, and user agent
- Audit logs are immutable — no UPDATE or DELETE is ever issued on `AuditLog`
- Always wrap in the same Prisma transaction as the business mutation

See ADR-0004, ADR-0006, and Phase 1 in `CLAUDE_CODE_BUILD_PLAN.md`.
