import { AsyncLocalStorage } from 'async_hooks';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Skip `AutomationService` middleware for nested writes (e.g. `UPDATE_RECORD` actions). */
const skipAutomation = new AsyncLocalStorage<boolean>();

export function runAutomationSkipped<T>(fn: () => Promise<T>): Promise<T> {
    return skipAutomation.run(true, fn);
}

function modelToDelegateKey(model: string): string {
    if (!model.length) return model;
    return model.charAt(0).toLowerCase() + model.slice(1);
}

// Automation Trigger Middleware
prisma.$use(async (params, next) => {
    const shouldAutomate =
        (params.action === 'create' || params.action === 'update') &&
        !params.model?.includes('Workflow') &&
        !skipAutomation.getStore();

    let previousRow: Record<string, unknown> | undefined;
    if (
        shouldAutomate &&
        params.action === 'update' &&
        typeof params.model === 'string' &&
        params.args &&
        typeof params.args === 'object' &&
        params.args !== null &&
        'where' in params.args
    ) {
        const where = (params.args as { where?: unknown }).where;
        if (where && typeof where === 'object') {
            const delegateKey = modelToDelegateKey(params.model);
            const delegate = (
                prisma as unknown as Record<string, { findUnique?: (args: { where: unknown }) => Promise<unknown> } | undefined>
            )[delegateKey];
            if (delegate?.findUnique) {
                try {
                    const prev = await delegate.findUnique({ where });
                    if (prev && typeof prev === 'object' && !Array.isArray(prev)) {
                        previousRow = { ...(prev as Record<string, unknown>) };
                    }
                } catch {
                    // omit __previous — structured "changed" checks stay false
                }
            }
        }
    }

    const result = await next(params);

    // Trigger automation on create or update
    if (shouldAutomate) {
        const trigger = params.action === 'create' ? 'ON_CREATE' : 'ON_UPDATE';
        const model = params.model || 'Unknown';

        const payload =
            trigger === 'ON_UPDATE' &&
            previousRow &&
            result &&
            typeof result === 'object' &&
            !Array.isArray(result)
                ? { ...(result as Record<string, unknown>), __previous: previousRow }
                : result;

        // Run as background task to avoid blocking the main request
        import('../modules/spreadsheet/automationService').then(({ AutomationService }) => {
            AutomationService.handleEvent(model, trigger, payload).catch(err => {
                console.error(`[PrismaMiddleware] Automation error:`, err);
            });
        });
    }

    return result;
});

export default prisma;
