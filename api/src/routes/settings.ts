import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

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
        // Convert array of {key, value} to a key-value object
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
        const settings = req.body; // Expects an object like { "crm.qualification_rule": "strict", ... }

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

export const settingsRoutes = router;
