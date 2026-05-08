/**
 * CSRF protection middleware
 *
 * Strategy:
 *   1. Requests with a valid `Authorization: Bearer <jwt>` header are safe by
 *      design — browsers cannot include custom headers cross-origin without a
 *      CORS preflight, which our `cors()` config already blocks for unknown
 *      origins. No additional token needed.
 *
 *   2. For state-changing requests (POST/PUT/PATCH/DELETE) that arrive WITHOUT
 *      a Bearer token (e.g. session-only auth from the admin shell), we require
 *      an `X-Requested-With: XMLHttpRequest` header — the well-established
 *      AJAX CSRF defence (Microsoft pattern, used by Rails/Django/Spring).
 *      This header cannot be set cross-origin from a plain HTML form or
 *      img/script tag, so it proves the request originated from our SPA.
 *
 *   3. Safe methods (GET/HEAD/OPTIONS) are always allowed.
 *   4. Internal health / metrics endpoints are skipped.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../core/errors';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const SKIP_PATHS = new Set(['/api/health', '/api/ready', '/metrics']);

export function csrfProtection(req: Request, _res: Response, next: NextFunction): void {
    // Skip safe HTTP methods
    if (SAFE_METHODS.has(req.method)) {
        next();
        return;
    }

    // Skip non-API health/metrics paths
    if (SKIP_PATHS.has(req.path)) {
        next();
        return;
    }

    // If a Bearer token is present, the request is CSRF-safe by design
    const authHeader = req.headers.authorization ?? '';
    if (authHeader.startsWith('Bearer ')) {
        next();
        return;
    }

    // Session-only request: enforce X-Requested-With header
    const xrw = req.headers['x-requested-with'];
    if (xrw && xrw.toString().toLowerCase() === 'xmlhttprequest') {
        next();
        return;
    }

    next(new AppError('FORBIDDEN', 'CSRF check failed: include Authorization: Bearer or X-Requested-With: XMLHttpRequest', 403));
}
