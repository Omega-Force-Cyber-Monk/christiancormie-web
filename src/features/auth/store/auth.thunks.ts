import type { ThunkAction, UnknownAction } from "@reduxjs/toolkit";

import type { RootState } from "@/app/rootReducer";
import { authApi } from "@/features/auth/api/auth.api";
import { authenticatedUserSchema } from "@/features/auth/schemas/session.schema";
import {
  initializationFailed,
  initializationStarted,
  sessionUpdated,
} from "@/features/auth/store/auth.slice";
import { logger } from "@/lib/logger/logger";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";

export const initializeSession =
  (): ThunkAction<Promise<void>, RootState, unknown, UnknownAction> =>
  async (dispatch, getState) => {
    const initial = getState().auth;
    if (initial.isHydrated || initial.isInitializing) return;

    dispatch(initializationStarted());
    logger.debug("Authentication initialization started.", {
      tokenPresent: Boolean(initial.accessToken),
    });
    const request = dispatch(
      authApi.endpoints.getCurrentUser.initiate(undefined, { forceRefetch: true }),
    );
    try {
      const user = authenticatedUserSchema.parse(await request.unwrap());
      const current = getState().auth;
      if (
        current.sessionId !== initial.sessionId ||
        !current.accessToken ||
        !current.refreshToken
      )
        return;
      dispatch(
        sessionUpdated({
          accessToken: current.accessToken,
          refreshToken: current.refreshToken,
          expiresAt: current.expiresAt,
          user,
        }),
      );
    } catch (error) {
      if (getState().auth.sessionId !== initial.sessionId) return;
      dispatch(initializationFailed(normalizeApiError(error)));
      logger.debug("Authentication initialization failed; credentials retained.");
    } finally {
      request.unsubscribe();
    }
  };
