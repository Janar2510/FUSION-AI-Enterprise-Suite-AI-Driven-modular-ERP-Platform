/**
 * core/validation — Zod-based request validation helpers
 *
 * Usage:
 *   router.post('/', validate(CreatePartnerSchema), handler)
 *   // or inline:
 *   const body = parseBody(req, CreatePartnerSchema);
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodTypeAny, z } from 'zod';
import { AppError } from '../errors';

// ── Middleware factory ────────────────────────────────────────────────────────

/**
 * Express middleware that validates req.body against a Zod schema.
 * On failure it throws an AppError that the errorHandler will catch.
 */
export function validate<T extends ZodTypeAny>(schema: T) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const fields = result.error.issues.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            }));
            next(AppError.validation('Validation failed', fields));
            return;
        }
        req.body = result.data; // replace with parsed/coerced data
        next();
    };
}

/**
 * Validate query params against a Zod schema.
 */
export function validateQuery<T extends ZodTypeAny>(schema: T) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            const fields = result.error.issues.map((e) => ({
                field: `query.${e.path.join('.')}`,
                message: e.message,
            }));
            next(AppError.validation('Invalid query parameters', fields));
            return;
        }
        (req as any).validatedQuery = result.data;
        next();
    };
}

/**
 * Inline parse helper for use inside handlers.
 * Throws an AppError if validation fails.
 */
export function parseBody<T>(req: Request, schema: ZodSchema<T>): T {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        const fields = result.error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        throw AppError.validation('Validation failed', fields);
    }
    return result.data;
}

// ── Common reusable schemas ──────────────────────────────────────────────────

export const PaginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
});

export const IdParamSchema = z.object({
    id: z.string().min(1, 'ID is required'),
});

export const EmailSchema = z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .trim();

export const PasswordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number');
