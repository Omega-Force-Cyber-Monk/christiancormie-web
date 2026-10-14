import { baseApi } from "@/services/api/baseApi";
import { sessionStarted } from "@/features/auth/store/auth.slice";
import type {
  LoginRequest,
  RefreshSessionResponse,
  RegisterRequest,
  SourceRegisterResponse,
} from "@/features/auth/types/auth.types";
import { toAuthenticatedUser } from "@/features/auth/utils/authAdapters";
import { sourceLoginResponseSchema } from "@/features/auth/schemas/session.schema";
import { logger } from "@/lib/logger/logger";
import type { AuthenticatedUser } from "@/types/user.types";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<RefreshSessionResponse, LoginRequest>({
      async queryFn(credentials, api, _extraOptions, baseQuery) {
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
          user: toAuthenticatedUser(parsed.data.user),
        };
        // Establish and persist the session before unwrap resolves and navigation runs.
        api.dispatch(sessionStarted(session));
        logger.debug("Login succeeded.", { tokenPresent: true });
        return { data: session };
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
    getCurrentUser: builder.query<AuthenticatedUser, void>({
      query: () => "/auth/me",
      providesTags: ["CurrentUser"],
    }),
  }),
});

export const { useGetCurrentUserQuery, useLoginMutation, useRegisterMutation } =
  authApi;
