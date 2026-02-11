// lib/websocket/server.ts - Socket.io Server Setup
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { redis } from '@/lib/redis';

// Global socket server instance
let io: SocketIOServer | null = null;

// Connected clients tracking
const connectedClients = new Map<string, Set<string>>(); // userId -> Set of socketIds

/**
 * Initialize Socket.io server
 */
export function initializeSocketServer(httpServer: HTTPServer) {
  if (io) {
    console.log('[WebSocket] Server already initialized');
    return io;
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  console.log('[WebSocket] Server initialized');

  // Connection handler
  io.on('connection', handleConnection);

  // Redis pub/sub for multi-server support
  setupRedisPubSub();

  return io;
}

/**
 * Handle new socket connection
 */
function handleConnection(socket: Socket) {
  console.log(`[WebSocket] Client connected: ${socket.id}`);

  // Authentication
  socket.on(
    'authenticate',
    async (data: { userId: string; token?: string }) => {
      try {
        // TODO: Verify token if needed
        const userId = data.userId;

        if (!userId) {
          socket.emit('error', { message: 'Authentication failed' });
          return;
        }

        // Store user connection
        socket.data.userId = userId;

        if (!connectedClients.has(userId)) {
          connectedClients.set(userId, new Set());
        }
        connectedClients.get(userId)!.add(socket.id);

        // Join user's personal room
        socket.join(`user:${userId}`);

        // Emit authentication success
        socket.emit('authenticated', { userId });

        console.log(
          `[WebSocket] User ${userId} authenticated (socket: ${socket.id})`,
        );
      } catch (error) {
        console.error('[WebSocket] Authentication error:', error);
        socket.emit('error', { message: 'Authentication failed' });
      }
    },
  );

  // Subscribe to specific rooms
  socket.on('subscribe', (rooms: string[]) => {
    rooms.forEach((room) => {
      socket.join(room);
      console.log(`[WebSocket] Socket ${socket.id} subscribed to ${room}`);
    });
    socket.emit('subscribed', { rooms });
  });

  // Unsubscribe from rooms
  socket.on('unsubscribe', (rooms: string[]) => {
    rooms.forEach((room) => {
      socket.leave(room);
      console.log(`[WebSocket] Socket ${socket.id} unsubscribed from ${room}`);
    });
    socket.emit('unsubscribed', { rooms });
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`[WebSocket] Client disconnected: ${socket.id} (${reason})`);

    // Remove from connected clients
    const userId = socket.data.userId;
    if (userId && connectedClients.has(userId)) {
      connectedClients.get(userId)!.delete(socket.id);
      if (connectedClients.get(userId)!.size === 0) {
        connectedClients.delete(userId);
      }
    }
  });

  // Heartbeat/ping
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });
}

/**
 * Setup Redis pub/sub for multi-server communication
 */
function setupRedisPubSub() {
  // Subscribe to broadcast channel
  const subscriber = redis.duplicate();

  subscriber.subscribe('websocket:broadcast', (err) => {
    if (err) {
      console.error('[WebSocket] Redis subscription error:', err);
      return;
    }
    console.log('[WebSocket] Subscribed to Redis broadcast channel');
  });

  subscriber.on('message', (channel, message) => {
    try {
      const data = JSON.parse(message);

      if (!io) return;

      // Broadcast to appropriate room/user
      if (data.room) {
        io.to(data.room).emit(data.event, data.payload);
      } else if (data.userId) {
        io.to(`user:${data.userId}`).emit(data.event, data.payload);
      } else {
        // Broadcast to all
        io.emit(data.event, data.payload);
      }
    } catch (error) {
      console.error('[WebSocket] Error processing Redis message:', error);
    }
  });
}

/**
 * Get Socket.io server instance
 */
export function getSocketServer(): SocketIOServer | null {
  return io;
}

/**
 * Emit event to specific user
 */
export function emitToUser(userId: string, event: string, data: any) {
  if (!io) {
    console.warn('[WebSocket] Server not initialized');
    return;
  }

  io.to(`user:${userId}`).emit(event, data);

  // Also publish to Redis for multi-server support
  redis.publish(
    'websocket:broadcast',
    JSON.stringify({
      userId,
      event,
      payload: data,
    }),
  );
}

/**
 * Emit event to specific room
 */
export function emitToRoom(room: string, event: string, data: any) {
  if (!io) {
    console.warn('[WebSocket] Server not initialized');
    return;
  }

  io.to(room).emit(event, data);

  // Also publish to Redis
  redis.publish(
    'websocket:broadcast',
    JSON.stringify({
      room,
      event,
      payload: data,
    }),
  );
}

/**
 * Broadcast event to all connected clients
 */
export function broadcastEvent(event: string, data: any) {
  if (!io) {
    console.warn('[WebSocket] Server not initialized');
    return;
  }

  io.emit(event, data);

  // Publish to Redis
  redis.publish(
    'websocket:broadcast',
    JSON.stringify({
      event,
      payload: data,
    }),
  );
}

/**
 * Get connected clients count
 */
export function getConnectedClientsCount(): number {
  return connectedClients.size;
}

/**
 * Check if user is connected
 */
export function isUserConnected(userId: string): boolean {
  return connectedClients.has(userId) && connectedClients.get(userId)!.size > 0;
}

/**
 * Get user's socket IDs
 */
export function getUserSocketIds(userId: string): string[] {
  return Array.from(connectedClients.get(userId) || []);
}
