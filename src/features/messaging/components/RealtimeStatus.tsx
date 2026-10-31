import { Button } from "@/components/ui/Button";
import type { SocketStatus } from "@/services/socket/socket.types";
import type { RoomStatus } from "../realtime/messagingRealtime";
export function RealtimeStatus({
  realtime,
}: {
  realtime: { status: SocketStatus; room: RoomStatus; retry: () => void };
}) {
  const labels: Record<SocketStatus, string> = {
    idle: "Realtime inactive; HTTP messaging remains available.",
    unavailable: "Realtime is not configured; use HTTP refresh for updates.",
    connecting: "Connecting realtime updates… HTTP messaging remains available.",
    reconnecting: "Reconnecting realtime updates… HTTP messaging remains available.",
    disconnected: "Realtime disconnected; HTTP messaging remains available.",
    error: "Realtime unavailable; HTTP messaging remains available.",
    expired: "Realtime token expired; revalidating through HTTP.",
    connected:
      realtime.room === "joined"
        ? "Realtime updates active for this conversation."
        : realtime.room === "error"
          ? "Conversation room unavailable; HTTP messaging remains available."
          : realtime.room === "checking" || realtime.room === "joining"
            ? "Verifying the selected conversation for realtime updates…"
            : "Realtime connected. Select a conversation for updates.",
  };
  return (
    <div className="space-y-1 text-xs">
      <p role="status">{labels[realtime.status]}</p>
      <p>
        Other conversations update on HTTP refresh, focus or reconnect. Presence and
        per-message receipts are unavailable.
      </p>
      {!["idle", "unavailable"].includes(realtime.status) && (
        <Button onClick={realtime.retry}>Retry realtime / revalidate room</Button>
      )}
    </div>
  );
}
