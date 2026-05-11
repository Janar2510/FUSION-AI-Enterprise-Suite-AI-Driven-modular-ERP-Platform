/**
 * Shared marketing campaign workflow helpers — schedule computation used by
 * POST /launch and the campaign workflow runner.
 */

import type { Logger } from 'pino';

export function delayUnitToMillis(unit: string, log?: Pick<Logger, 'warn'>): number {
    switch (unit) {
        case 'minutes':
            return 60_000;
        case 'hours':
            return 3_600_000;
        case 'days':
            return 86_400_000;
        case 'weeks':
            return 7 * 86_400_000;
        default:
            log?.warn({ unit }, '[marketingWorkflow] unknown delayUnit — treating as hours');
            return 3_600_000;
    }
}

export function addActivityDelay(
    from: Date,
    delayValue: number,
    delayUnit: string,
    log?: Pick<Logger, 'warn'>
): Date {
    const ms = delayValue * delayUnitToMillis(delayUnit, log);
    return new Date(from.getTime() + ms);
}

/** Next fire time for a participant who has not started (uses the first activity's delay). */
export function firstStepScheduledAt(
    firstActivity: { delayValue: number; delayUnit: string },
    now: Date,
    log?: Pick<Logger, 'warn'>
): Date {
    return addActivityDelay(now, firstActivity.delayValue, firstActivity.delayUnit, log);
}

export type WorkflowActivity = {
    id: number;
    sequence: number;
    type: string;
    delayValue: number;
    delayUnit: string;
    subject: string | null;
    body: string | null;
    serverAction: string | null;
};

/** Activities ordered by sequence, then id (stable chain). */
export function sortActivitiesForChain<T extends Pick<WorkflowActivity, 'sequence' | 'id'>>(activities: T[]): T[] {
    return [...activities].sort((a, b) => (a.sequence !== b.sequence ? a.sequence - b.sequence : a.id - b.id));
}

export function pickNextActivityInChain(
    sorted: WorkflowActivity[],
    lastActivityId: number | null
): WorkflowActivity | null {
    if (sorted.length === 0) return null;
    if (lastActivityId == null) return sorted[0] ?? null;
    const idx = sorted.findIndex((a) => a.id === lastActivityId);
    if (idx < 0) return sorted[0] ?? null;
    return sorted[idx + 1] ?? null;
}
