import { baseApi } from "@/services/api/baseApi";
import { sessionStarted } from "@/features/auth/store/auth.slice";
import type { RootState } from "@/app/rootReducer";
import type { AppDispatch } from "@/app/store";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
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
  StaffLoginRequest,
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
import { staffLoginSchema } from "@/features/auth/schemas/staff-login.schema";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";

// Adapt T13-A's single-use credential handoff: only a random ID enters Redux.
const staffLoginDrafts = new Map<string, unknown>();
const staffLoginFlights = new WeakSet<object>();
function staffLoginError(cause: FetchBaseQueryError, pin: string): FetchBaseQueryError {
  const error = normalizeApiError(cause);
  if (error.kind === "NETWORK") return { status: "FETCH_ERROR", error: error.message };
  if (error.status === undefined)
    return { status: "CUSTOM_ERROR", error: error.message };
  const redact = (text: string) => text.replaceAll(pin, "[redacted]");
  const fields = Object.fromEntries(
    Object.entries(error.fieldErrors ?? {})
      .filter(([key]) => ["email", "pin"].includes(key))
      .map(([key, value]) => [key, redact(value)]),
  );
  // These are the exact StaffLoginDto diagnostics, not guesses from arbitrary prose.
  for (const message of error.validationMessages ?? []) {
    if (message === "PIN must be exactly 4 digits") fields.pin ??= message;
    if (message === "Email must be a valid email address") fields.email ??= message;
  }
  return {
    status: error.status,
    data: {
      message: error.validationMessages?.map(redact) ?? redact(error.message),
      errors: fields,
    },
  };
}

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
    staffLogin: builder.mutation<RefreshSessionResponse, { submissionId: string }>({
      async queryFn({ submissionId }, api, _extra, query) {
        const draft = staffLoginDrafts.get(submissionId);
        staffLoginDrafts.delete(submissionId);
        const body = staffLoginSchema.safeParse(draft);
        if (!body.success)
          return {
            error: {
              status: 400,
              data: {
                message: "Enter a valid email and exactly four numeric PIN digits.",
              },
            },
          };
        if (staffLoginFlights.has(api.dispatch))
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "A staff sign-in is already pending.",
            },
          };
        staffLoginFlights.add(api.dispatch);
        try {
          const result = await query({
            url: "/auth/staff/login",
            method: "POST",
            body: body.data,
          });
          if (result.error)
            return { error: staffLoginError(result.error, body.data.pin) };
          const parsed = sourceLoginResponseSchema.safeParse(result.data);
          if (!parsed.success)
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "Invalid staff authentication response.",
              },
            };
          return {
            data: {
              accessToken: parsed.data.accessToken,
              refreshToken: parsed.data.refreshToken,
            },
          };
        } finally {
          staffLoginFlights.delete(api.dispatch);
        }
      },
      // beginStaffLogin commits only the still-current tracked request. No tag
      // invalidation or lifecycle callback can affect a replacement session.
    }),
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

export function beginStaffLogin(
  dispatch: AppDispatch,
  getState: () => RootState,
  body: StaffLoginRequest,
) {
  const snapshot = getState().auth;
  const submissionId = crypto.randomUUID();
  staffLoginDrafts.set(submissionId, body);
  const request = dispatch(authApi.endpoints.staffLogin.initiate({ submissionId }));
  let cancelled = false;
  const isCurrentRequest = () => {
    const current = getState().auth;
    const tracked = authApi.endpoints.staffLogin.select(request.requestId)(getState());
    // The entry check also catches logout/storage-clear when both session IDs
    // are null. Existing auth middleware clears API state on every logout.
    return (
      !cancelled &&
      tracked.requestId === request.requestId &&
      current.sessionId === snapshot.sessionId &&
      current.accessToken === snapshot.accessToken &&
      current.refreshToken === snapshot.refreshToken
    );
  };
  const result = (async () => {
    try {
      const tokens = await request.unwrap();
      if (!isCurrentRequest()) return false;
      dispatch(sessionStarted(tokens));
      return true;
    } catch (cause) {
      if (!isCurrentRequest()) return false;
      throw cause;
    } finally {
      staffLoginDrafts.delete(submissionId);
      request.reset();
    }
  })();
  return {
    result,
    cancel() {
      cancelled = true;
      staffLoginDrafts.delete(submissionId);
      request.abort();
      request.reset();
    },
  };
}

export const {
  useGetCurrentUserQuery,
  useLoginMutation,
  useRegisterCustomerMutation,
  useRegisterVendorMutation,
  useVerifyEmailMutation,
  useResendVerificationCodeMutation,
} = authApi;
