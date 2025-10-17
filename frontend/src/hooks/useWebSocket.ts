import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (event: string, data: any) => void;
  disconnect: () => void;
}

export const useWebSocket = (endpoint: string): UseWebSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // For now, just return a mock implementation
    // In a real app, this would connect to the actual WebSocket server
    const mockSocket = {
      on: (event: string, callback: (data: any) => void) => {
        console.log(`Mock WebSocket: Listening for ${event}`);
      },
      off: (event: string, callback: (data: any) => void) => {
        console.log(`Mock WebSocket: Stopped listening for ${event}`);
      },
      emit: (event: string, data: any) => {
        console.log(`Mock WebSocket: Emitting ${event}`, data);
      },
      disconnect: () => {
        console.log('Mock WebSocket: Disconnected');
      }
    } as any;

    setSocket(mockSocket);
    setIsConnected(true);
    socketRef.current = mockSocket;

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [endpoint]);

  const sendMessage = (event: string, data: any) => {
    if (socket) {
      socket.emit(event, data);
    }
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  };

  return {
    socket,
    isConnected,
    sendMessage,
    disconnect
  };
};




