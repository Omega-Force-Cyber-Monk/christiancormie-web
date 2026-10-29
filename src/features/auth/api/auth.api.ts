import { baseApi } from "@/services/api/baseApi";
import { sessionStarted } from "@/features/auth/store/auth.slice";
import type { RootState } from "@/app/rootReducer";
import type { z } from "zod";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type { ApiBaseQuery } from "@/services/api/baseQuery";
import {
  registerCustomerSchema,
  registerVendorSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  pendingVerificationSchema,
} from "@/features/auth/schemas/signup.schema";
import type {
  LoginRequest,
  LogoutCredentials,
  LogoutResponse,
  RefreshSessionResponse,
  RegisterCustomerRequest,
  RegisterVendorRequest,
  PendingVerificationResponse,
  VerifyEmailRequest,
  ResendVerificationRequest,
} from "@/features/auth/types/auth.types";
import type { CurrentUserResponse } from "@/features/auth/types/current-user.types";
import { currentUserResponseSchema } from "@/features/auth/schemas/current-user.schema";
import {
  logoutResponseSchema,
  sourceLoginResponseSchema,
} from "@/features/auth/schemas/session.schema";
import { logger } from "@/lib/logger/logger";

async function postAuth<Request, Response>(
  url: string,
  input: Request,
  requestSchema: z.ZodType<Request>,
  responseSchema: z.ZodType<Response>,
  baseQuery: (args: FetchArgs) => ReturnType<ApiBaseQuery>,
) {
  const body = requestSchema.safeParse(input);
  if (!body.success)
    return {
      error: {
        status: 400,
        data: { message: "Please correct the registration or verification fields." },
      },
    };
  const result = await baseQuery({ url, method: "POST", body: body.data });
  if (result.error) return { error: result.error };
  const response = responseSchema.safeParse(result.data);
  if (!response.success)
    return {
      error: {
        status: "CUSTOM_ERROR" as const,
        error: "Invalid authentication response.",
      },
    };
  return { data: response.data };
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    logout: builder.mutation<LogoutResponse, LogoutCredentials>({
      async queryFn(credentials, _api, _extraOptions, baseQuery) {
        const result = await baseQuery({
          url: "/auth/logout",
          method: "POST",
          headers: { authorization: `Bearer ${credentials.accessToken}` },
          body: { refreshToken: credentials.refreshToken },
        });
        if (result.error) return { error: result.error };
        const parsed = logoutResponseSchema.safeParse(result.data);
        if (!parsed.success)
          return {
            error: { status: "CUSTOM_ERROR", error: "Invalid logout response." },
          };
        return { data: parsed.data };
      },
      // No completion-time auth changes or tag invalidation: a new session may exist.
    }),
    login: builder.mutation<RefreshSessionResponse, LoginRequest>({
      async queryFn(credentials, _api, _extraOptions, baseQuery) {
        const result = await baseQuery({
          url: "/auth/login",
          method: "POST",
          body: credentials,
        });
        if (result.error) {
          logger.debug("Login failed.", { status: result.error.status });
          return { error: result.error };
        }
        const parsed = sourceLoginResponseSchema.safeParse(result.data);
        if (!parsed.success) {
          return {
            error: { status: "CUSTOM_ERROR", error: "Invalid login response." },
          };
        }
        const session = {
          accessToken: parsed.data.accessToken,
          refreshToken: parsed.data.refreshToken,
        };
        return { data: session };
      },
      async onQueryStarted(_credentials, lifecycle) {
        const { dispatch, queryFulfilled } = lifecycle;
        const sessionId = (lifecycle.getState() as RootState).auth.sessionId;
        try {
          const { data } = await queryFulfilled;
          // Session middleware resets the API cache. Wait for mutation completion
          // so that cleanup cannot cancel this login's pending result.
          if ((lifecycle.getState() as RootState).auth.sessionId === sessionId)
            dispatch(sessionStarted(data));
          logger.debug("Login succeeded.", { tokenPresent: true });
        } catch {
          // Failed login leaves the existing session untouched; the form owns errors.
        }
      },
      invalidatesTags: ["CurrentUser"],
    }),
    registerCustomer: builder.mutation<
      PendingVerificationResponse,
      RegisterCustomerRequest
    >({
      queryFn: (body, _api, _extra, baseQuery) =>
        postAuth(
          "/auth/register/customer",
          body,
          registerCustomerSchema,
          pendingVerificationSchema,
          baseQuery,
        ),
    }),
    registerVendor: builder.mutation<
      PendingVerificationResponse,
      RegisterVendorRequest
    >({
      queryFn: (body, _api, _extra, baseQuery) =>
        postAuth(
          "/auth/register/vendor",
          body,
          registerVendorSchema,
          pendingVerificationSchema,
          baseQuery,
        ),
    }),
    verifyEmail: builder.mutation<RefreshSessionResponse, VerifyEmailRequest>({
      async queryFn(body, _api, _extra, baseQuery) {
        const result = await postAuth(
          "/auth/verify-email",
          body,
          verifyEmailSchema,
          sourceLoginResponseSchema,
          baseQuery,
        );
        if (result.error) return { error: result.error };
        return {
          data: {
            accessToken: result.data.accessToken,
            refreshToken: result.data.refreshToken,
          },
        };
      },
      async onQueryStarted(_body, lifecycle) {
        const { dispatch, queryFulfilled } = lifecycle;
        const sessionId = (lifecycle.getState() as RootState).auth.sessionId;
        try {
          const { data } = await queryFulfilled;
          if ((lifecycle.getState() as RootState).auth.sessionId === sessionId)
            dispatch(sessionStarted(data));
        } catch {
          // Verification errors leave the pending form and current session intact.
        }
      },
    }),
    resendVerificationCode: builder.mutation<
      PendingVerificationResponse,
      ResendVerificationRequest
    >({
      queryFn: (body, _api, _extra, baseQuery) =>
        postAuth(
          "/auth/resend-verification-code",
          body,
          resendVerificationSchema,
          pendingVerificationSchema,
          baseQuery,
        ),
    }),
    getCurrentUser: builder.query<CurrentUserResponse, void>({
      async queryFn(_arg, _api, _extraOptions, baseQuery) {
        const result = await baseQuery({ url: "/users/me", method: "GET" });
        if (result.error) return { error: result.error };
        const parsed = currentUserResponseSchema.safeParse(result.data);
        if (!parsed.success) {
          return {
            error: { status: "CUSTOM_ERROR", error: "Invalid current-user response." },
          };
        }
        // Cache the complete API response, including opaque and additional fields.
        return { data: parsed.data };
      },
      providesTags: ["CurrentUser"],
    }),
  }),
});

export const {
  useGetCurrentUserQuery,
  useLoginMutation,
  useRegisterCustomerMutation,
  useRegisterVendorMutation,
  useVerifyEmailMutation,
  useResendVerificationCodeMutation,
} = authApi;
