import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (event: string, data: any) => void;
  disconnect: () => void;
  // Discuss-compatible interface
  data: any;
  send: (data: any) => void;
}

const WS_URL = (import.meta as any).env.VITE_WS_URL || (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

function getStoredToken(): string | null {
  try {
    // Try standard localStorage key used by auth store
    const raw = localStorage.getItem('fusionai_auth') || localStorage.getItem('auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.accessToken ?? parsed?.accessToken ?? null;
  } catch {
    return null;
  }
}

export const useWebSocket = (endpoint: string): UseWebSocketReturn => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastData, setLastData] = useState<any>(null);

  useEffect(() => {
    const token = getStoredToken();

    // Try real socket.io connection — fall back silently if server isn't running WS
    const socket = io(WS_URL, {
      path: '/socket.io',
      auth: token ? { token } : {},
      query: { endpoint },
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnectionAttempts: 3,
    });

    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('connect_error', () => {
      // Server doesn't have WS — stay disconnected, polling will handle real-time
      setIsConnected(false);
    });

    // Generic inbound data relay
    socket.onAny((event, data) => {
      if (event !== 'connect' && event !== 'disconnect') {
        setLastData({ type: event, ...data });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [endpoint]);

  const sendMessage = useCallback((event: string, data: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  const send = useCallback((data: any) => {
    if (data?.type) {
      socketRef.current?.emit(data.type, data);
    }
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    setIsConnected(false);
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    sendMessage,
    disconnect,
    data: lastData,
    send,
  };
};
