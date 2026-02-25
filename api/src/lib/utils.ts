import { Request, Response } from 'express';

/**
 * Async handler wrapper to catch errors in route handlers
 * and forward them to the Express error handler.
 */
export const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) => {
    return (req: Request, res: Response, next: any) => {
        Promise.resolve(fn(req, res)).catch(next);
    };
};

/**
 * Parse pagination params from query string
 */
export const getPagination = (query: any) => {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

/**
 * Build a standard paginated response
 */
export const paginatedResponse = (data: any[], total: number, page: number, limit: number) => ({
    data,
    pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    },
});
