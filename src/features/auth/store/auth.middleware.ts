import type { Middleware } from "@reduxjs/toolkit";

import type { RootState } from "@/app/rootReducer";
import type { AppDispatch } from "@/app/store";
import { authApi } from "@/features/auth/api/auth.api";
import {
  clearSession,
  activeRoleSelected,
  identityVerified,
  sessionRestored,
  sessionStarted,
  sessionUpdated,
} from "@/features/auth/store/auth.slice";
import { sessionStorageService } from "@/features/auth/utils/sessionStorage";
import { logger } from "@/lib/logger/logger";
import { baseApi } from "@/services/api/baseApi";
import { socketService } from "@/services/socket/socket";

export const authSessionMiddleware: Middleware<Record<string, never>, RootState> =
  (api) => (next) => (action) => {
    const previousAuth = api.getState().auth;
    const previousSession = previousAuth.sessionId;
    const result: unknown = next(action);
    const auth = api.getState().auth;

    if (clearSession.match(action)) {
      sessionStorageService.clear();
      socketService.disconnect();
      api.dispatch(baseApi.util.resetApiState());
      logger.debug("Authentication session cleared.", { reason: action.payload });
      if (
        action.payload === "manual" &&
        previousAuth.accessToken &&
        previousAuth.refreshToken
      ) {
        // Clear locally first. Only captured credentials may be used for revocation.
        // Repeated clears see no tokens, so they cannot send duplicate requests.
        const dispatch = api.dispatch as AppDispatch;
        const request = dispatch(
          authApi.endpoints.logout.initiate(
            {
              accessToken: previousAuth.accessToken,
              refreshToken: previousAuth.refreshToken,
            },
            { track: false },
          ),
        );
        void request
          .unwrap()
          .catch(() => {
            // Best-effort remote revocation must never block local logout or reveal errors.
            logger.debug(
              "Backend logout could not be confirmed; local logout completed.",
            );
          })
          .finally(() => request.reset());
      }
    } else if (
      identityVerified.match(action) ||
      activeRoleSelected.match(action) ||
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
      if (
        previousSession !== auth.sessionId ||
        (previousAuth.user &&
          (previousAuth.user.id !== auth.user?.id ||
            previousAuth.user.role !== auth.user?.role))
      ) {
        socketService.disconnect();
        api.dispatch(baseApi.util.resetApiState());
      }
      logger.debug("Authentication session updated.", {
        hydrated: auth.isHydrated,
        tokenPresent: Boolean(auth.accessToken),
      });
    }

    return result;
  };
