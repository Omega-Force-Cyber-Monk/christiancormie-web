import { env } from "@/config/env";
import type { RootState } from "@/app/store";

export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectCurrentRole = (state: RootState) => state.auth.user?.role ?? null;
export const selectIsAuthenticated = (state: RootState) =>
  Boolean(state.auth.user && (state.auth.accessToken || env.enableMockAuth));
export const selectAccessToken = (state: RootState) => state.auth.accessToken;
export const selectRefreshToken = (state: RootState) => state.auth.refreshToken;
export const selectSessionExpiresAt = (state: RootState) => state.auth.expiresAt;

export const selectAuthInitialization = (state: RootState) => state.auth;
export const selectIsAuthHydrated = (state: RootState) => state.auth.isHydrated;
