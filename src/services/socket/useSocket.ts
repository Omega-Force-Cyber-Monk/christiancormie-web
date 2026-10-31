import { useEffect, useSyncExternalStore } from "react";
import { z } from "zod";
import { useAppSelector } from "@/app/hooks";
import {
  selectCurrentRole,
  selectIsAuthenticated,
} from "@/features/auth/store/auth.selectors";
import { idleSocketSnapshot, socketService } from "./socket";
export function useSocket() {
  const verified = useAppSelector(selectIsAuthenticated);
  const role = useAppSelector(selectCurrentRole);
  const auth = useAppSelector((s) => s.auth);
  const enabled =
    verified &&
    (role === "CUSTOMER" || role === "VENDOR") &&
    z.uuid().safeParse(auth.user?.id).success;
  const owner =
    enabled && auth.sessionId && auth.user
      ? `${auth.sessionId}:${auth.user.id}:${role}`
      : "";
  const accessToken = auth.accessToken;
  const snapshot = useSyncExternalStore(
    socketService.subscribeState,
    socketService.getSnapshot,
    () => idleSocketSnapshot,
  );
  useEffect(() => {
    if (!owner || !accessToken) return;
    return socketService.acquire(accessToken, owner);
  }, [owner, accessToken]);
  const current = snapshot.owner === owner ? snapshot : idleSocketSnapshot;
  return {
    ...current,
    token: accessToken,
    retry: () => {
      if (owner && accessToken) socketService.retry(accessToken, owner);
    },
  };
}
