import type { Middleware } from "@reduxjs/toolkit";

import type { RootState } from "@/app/rootReducer";
import {
  clearSession,
  sessionRestored,
  sessionStarted,
  sessionUpdated,
  setMockRole,
} from "@/features/auth/store/auth.slice";
import { persistMockRole } from "@/features/auth/utils/mockAuth";
import { sessionStorageService } from "@/features/auth/utils/sessionStorage";
import { logger } from "@/lib/logger/logger";
import { baseApi } from "@/services/api/baseApi";
import { socketService } from "@/services/socket/socket";

export const authSessionMiddleware: Middleware<Record<string, never>, RootState> =
  (api) => (next) => (action) => {
    const previousSession = api.getState().auth.sessionId;
    const result: unknown = next(action);
    const auth = api.getState().auth;

    if (clearSession.match(action)) {
      sessionStorageService.clear();
      socketService.disconnect();
      api.dispatch(baseApi.util.resetApiState());
      logger.debug("Authentication session cleared.", { reason: action.payload });
    } else if (
      sessionStarted.match(action) ||
      sessionUpdated.match(action) ||
      sessionRestored.match(action)
    ) {
      if (auth.accessToken && auth.refreshToken && auth.sessionId) {
        sessionStorageService.writeSession({
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          sessionId: auth.sessionId,
          expiresAt: auth.expiresAt,
          user: auth.user,
        });
      }
      if (previousSession !== auth.sessionId) {
        socketService.disconnect();
        api.dispatch(baseApi.util.resetApiState());
      }
      logger.debug("Authentication session updated.", {
        hydrated: auth.isHydrated,
        tokenPresent: Boolean(auth.accessToken),
      });
    } else if (setMockRole.match(action) && !auth.accessToken) {
      if (auth.user?.id === "dev-current-user") persistMockRole(action.payload);
    }

    return result;
  };
