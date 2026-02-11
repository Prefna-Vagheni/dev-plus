// hooks/use-websocket.ts - Client-side WebSocket hook
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketOptions {
  userId: string;
  autoConnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

interface WebSocketStatus {
  connected: boolean;
  authenticated: boolean;
  reconnecting: boolean;
  error: string | null;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const {
    userId,
    autoConnect = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<WebSocketStatus>({
    connected: false,
    authenticated: false,
    reconnecting: false,
    error: null,
  });

  // Event listeners registry
  const eventListeners = useRef<Map<string, Set<Function>>>(new Map());

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    console.log('[WebSocket] Connecting...');

    const socket = io(
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      {
        transports: ['websocket', 'polling'],
        reconnectionAttempts,
        reconnectionDelay,
        autoConnect: false,
      },
    );

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('[WebSocket] Connected:', socket.id);
      setStatus((prev) => ({ ...prev, connected: true, error: null }));

      // Authenticate
      socket.emit('authenticate', { userId });
    });

    socket.on('authenticated', (data) => {
      console.log('[WebSocket] Authenticated:', data.userId);
      setStatus((prev) => ({ ...prev, authenticated: true }));
    });

    socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      setStatus({
        connected: false,
        authenticated: false,
        reconnecting: reason !== 'io client disconnect',
        error: null,
      });
    });

    socket.on('reconnecting', (attemptNumber) => {
      console.log(`[WebSocket] Reconnecting... (attempt ${attemptNumber})`);
      setStatus((prev) => ({ ...prev, reconnecting: true }));
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`[WebSocket] Reconnected after ${attemptNumber} attempts`);
      setStatus((prev) => ({ ...prev, reconnecting: false }));
    });

    socket.on('reconnect_error', (error) => {
      console.error('[WebSocket] Reconnection error:', error);
    });

    socket.on('reconnect_failed', () => {
      console.error('[WebSocket] Reconnection failed');
      setStatus((prev) => ({
        ...prev,
        reconnecting: false,
        error: 'Connection failed after multiple attempts',
      }));
    });

    socket.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
      setStatus((prev) => ({
        ...prev,
        error: error.message || 'Unknown error',
      }));
    });

    socket.on('pong', (data) => {
      // Heartbeat response
    });

    // Connect
    socket.connect();
  }, [userId, reconnectionAttempts, reconnectionDelay]);

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('[WebSocket] Disconnecting...');
      socketRef.current.disconnect();
      socketRef.current = null;
      setStatus({
        connected: false,
        authenticated: false,
        reconnecting: false,
        error: null,
      });
    }
  }, []);

  /**
   * Subscribe to event
   */
  const on = useCallback((event: string, handler: Function) => {
    if (!socketRef.current) {
      console.warn('[WebSocket] Cannot subscribe - not connected');
      return;
    }

    // Add to registry
    if (!eventListeners.current.has(event)) {
      eventListeners.current.set(event, new Set());
    }
    eventListeners.current.get(event)!.add(handler);

    // Subscribe on socket
    socketRef.current.on(event, handler as any);

    console.log(`[WebSocket] Subscribed to event: ${event}`);
  }, []);

  /**
   * Unsubscribe from event
   */
  const off = useCallback((event: string, handler?: Function) => {
    if (!socketRef.current) return;

    if (handler) {
      socketRef.current.off(event, handler as any);
      eventListeners.current.get(event)?.delete(handler);
    } else {
      socketRef.current.off(event);
      eventListeners.current.delete(event);
    }

    console.log(`[WebSocket] Unsubscribed from event: ${event}`);
  }, []);

  /**
   * Emit event to server
   */
  const emit = useCallback((event: string, data?: any) => {
    if (!socketRef.current?.connected) {
      console.warn('[WebSocket] Cannot emit - not connected');
      return;
    }

    socketRef.current.emit(event, data);
  }, []);

  /**
   * Subscribe to room
   */
  const subscribeToRoom = useCallback(
    (rooms: string | string[]) => {
      const roomArray = Array.isArray(rooms) ? rooms : [rooms];
      emit('subscribe', roomArray);
    },
    [emit],
  );

  /**
   * Unsubscribe from room
   */
  const unsubscribeFromRoom = useCallback(
    (rooms: string | string[]) => {
      const roomArray = Array.isArray(rooms) ? rooms : [rooms];
      emit('unsubscribe', roomArray);
    },
    [emit],
  );

  /**
   * Send heartbeat
   */
  const ping = useCallback(() => {
    emit('ping');
  }, [emit]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && userId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, userId, connect, disconnect]);

  // Heartbeat interval
  useEffect(() => {
    if (!status.connected) return;

    const interval = setInterval(() => {
      ping();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [status.connected, ping]);

  return {
    status,
    connect,
    disconnect,
    on,
    off,
    emit,
    subscribeToRoom,
    unsubscribeFromRoom,
    socket: socketRef.current,
  };
}

/**
 * Hook for listening to specific events
 */
export function useWebSocketEvent<T = any>(
  event: string,
  handler: (data: T) => void,
  deps: any[] = [],
) {
  const { on, off, status } = useWebSocket({ userId: '', autoConnect: false });

  useEffect(() => {
    if (!status.connected) return;

    on(event, handler);

    return () => {
      off(event, handler);
    };
  }, [status.connected, event, ...deps]);
}
