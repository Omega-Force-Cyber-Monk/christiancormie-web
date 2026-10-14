import { createApi } from "@reduxjs/toolkit/query/react";

import { authBaseQuery } from "@/services/api/authBaseQuery";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: authBaseQuery,
  tagTypes: [
    "CurrentUser",
    "Dashboard",
    "AdminDashboard",
    "AdminBookings",
    "AdminVendors",
    "AdminUsers",
    "AdminCommunity",
    "AdminReviews",
    "AdminPayments",
    "AdminRewards",
  ],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: () => ({}),
});
