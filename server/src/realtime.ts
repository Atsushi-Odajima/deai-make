import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { config } from './config.js';
import { verifyToken } from './auth.js';
import { touchActivity } from './db.js';

let io: Server | null = null;

/** Initialise Socket.IO on top of the HTTP server. */
export function initRealtime(server: HttpServer): Server {
  io = new Server(server, {
    cors: { origin: config.corsOrigins, credentials: true },
  });

  // Authenticate the socket with the same JWT used for REST.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    const userId = token ? verifyToken(token) : null;
    if (!userId) return next(new Error('unauthorized'));
    socket.data.userId = userId;
    next();
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;
    // Each user joins a private room so we can push events by user id.
    socket.join(`user:${userId}`);
    touchActivity(userId);

    socket.on('typing', (payload: { matchId: string; to: string }) => {
      if (payload?.to) {
        io?.to(`user:${payload.to}`).emit('typing', { matchId: payload.matchId, from: userId });
      }
    });

    socket.on('disconnect', () => touchActivity(userId));
  });

  return io;
}

/** Push a realtime event to a specific user (all their connected devices). */
export function emitToUser(userId: string, event: string, payload: unknown): void {
  io?.to(`user:${userId}`).emit(event, payload);
}
