/**
 * Transactional Outbox helper (ADR-0004, Phase 1)
 *
 * Publishes domain events via the OutboxEvent table so that a background
 * worker (Phase 3) can relay them to external message brokers (Kafka / Redis
 * Streams) with at-least-once guarantees.
 *
 * Usage:
 *   import { publishEvent } from '../core/outbox';
 *   await publishEvent({
 *     organizationId: 'org_xxx',
 *     eventKey: 'email.send',
 *     payload: { to: 'user@x.com', templateKey: 'invoice', vars: { ... } },
 *   });
 *
 *   // Or inside an existing Prisma transaction (recommended for atomicity):
 *   await prisma.$transaction(async (tx) => {
 *     const partner = await tx.partner.create({ data: ... });
 *     await publishEvent({
 *       organizationId: org.id,
 *       eventKey: 'partner.created',
 *       payload: partner,
 *       tx,
 *     });
 *   });
 */

import prisma from '../../lib/prisma';
import type { PrismaClient, Prisma } from '@prisma/client';

export interface PublishEventOptions {
  organizationId: string;
  /** Handled by OutboxRelay handlers (e.g. `email.send`). */
  eventKey?: string;
  /** @deprecated Use `eventKey` — same value stored in DB. */
  topic?: string;
  payload: Record<string, unknown>;
  /** Supply the tx context to write atomically inside a Prisma transaction. */
  tx?: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;
}

/**
 * Inserts an OutboxEvent row.  Never throws — errors are logged to stderr.
 *
 * When `tx` is supplied the write participates in that transaction; otherwise
 * it uses the global prisma client.
 */
export async function publishEvent(opts: PublishEventOptions): Promise<void> {
  const eventKey = opts.eventKey ?? opts.topic;
  if (!eventKey) {
    console.error('[Outbox] publishEvent: missing eventKey (or deprecated topic)');
    return;
  }
  try {
    const db: any = opts.tx ?? prisma;

    await db.outboxEvent.create({
      data: {
        organizationId: opts.organizationId,
        eventKey,
        payload: opts.payload as Prisma.InputJsonValue,
        attempts: 0,
      },
    });
  } catch (err) {
    console.error('[Outbox] Failed to publish event:', err);
  }
}
