/**
 * Registers `Workflow` rows with `trigger === 'CRON'` into `node-cron` at process start.
 * `Workflow.condition` must hold a valid cron expression or JSON `{ "cron": "..." }` / `{ "schedule": "..." }`.
 * Schedule changes in the DB require an API restart unless a refresh job is added later.
 */

import cron from 'node-cron';
import prisma from '../lib/prisma';
import { logger } from '../core/logger';
import { AutomationService } from '../modules/spreadsheet/automationService';

function parseCronExpression(raw: string | null | undefined): string | null {
    if (raw == null) return null;
    const t = raw.trim();
    if (!t.length) return null;
    try {
        const j = JSON.parse(t) as { cron?: unknown; schedule?: unknown };
        if (j && typeof j === 'object' && !Array.isArray(j)) {
            const c = j.cron ?? j.schedule;
            if (typeof c === 'string' && c.trim().length > 0) {
                return c.trim();
            }
        }
    } catch {
        /* plain cron string */
    }
    return t;
}

export function startWorkflowCronSchedules(): void {
    void (async () => {
        const rows = await prisma.workflow.findMany({
            where: { trigger: 'CRON', active: true },
        });
        for (const w of rows) {
            const expr = parseCronExpression(w.condition);
            if (!expr) {
                logger.warn(
                    { workflowId: w.id, name: w.name },
                    '[WorkflowCron] missing condition (cron expression)'
                );
                continue;
            }
            if (!cron.validate(expr)) {
                logger.warn(
                    { workflowId: w.id, name: w.name, expr },
                    '[WorkflowCron] invalid cron expression — skipped'
                );
                continue;
            }
            cron.schedule(expr, () => {
                void AutomationService.runCronWorkflow(w.id).catch(err => {
                    logger.error({ err, workflowId: w.id }, '[WorkflowCron] run failed');
                });
            });
            logger.info({ workflowId: w.id, name: w.name, expr }, '[WorkflowCron] scheduled');
        }
    })().catch(err => {
        logger.error({ err }, '[WorkflowCron] bootstrap failed');
    });
}
