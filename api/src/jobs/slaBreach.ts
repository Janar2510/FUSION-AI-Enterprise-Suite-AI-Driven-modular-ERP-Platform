/**
 * jobs/slaBreach — scans open helpdesk tickets every 5 minutes and marks any
 * ticket whose slaDeadline has passed as slaExceeded = true.
 *
 * Sprint 19B requirement: SLA breach alert background job.
 */

import prisma from '../lib/prisma';
import { logger } from '../core/logger';

const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

async function checkSlaBreach(): Promise<void> {
    try {
        const now = new Date();
        const result = await prisma.helpdeskTicket.updateMany({
            where: {
                slaDeadline: { lt: now },
                slaExceeded: false,
                dateClosed: null,
            },
            data: { slaExceeded: true },
        });

        if (result.count > 0) {
            logger.warn({ count: result.count }, '[SlaBreach] Marked tickets as SLA exceeded');
        }
    } catch (err) {
        logger.error({ err }, '[SlaBreach] Error during SLA breach check');
    }
}

export function startSlaBreach(): void {
    // Run immediately on start, then on a fixed interval
    void checkSlaBreach();
    setInterval(() => void checkSlaBreach(), INTERVAL_MS);
    logger.info('[SlaBreach] SLA breach job started (every 5 min)');
}
