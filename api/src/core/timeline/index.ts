/**
 * Timeline helper (ADR-0004, Phase 1)
 *
 * Emits a TimelineEvent row so that the 360° Partner / Chatter view can
 * display a chronological activity feed.
 *
 * Usage:
 *   import { emitTimeline } from '../core/timeline';
 *   await emitTimeline({
 *     organizationId: 'org_xxx',
 *     model: 'SaleOrder',
 *     recordId: order.id,
 *     type: 'STATUS_CHANGE',
 *     message: 'Order confirmed',
 *     userId: 'user_xxx',
 *     partnerId: order.partnerId,
 *   });
 */

import prisma from '../../lib/prisma';

export type TimelineType =
  | 'CREATED'
  | 'UPDATED'
  | 'DELETED'
  | 'STATUS_CHANGE'
  | 'NOTE'
  | 'EMAIL_SENT'
  | 'CALL_LOGGED'
  | 'MEETING_SCHEDULED'
  | 'DOCUMENT_ATTACHED'
  | 'PAYMENT_RECEIVED'
  | 'CUSTOM';

export interface EmitTimelineOptions {
  organizationId: string;
  model: string;
  recordId: string;
  type: TimelineType;
  message: string;
  userId?: string | null;
  partnerId?: string | null;
  meta?: Record<string, unknown>;
}

/**
 * Persists a timeline event.  Never throws — errors are logged to stderr.
 */
export async function emitTimeline(opts: EmitTimelineOptions): Promise<void> {
  try {
    await (prisma as any).timelineEvent.create({
      data: {
        organizationId: opts.organizationId,
        model: opts.model,
        recordId: opts.recordId,
        type: opts.type,
        message: opts.message,
        userId: opts.userId ?? null,
        partnerId: opts.partnerId ?? null,
        meta: opts.meta ? JSON.stringify(opts.meta) : null,
      },
    });
  } catch (err) {
    console.error('[Timeline] Failed to emit timeline event:', err);
  }
}
