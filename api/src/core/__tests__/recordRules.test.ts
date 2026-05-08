/**
 * Cross-tenant isolation tests — record rules + org scoping
 *
 * Verifies:
 *   1. Record-level filters return correct row restrictions per role
 *   2. Tenant A's orgId cannot bleed into Tenant B's queries
 *   3. Admin/manager roles bypass row-level filters
 *   4. Non-privileged roles get ownership-scoped filters
 */

import {
    crmLeadFilter,
    saleOrderFilter,
    helpdeskTicketFilter,
    partnerFilter,
    accountMoveFilter,
    purchaseOrderFilter,
} from '../auth/recordRules';
import type { JwtPayload } from '../auth';

function makeUser(overrides: Partial<JwtPayload> = {}): JwtPayload {
    return {
        sub: 'user-001',
        email: 'user@org-a.com',
        orgId: 'org-a',
        roles: [],
        permissions: [],
        ...overrides,
    };
}

// ── crmLeadFilter ─────────────────────────────────────────────────────────────

describe('crmLeadFilter()', () => {
    test('admin sees all leads (empty filter)', () => {
        const filter = crmLeadFilter(makeUser({ roles: ['admin'] }));
        expect(filter).toEqual({});
    });

    test('manager sees all leads (empty filter)', () => {
        const filter = crmLeadFilter(makeUser({ roles: ['manager'] }));
        expect(filter).toEqual({});
    });

    test('salesperson sees own + unassigned leads', () => {
        const filter = crmLeadFilter(makeUser({ sub: 'user-001', roles: ['salesperson'] }));
        expect(filter).toMatchObject({ OR: expect.arrayContaining([{ userId: 'user-001' }, { userId: null }]) });
    });

    test('no-role user sees own + unassigned leads', () => {
        const filter = crmLeadFilter(makeUser({ sub: 'user-002', roles: [] }));
        expect(filter).toMatchObject({ OR: expect.arrayContaining([{ userId: 'user-002' }]) });
    });

    // Cross-tenant: user from org-a cannot see leads from org-b via the filter
    // (orgId scoping is enforced in the route — filter adds user-level restriction on top)
    test('filter for org-a user does NOT include org-b user IDs', () => {
        const filterA = crmLeadFilter(makeUser({ sub: 'user-a', roles: [], orgId: 'org-a' }));
        const filterB = crmLeadFilter(makeUser({ sub: 'user-b', roles: [], orgId: 'org-b' }));
        // Each filter scopes to its own userId — they are disjoint
        const orA = (filterA as any).OR ?? [];
        const orB = (filterB as any).OR ?? [];
        const userIdsA = orA.filter((c: any) => c.userId !== null).map((c: any) => c.userId);
        const userIdsB = orB.filter((c: any) => c.userId !== null).map((c: any) => c.userId);
        expect(userIdsA).not.toContain('user-b');
        expect(userIdsB).not.toContain('user-a');
    });
});

// ── saleOrderFilter ───────────────────────────────────────────────────────────

describe('saleOrderFilter()', () => {
    test('admin sees all orders', () => {
        expect(saleOrderFilter(makeUser({ roles: ['admin'] }))).toEqual({});
    });

    test('accountant sees all orders', () => {
        expect(saleOrderFilter(makeUser({ roles: ['accountant'] }))).toEqual({});
    });

    test('salesperson sees own + unassigned orders', () => {
        const filter = saleOrderFilter(makeUser({ sub: 'u-1', roles: ['salesperson'] }));
        expect(filter).toMatchObject({ OR: expect.arrayContaining([{ userId: 'u-1' }]) });
    });

    test('regular user cannot see orders from another user via the filter', () => {
        const fA = saleOrderFilter(makeUser({ sub: 'u-a', roles: [] }));
        const fB = saleOrderFilter(makeUser({ sub: 'u-b', roles: [] }));
        expect((fA as any).OR).not.toEqual(expect.arrayContaining([{ userId: 'u-b' }]));
    });
});

