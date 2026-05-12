/**
 * Registers `Workflow` rows with `trigger === 'CRON'` via `node-cron`.
 * `Workflow.condition` must hold a valid cron expression or JSON `{ "cron": "..." }` / `{ "schedule": "..." }`.
 * Jobs re-sync periodically (see `WORKFLOW_CRON_REFRESH_MS`) so DB changes apply without restarting the API.
 */

import cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';

import prisma from '../lib/prisma';
import { logger } from '../core/logger';
import { AutomationService } from '../modules/spreadsheet/automationService';

const DEFAULT_REFRESH_MS = 120_000;
const cronTasksByWorkflowId = new Map<number, { task: ScheduledTask; expr: string }>();

/** Serializes DB → cron sync so overlapping timers cannot corrupt the task map */
let workflowCronSyncChain: Promise<void> = Promise.resolve();

export function parseWorkflowCronExpression(raw: string | null | undefined): string | null {
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

function workflowCronRefreshMs(): number {
    const n = Number(process.env.WORKFLOW_CRON_REFRESH_MS);
    return Number.isFinite(n) && n >= 5000 ? n : DEFAULT_REFRESH_MS;
}

/**
 * Loads active CRON workflows from DB and matches `node-cron` tasks (creates / updates / removes).
 */
export async function syncWorkflowCronSchedules(): Promise<void> {
    const rows = await prisma.workflow.findMany({
        where: { trigger: 'CRON', active: true },
    });

    const desired = new Map<number, string>();
    for (const w of rows) {
        const expr = parseWorkflowCronExpression(w.condition);
        if (!expr) {
            logger.warn(
                { workflowId: w.id, name: w.name },
                '[WorkflowCron] missing condition (cron expression)'
            );
            continue;
        }
        if (!cron.validate(expr)) {
            logger.warn({ workflowId: w.id, name: w.name, expr }, '[WorkflowCron] invalid cron — skipped');
            continue;
        }
        desired.set(w.id, expr);
    }

    for (const [id, entry] of [...cronTasksByWorkflowId.entries()]) {
        const nextExpr = desired.get(id);
        if (nextExpr === undefined || nextExpr !== entry.expr) {
            entry.task.destroy();
            cronTasksByWorkflowId.delete(id);
            logger.info({ workflowId: id }, '[WorkflowCron] unscheduled');
        }
    }

    for (const [workflowId, expr] of desired) {
        const current = cronTasksByWorkflowId.get(workflowId);
        if (current && current.expr === expr) {
            continue;
        }

        const task = cron.schedule(expr, () => {
            void AutomationService.runCronWorkflow(workflowId).catch(err => {
                logger.error({ err, workflowId }, '[WorkflowCron] run failed');
            });
        });
        cronTasksByWorkflowId.set(workflowId, { task, expr });
        logger.info({ workflowId, expr }, '[WorkflowCron] scheduled');
    }
}

export function startWorkflowCronSchedules(): void {
    const enqueue = (): void => {
        workflowCronSyncChain = workflowCronSyncChain
            .then(() => syncWorkflowCronSchedules())
            .catch(err => logger.error({ err }, '[WorkflowCron] sync failed'));
    };

    enqueue();
    const ms = workflowCronRefreshMs();
    setInterval(enqueue, ms);
    logger.info({ refreshMs: ms }, '[WorkflowCron] refresh timer started');
}
