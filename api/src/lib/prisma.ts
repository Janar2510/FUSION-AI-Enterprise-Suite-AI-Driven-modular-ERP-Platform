import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Automation Trigger Middleware
prisma.$use(async (params, next) => {
    const result = await next(params);

    // Trigger automation on create or update
    if ((params.action === 'create' || params.action === 'update') &&
        !params.model?.includes('Workflow')) { // Avoid recursion on workflow model

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
