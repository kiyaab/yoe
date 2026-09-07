import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL 
      || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000');
    socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socket;
};
