// ── OTEL must be first — before any other imports ────────────
import { startTracing } from './core/tracing';
startTracing();

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import pinoHttp from 'pino-http';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import * as Sentry from '@sentry/node';

// Load environment variables
dotenv.config();

// ── Sentry v10 (init before all other code) ─────────────────
Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'development',
    release: process.env.npm_package_version,
    enabled: !!(process.env.SENTRY_DSN),
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [Sentry.expressIntegration()],
});

// ── Production secret guard ──────────────────────────────────
if (process.env.NODE_ENV === 'production') {
    const required = ['SESSION_SECRET', 'DATABASE_URL', 'JWT_SECRET'];
    const missing = required.filter(
        k => !process.env[k] || /change.?me|placeholder|dev-secret|ultra-secret/i.test(process.env[k]!)
    );
    if (missing.length) {
        console.error('FATAL: missing/placeholder production secrets:', missing);
        process.exit(1);
    }
}

// ── Core imports ─────────────────────────────────────────────
import { logger } from './core/logger';
import { metricsMiddleware, metricsRegistry } from './core/metrics';
import { requestIdMiddleware, errorHandler } from './core/errors';
import { globalLimiter, authLimiter, apiLimiter } from './middleware/rateLimiter';
import { csrfProtection } from './middleware/csrf';
import { requireAuth } from './core/auth';
import { authCredentialsRoutes } from './routes/auth-credentials';

// ── Route imports ────────────────────────────────────────────
import { authRoutes } from './routes/auth';
import { partnerRoutes } from './routes/partners';
import { crmRoutes } from './routes/crm';
import { saleRoutes } from './routes/sales';
import { purchaseRoutes } from './routes/purchases';
import { productRoutes } from './routes/products';
import { inventoryRoutes } from './routes/inventory';
import { accountingRoutes } from './routes/accounting';
import { hrRoutes } from './routes/hr';
import { projectRoutes } from './routes/projects';
import { helpdeskRoutes } from './routes/helpdesk';
import { calendarRoutes } from './routes/calendar';
import { manufacturingRoutes } from './routes/manufacturing';
import { posRoutes } from './routes/pos';
import { messagingRoutes } from './routes/messaging';
import { eventRoutes } from './routes/events';
import { fleetRoutes } from './routes/fleet';
import { maintenanceRoutes } from './routes/maintenance';
import { surveyRoutes } from './routes/surveys';
import { noteRoutes } from './routes/notes';
import { dashboardRoutes } from './routes/dashboard';
import { fsRentalRoutes } from './routes/fs_rental';
import { marketingWebRoutes } from './routes/marketing_web';
import { knowledgeRoutes } from './routes/knowledge';
import { recruitmentRoutes } from './routes/recruitment';
import { attendanceRoutes } from './routes/attendance';
import { payrollRoutes } from './routes/payroll';
import { appraisalRoutes } from './routes/appraisal';
import { qualityRoutes } from './routes/quality';
import { plmRoutes } from './routes/plm';
import { subscriptionRoutes } from './routes/subscriptions';
import { planningRoutes } from './routes/planning';
import { campaignRoutes } from './routes/campaigns';
import { settingsRoutes } from './routes/settings';
import { ecommerceRoutes } from './routes/ecommerce';
import { skillsRoutes } from './routes/skills';
import { spreadsheetRoutes } from './routes/spreadsheet';
import { automationRoutes } from './routes/automation';
import aiActionsRouter from './routes/ai-actions';
import { gdprRoutes } from './routes/gdpr';
import { startBackgroundJobs } from './jobs';
import prisma from './lib/prisma';

const app = express();
const PORT = process.env.PORT || 3001;
const isDev = process.env.NODE_ENV !== 'production';


// ── Observability middleware ─────────────────────────────────
app.use(requestIdMiddleware);
app.use(metricsMiddleware);
app.use(pinoHttp({
    logger,
    customLogLevel: (_req, res) => res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
    // Don't log health/metrics polls
    autoLogging: {
        ignore: (req) => ['/api/health', '/api/ready', '/metrics'].includes(req.url ?? ''),
    },
}));

// ── Security + parsing middleware ────────────────────────────
app.use(globalLimiter);
app.use(helmet({
    contentSecurityPolicy: isDev
        ? false
        : {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'"],
                frameSrc: ["'none'"],
                objectSrc: ["'none'"],
            },
        },
    crossOriginEmbedderPolicy: false,
}));
app.use(compression());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'fusion-ai-ultra-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: !isDev,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
    },
}));

// ── CSRF protection ──────────────────────────────────────────
app.use(csrfProtection);

// ── Root info ────────────────────────────────────────────────
app.get('/', (_req: Request, res: Response) => {
    res.json({ name: 'FusionAI Enterprise Suite API', version: '1.0.0', status: 'running' });
});

// ── OpenAPI spec + Scalar UI (dev only) ─────────────────────
import { generateOpenApiSpec } from './openapi';
app.get('/api/docs/openapi.json', (_req: Request, res: Response) => {
    res.json(generateOpenApiSpec());
});
app.get('/api/docs', (_req: Request, res: Response) => {
    res.send(`<!doctype html><html><head><title>FusionAI API Docs</title><meta charset="utf-8"/></head><body><script id="api-reference" data-url="/api/docs/openapi.json"></script><script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script></body></html>`);
});

// ── Health — liveness (no DB) ────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

// ── Ready — readiness (checks DB) ───────────────────────────
app.get('/api/ready', async (_req: Request, res: Response) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'ready', db: 'ok', timestamp: new Date().toISOString() });
    } catch (err) {
        logger.error({ err }, 'Readiness check failed — DB unreachable');
        res.status(503).json({ status: 'not_ready', db: 'error' });
    }
});

// ── Prometheus metrics (internal only — restrict in nginx) ───
app.get('/metrics', async (_req: Request, res: Response) => {
    res.set('Content-Type', metricsRegistry.contentType);
    res.end(await metricsRegistry.metrics());
});

// ── API Routes ──────────────────────────────────────────────
// Public routes — no auth required
app.use('/api/auth', authLimiter, authCredentialsRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api', apiLimiter);

// Public data routes (unauthenticated access by design)
app.use('/api/ecommerce', ecommerceRoutes);         // session-based cart
app.use('/api/marketing-web', marketingWebRoutes);  // public website pages

// Global auth guard — all routes registered below require a valid Bearer token
app.use('/api', requireAuth);

app.use('/api/partners', partnerRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/helpdesk', helpdeskRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/manufacturing', manufacturingRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/fs-rental', fsRentalRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/appraisals', appraisalRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/plm', plmRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/planning', planningRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/spreadsheet', spreadsheetRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/ai', apiLimiter, aiActionsRouter);
app.use('/api/gdpr', apiLimiter, gdprRoutes);

// ── 404 ──────────────────────────────────────────────────────
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Endpoint not found', requestId: (req as any).id ?? '' },
    });
});

// ── Sentry error handler (before our errorHandler) ──────────
Sentry.setupExpressErrorHandler(app);

// ── Centralized error handler ────────────────────────────────
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
    logger.info({ port: PORT, env: process.env.NODE_ENV }, 'FusionAI API started');
    startBackgroundJobs();
});

export default app;
