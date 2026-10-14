import type { ThunkAction, UnknownAction } from "@reduxjs/toolkit";

import type { RootState } from "@/app/rootReducer";
import { authApi } from "@/features/auth/api/auth.api";
import { currentUserResponseSchema } from "@/features/auth/schemas/current-user.schema";
import { toAuthenticatedUser } from "@/features/auth/utils/authAdapters";
import {
  initializationFailed,
  initializationStarted,
  identityVerified,
  clearSession,
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
      const parsed = currentUserResponseSchema.safeParse(await request.unwrap());
      if (!parsed.success)
        throw new Error("Unable to verify your account. Please try again.");
      const current = getState().auth;
      if (
        current.sessionId !== initial.sessionId ||
        !current.accessToken ||
        !current.refreshToken
      )
        return;
      dispatch(identityVerified(toAuthenticatedUser(parsed.data)));
    } catch (error) {
      if (getState().auth.sessionId !== initial.sessionId) return;
      const appError = normalizeApiError(error);
      if (appError.kind === "AUTHENTICATION") {
        dispatch(clearSession("invalid-session"));
        return;
      }
      dispatch(initializationFailed(appError));
      logger.debug("Authentication initialization failed; credentials retained.");
    } finally {
      request.unsubscribe();
    }
  };
