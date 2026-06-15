import { io, type Socket } from 'socket.io-client';
import { getToken } from '../api/client';

let socket: Socket | null = null;

/** Lazily create the authenticated realtime connection. */
export function getSocket(): Socket {
  if (!socket) {
    socket = io('/', {
      auth: { token: getToken() },
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function refreshSocketAuth(): void {
  if (socket) {
    socket.auth = { token: getToken() };
    socket.disconnect().connect();
  }
}

export function closeSocket(): void {
  socket?.disconnect();
  socket = null;
}
