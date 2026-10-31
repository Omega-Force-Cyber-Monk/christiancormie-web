import { useEffect, useRef, useState } from "react";
import { useStore } from "react-redux";
import type { RootState, AppDispatch } from "@/app/store";
import { useSocket } from "@/services/socket/useSocket";
import { socketService } from "@/services/socket/socket";
import { startMessagingRealtime, type RoomStatus } from "../realtime/messagingRealtime";
import type { MessagingScope } from "../types/messaging.types";
export function useMessagingRealtime(
  scope: MessagingScope,
  viewer: string,
  selectedId: string,
) {
  const connection = useSocket();
  const store = useStore<RootState>();
  const controller = useRef<ReturnType<typeof startMessagingRealtime> | null>(null);
  const [room, setRoom] = useState<RoomStatus>("idle");
  const { socket, token } = connection;
  useEffect(() => {
    if (!socket || !token) return;
    const instance = startMessagingRealtime({
      store: {
        getState: () => store.getState(),
        dispatch: store.dispatch as AppDispatch,
        subscribe: (listener) => store.subscribe(listener),
      },
      socket,
      scope: { sessionId: scope.sessionId, role: scope.role },
      viewer,
      token,
      isSocketCurrent: () => socketService.getSocket() === socket,
      onRoom: setRoom,
    });
    controller.current = instance;
    return () => {
      instance.stop();
      if (controller.current === instance) controller.current = null;
    };
  }, [socket, token, store, scope.sessionId, scope.role, viewer]);
  useEffect(() => {
    controller.current?.select(selectedId);
  }, [selectedId, socket, token]);
  useEffect(() => {
    if (connection.status === "expired") controller.current?.refreshAuthentication();
  }, [connection.status, socket]);
  return {
    status: connection.status,
    room,
    retry: () => {
      connection.retry();
      controller.current?.retry();
    },
  };
}
