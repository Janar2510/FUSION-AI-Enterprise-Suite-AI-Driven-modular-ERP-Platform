import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
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

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ───────────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

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
            'attendance', 'payroll', 'appraisals', 'quality', 'plm',
        ],
    });
});

// ── API Routes ──────────────────────────────────────────────
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

// ── 404 Handler ─────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found', message: 'The requested endpoint does not exist' });
});

// ── Error Handler ───────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
});

// ── Start Server ────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════╗
║       FusionAI Enterprise Suite — API Server         ║
║──────────────────────────────────────────────────────║
║  🚀 Server running on http://localhost:${PORT}          ║
║  📚 Health check: http://localhost:${PORT}/api/health   ║
║  🗄️  Database: SQLite (Prisma)                       ║
╚══════════════════════════════════════════════════════╝
  `);
});

export default app;
