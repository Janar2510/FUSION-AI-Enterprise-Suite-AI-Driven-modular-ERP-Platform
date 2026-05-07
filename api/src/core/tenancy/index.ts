/**
 * Tenant-scoped Prisma wrapper (ADR-0004, Phase 1)
 *
 * Usage:
 *   import { tenantDb } from '../core/tenancy';
 *   const db = tenantDb(req.organizationId);
 *   const partners = await db.partner.findMany();   // always filters by org
 *
 * The wrapper adds a default `where.organizationId` clause to every
 * findMany / findFirst / findUnique operation, and injects organizationId
 * into every create call automatically.
 *
 * IMPORTANT: Raw `prisma` calls bypass this filter.  Always use tenantDb()
 * inside request handlers.  The ESLint rule `no-direct-prisma` (to be added
 * in Phase 2) will enforce this.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import basePrisma from '../../lib/prisma';

// Models that carry an organizationId field.
const TENANT_MODELS = new Set([
  'partner', 'product', 'attachment', 'spineDocument', 'activity',
  'chatterMessage', 'timelineEvent', 'auditLog', 'outboxEvent',
]);

/**
 * Returns a Prisma proxy that automatically scopes all reads & creates to
 * the supplied organizationId.
 */
export function tenantDb(organizationId: string): PrismaClient {
  if (!organizationId) {
    throw new Error('tenantDb: organizationId is required');
  }

  return new Proxy(basePrisma, {
    get(target: any, model: string) {
      const delegate = target[model];
      if (!delegate || typeof delegate !== 'object') return delegate;

      if (!TENANT_MODELS.has(model)) return delegate;

      return new Proxy(delegate, {
        get(delegateTarget: any, method: string) {
          const fn = delegateTarget[method];
          if (typeof fn !== 'function') return fn;

          if (method === 'findMany' || method === 'findFirst' || method === 'count' || method === 'aggregate') {
            return (args: any = {}) => {
              const scopedArgs = {
                ...args,
                where: { ...args.where, organizationId },
              };
              return fn.call(delegateTarget, scopedArgs);
            };
          }

          if (method === 'findUnique' || method === 'findUniqueOrThrow' || method === 'findFirstOrThrow') {
            // findUnique uses `where` with unique fields; wrap in findFirst
            if (method === 'findUnique') {
              return (args: any = {}) => {
                const scopedArgs = {
                  ...args,
                  where: { ...args.where, organizationId },
                };
                return delegateTarget.findFirst.call(delegateTarget, scopedArgs);
              };
            }
            return fn;
          }

          if (method === 'create') {
            return (args: any = {}) => {
              const scopedArgs = {
                ...args,
                data: { ...args.data, organizationId },
              };
              return fn.call(delegateTarget, scopedArgs);
            };
          }

          if (method === 'createMany') {
            return (args: any = {}) => {
              const scopedArgs = {
                ...args,
                data: (args.data as any[]).map((d: any) => ({ ...d, organizationId })),
              };
              return fn.call(delegateTarget, scopedArgs);
            };
          }

          if (method === 'update' || method === 'delete' || method === 'updateMany' || method === 'deleteMany') {
            return (args: any = {}) => {
              const scopedArgs = {
                ...args,
                where: { ...args.where, organizationId },
              };
              return fn.call(delegateTarget, scopedArgs);
            };
          }

          return fn.bind(delegateTarget);
        },
      });
    },
  }) as unknown as PrismaClient;
}

/** Convenience: extract organizationId from Express request (set by requireTenant middleware). */
export function getOrgId(req: { organizationId?: string }): string {
  if (!req.organizationId) {
    throw new Error('requireTenant middleware not applied — organizationId missing on request');
  }
  return req.organizationId;
}