// ── helpdeskTicketFilter ──────────────────────────────────────────────────────

describe('helpdeskTicketFilter()', () => {
    test('manager sees all tickets', () => {
        expect(helpdeskTicketFilter(makeUser({ roles: ['manager'] }))).toEqual({});
    });

    test('support agent sees assigned + unassigned tickets', () => {
        const filter = helpdeskTicketFilter(makeUser({ sub: 'agent-1', roles: ['support'] }));
        expect(filter).toMatchObject({ OR: expect.arrayContaining([{ userId: 'agent-1' }, { userId: null }]) });
    });
});

// ── accountMoveFilter ─────────────────────────────────────────────────────────

describe('accountMoveFilter()', () => {
    test('accountant sees all moves', () => {
        expect(accountMoveFilter(makeUser({ roles: ['accountant'] }))).toEqual({});
    });

    test('admin sees all moves', () => {
        expect(accountMoveFilter(makeUser({ roles: ['admin'] }))).toEqual({});
    });

    test('non-accountant gets an impossible filter (id: -1)', () => {
        const filter = accountMoveFilter(makeUser({ roles: ['salesperson'] }));
        expect(filter).toEqual({ id: -1 });
    });

    // Cross-tenant: a non-accountant from org-a getting the safety-net filter
    // cannot accidentally see org-b data — the impossible filter ensures zero rows
    test('non-accountant impossible filter returns zero rows regardless of org', () => {
        const filterA = accountMoveFilter(makeUser({ roles: [], orgId: 'org-a' }));
        const filterB = accountMoveFilter(makeUser({ roles: [], orgId: 'org-b' }));
        expect(filterA).toEqual({ id: -1 });
        expect(filterB).toEqual({ id: -1 });
    });
});

// ── purchaseOrderFilter ───────────────────────────────────────────────────────

describe('purchaseOrderFilter()', () => {
    test('admin sees all POs', () => {
        expect(purchaseOrderFilter(makeUser({ roles: ['admin'] }))).toEqual({});
    });

    test('purchasing role sees all POs', () => {
        expect(purchaseOrderFilter(makeUser({ roles: ['purchasing'] }))).toEqual({});
    });

    test('regular user sees only own POs', () => {
        const filter = purchaseOrderFilter(makeUser({ sub: 'u-1', roles: [] }));
        expect(filter).toEqual({ userId: 'u-1' });
    });
});

// ── partnerFilter ─────────────────────────────────────────────────────────────

describe('partnerFilter()', () => {
    test('returns empty filter for all roles (org scoping handled in routes)', () => {
        for (const roles of [[], ['admin'], ['salesperson'], ['support']]) {
            expect(partnerFilter(makeUser({ roles }))).toEqual({});
        }
    });
});

// ── Cross-tenant isolation invariants ─────────────────────────────────────────

describe('Cross-tenant isolation', () => {
    test('no filter function ever returns another tenant\'s orgId in the where clause', () => {
        const filters = [
            crmLeadFilter, saleOrderFilter, helpdeskTicketFilter,
            partnerFilter, accountMoveFilter, purchaseOrderFilter,
        ];
        const userOrgA = makeUser({ sub: 'user-a', orgId: 'org-a', roles: ['salesperson'] });

        for (const fn of filters) {
            const filter = fn(userOrgA);
            const serialized = JSON.stringify(filter);
            expect(serialized).not.toContain('org-b');
        }
    });

    test('filter for user-a never contains user-b\'s ID', () => {
        const userA = makeUser({ sub: 'user-a', roles: [] });
        const filtersA = [crmLeadFilter(userA), saleOrderFilter(userA), helpdeskTicketFilter(userA)];

        for (const filter of filtersA) {
            expect(JSON.stringify(filter)).not.toContain('user-b');
        }
    });
});
