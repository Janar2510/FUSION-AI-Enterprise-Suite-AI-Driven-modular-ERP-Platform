/**
 * OpenAPI 3.1 specification generated from Zod schemas.
 *
 * Run: npx ts-node src/openapi.ts > openapi.json
 * Or access: GET /api/docs/openapi.json (served by the dev server)
 *
 * Schema conventions:
 *  - All protected routes require Bearer JWT (bearerAuth)
 *  - Error envelope: { error: { code, message, fields?, requestId } }
 *  - Paginated lists: { data: T[], total, page, limit }
 */

import { OpenAPIRegistry, OpenApiGeneratorV31, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

// ── Security scheme ──────────────────────────────────────────────────────────
registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
});

// ── Shared schemas ───────────────────────────────────────────────────────────
const ErrorSchema = registry.register(
    'Error',
    z.object({
        error: z.object({
            code: z.string(),
            message: z.string(),
            fields: z.record(z.string(), z.array(z.string())).optional(),
            requestId: z.string().optional(),
        }),
    }).openapi('Error'),
);

const PaginationMeta = z.object({
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
});

function paginatedSchema<T extends z.ZodTypeAny>(itemSchema: T) {
    return z.object({ data: z.array(itemSchema), ...PaginationMeta.shape });
}

// ── Domain schemas ───────────────────────────────────────────────────────────
const PartnerSchema = registry.register(
    'Partner',
    z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().email().nullable().optional(),
        phone: z.string().nullable().optional(),
        isCompany: z.boolean(),
        isCustomer: z.boolean(),
        isVendor: z.boolean(),
        city: z.string().nullable().optional(),
        country: z.string().nullable().optional(),
        active: z.boolean(),
        createdAt: z.string().datetime(),
    }).openapi('Partner'),
);

const CrmLeadSchema = registry.register(
    'CrmLead',
    z.object({
        id: z.number().int(),
        name: z.string(),
        type: z.enum(['lead', 'opportunity']),
        expectedRevenue: z.number().nullable().optional(),
        priority: z.number().int().min(0).max(3),
        partnerId: z.string().nullable().optional(),
        stageId: z.number().int().nullable().optional(),
        createdAt: z.string().datetime(),
    }).openapi('CrmLead'),
);

const SaleOrderSchema = registry.register(
    'SaleOrder',
    z.object({
        id: z.number().int(),
        name: z.string(),
        state: z.enum(['draft', 'sent', 'sale', 'cancel', 'delivered']),
        amountUntaxed: z.number(),
        amountTax: z.number(),
        amountTotal: z.number(),
        partnerId: z.string(),
        dateOrder: z.string().datetime(),
        createdAt: z.string().datetime(),
    }).openapi('SaleOrder'),
);

const AccountMoveSchema = registry.register(
    'AccountMove',
    z.object({
        id: z.number().int(),
        name: z.string(),
        moveType: z.enum(['out_invoice', 'in_invoice', 'out_refund', 'in_refund', 'entry']),
        state: z.enum(['draft', 'posted', 'cancel']),
        paymentState: z.enum(['not_paid', 'in_payment', 'paid', 'partial', 'reversed']),
        amountUntaxed: z.number(),
        amountTax: z.number(),
        amountTotal: z.number(),
        amountResidual: z.number(),
        date: z.string().datetime(),
        dueDate: z.string().datetime().nullable().optional(),
        partnerId: z.string().nullable().optional(),
        journalId: z.number().int(),
    }).openapi('AccountMove'),
);

const AiActionSchema = registry.register(
    'AiAction',
    z.object({
        id: z.string(),
        agentKey: z.string(),
        status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'APPLIED', 'ROLLED_BACK']),
        entityType: z.string(),
        entityId: z.string(),
        confidence: z.number().min(0).max(1),
        output: z.object({
            summary: z.string(),
            suggestions: z.array(z.object({
                field: z.string(),
                suggestedValue: z.unknown(),
                reasoning: z.string(),
                isSensitive: z.boolean().optional(),
            })),
        }),
        createdAt: z.string().datetime(),
    }).openapi('AiAction'),
);

