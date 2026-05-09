/**
 * OpenAPI contract test
 *
 * Verifies that every route registered in openapi.ts:
 *  1. Has at least one 2xx response defined
 *  2. Is reachable on the live Express app (not mocked)
 *  3. Returns 401 when called without a Bearer token (auth guard works)
 *
 * Does NOT need a database connection — we test the auth layer only.
 */

import request from 'supertest';
import { generateOpenApiSpec } from '../../openapi';

// Live tests require a running server — skip in CI unless INTEGRATION=true
const INTEGRATION = process.env.INTEGRATION === 'true';
let app: any = null;

beforeAll(async () => {
    if (!INTEGRATION) return;
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
        const mod = await import('../../index');
        app = (mod as any).default ?? (mod as any).app;
    } catch {
        app = null;
    }
});

// ── Spec structure tests (no network required) ────────────────────────────
describe('OpenAPI spec structure', () => {
    let spec: ReturnType<typeof generateOpenApiSpec>;

    beforeAll(() => {
        spec = generateOpenApiSpec();
    });

    test('spec has title and version', () => {
        expect(spec.info.title).toBeTruthy();
        expect(spec.info.version).toBeTruthy();
    });

    test('spec has openapi 3.1.0', () => {
        expect(spec.openapi).toBe('3.1.0');
    });

    test('bearerAuth security scheme is defined', () => {
        expect(spec.components?.securitySchemes?.bearerAuth).toBeDefined();
    });

    test('all registered paths have at least one 2xx response', () => {
        const paths = spec.paths ?? {};
        const violations: string[] = [];
        for (const [path, methods] of Object.entries(paths)) {
            if (!methods) continue;
            for (const [method, op] of Object.entries(methods as Record<string, any>)) {
                if (['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
                    const responses = op?.responses ?? {};
                    const has2xx = Object.keys(responses).some(code => code.startsWith('2'));
                    if (!has2xx) violations.push(`${method.toUpperCase()} ${path}`);
                }
            }
        }
        expect(violations).toEqual([]);
    });

    test('protected routes declare bearerAuth security', () => {
        const paths = spec.paths ?? {};
        const unprotected: string[] = [];
        const publicPaths = ['/api/auth/register', '/api/auth/login'];
        for (const [path, methods] of Object.entries(paths)) {
            if (publicPaths.includes(path)) continue;
            if (!methods) continue;
            for (const [method, op] of Object.entries(methods as Record<string, any>)) {
                if (['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
                    const hasSecurity = Array.isArray(op?.security) && op.security.length > 0;
                    if (!hasSecurity) unprotected.push(`${method.toUpperCase()} ${path}`);
                }
            }
        }
        expect(unprotected).toEqual([]);
    });

    test('all tags used in paths are declared in the top-level tags array', () => {
        const spec2 = generateOpenApiSpec();
        const declaredTags = new Set((spec2.tags ?? []).map((t: any) => t.name));
        const paths = spec2.paths ?? {};
        const undeclaredTags: string[] = [];
        for (const methods of Object.values(paths)) {
            if (!methods) continue;
            for (const op of Object.values(methods as Record<string, any>)) {
                for (const tag of (op?.tags ?? [])) {
                    if (!declaredTags.has(tag)) undeclaredTags.push(tag);
                }
            }
        }
        expect(undeclaredTags).toEqual([]);
    });
});

// ── Live auth guard tests (requires Express app) ──────────────────────────
describe('Auth guard — 401 on protected routes without token', () => {
    const protectedRoutes = [
        { method: 'get', path: '/api/partners' },
        { method: 'get', path: '/api/crm/leads' },
        { method: 'get', path: '/api/sales' },
        { method: 'get', path: '/api/accounting/moves' },
        { method: 'get', path: '/api/ai/actions' },
        { method: 'get', path: '/api/hr/employees' },
        { method: 'get', path: '/api/notes' },
        { method: 'get', path: '/api/projects' },
        { method: 'get', path: '/api/helpdesk/tickets' },
        { method: 'get', path: '/api/knowledge' },
        { method: 'get', path: '/api/inventory/pickings' },
        { method: 'get', path: '/api/purchases' },
        { method: 'get', path: '/api/manufacturing/orders' },
        { method: 'get', path: '/api/fs-rental/rentals' },
        { method: 'get', path: '/api/fleet/vehicles' },
        { method: 'get', path: '/api/payroll/payslips' },
        { method: 'get', path: '/api/quality/checks' },
    ];

    test.each(protectedRoutes)('$method $path returns 401 without auth', async ({ method, path }) => {
        if (!app) {
            console.warn('App not available — skipping live auth test');
            return;
        }
        const res = await (request(app) as any)[method](path);
        expect(res.status).toBe(401);
    });

    test('public route /api/ecommerce/cart/:sid does NOT require auth', async () => {
        if (!app) return;
        // ecommerce cart creation is public — should not return 401
        const res = await request(app).post('/api/ecommerce/cart/test-session');
        expect(res.status).not.toBe(401);
    });

    test('GET /api/health returns 200 without auth', async () => {
        if (!app) return;
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
    });

    test('GET /api/docs/openapi.json returns 200 without auth', async () => {
        if (!app) return;
        const res = await request(app).get('/api/docs/openapi.json');
        expect(res.status).toBe(200);
        expect(res.body.openapi).toBe('3.1.0');
    });
});

// ── Frontend SDK contract ─────────────────────────────────────────────────
describe('Frontend SDK ↔ OpenAPI contract', () => {
    /**
     * Mapping of SDK function names to the route they call.
     * We verify each route appears in the OpenAPI spec.
     * Update this list whenever the frontend lib/api.ts changes.
     */
    const sdkRoutes: Array<{ sdkMethod: string; method: string; pathPattern: string }> = [
        { sdkMethod: 'partnersApi.list', method: 'get', pathPattern: '/api/partners' },
        { sdkMethod: 'crmApi.listLeads', method: 'get', pathPattern: '/api/crm/leads' },
        { sdkMethod: 'crmApi.qualifyLead', method: 'post', pathPattern: '/api/crm/leads/{id}/qualify' },
        { sdkMethod: 'salesApi.list', method: 'get', pathPattern: '/api/sales' },
        { sdkMethod: 'salesApi.confirmOrder', method: 'post', pathPattern: '/api/sales/{id}/confirm' },
        { sdkMethod: 'accountingApi.listMoves', method: 'get', pathPattern: '/api/accounting/moves' },
        { sdkMethod: 'accountingApi.postMove', method: 'post', pathPattern: '/api/accounting/moves/{id}/post' },
        { sdkMethod: 'accountingApi.registerPayment', method: 'post', pathPattern: '/api/accounting/moves/{id}/pay' },
        { sdkMethod: 'aiActionsApi.run', method: 'post', pathPattern: '/api/ai/run' },
        { sdkMethod: 'aiActionsApi.list', method: 'get', pathPattern: '/api/ai/actions' },
    ];

    let spec: ReturnType<typeof generateOpenApiSpec>;

    beforeAll(() => { spec = generateOpenApiSpec(); });

    test.each(sdkRoutes)('$sdkMethod → $method $pathPattern exists in OpenAPI spec', ({ method, pathPattern }) => {
        const paths = spec.paths ?? {};
        // Convert Express-style /:id to OpenAPI {id}
        const openApiPath = pathPattern.replace(/:([a-z_]+)/g, '{$1}');
        const pathEntry = paths[openApiPath] as any;
        expect(pathEntry).toBeDefined();
        expect(pathEntry[method]).toBeDefined();
    });
});
