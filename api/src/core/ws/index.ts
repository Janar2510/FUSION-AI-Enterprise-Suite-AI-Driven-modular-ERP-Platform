/**
 * WebSocket server — real-time messaging for the Discuss module.
 *
 * Auth: JWT from socket.io handshake auth.token or query.token.
 * Rooms: one Socket.IO room per channel — "channel:{id}".
 *
 * Events emitted to clients:
 *   message — new chat message { channelId, senderId, content, createdAt }
 *   typing  — someone is typing { channelId, userId }
 *
 * Events received from clients:
 *   join    { channelId }
 *   leave   { channelId }
 *   message { channelId, content }
 *   typing  { channelId }
 */

import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../auth';
import { logger } from '../logger';
import prisma from '../../lib/prisma';

let io: SocketServer | null = null;

export function initWebSocket(httpServer: HttpServer): SocketServer {
    io = new SocketServer(httpServer, {
        cors: { origin: '*', methods: ['GET', 'POST'] },
        path: '/socket.io',
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth?.token
            ?? socket.handshake.query?.token as string | undefined;

        if (!token) {
            return next(new Error('Authentication required'));
        }
        try {
            const payload = verifyAccessToken(token as string);
            (socket as any).user = payload;
            next();
        } catch {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket: Socket) => {
        const user = (socket as any).user;
        logger.info({ userId: user?.sub }, 'WS client connected');

        socket.on('join', ({ channelId }: { channelId: number }) => {
            socket.join(`channel:${channelId}`);
            logger.debug({ userId: user?.sub, channelId }, 'WS joined channel');
        });

        socket.on('leave', ({ channelId }: { channelId: number }) => {
            socket.leave(`channel:${channelId}`);
        });

        socket.on('message', async ({ channelId, content }: { channelId: number; content: string }) => {
            if (!content?.trim()) return;

            // Persist to DB then broadcast so all clients get a consistent ID
            let msgId: number | undefined;
            try {
                const saved = await prisma.mailMessage.create({
                    data: {
                        body: content.trim(),
                        authorName: user?.email ?? 'Unknown',
                        authorId: user?.sub,
                        channelId,
                    },
                });
                msgId = saved.id;
            } catch (err) {
                logger.warn({ err }, 'WS message persist failed');
            }

            io!.to(`channel:${channelId}`).emit('message', {
                type: 'message',
                id: msgId,
                channelId,
                senderId: user?.sub,
                senderName: user?.email ?? 'Unknown',
                content: content.trim(),
                createdAt: new Date().toISOString(),
            });

            logger.debug({ userId: user?.sub, channelId }, 'WS message broadcast');
        });

        socket.on('typing', ({ channelId }: { channelId: number }) => {
            socket.to(`channel:${channelId}`).emit('typing', {
                type: 'typing',
                channelId,
                userId: user?.sub,
            });
        });

        socket.on('disconnect', () => {
            logger.debug({ userId: user?.sub }, 'WS client disconnected');
        });
    });

    logger.info('WebSocket server initialized on /socket.io');
    return io;
}

/** Emit a message to a channel from server-side code (e.g., after HTTP POST /chatter). */
export function emitToChannel(channelId: number | string, event: string, data: unknown) {
    io?.to(`channel:${channelId}`).emit(event, data);
}
