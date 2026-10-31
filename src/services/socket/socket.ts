import { io, type Socket } from "socket.io-client";
import { env } from "@/config/env";
import type { SocketEventHandler, SocketStatus } from "./socket.types";
// Advisory JWT NumericDate only, never identity verification or permission.
export function socketTokenDeadline(token: string): number | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const value: unknown = JSON.parse(
      atob(
        part
          .replace(/-/g, "+")
          .replace(/_/g, "/")
          .padEnd(Math.ceil(part.length / 4) * 4, "="),
      ),
    );
    if (
      typeof value !== "object" ||
      value === null ||
      !("exp" in value) ||
      typeof value.exp !== "number" ||
      !Number.isSafeInteger(value.exp) ||
      value.exp <= 0 ||
      !Number.isSafeInteger(value.exp * 1000)
    )
      return null;
    return value.exp * 1000;
  } catch {
    return null;
  }
}

type Snapshot = { socket: Socket | null; owner: string | null; status: SocketStatus };
export const idleSocketSnapshot: Snapshot = {
  socket: null,
  owner: null,
  status: "idle",
};
export function messagingSocketUrl(base: string): string | null {
  try {
    const url = new URL(base);
    if (!["http:", "https:", "ws:", "wss:"].includes(url.protocol)) return null;
    url.pathname = "/messaging";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}
export function createSocketService(factory: typeof io, baseUrl: string) {
  let snapshot = idleSocketSnapshot;
  let token: string | null = null;
  const subscribers = new Set<() => void>();
  const references = new Map<Socket, number>();
  let removeManagerListeners = () => {};
  let expiryTimer: ReturnType<typeof setTimeout> | undefined;
  function publish(next: Snapshot) {
    if (
      snapshot.socket === next.socket &&
      snapshot.owner === next.owner &&
      snapshot.status === next.status
    )
      return;
    snapshot = next;
    subscribers.forEach((f) => f());
  }
  function disconnect() {
    if (expiryTimer) clearTimeout(expiryTimer);
    expiryTimer = undefined;
    const captured = snapshot.socket;
    removeManagerListeners();
    removeManagerListeners = () => {};
    if (captured) {
      references.delete(captured);
      captured.removeAllListeners();
      captured.disconnect();
    }
    token = null;
    publish(idleSocketSnapshot);
  }
  function connect(accessToken: string, owner: string): Socket | null {
    if (!accessToken || !owner) {
      disconnect();
      return null;
    }
    // A connecting/reconnecting socket is still the single owned connection.
    if (snapshot.socket && snapshot.owner === owner && token === accessToken)
      return snapshot.socket;
    disconnect();
    const url = messagingSocketUrl(baseUrl);
    if (!url) {
      publish({ socket: null, owner, status: "unavailable" });
      return null;
    }
    const captured = factory(url, {
      autoConnect: false,
      forceNew: true,
      transports: ["websocket"],
      auth: { token: accessToken },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
    });
    token = accessToken;
    const status = (value: SocketStatus) => {
      if (snapshot.socket === captured)
        publish({ socket: captured, owner, status: value });
    };
    publish({ socket: captured, owner, status: "connecting" });
    captured.on("connect", () => status("connected"));
    captured.on("disconnect", () => {
      if (!["error", "expired"].includes(snapshot.status)) status("disconnected");
    });
    captured.on("connect_error", () =>
      status(captured.active ? "reconnecting" : "error"),
    );
    captured.on("error", () => {
      status("error");
      captured.disconnect();
    });
    const reconnecting = () => status("reconnecting");
    const failed = () => status("error");
    captured.io.on("reconnect_attempt", reconnecting);
    captured.io.on("reconnect_failed", failed);
    removeManagerListeners = () => {
      captured.io.off("reconnect_attempt", reconnecting);
      captured.io.off("reconnect_failed", failed);
    };
    const deadline = socketTokenDeadline(accessToken);
    function checkExpiry() {
      if (snapshot.socket !== captured || deadline === null) return;
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        status("expired");
        captured.disconnect();
      } else expiryTimer = setTimeout(checkExpiry, Math.min(remaining, 2147483647));
    }
    if (deadline !== null && deadline <= Date.now()) status("expired");
    else {
      captured.connect();
      checkExpiry();
    }
    return captured;
  }
  return {
    connect,
    disconnect,
    acquire(accessToken: string, owner: string): () => void {
      const captured = connect(accessToken, owner);
      if (!captured)
        return () => {
          if (snapshot.owner === owner && !snapshot.socket) publish(idleSocketSnapshot);
        };
      references.set(captured, (references.get(captured) ?? 0) + 1);
      let released = false;
      return () => {
        if (released) return;
        released = true;
        const left = (references.get(captured) ?? 1) - 1;
        if (left > 0) references.set(captured, left);
        else {
          references.delete(captured);
          if (snapshot.socket === captured) disconnect();
        }
      };
    },
    retry(accessToken: string, owner: string) {
      if (
        snapshot.status !== "expired" &&
        snapshot.owner === owner &&
        token === accessToken &&
        snapshot.socket &&
        !snapshot.socket.connected
      ) {
        publish({ ...snapshot, status: "connecting" });
        snapshot.socket.connect();
      }
    },
    subscribe<T>(eventName: string, handler: SocketEventHandler<T>): () => void {
      const captured = snapshot.socket;
      if (!captured) return () => {};
      const wrapped = (payload: T) => handler(payload);
      captured.on(eventName, wrapped);
      return () => {
        captured.off(eventName, wrapped);
      };
    },
    subscribeState: (handler: () => void) => {
      subscribers.add(handler);
      return () => {
        subscribers.delete(handler);
      };
    },
    getSnapshot: () => snapshot,
    getSocket: () => snapshot.socket,
  };
}
export const socketService = createSocketService(io, env.socketUrl);
