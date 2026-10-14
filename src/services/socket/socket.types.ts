export type SocketEventHandler<TPayload = unknown> = (payload: TPayload) => void;

export type SocketStatus = "idle" | "connecting" | "connected" | "disconnected";
