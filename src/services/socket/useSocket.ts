import { useEffect, useState } from "react";

import { useAppSelector } from "@/app/hooks";
import { selectAccessToken } from "@/features/auth/store/auth.selectors";
import { socketService } from "@/services/socket/socket";
import type { SocketStatus } from "@/services/socket/socket.types";

export const useSocket = () => {
  const accessToken = useAppSelector(selectAccessToken);
  const [status, setStatus] = useState<SocketStatus>("idle");

  useEffect(() => {
    const socket = socketService.connect(accessToken);

    if (!socket) return undefined;

    const handleConnect = () => setStatus("connected");
    const handleDisconnect = () => setStatus("disconnected");

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [accessToken]);

  return { status, socket: socketService.getSocket() };
};
