# ADR-0013 — Record-Level Access Control (Row-Level Security)

**Status:** Accepted  
**Date:** 2026-05-07

## Context
The current `requirePermission('key')` middleware only enforces module-level permissions. Any authenticated salesperson can read all leads, all orders, all contacts — regardless of ownership. This is a data leakage and compliance risk for multi-user deployments.

## Decision
Implement a **Record Rule** layer: per-module Prisma `where` filter functions that restrict queryable rows based on the user's role.

Architecture:
```ts
// core/auth/recordRules.ts
export type RecordRule = (user: JwtPayload) => Record<string, unknown>;

export const crmLeadRules: RecordRule = (user) => {
  if (user.roles.includes('admin') || user.roles.includes('manager')) return {};
  return { OR: [{ salespersonId: user.sub }, { isPublic: true }] };
};
```

Route handlers apply rules before any DB query:
```ts
const where = { ...baseWhere, ...crmLeadRules(req.user!) };
const leads = await prisma.crmLead.findMany({ where });
```

Rules apply to: **list**, **get**, and **count** queries. Create/update/delete are separately gated by `requirePermission`.

## Module record rules (Phase 2 backlog)
| Module | Salesperson | Manager | Admin |
|--------|------------|---------|-------|
| CRM leads | Own leads only | All in company | All in org |
| Sales orders | Own orders | All in company | All in org |
| Helpdesk tickets | Assigned tickets | All teams | All |
| HR employees | Own record | Subordinates | All |
| Accounting | Read-only | Read-only | Read + post |

## Consequences
- **Good:** Eliminates data leakage between salespeople. Legally required for GDPR Article 25 (data minimization by design).
- **Bad:** Adds a function call to every list/get route — minor performance cost, offset by Postgres index usage.
- **Requires:** `salespersonId` FK on `CrmLead`, `SaleOrder`, `HelpdeskTicket`. Migration required.

## Implementation
`api/src/core/auth/recordRules.ts` — all module record rules.
Applied in each module's list + get route handler.
