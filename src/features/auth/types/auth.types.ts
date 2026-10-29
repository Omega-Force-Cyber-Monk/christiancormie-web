import type { AppError } from "@/utils/errors/error.types";

import type { AuthenticatedUser } from "@/types/user.types";

export type AuthState = {
  user: AuthenticatedUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  sessionId: string | null;
  isHydrated: boolean;
  isIdentityVerified: boolean;
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
  roles: string[];
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

export type RegisterCustomerRequest = {
  name: string;
  email: string;
  password: string;
  dateOfBirth: string;
  referralCode?: string;
};

export type RegisterVendorRequest = {
  email: string;
  phone: string;
  password: string;
  dateOfBirth?: string;
  businessName?: string;
  businessEmail?: string;
  businessPhone?: string;
  description?: string;
  websiteUrl?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  timezone?: string;
  referralCode?: string;
};

export type PendingVerificationResponse = {
  success: true;
  status: "PENDING";
  message: string;
  email: string;
};

export type VerifyEmailRequest = { email: string; code: string };
export type ResendVerificationRequest = { email: string };

export type StoredSession = SessionTokens & {
  sessionId: string;
  user: AuthenticatedUser | null;
};

export type LogoutReason = "manual" | "invalid-session" | "storage";

/** Captured locally before cleanup; only refreshToken is sent in the JSON body. */
export type LogoutCredentials = Pick<SessionTokens, "accessToken" | "refreshToken">;
export type LogoutResponse = { success: true };
