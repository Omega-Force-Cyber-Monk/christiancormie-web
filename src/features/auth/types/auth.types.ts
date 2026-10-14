import type { AppError } from "@/utils/errors/error.types";

import type { AuthenticatedUser } from "@/types/user.types";

export type AuthState = {
  user: AuthenticatedUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  sessionId: string | null;
  isHydrated: boolean;
  isInitializing: boolean;
  initializationError: AppError | null;
  expiresAt: number | null;
};

export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt?: number | null;
};

export type RefreshSessionResponse = SessionTokens & {
  user?: AuthenticatedUser;
};

export type SourceAuthUser = {
  id: string;
  email: string;
  displayName: string;
  roles: Array<AuthenticatedUser["role"]>;
  vendor?: {
    id: string;
    businessName: string;
  };
  staff?: {
    id: string;
    vendorId: string;
    businessName?: string;
  };
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type SourceLoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: SourceAuthUser;
};

export type RegisterRequest = {
  name: string;
  businessName: string;
  address_Pickup_Location: string;
  phone: string;
  email: string;
  password: string;
};

export type SourceRegisterResponse = {
  success: boolean;
  message: string;
  data: SourceAuthUser;
};

export type StoredSession = SessionTokens & {
  sessionId: string;
  user: AuthenticatedUser | null;
};

export type LogoutReason = "manual" | "invalid-session" | "storage";
