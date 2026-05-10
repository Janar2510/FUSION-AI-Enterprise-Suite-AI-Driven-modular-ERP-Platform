/**
 * Shared Chatter Router Factory
 *
 * Creates an Express sub-router exposing:
 *   GET  /:id/messages
 *   POST /:id/messages
 *
 * for any module (ownerType). Mount once per module in the module's route file:
 *
 *   import { createChatterRouter } from '../core/chatter';
 *   router.use('/', createChatterRouter('sale.order'));
 *
 * Then the module gains:
 *   GET  /api/sales/:id/messages
 *   POST /api/sales/:id/messages
 */

import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';

export function createChatterRouter(ownerType: string): Router {
    const router = Router({ mergeParams: true });

    /** GET /:id/messages */
    router.get('/:id/messages', async (req: Request, res: Response) => {
        try {
            const messages = await prisma.chatterMessage.findMany({
                where: { ownerType, ownerId: req.params.id },
                orderBy: { createdAt: 'asc' },
            });
            res.json(messages);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    /** POST /:id/messages */
    router.post('/:id/messages', async (req: Request, res: Response) => {
        const { body: content, isInternal = true } = req.body as {
            body?: string;
            isInternal?: boolean;
        };

        if (!content) {
            return res.status(400).json({ error: 'body is required' });
        }

        const userId = (req as any).user?.id as string | undefined;
        const orgId: string = (req as any).user?.organizationId ?? 'default';

        try {
            const message = await prisma.chatterMessage.create({
                data: {
                    ownerType,
                    ownerId: req.params.id,
                    body: content,
                    isInternal: Boolean(isInternal),
                    authorId: userId ?? null,
                    organizationId: orgId,
                },
            });

            res.status(201).json(message);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
}
