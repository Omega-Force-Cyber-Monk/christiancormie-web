import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { env } from "@/config/env";
import type { UserRole } from "@/constants/roles";
import type {
  AuthState,
  LogoutReason,
  RefreshSessionResponse,
  StoredSession,
  SessionTokens,
} from "@/features/auth/types/auth.types";
import { createMockUser, getInitialMockRole } from "@/features/auth/utils/mockAuth";
import { sessionStorageService } from "@/features/auth/utils/sessionStorage";
import type { AuthenticatedUser } from "@/types/user.types";
import type { AppError } from "@/utils/errors/error.types";

const initialState = (): AuthState => {
  const session = sessionStorageService.readSession();
  return {
    user:
      session?.user ??
      (env.enableMockAuth && !session ? createMockUser(getInitialMockRole()) : null),
    accessToken: session?.accessToken ?? null,
    refreshToken: session?.refreshToken ?? null,
    sessionId: session?.sessionId ?? null,
    isHydrated: !session,
    isIdentityVerified: false,
    isInitializing: false,
    initializationError: null,
    expiresAt: session?.expiresAt ?? null,
  };
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setMockRole(state, action: PayloadAction<UserRole>) {
      if (env.enableMockAuth && !state.accessToken) {
        state.user = createMockUser(action.payload);
      }
    },
    sessionStarted: {
      prepare(session: SessionTokens) {
        return { payload: { ...session, user: null, sessionId: crypto.randomUUID() } };
      },
      reducer(state, action: PayloadAction<StoredSession>) {
        Object.assign(state, action.payload);
        state.expiresAt = action.payload.expiresAt ?? null;
        state.isHydrated = false;
        state.isIdentityVerified = false;
        state.isInitializing = false;
        state.initializationError = null;
      },
    },
    sessionUpdated(state, action: PayloadAction<RefreshSessionResponse>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.expiresAt = action.payload.expiresAt ?? null;
      if (action.payload.user) state.user = action.payload.user;
      // Refreshing tokens must not verify an identity loaded from local storage.
      state.isHydrated = state.isIdentityVerified;
      if (state.isHydrated) state.isInitializing = false;
      state.initializationError = null;
    },
    sessionRestored(state, action: PayloadAction<StoredSession>) {
      Object.assign(state, action.payload);
      state.expiresAt = action.payload.expiresAt ?? null;
      state.isHydrated = false;
      state.isIdentityVerified = false;
      state.isInitializing = false;
      state.initializationError = null;
    },
    initializationStarted(state) {
      state.isInitializing = true;
      state.initializationError = null;
    },
    identityVerified(state, action: PayloadAction<AuthenticatedUser>) {
      state.user = action.payload;
      state.isIdentityVerified = true;
      state.isHydrated = true;
      state.isInitializing = false;
      state.initializationError = null;
    },
    initializationFailed(state, action: PayloadAction<AppError>) {
      state.isInitializing = false;
      state.initializationError = action.payload;
    },
    clearSession: {
      prepare(reason: LogoutReason = "manual") {
        return { payload: reason };
      },
      reducer(state) {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.sessionId = null;
        state.expiresAt = null;
        state.isHydrated = true;
        state.isIdentityVerified = false;
        state.isInitializing = false;
        state.initializationError = null;
      },
    },
  },
});

export const {
  clearSession,
  initializationFailed,
  identityVerified,
  initializationStarted,
  sessionRestored,
  sessionStarted,
  sessionUpdated,
  setMockRole,
} = authSlice.actions;
export const authReducer = authSlice.reducer;
