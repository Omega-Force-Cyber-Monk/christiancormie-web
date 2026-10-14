import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

import type { RootState } from "@/app/store";
import { STORAGE_KEYS } from "@/constants/storage";
import { sessionResponseSchema } from "@/features/auth/schemas/session.schema";
import { clearSession, sessionUpdated } from "@/features/auth/store/auth.slice";
import type { AuthState } from "@/features/auth/types/auth.types";
import { sessionStorageService } from "@/features/auth/utils/sessionStorage";
import { logger } from "@/lib/logger/logger";
import { rawBaseQuery, type ApiBaseQuery } from "@/services/api/baseQuery";

type QueryApi = Parameters<ApiBaseQuery>[1];
type RefreshResult = { refreshed: boolean; error?: FetchBaseQueryError };
type RefreshFlight = { sessionId: string | null; promise: Promise<RefreshResult> };
const refreshFlights = new WeakMap<QueryApi["dispatch"], RefreshFlight>();

const getAuth = (api: QueryApi) => (api.getState() as RootState).auth;
const isCurrentSession = (api: QueryApi, snapshot: AuthState) => {
  const current = getAuth(api);
  return (
    current.sessionId === snapshot.sessionId &&
    current.refreshToken === snapshot.refreshToken
  );
};

const refreshSession = async (
  api: QueryApi,
  extraOptions: Parameters<ApiBaseQuery>[2],
  snapshot: AuthState,
  wasPersisted: boolean,
): Promise<RefreshResult> => {
  if (!isCurrentSession(api, snapshot)) return { refreshed: false };

  // Another tab may already have rotated these tokens while we waited for its lock.
  const saved = sessionStorageService.readSession();
  if (wasPersisted && !saved) return { refreshed: false };
  if (saved && saved.sessionId !== snapshot.sessionId) return { refreshed: false };
  if (saved && saved.refreshToken !== snapshot.refreshToken) {
    api.dispatch(sessionUpdated(saved));
    return { refreshed: true };
  }

  logger.debug("Session refresh started.", {
    tokenPresent: Boolean(snapshot.accessToken),
  });
  const result = await rawBaseQuery(
    {
      url: "/auth/refresh",
      method: "POST",
      body: { refreshToken: snapshot.refreshToken },
    },
    api,
    extraOptions,
  );

  // A logout, new login, or storage event makes this response obsolete.
  if (!isCurrentSession(api, snapshot)) return { refreshed: false };
  if (saved && sessionStorageService.readSession()?.sessionId !== snapshot.sessionId) {
    return { refreshed: false };
  }

  if (result.error) {
    // Only a refresh endpoint's explicit 401 establishes an invalid session.
    if (result.error.status === 401) api.dispatch(clearSession("invalid-session"));
    logger.debug("Session refresh failed.", {
      status: result.error.status,
      cleared: result.error.status === 401,
    });
    return { refreshed: false, error: result.error };
  }

  const session = sessionResponseSchema.safeParse(result.data);
  if (!session.success) {
    logger.debug("Session refresh returned an invalid response; credentials retained.");
    return {
      refreshed: false,
      error: { status: "CUSTOM_ERROR", error: "Invalid session refresh response." },
    };
  }
  api.dispatch(sessionUpdated(session.data));
  logger.debug("Session refresh succeeded.", { tokenPresent: true });
  return { refreshed: true };
};

const getRefreshPromise = (
  api: QueryApi,
  extraOptions: Parameters<ApiBaseQuery>[2],
) => {
  const snapshot = getAuth(api);
  const existing = refreshFlights.get(api.dispatch);
  if (existing?.sessionId === snapshot.sessionId) return existing.promise;

  const wasPersisted =
    sessionStorageService.readSession()?.sessionId === snapshot.sessionId;
  const refresh = () => refreshSession(api, extraOptions, snapshot, wasPersisted);
  const promise = (
    typeof navigator !== "undefined" && navigator.locks
      ? navigator.locks.request(STORAGE_KEYS.AUTH_SESSION, refresh)
      : refresh()
  )
    .catch((): RefreshResult => ({
      refreshed: false,
      error: { status: "CUSTOM_ERROR", error: "Unable to refresh session." },
    }))
    .finally(() => {
      if (refreshFlights.get(api.dispatch)?.promise === promise)
        refreshFlights.delete(api.dispatch);
    });
  refreshFlights.set(api.dispatch, { sessionId: snapshot.sessionId, promise });
  return promise;
};

export const authBaseQuery: ApiBaseQuery = async (args, api, extraOptions) => {
  const requestUrl = (typeof args === "string" ? args : args.url)
    .replace(/^\/+/, "")
    .split("?")[0];
  const isPublicAuth = ["auth/login", "auth/create-user", "auth/refresh"].includes(
    requestUrl,
  );
  if (isPublicAuth) return rawBaseQuery(args, api, extraOptions);

  const pending = refreshFlights.get(api.dispatch);
  const beforeWait = getAuth(api);
  if (pending?.sessionId === beforeWait.sessionId) {
    await pending.promise;
    if (getAuth(api).sessionId !== beforeWait.sessionId) {
      return {
        error: { status: "CUSTOM_ERROR", error: "The authentication session changed." },
      };
    }
  }

  const snapshot = getAuth(api);
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status !== 401 || getAuth(api).sessionId !== snapshot.sessionId)
    return result;

  // Late 401s from the old token retry with the token already refreshed by another request.
  if (getAuth(api).accessToken !== snapshot.accessToken)
    return rawBaseQuery(args, api, extraOptions);
  if (!snapshot.refreshToken) {
    if (snapshot.accessToken) api.dispatch(clearSession("invalid-session"));
    return result;
  }

  const refreshed = await getRefreshPromise(api, extraOptions);
  if (getAuth(api).sessionId !== snapshot.sessionId) return result;
  if (!refreshed.refreshed)
    return refreshed.error ? { error: refreshed.error } : result;

  // Exactly one retry: a second 401 never recursively starts another refresh.
  return rawBaseQuery(args, api, extraOptions);
};
