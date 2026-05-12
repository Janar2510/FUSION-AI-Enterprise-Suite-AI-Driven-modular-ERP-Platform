import { AsyncLocalStorage } from 'async_hooks';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Skip `AutomationService` middleware for nested writes (e.g. `UPDATE_RECORD` actions). */
const skipAutomation = new AsyncLocalStorage<boolean>();

export function runAutomationSkipped<T>(fn: () => Promise<T>): Promise<T> {
    return skipAutomation.run(true, fn);
}

// Automation Trigger Middleware
prisma.$use(async (params, next) => {
    const result = await next(params);

    // Trigger automation on create or update
    if (
        (params.action === 'create' || params.action === 'update') &&
        !params.model?.includes('Workflow') &&
        !skipAutomation.getStore()
    ) {
        const trigger = params.action === 'create' ? 'ON_CREATE' : 'ON_UPDATE';
        const model = params.model || 'Unknown';

        // Run as background task to avoid blocking the main request
        import('../modules/spreadsheet/automationService').then(({ AutomationService }) => {
            AutomationService.handleEvent(model, trigger, result).catch(err => {
                console.error(`[PrismaMiddleware] Automation error:`, err);
            });
        });
    }

    return result;
});

export default prisma;
