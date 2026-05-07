/**
 * jobs/outboxRelay — Transactional outbox event relay (ADR-0009)
 *
 * Picks up OutboxEvent rows where publishedAt IS NULL and processes them.
 * Runs every 30 seconds via node-cron.
 *
 * Event handler registry maps eventKey → handler function.
 * Unhandled events are marked published with a warning (not retried).
 *
 * Retry logic:
 *   - On handler error: increment attempts, set lastError
 *   - After 5 attempts: mark published with error (dead-letter)
 *   - Successful: set publishedAt = NOW()
 */

import cron from 'node-cron';
import prisma from '../lib/prisma';

type EventHandler = (payload: unknown) => Promise<void>;

const handlers: Record<string, EventHandler> = {};

export function registerEventHandler(eventKey: string, handler: EventHandler) {
    handlers[eventKey] = handler;
}

// ── Default handlers ──────────────────────────────────────────────────────────

registerEventHandler('email.send', async (payload: any) => {
    const { sendEmail } = await import('../core/email');
    await sendEmail({
        to: payload.to,
        templateKey: payload.templateKey,
        vars: payload.vars,
        attachments: payload.attachments,
    });
});

registerEventHandler('timeline.emit', async (payload: any) => {
    const { emitTimeline } = await import('../core/timeline');
    await emitTimeline(payload);
});

// ── Relay runner ──────────────────────────────────────────────────────────────

const MAX_ATTEMPTS = 5;
let isRunning = false;

async function relay() {
    if (isRunning) return; // prevent overlap
    isRunning = true;

    try {
        const events = await (prisma as any).outboxEvent?.findMany?.({
            where: {
                publishedAt: null,
                attempts: { lt: MAX_ATTEMPTS },
            },
            orderBy: { createdAt: 'asc' },
            take: 50,
        });

        if (!events || events.length === 0) return;

        for (const event of events) {
            const handler = handlers[event.eventKey];
            try {
                if (handler) {
                    await handler(event.payload);
                } else {
                    console.warn(`[Outbox] No handler for event '${event.eventKey}' — marking done`);
                }
                await (prisma as any).outboxEvent?.update?.({
                    where: { id: event.id },
                    data: { publishedAt: new Date(), lastError: null },
                });
            } catch (err: any) {
                const newAttempts = (event.attempts ?? 0) + 1;
                await (prisma as any).outboxEvent?.update?.({
                    where: { id: event.id },
                    data: {
                        attempts: newAttempts,
                        lastError: String(err?.message ?? err),
                        // Dead-letter after max attempts
                        ...(newAttempts >= MAX_ATTEMPTS ? { publishedAt: new Date() } : {}),
                    },
                });
                console.error(`[Outbox] Handler failed for event '${event.eventKey}' (attempt ${newAttempts}):`, err?.message);
            }
        }
    } catch (err) {
        console.error('[Outbox] Relay error:', err);
    } finally {
        isRunning = false;
    }
}

export function startOutboxRelay() {
    cron.schedule('*/30 * * * * *', relay); // every 30 seconds
    console.log('[Outbox] Relay worker started (every 30s)');
}
