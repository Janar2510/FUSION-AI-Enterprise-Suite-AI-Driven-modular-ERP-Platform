import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useDiscussStore } from '../stores/discussStore';
import { Message } from '../types';

const WS_URL = (import.meta as any).env?.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:3001';

function getToken(): string | null {
    return localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken');
}

function wsMessageToStoreMessage(data: Record<string, unknown>): Message {
    return {
        id: (data.id as number) ?? Date.now(),
        channel_id: data.channelId as number,
        sender_id: 0,
        sender_name: (data.senderName as string) ?? 'Unknown',
        content: (data.content as string) ?? '',
        type: 'text',
        created_at: (data.createdAt as string) ?? new Date().toISOString(),
        reactions: [],
        is_edited: false,
        is_deleted: false,
    };
}

export function useDiscussSocket(currentChannelId: number | null) {
    const socketRef = useRef<Socket | null>(null);
    const currentChannelRef = useRef<number | null>(null);
    const { messages, addMessage } = useDiscussStore();
    const messageIdsRef = useRef<Set<number>>(new Set());

    // Keep message IDs in sync to deduplicate
    useEffect(() => {
        messageIdsRef.current = new Set(messages.map(m => m.id));
    }, [messages]);

    useEffect(() => {
        const token = getToken();
        if (!token) return;

        const socket = io(WS_URL, {
            auth: { token },
            path: '/socket.io',
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
        });

        socket.on('connect', () => {
            if (currentChannelRef.current != null) {
                socket.emit('join', { channelId: currentChannelRef.current });
            }
        });

        socket.on('message', (data: Record<string, unknown>) => {
            const msg = wsMessageToStoreMessage(data);
            if (!messageIdsRef.current.has(msg.id)) {
                addMessage({ ...msg, id: undefined as unknown as number } as Omit<Message, 'id' | 'created_at' | 'updated_at'>);
            }
        });

        socket.on('connect_error', (err) => {
            console.warn('[WS] connection error:', err.message);
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [addMessage]);

    // Join/leave channel rooms when currentChannelId changes
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket) return;

        if (currentChannelRef.current != null && currentChannelRef.current !== currentChannelId) {
            socket.emit('leave', { channelId: currentChannelRef.current });
        }

        currentChannelRef.current = currentChannelId;

        if (currentChannelId != null) {
            socket.emit('join', { channelId: currentChannelId });
        }
    }, [currentChannelId]);

    const sendViaSocket = useCallback((channelId: number, content: string) => {
        socketRef.current?.emit('message', { channelId, content });
    }, []);

    const sendTyping = useCallback((channelId: number) => {
        socketRef.current?.emit('typing', { channelId });
    }, []);

    return { sendViaSocket, sendTyping };
}
