/**
 * Drains `AutomationWebhookDelivery` rows when `AUTOMATION_WEBHOOK_QUEUE` is enabled.
 * Uses bounded polling (default 15s) to avoid hammering the DB; overlap guard like `outboxRelay`.
 */

import { logger } from '../core/logger';
import { isWebhookQueueEnabled, processWebhookQueueBatch } from '../modules/spreadsheet/webhookQueue';

const DEFAULT_INTERVAL_MS = 15_000;

function intervalMs(): number {
    const n = Number(process.env.AUTOMATION_WEBHOOK_QUEUE_POLL_MS);
    return Number.isFinite(n) && n >= 3000 ? n : DEFAULT_INTERVAL_MS;
}

let isRunning = false;

export function startWebhookQueueWorker(): void {
    if (!isWebhookQueueEnabled()) {
        logger.info('[WebhookQueue] disabled (set AUTOMATION_WEBHOOK_QUEUE=1 to enable)');
        return;
    }

    const ms = intervalMs();

    const tick = async (): Promise<void> => {
        if (isRunning) {
            return;
        }
        isRunning = true;
        try {
            const r = await processWebhookQueueBatch();
            if (r.attempted > 0 || r.dead > 0) {
                logger.debug(r, '[WebhookQueue] batch');
            }
        } catch (err) {
            logger.error({ err }, '[WebhookQueue] batch failed');
        } finally {
            isRunning = false;
        }
    };

    void tick();
    setInterval(() => void tick(), ms);
    logger.info({ intervalMs: ms }, '[WebhookQueue] worker started');
}
