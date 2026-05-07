import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import session from 'express-session';

// Load environment variables
dotenv.config();

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

// ── Phase 2 imports ──────────────────────────────────────────
import { requestIdMiddleware, errorHandler } from './core/errors';
import { globalLimiter, authLimiter, apiLimiter } from './middleware/rateLimiter';
import { authCredentialsRoutes } from './routes/auth-credentials';

// Import routes
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

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ───────────────────────────────────────────────
app.use(requestIdMiddleware);
app.use(globalLimiter);
const isDev = process.env.NODE_ENV !== 'production';
app.use(helmet({
    contentSecurityPolicy: isDev
        ? false  // Disabled in dev — no browser CSP friction during local development
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
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
app.use(morgan('dev'));

// ── Root info handler (dev convenience) ─────────────────────
app.get('/', (_req: Request, res: Response) => {
    res.json({
        name: 'FusionAI Enterprise Suite API',
        version: '1.0.0',
        status: 'running',
        docs: '/api/health',
        note: 'All endpoints are prefixed with /api — e.g. /api/auth/login, /api/partners',
    });
});

// ── Health Check ────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        modules: [
            'partners', 'crm', 'sales', 'purchases', 'products',
            'inventory', 'accounting', 'hr', 'projects', 'helpdesk',
            'calendar', 'manufacturing', 'pos', 'messaging', 'events',
            'fleet', 'maintenance', 'surveys', 'notes', 'dashboard',
            'fs-rental', 'marketing-web', 'knowledge', 'recruitment',
            'attendance', 'payroll', 'appraisals', 'quality', 'plm', 'skills', 'auth',
        ],
    });
});

// ── API Routes ──────────────────────────────────────────────
// Auth — credential routes with strict rate limiting
app.use('/api/auth', authLimiter, authCredentialsRoutes);
// WebAuthn passkey routes
app.use('/api/auth', authLimiter, authRoutes);
// All other API routes with standard rate limiting
app.use('/api', apiLimiter);
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
app.use('/api/marketing-web', marketingWebRoutes);
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
app.use('/api/ecommerce', ecommerceRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/spreadsheet', spreadsheetRoutes);
app.use('/api/automation', automationRoutes);

// ── Phase 5 — AI Layer ───────────────────────────────────────
import aiActionsRouter from './routes/ai-actions';
app.use('/api/ai', apiLimiter, aiActionsRouter);

// ── Phase 5c/6 — Background Jobs ─────────────────────────────
import { startBackgroundJobs } from './jobs';

// ── 404 Handler ─────────────────────────────────────────────
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'The requested endpoint does not exist', requestId: (req as any).id ?? '' },
    });
});

// ── Centralized Error Handler ───────────────────────────────
app.use(errorHandler);

// ── Start Server ────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════╗
║       FusionAI Enterprise Suite — API Server         ║
║──────────────────────────────────────────────────────║
║  Running on http://localhost:${PORT}                    ║
║  Health: http://localhost:${PORT}/api/health            ║
║  DB: PostgreSQL (Prisma)                             ║
╚══════════════════════════════════════════════════════╝
  `);
    startBackgroundJobs();
});

export default app;
