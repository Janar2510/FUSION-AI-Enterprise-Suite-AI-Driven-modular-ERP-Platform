import { Registry, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

export const metricsRegistry = new Registry();

// Default Node.js process metrics (CPU, memory, GC, event-loop lag)
collectDefaultMetrics({ register: metricsRegistry, prefix: 'fusionai_' });

// ── HTTP metrics ──────────────────────────────────────────────────────────────

export const httpRequestsTotal = new Counter({
    name: 'fusionai_http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [metricsRegistry],
});

export const httpRequestDurationSeconds = new Histogram({
    name: 'fusionai_http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [metricsRegistry],
});

// ── ERP business metrics ──────────────────────────────────────────────────────

export const erpOperationsTotal = new Counter({
    name: 'fusionai_erp_operations_total',
    help: 'ERP business operations performed',
    labelNames: ['module', 'operation'],
    registers: [metricsRegistry],
});

export const aiActionsTotal = new Counter({
    name: 'fusionai_ai_actions_total',
    help: 'AI agent actions triggered',
    labelNames: ['agent_key', 'status'],
    registers: [metricsRegistry],
});

export const aiActionDurationSeconds = new Histogram({
    name: 'fusionai_ai_action_duration_seconds',
    help: 'AI agent run duration',
    labelNames: ['agent_key'],
    buckets: [0.5, 1, 2, 5, 10, 30, 60],
    registers: [metricsRegistry],
});

export const outboxRelayTotal = new Counter({
    name: 'fusionai_outbox_relay_total',
    help: 'Outbox events processed',
    labelNames: ['status'],
    registers: [metricsRegistry],
});

// ── Middleware: record HTTP metrics per request ───────────────────────────────
import { Request, Response, NextFunction } from 'express';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1e9;
        const route = (req.route?.path as string) ?? req.path ?? 'unknown';
        const labels = { method: req.method, route, status_code: String(res.statusCode) };
        httpRequestsTotal.inc(labels);
        httpRequestDurationSeconds.observe(labels, durationMs);
    });

    next();
}
