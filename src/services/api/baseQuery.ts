import {
  fetchBaseQuery,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn } from "@reduxjs/toolkit/query";

import type { RootState } from "@/app/store";
import { env } from "@/config/env";

export type ApiBaseQuery = BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
>;

export const rawBaseQuery = fetchBaseQuery({
  baseUrl: env.apiBaseUrl || "/api",
  prepareHeaders: (headers, { getState, endpoint }) => {
    const token = (getState() as RootState).auth.accessToken;

    if (
      token &&
      ![
        "login",
        "staffLogin",
        "logout",
        "registerCustomer",
        "registerVendor",
        "verifyEmail",
        "resendVerificationCode",
      ].includes(endpoint)
    ) {
      headers.set("authorization", `Bearer ${token}`);
    }

    headers.set("accept", "application/json");
    return headers;
  },
});
