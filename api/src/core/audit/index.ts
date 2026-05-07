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
  | 'LOGOUT'
  | 'ai_action.approve'
  | 'ai_action.reject'
  | 'ai_action.apply'
  | 'ai_action.rollback';

export interface AuditOptions {
  organizationId: string;
  userId?: string;           // maps to actorUserId
  model: string;             // maps to entityType
  recordId: string;          // maps to entityId
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
    await (prisma as any).auditLog.create({
      data: {
        organizationId: opts.organizationId,
        actorUserId:    opts.userId ?? null,
        action:         opts.action,
        entityType:     opts.model,
        entityId:       opts.recordId,
        // AuditLog.before/after are native Json columns — pass objects directly
        before: opts.before ?? null,
        after:  opts.after  ?? null,
        ip:        opts.req?.ip ?? null,
        userAgent: (opts.req?.headers?.['user-agent'] as string) ?? null,
      },
    });
  } catch (err) {
    // Audit failures must NOT crash the main request.
    console.error('[Audit] Failed to write audit log:', err);
  }
}
