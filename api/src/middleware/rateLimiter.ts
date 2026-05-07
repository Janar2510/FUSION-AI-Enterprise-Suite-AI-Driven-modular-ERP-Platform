/**
 * middleware/rateLimiter — express-rate-limit configurations
 *
 * Three tiers:
 *   - globalLimiter  — 300 req / 15 min per IP (all routes)
 *   - authLimiter    — 20 req / 15 min per IP (login/register)
 *   - apiLimiter     — 100 req / 1 min per IP (general API)
 */

import rateLimit from 'express-rate-limit';
import { AppError } from '../core/errors';

const rateLimitHandler = (_req: any, _res: any, next: any, _options: any) => {
    next(new AppError('RATE_LIMITED', 'Too many requests. Please try again later.', 429));
};

/** Applied globally — broad protection */
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
});

/** Applied to auth routes — prevents brute force */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    skipSuccessfulRequests: false,
});

/** Applied to general API routes */
export const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
});
