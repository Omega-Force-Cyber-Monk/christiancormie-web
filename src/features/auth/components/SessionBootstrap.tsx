import { useEffect, type ReactNode } from "react";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { STORAGE_KEYS } from "@/constants/storage";
import { selectAuthInitialization } from "@/features/auth/store/auth.selectors";
import { clearSession, sessionRestored } from "@/features/auth/store/auth.slice";
import { initializeSession } from "@/features/auth/store/auth.thunks";
import { sessionStorageService } from "@/features/auth/utils/sessionStorage";

export function SessionBootstrap({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const { isHydrated, sessionId } = useAppSelector(selectAuthInitialization);

  useEffect(() => {
    void dispatch(initializeSession());
  }, [dispatch, isHydrated, sessionId]);

  useEffect(() => {
    const synchronize = (event: StorageEvent) => {
      if (
        event.storageArea !== window.localStorage ||
        (event.key !== STORAGE_KEYS.AUTH_SESSION && event.key !== null)
      )
        return;
      const session = sessionStorageService.readSession();
      if (session) dispatch(sessionRestored(session));
      else dispatch(clearSession("storage"));
    };
    window.addEventListener("storage", synchronize);
    return () => window.removeEventListener("storage", synchronize);
  }, [dispatch]);

  return children;
}
