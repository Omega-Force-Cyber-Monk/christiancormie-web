import { io, type Socket } from "socket.io-client";

import { env } from "@/config/env";
import type { SocketEventHandler } from "@/services/socket/socket.types";

let socket: Socket | null = null;

export const socketService = {
  connect(accessToken?: string | null): Socket | null {
    if (!env.socketUrl) return null;
    if (socket?.connected) return socket;

    socket = io(env.socketUrl, {
      autoConnect: false,
      transports: ["websocket"],
      auth: accessToken ? { token: accessToken } : undefined,
    });

    socket.connect();
    return socket;
  },
  disconnect(): void {
    socket?.removeAllListeners();
    socket?.disconnect();
    socket = null;
  },
  subscribe<TPayload>(
    eventName: string,
    handler: SocketEventHandler<TPayload>,
  ): () => void {
    if (!socket) return () => undefined;

    const wrappedHandler = (payload: TPayload) => handler(payload);
    socket.on(eventName, wrappedHandler);

    return () => {
      socket?.off(eventName, wrappedHandler);
    };
  },
  getSocket(): Socket | null {
    return socket;
  },
};
