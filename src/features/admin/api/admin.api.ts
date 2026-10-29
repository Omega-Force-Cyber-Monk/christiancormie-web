import type {
  AdminBookingsManagementResponse,
  AdminCommunityManagementResponse,
  AdminDashboardResponse,
  AdminListQuery,
  AdminPaymentsManagementResponse,
  AdminReviewsManagementResponse,
  AdminRewardsManagementResponse,
  AdminUsersManagementResponse,
  AdminVendorsManagementResponse,
} from "@/features/admin/types/admin.types";
import { baseApi } from "@/services/api/baseApi";
import type { AdminTruckRequestDto } from "@/features/admin/types/admin.dto";

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminTruckRequests: builder.query<AdminTruckRequestDto[], AdminListQuery | void>(
      {
        query: (params) => ({
          url: "admin/vendors/truck-requests",
          method: "GET",
          params: params ?? undefined,
        }),
        providesTags: ["AdminVendors"],
      },
    ),
    getAdminDashboard: builder.query<AdminDashboardResponse, void>({
      query: () => ({ url: "admin/dashboard", method: "GET" }),
      providesTags: ["AdminDashboard"],
    }),
    getAdminBookingsManagement: builder.query<
      AdminBookingsManagementResponse,
      AdminListQuery | void
    >({
      query: (params) => ({
        url: "admin/bookings-management",
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["AdminBookings"],
    }),
    getAdminVendorsManagement: builder.query<
      AdminVendorsManagementResponse,
      AdminListQuery | void
    >({
      query: (params) => ({
        url: "admin/vendors-management",
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["AdminVendors"],
    }),
    getAdminUsersManagement: builder.query<
      AdminUsersManagementResponse,
      AdminListQuery | void
    >({
      query: (params) => ({
        url: "admin/users-management",
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["AdminUsers"],
    }),
    getAdminCommunityManagement: builder.query<
      AdminCommunityManagementResponse,
      AdminListQuery | void
    >({
      query: (params) => ({
        url: "admin/community-management",
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["AdminCommunity"],
    }),
    getAdminReviewsManagement: builder.query<
      AdminReviewsManagementResponse,
      AdminListQuery | void
    >({
      query: (params) => ({
        url: "admin/reviews-management",
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["AdminReviews"],
    }),
    getAdminPaymentsManagement: builder.query<
      AdminPaymentsManagementResponse,
      AdminListQuery | void
    >({
      query: (params) => ({
        url: "admin/payments-management",
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["AdminPayments"],
    }),
    getAdminRewardsManagement: builder.query<
      AdminRewardsManagementResponse,
      AdminListQuery | void
    >({
      query: (params) => ({
        url: "admin/rewards-management",
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["AdminRewards"],
    }),
    suspendAdminUser: builder.mutation<{ id: string; status: string }, string>({
      query: (userId) => ({
        url: `admin/users/${userId}/suspend`,
        method: "PATCH",
      }),
      invalidatesTags: ["AdminUsers"],
    }),
    retrieveAdminUser: builder.mutation<{ id: string; status: string }, string>({
      query: (userId) => ({
        url: `admin/users/${userId}/retrieve`,
        method: "PATCH",
      }),
      invalidatesTags: ["AdminUsers"],
    }),
    updateTruckRequestStatus: builder.mutation<
      AdminTruckRequestDto,
      {
        requestId: string;
        status: "PENDING" | "COMMUNICATED" | "DISMISSED";
        notes?: string;
      }
    >({
      query: ({ requestId, ...body }) => ({
        url: `admin/vendors/truck-requests/${requestId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["AdminVendors"],
    }),
    approvePayout: builder.mutation<{ id: string; status: string }, string>({
      query: (payoutId) => ({
        url: `admin/payouts/${payoutId}/approve`,
        method: "PATCH",
      }),
      invalidatesTags: ["AdminPayments"],
    }),
  }),
});

export const {
  useGetAdminTruckRequestsQuery,
  useApprovePayoutMutation,
  useGetAdminBookingsManagementQuery,
  useGetAdminCommunityManagementQuery,
  useGetAdminDashboardQuery,
  useGetAdminPaymentsManagementQuery,
  useGetAdminReviewsManagementQuery,
  useGetAdminRewardsManagementQuery,
  useGetAdminUsersManagementQuery,
  useGetAdminVendorsManagementQuery,
  useRetrieveAdminUserMutation,
  useSuspendAdminUserMutation,
  useUpdateTruckRequestStatusMutation,
} = adminApi;
