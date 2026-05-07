/**
 * core/auth/recordRules — Record-level access control (ADR-0013)
 *
 * Returns a Prisma `where` clause fragment that restricts which rows
 * the current user can read, based on their role and ownership.
 *
 * Rules (applied per module):
 *   - admin/manager  → no additional filter (sees all in org)
 *   - salesperson    → owns the record (userId === req.user.sub) OR record has no owner
 *   - support agent  → assigned tickets only OR unassigned
 *   - accountant     → read-only; sees all in company (no row filter, role checked separately)
 *   - employee       → own records only
 *
 * Usage in a route handler:
 *   const filter = crmLeadFilter(req.user!);
 *   const leads = await prisma.crmLead.findMany({ where: { ...filter, ...otherWhere } });
 *
 * IMPORTANT: Always merge with your existing `where` clause — never replace it.
 */

import type { JwtPayload } from './index';

// ── Role helpers ──────────────────────────────────────────────────────────────

function isAdmin(user: JwtPayload): boolean {
    return user.roles.some(r => ['admin', 'Administrator'].includes(r));
}

function isManager(user: JwtPayload): boolean {
    return user.roles.some(r => ['admin', 'manager', 'Administrator', 'Manager'].includes(r));
}

function isAccountant(user: JwtPayload): boolean {
    return user.roles.some(r => ['accountant', 'Accountant'].includes(r));
}

// ── Module filters ────────────────────────────────────────────────────────────

/**
 * CRM leads / opportunities
 * Managers see all; others see only their own or unassigned leads.
 */
export function crmLeadFilter(user: JwtPayload): Record<string, unknown> {
    if (isManager(user)) return {};
    // See own leads OR leads with no salesperson assigned
    return { OR: [{ userId: user.sub }, { userId: null }] };
}

/**
 * Sales orders
 * Managers + accountants see all; salesperson sees own orders only.
 */
export function saleOrderFilter(user: JwtPayload): Record<string, unknown> {
    if (isManager(user) || isAccountant(user)) return {};
    return { OR: [{ userId: user.sub }, { userId: null }] };
}

/**
 * Helpdesk tickets
 * Managers see all; support agents see only assigned or unassigned tickets.
 */
export function helpdeskTicketFilter(user: JwtPayload): Record<string, unknown> {
    if (isManager(user)) return {};
    return { OR: [{ userId: user.sub }, { userId: null }] };
}

/**
 * Partners — all authenticated users can read; no row filter.
 * Row-level partner access is governed by organizationId scoping in the route.
 */
export function partnerFilter(_user: JwtPayload): Record<string, unknown> {
    return {};
}

/**
 * Accounting moves — accountants + managers see all; others see none (use requirePermission).
 */
export function accountMoveFilter(user: JwtPayload): Record<string, unknown> {
    if (isManager(user) || isAccountant(user)) return {};
    // Non-accountants should never reach accounting routes (permission check handles that)
    // Return an impossible filter as a safety net
    return { id: -1 };
}

/**
 * Purchase orders — purchasing role, managers, and admins; others see none.
 */
export function purchaseOrderFilter(user: JwtPayload): Record<string, unknown> {
    if (isManager(user)) return {};
    // Allow if user has a purchasing-related role
    if (user.roles.some(r => ['purchasing', 'Purchasing', 'accountant', 'Accountant'].includes(r))) return {};
    return { userId: user.sub };
}