// ── Auth routes ──────────────────────────────────────────────────────────────
registry.registerPath({
    method: 'post',
    path: '/api/auth/register',
    tags: ['Auth'],
    summary: 'Register a new user',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        email: z.string().email(),
                        password: z.string().min(8),
                        name: z.string().min(1),
                        organizationName: z.string().min(1),
                    }),
                },
            },
        },
    },
    responses: {
        201: { description: 'User registered', content: { 'application/json': { schema: z.object({ accessToken: z.string(), refreshToken: z.string() }) } } },
        422: { description: 'Validation error', content: { 'application/json': { schema: ErrorSchema } } },
    },
});

registry.registerPath({
    method: 'post',
    path: '/api/auth/login',
    tags: ['Auth'],
    summary: 'Login with email + password',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({ email: z.string().email(), password: z.string() }),
                },
            },
        },
    },
    responses: {
        200: { description: 'Login success', content: { 'application/json': { schema: z.object({ accessToken: z.string(), refreshToken: z.string() }) } } },
        401: { description: 'Invalid credentials', content: { 'application/json': { schema: ErrorSchema } } },
    },
});

// ── Partners ─────────────────────────────────────────────────────────────────
registry.registerPath({
    method: 'get',
    path: '/api/partners',
    tags: ['Partners'],
    security: [{ bearerAuth: [] }],
    summary: 'List partners',
    request: { query: z.object({ page: z.string().optional(), limit: z.string().optional(), q: z.string().optional() }) },
    responses: {
        200: { description: 'Paginated partners', content: { 'application/json': { schema: paginatedSchema(PartnerSchema) } } },
    },
});

registry.registerPath({
    method: 'get',
    path: '/api/partners/{id}/profile',
    tags: ['Partners'],
    security: [{ bearerAuth: [] }],
    summary: '360° partner profile',
    request: { params: z.object({ id: z.string() }) },
    responses: {
        200: { description: 'Partner profile with aggregated module data' },
        404: { description: 'Not found', content: { 'application/json': { schema: ErrorSchema } } },
    },
});

// ── CRM ──────────────────────────────────────────────────────────────────────
registry.registerPath({
    method: 'get',
    path: '/api/crm/leads',
    tags: ['CRM'],
    security: [{ bearerAuth: [] }],
    summary: 'List CRM leads/opportunities',
    responses: { 200: { description: 'Paginated leads', content: { 'application/json': { schema: paginatedSchema(CrmLeadSchema) } } } },
});

registry.registerPath({
    method: 'post',
    path: '/api/crm/leads/{id}/qualify',
    tags: ['CRM'],
    security: [{ bearerAuth: [] }],
    summary: 'Qualify a lead → opportunity',
    request: { params: z.object({ id: z.string() }) },
    responses: {
        200: { description: 'Lead qualified' },
        404: { description: 'Not found', content: { 'application/json': { schema: ErrorSchema } } },
    },
});

// ── Sales ────────────────────────────────────────────────────────────────────
registry.registerPath({
    method: 'get',
    path: '/api/sales',
    tags: ['Sales'],
    security: [{ bearerAuth: [] }],
    summary: 'List sale orders',
    responses: { 200: { description: 'Paginated orders', content: { 'application/json': { schema: paginatedSchema(SaleOrderSchema) } } } },
});

registry.registerPath({
    method: 'post',
    path: '/api/sales/{id}/confirm',
    tags: ['Sales'],
    security: [{ bearerAuth: [] }],
    summary: 'Confirm a draft sale order',
    request: { params: z.object({ id: z.string() }) },
    responses: {
        200: { description: 'Order confirmed' },
        409: { description: 'Conflict', content: { 'application/json': { schema: ErrorSchema } } },
    },
});

registry.registerPath({
    method: 'get',
    path: '/api/sales/{id}/pdf',
    tags: ['Sales'],
    security: [{ bearerAuth: [] }],
    summary: 'Download sale order PDF',
    request: { params: z.object({ id: z.string() }) },
    responses: { 200: { description: 'PDF file', content: { 'application/pdf': { schema: z.string().openapi({ format: 'binary' }) } } } },
});

// ── Accounting ───────────────────────────────────────────────────────────────
registry.registerPath({
    method: 'get',
    path: '/api/accounting/moves',
    tags: ['Accounting'],
    security: [{ bearerAuth: [] }],
    summary: 'List journal entries (invoices, bills, etc.)',
    request: { query: z.object({ move_type: z.string().optional(), state: z.string().optional() }) },
    responses: { 200: { description: 'Paginated moves', content: { 'application/json': { schema: paginatedSchema(AccountMoveSchema) } } } },
});

