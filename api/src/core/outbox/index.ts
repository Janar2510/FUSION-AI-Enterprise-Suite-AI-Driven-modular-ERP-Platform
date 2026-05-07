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
 *     topic: 'partner.created',
 *     payload: { id: partner.id, name: partner.name },
 *   });
 *
 *   // Or inside an existing Prisma transaction (recommended for atomicity):
 *   await prisma.$transaction(async (tx) => {
 *     const partner = await tx.partner.create({ data: ... });
 *     await publishEvent({
 *       organizationId: org.id,
 *       topic: 'partner.created',
 *       payload: partner,
 *       tx,
 *     });
 *   });
 */

import prisma from '../../lib/prisma';
import type { PrismaClient } from '@prisma/client';

export interface PublishEventOptions {
  organizationId: string;
  topic: string;
  payload: Record<string, unknown>;
  /** Supply the tx context to write atomically inside a Prisma transaction. */
  tx?: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;
  /** Optional correlation / trace ID */
  correlationId?: string;
}

/**
 * Inserts an OutboxEvent row.  Never throws — errors are logged to stderr.
 *
 * When `tx` is supplied the write participates in that transaction; otherwise
 * it uses the global prisma client.
 */
export async function publishEvent(opts: PublishEventOptions): Promise<void> {
  try {
    const db: any = opts.tx ?? prisma;

    await db.outboxEvent.create({
      data: {
        organizationId: opts.organizationId,
        topic: opts.topic,
        payload: JSON.stringify(opts.payload),
        correlationId: opts.correlationId ?? null,
        status: 'PENDING',
        attempts: 0,
      },
    });
  } catch (err) {
    console.error('[Outbox] Failed to publish event:', err);
  }
}
