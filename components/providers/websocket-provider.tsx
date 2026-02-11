// components/providers/websocket-provider.tsx - WebSocket Context Provider
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';

interface WebSocketContextValue {
  connected: boolean;
  authenticated: boolean;
  emit: (event: string, data?: any) => void;
  on: (event: string, handler: Function) => void;
  off: (event: string, handler?: Function) => void;
  subscribeToRoom: (rooms: string | string[]) => void;
  unsubscribeFromRoom: (rooms: string | string[]) => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

interface WebSocketProviderProps {
  children: React.ReactNode;
  userId: string;
}

export function WebSocketProvider({
  children,
  userId,
}: WebSocketProviderProps) {
  const { toast } = useToast();
  const [showConnectionToast, setShowConnectionToast] = useState(true);

  const {
    status,
    connect,
    disconnect,
    on,
    off,
    emit,
    subscribeToRoom,
    unsubscribeFromRoom,
  } = useWebSocket({
    userId,
    autoConnect: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  // Show connection status notifications
  useEffect(() => {
    if (status.connected && status.authenticated && showConnectionToast) {
      toast({
        title: 'Connected',
        description: 'Real-time updates enabled',
        duration: 3000,
      });
      setShowConnectionToast(false);
    }

    if (status.error) {
      toast({
        title: 'Connection Error',
        description: status.error,
        variant: 'destructive',
      });
    }

    if (status.reconnecting) {
      toast({
        title: 'Reconnecting',
        description: 'Attempting to restore connection...',
      });
    }
  }, [status, toast, showConnectionToast]);

  const value: WebSocketContextValue = {
    connected: status.connected,
    authenticated: status.authenticated,
    emit,
    on,
    off,
    subscribeToRoom,
    unsubscribeFromRoom,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

/**
 * Hook to use WebSocket context
 */
export function useWebSocketContext() {
  const context = useContext(WebSocketContext);

  if (!context) {
    throw new Error(
      'useWebSocketContext must be used within WebSocketProvider',
    );
  }

  return context;
}
