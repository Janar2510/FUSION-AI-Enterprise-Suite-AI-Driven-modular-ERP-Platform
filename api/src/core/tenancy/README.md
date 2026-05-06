# core/tenancy

Multi-tenant scoping middleware and the `tenantDb()` wrapper that enforces `organizationId` on every Prisma query.

Key exports:
- `requireTenant` — middleware that validates `req.user.organizationId` and `req.user.companyId`
- `tenantDb(orgId)` — returns a Prisma-wrapped client that injects `organizationId` on every query
- Never call `prisma.<model>.findMany()` directly without this wrapper or an explicit `where: { organizationId }`.

See ADR-0005 and Phase 1 in `CLAUDE_CODE_BUILD_PLAN.md`.
