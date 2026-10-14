import { baseApi } from "@/services/api/baseApi";
import { sessionStarted } from "@/features/auth/store/auth.slice";
import type {
  LoginRequest,
  RefreshSessionResponse,
  RegisterRequest,
  SourceRegisterResponse,
} from "@/features/auth/types/auth.types";
import type { CurrentUserResponse } from "@/features/auth/types/current-user.types";
import { currentUserResponseSchema } from "@/features/auth/schemas/current-user.schema";
import { sourceLoginResponseSchema } from "@/features/auth/schemas/session.schema";
import { logger } from "@/lib/logger/logger";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
      async onQueryStarted(_credentials, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // Session middleware resets the API cache. Wait for mutation completion
          // so that cleanup cannot cancel this login's pending result.
          dispatch(sessionStarted(data));
          logger.debug("Login succeeded.", { tokenPresent: true });
        } catch {
          // Failed login leaves the existing session untouched; the form owns errors.
        }
      },
      invalidatesTags: ["CurrentUser"],
    }),
    register: builder.mutation<SourceRegisterResponse, RegisterRequest>({
      query: (userData) => ({
        url: "/auth/create-user",
        method: "POST",
        body: userData,
      }),
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

export const { useGetCurrentUserQuery, useLoginMutation, useRegisterMutation } =
  authApi;