registry.registerPath({
    method: 'post',
    path: '/api/accounting/moves/{id}/post',
    tags: ['Accounting'],
    security: [{ bearerAuth: [] }],
    summary: 'Post (confirm) a draft journal entry',
    request: { params: z.object({ id: z.string() }) },
    responses: {
        200: { description: 'Move posted' },
        409: { description: 'Period closed or already posted', content: { 'application/json': { schema: ErrorSchema } } },
    },
});

registry.registerPath({
    method: 'post',
    path: '/api/accounting/moves/{id}/pay',
    tags: ['Accounting'],
    security: [{ bearerAuth: [] }],
    summary: 'Register payment on a posted invoice',
    request: { params: z.object({ id: z.string() }) },
    responses: { 200: { description: 'Payment registered' } },
});

registry.registerPath({
    method: 'get',
    path: '/api/accounting/moves/{id}/pdf',
    tags: ['Accounting'],
    security: [{ bearerAuth: [] }],
    summary: 'Download invoice PDF',
    request: { params: z.object({ id: z.string() }) },
    responses: { 200: { description: 'PDF file', content: { 'application/pdf': { schema: z.string().openapi({ format: 'binary' }) } } } },
});

// ── AI Actions ───────────────────────────────────────────────────────────────
registry.registerPath({
    method: 'post',
    path: '/api/ai/run',
    tags: ['AI'],
    security: [{ bearerAuth: [] }],
    summary: 'Run a named AI agent',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        agentKey: z.enum(['helpdesk-triage', 'customer-summary', 'lead-scoring', 'invoice-anomaly', 'stock-reorder', 'document-intelligence', 'partner-dedup', 'next-best-action', 'quote-drafter', 'manufacturing-scheduler']),
                        entityType: z.string(),
                        entityId: z.string(),
                        input: z.record(z.string(), z.unknown()).optional(),
                    }),
                },
            },
        },
    },
    responses: {
        200: { description: 'Agent output (status PENDING)', content: { 'application/json': { schema: AiActionSchema } } },
        400: { description: 'Unknown agent', content: { 'application/json': { schema: ErrorSchema } } },
    },
});

registry.registerPath({
    method: 'get',
    path: '/api/ai/actions',
    tags: ['AI'],
    security: [{ bearerAuth: [] }],
    summary: 'List AI actions (filterable by entity)',
    request: { query: z.object({ entityType: z.string().optional(), entityId: z.string().optional(), status: z.string().optional() }) },
    responses: { 200: { description: 'AI actions list', content: { 'application/json': { schema: z.array(AiActionSchema) } } } },
});

// ── GDPR ─────────────────────────────────────────────────────────────────────
registry.registerPath({
    method: 'get',
    path: '/api/gdpr/export',
    tags: ['GDPR'],
    security: [{ bearerAuth: [] }],
    summary: 'Export all personal data for the authenticated user',
    responses: { 200: { description: 'User data export as JSON' } },
});

registry.registerPath({
    method: 'post',
    path: '/api/gdpr/erase',
    tags: ['GDPR'],
    security: [{ bearerAuth: [] }],
    summary: 'Request erasure of authenticated user personal data',
    responses: { 200: { description: 'Erasure confirmation' } },
});

// ── Generate spec ────────────────────────────────────────────────────────────
export function generateOpenApiSpec() {
    const generator = new OpenApiGeneratorV31(registry.definitions);
    return generator.generateDocument({
        openapi: '3.1.0',
        info: {
            title: 'FusionAI Enterprise Suite API',
            version: '1.0.0',
            description: 'AI-driven modular ERP platform API. All protected routes require a Bearer JWT from POST /api/auth/login.',
        },
        servers: [{ url: '/api', description: 'API server' }],
        tags: [
            { name: 'Auth', description: 'Authentication and session management' },
            { name: 'Partners', description: 'Partner (customer/vendor/employee) management' },
            { name: 'CRM', description: 'Lead and opportunity management' },
            { name: 'Sales', description: 'Quotations and sale orders' },
            { name: 'Accounting', description: 'Invoices, bills, journal entries, and payments' },
            { name: 'AI', description: 'AI agent execution and action approval workflow' },
            { name: 'GDPR', description: 'Data export and erasure' },
        ],
    });
}

// ── CLI entrypoint ───────────────────────────────────────────────────────────
if (require.main === module) {
    const spec = generateOpenApiSpec();
    process.stdout.write(JSON.stringify(spec, null, 2));
}
