import type { z } from "zod";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type { ApiBaseQuery } from "@/services/api/baseQuery";
import { baseApi } from "@/services/api/baseApi";
import {
  vendorProfileSchema,
  vendorTrucksSchema,
  vendorAnalyticsSchema,
  vendorRequestCountsSchema,
  vendorQrSchema,
} from "@/features/vendor/schemas/vendor.schema";
import type {
  VendorProfileResponse,
  VendorTrucksResponse,
  VendorAnalyticsResponse,
  VendorRequestCountsResponse,
  VendorQrResponse,
} from "@/features/vendor/types/vendor.types";

async function readVendor<Response>(
  url: string,
  schema: z.ZodType<Response>,
  baseQuery: (args: FetchArgs) => ReturnType<ApiBaseQuery>,
) {
  const result = await baseQuery({ url, method: "GET" });
  if (result.error) return { error: result.error };
  const parsed = schema.safeParse(result.data);
  if (!parsed.success)
    return {
      error: { status: "CUSTOM_ERROR" as const, error: "Invalid vendor response." },
    };
  return { data: parsed.data };
}
export const vendorApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getVendorMe: builder.query<VendorProfileResponse, void>({
      queryFn: (_arg, _api, _extra, query) =>
        readVendor("/vendors/me", vendorProfileSchema, query),
      providesTags: ["Vendor"],
    }),
    getMyTrucks: builder.query<VendorTrucksResponse, void>({
      queryFn: (_arg, _api, _extra, query) =>
        readVendor("/food-trucks/mine", vendorTrucksSchema, query),
      providesTags: ["FoodTruck"],
    }),
    getVendorAnalytics: builder.query<VendorAnalyticsResponse, void>({
      queryFn: (_arg, _api, _extra, query) =>
        readVendor("/vendors/me/analytics", vendorAnalyticsSchema, query),
      providesTags: ["VendorAnalytics"],
    }),
    getVendorRequestCounts: builder.query<VendorRequestCountsResponse, void>({
      queryFn: (_arg, _api, _extra, query) =>
        readVendor(
          "/bookings/vendor/requests/counts",
          vendorRequestCountsSchema,
          query,
        ),
      providesTags: ["VendorRequests"],
    }),
    getVendorQr: builder.query<VendorQrResponse, void>({
      queryFn: (_arg, _api, _extra, query) =>
        readVendor("/vendors/me/qr-code", vendorQrSchema, query),
      providesTags: ["VendorQr"],
    }),
  }),
});
export const {
  useGetVendorMeQuery,
  useGetMyTrucksQuery,
  useGetVendorAnalyticsQuery,
  useGetVendorRequestCountsQuery,
  useGetVendorQrQuery,
} = vendorApi;
