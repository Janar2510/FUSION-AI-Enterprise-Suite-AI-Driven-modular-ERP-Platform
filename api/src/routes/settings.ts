import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requirePermission } from '../core/auth';

const router = express.Router();
const prisma = new PrismaClient();

router.use(requireAuth);

// ── Flat settings (legacy) ─────────────────────────────────────────────────────

// Get all settings or a specific set of settings
router.get('/', async (req: Request, res: Response) => {
    try {
        const { keys } = req.query;
        let query = {};

        if (keys && typeof keys === 'string') {
            const keyArray = keys.split(',');
            query = {
                where: {
                    key: { in: keyArray }
                }
            };
        }

        const settings = await prisma.systemConfig.findMany(query);
        const settingsMap = settings.reduce((acc: Record<string, string>, curr: { key: string; value: string }) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);

        res.json(settingsMap);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Update or create settings
router.post('/', async (req: Request, res: Response) => {
    try {
        const settings = req.body;

        if (!settings || typeof settings !== 'object') {
            res.status(400).json({ error: 'Invalid settings payload' });
            return;
        }

        const updates = Object.entries(settings).map(([key, value]) => {
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            return prisma.systemConfig.upsert({
                where: { key },
                update: { value: stringValue },
                create: { key, value: stringValue }
            });
        });

        await prisma.$transaction(updates);
        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Error saving settings:', error);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

// ── Admin: list platform users ─────────────────────────────────────────────────
// NOTE: must be registered BEFORE /:module or the path is swallowed by that param.

router.get('/users', async (req: Request, res: Response) => {
    try {
        const users = await (prisma as any).spineUser?.findMany?.({
            select: { id: true, name: true, email: true, active: true },
            orderBy: { name: 'asc' },
        }) ?? [];
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// ── Module-scoped settings ─────────────────────────────────────────────────────

/**
 * GET /api/settings/:module
 * Returns all settings whose keys are prefixed with `<module>.`
 * e.g. GET /api/settings/crm  → { lead_expiry_days: "30", auto_assign: "true" }
 */
router.get('/:module', async (req: Request, res: Response) => {
    const prefix = `${req.params.module}.`;
    try {
        const rows = await prisma.systemConfig.findMany({
            where: { key: { startsWith: prefix } },
        });
        const result = rows.reduce((acc: Record<string, unknown>, row) => {
            const shortKey = row.key.slice(prefix.length);
            try { acc[shortKey] = JSON.parse(row.value); } catch { acc[shortKey] = row.value; }
            return acc;
        }, {});
        res.json(result);
    } catch (error) {
        console.error(`Error fetching ${req.params.module} settings:`, error);
        res.status(500).json({ error: 'Failed to fetch module settings' });
    }
});

/**
 * PUT /api/settings/:module
 * Upserts settings under the `<module>.` namespace.
 * Body: { lead_expiry_days: 30, auto_assign: true }
 * Requires SETTINGS_WRITE permission.
 */
router.put('/:module', requirePermission('settings.write'), async (req: Request, res: Response) => {
    const prefix = `${req.params.module}.`;
    const body = req.body;

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return res.status(400).json({ error: 'Body must be a key-value object' });
    }

    try {
        const ops = Object.entries(body).map(([k, v]) => {
            const key = `${prefix}${k}`;
            const value = typeof v === 'string' ? v : JSON.stringify(v);
            return prisma.systemConfig.upsert({
                where: { key },
                update: { value },
                create: { key, value },
            });
        });
        await prisma.$transaction(ops);
        res.json({ module: req.params.module, saved: Object.keys(body).length });
    } catch (error) {
        console.error(`Error saving ${req.params.module} settings:`, error);
        res.status(500).json({ error: 'Failed to save module settings' });
    }
});

export const settingsRoutes = router;
