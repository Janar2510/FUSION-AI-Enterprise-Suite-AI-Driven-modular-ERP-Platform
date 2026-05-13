import prisma from '../../lib/prisma';
import { logger } from '../../core/logger';
import { deliverWebhook, resolveWebhookHmacSecret, type DeliverWebhookOptions } from './webhookDelivery';

/** Worker-level attempts after `deliverWebhook` returns failure (each call may still retry HTTP internally). */
export const WEBHOOK_QUEUE_MAX_RUNS = 5;

export type WebhookQueuePayload = {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
    timeoutMs: number;
    maxRetries: number;
    /** Env key for HMAC; inline `hmacSecret` workflows are never queued. */
    hmacSecretEnv?: string;
    workflowId: number;
    workflowName?: string;
};

export function isWebhookQueueEnabled(): boolean {
    const v = process.env.AUTOMATION_WEBHOOK_QUEUE ?? '';
    return v === '1' || v.toLowerCase() === 'true';
}

/**
 * Inline `hmacSecret` must not be stored in DB — those webhooks stay synchronous.
 * Env-based secrets (`hmacSecretEnv`) or unsigned webhooks can be queued.
 */
export function canQueueWebhookConfig(cfg: Record<string, unknown>): boolean {
    const direct = cfg.hmacSecret;
    if (typeof direct === 'string' && direct.trim().length > 0) {
        return false;
    }
    return true;
}

function backoffWorkerMs(workerAttemptIndex: number): number {
    return Math.min(60_000, 2000 * 2 ** workerAttemptIndex);
}

export async function enqueueWebhookFromAutomation(input: WebhookQueuePayload): Promise<void> {
    await prisma.automationWebhookDelivery.create({
        data: {
            status: 'queued',
            payload: input as object,
            workflowId: input.workflowId,
        },
    });
}

function payloadToDeliverOptions(payload: WebhookQueuePayload): DeliverWebhookOptions {
    const hmacSecret = resolveWebhookHmacSecret({
        hmacSecretEnv: payload.hmacSecretEnv,
    });
    return {
        url: payload.url,
        method: payload.method,
        headers: payload.headers,
        body: payload.body,
        timeoutMs: payload.timeoutMs,
        maxRetries: payload.maxRetries,
        hmacSecret,
    };
}

export type WebhookQueueBatchResult = { attempted: number; dead: number };

export async function processWebhookQueueBatch(): Promise<WebhookQueueBatchResult> {
    const raw = Number(process.env.AUTOMATION_WEBHOOK_QUEUE_BATCH);
    const take = Number.isFinite(raw) && raw > 0 ? Math.min(100, Math.floor(raw)) : 25;

    const now = new Date();
    const rows = await prisma.automationWebhookDelivery.findMany({
        where: {
            status: 'queued',
            OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
        },
        orderBy: { createdAt: 'asc' },
        take,
    });

    let dead = 0;
    let attempted = 0;

    for (const row of rows) {
        const payload = row.payload as unknown as WebhookQueuePayload;
        if (!payload?.url || typeof payload.url !== 'string') {
            await prisma.automationWebhookDelivery.update({
                where: { id: row.id },
                data: {
                    status: 'dead',
                    lastError: 'invalid_queue_payload',
                    attempts: { increment: 1 },
                },
            });
            dead++;
            continue;
        }

        const result = await deliverWebhook(payloadToDeliverOptions(payload));
        attempted++;

        if (result.ok) {
            await prisma.automationWebhookDelivery.delete({ where: { id: row.id } });
            logger.info(
                { workflowId: row.workflowId, deliveryId: row.id },
                '[WebhookQueue] delivered',
            );
            continue;
        }

        const msg =
            result.status != null
                ? `http_${result.status} (http_attempts=${result.attempts})`
                : `network_error (http_attempts=${result.attempts})`;

        const nextAttempts = row.attempts + 1;
        if (nextAttempts >= WEBHOOK_QUEUE_MAX_RUNS) {
            await prisma.automationWebhookDelivery.update({
                where: { id: row.id },
                data: {
                    status: 'dead',
                    attempts: nextAttempts,
                    lastHttpStatus: result.status ?? null,
                    lastError: msg,
                    nextRetryAt: null,
                },
            });
            dead++;
            logger.warn(
                { workflowId: row.workflowId, deliveryId: row.id, lastError: msg },
                '[WebhookQueue] dead-lettered',
            );
        } else {
            const nextAt = new Date(Date.now() + backoffWorkerMs(nextAttempts - 1));
            await prisma.automationWebhookDelivery.update({
                where: { id: row.id },
                data: {
                    attempts: nextAttempts,
                    lastHttpStatus: result.status ?? null,
                    lastError: msg,
                    nextRetryAt: nextAt,
                },
            });
            logger.warn(
                { workflowId: row.workflowId, deliveryId: row.id, nextRetryAt: nextAt },
                '[WebhookQueue] scheduled retry',
            );
        }
    }

    return { attempted, dead };
}
