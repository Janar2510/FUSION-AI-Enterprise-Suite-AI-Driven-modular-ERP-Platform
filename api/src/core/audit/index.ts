/**
 * Audit helper (ADR-0004, Phase 1)
 *
 * Writes immutable audit trail rows to the AuditLog table.
 *
 * Usage:
 *   import { audit } from '../core/audit';
 *   await audit({
 *     organizationId: 'org_xxx',
 *     userId: 'user_xxx',
 *     model: 'Partner',
 *     recordId: partner.id,
 *     action: 'UPDATE',
 *     before: oldPartner,
 *     after: updatedPartner,
 *     req,             // optional — captures IP / userAgent
 *   });
 */

import prisma from '../../lib/prisma';
import type { Request } from 'express';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'READ'
  | 'EXPORT'
  | 'IMPORT'
  | 'LOGIN'
  | 'LOGOUT';

export interface AuditOptions {
  organizationId: string;
  userId?: string;
  model: string;
  recordId: string;
  action: AuditAction;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  meta?: Record<string, unknown>;
  req?: Pick<Request, 'ip' | 'headers'>;
}

/**
 * Persists an audit log entry.  Never throws — errors are logged to stderr so
 * they do not break the main request flow.
 */
export async function audit(opts: AuditOptions): Promise<void> {
  try {
    const diff = computeDiff(opts.before ?? null, opts.after ?? null);

    await (prisma as any).auditLog.create({
      data: {
        organizationId: opts.organizationId,
        userId: opts.userId ?? null,
        model: opts.model,
        recordId: opts.recordId,
        action: opts.action,
        before: opts.before ? JSON.stringify(opts.before) : null,
        after: opts.after ? JSON.stringify(opts.after) : null,
        diff: diff ? JSON.stringify(diff) : null,
        meta: opts.meta ? JSON.stringify(opts.meta) : null,
        ipAddress: opts.req?.ip ?? null,
        userAgent: (opts.req?.headers?.['user-agent'] as string) ?? null,
      },
    });
  } catch (err) {
    // Audit failures must NOT crash the main request.
    console.error('[Audit] Failed to write audit log:', err);
  }
}

/**
 * Returns a key→{before,after} diff object for changed scalar fields.
 * Returns null when both snapshots are absent.
 */
function computeDiff(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): Record<string, { before: unknown; after: unknown }> | null {
  if (!before && !after) return null;
  if (!before) return null;
  if (!after) return null;

  const diff: Record<string, { before: unknown; after: unknown }> = {};
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    const b = before[key];
    const a = after[key];
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      diff[key] = { before: b, after: a };
    }
  }

  return Object.keys(diff).length > 0 ? diff : null;
}
