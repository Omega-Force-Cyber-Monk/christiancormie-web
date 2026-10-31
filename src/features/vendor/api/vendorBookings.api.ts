import { z } from "zod";
import type { FetchBaseQueryError, QueryReturnValue } from "@reduxjs/toolkit/query";
import type { RootState } from "@/app/store";
import { baseApi } from "@/services/api/baseApi";
import {
  scopedRead,
  scopeMatches,
  sessionDenied,
  sessionFlight,
  type SessionScope,
} from "@/services/api/sessionGuard";
import { invalidContract } from "@/services/api/validatedQuery";
import { vendorApi } from "./vendor.api";
import { isVendorAccessError } from "../utils/useVendorContext";
import { vendorRequestCountsSchema } from "../schemas/vendor.schema";
import {
  vendorBookingSchema,
  vendorBookingTrackingSchema,
  vendorBookingFiltersSchema,
  vendorDecisionBodySchema,
  vendorDecisionAllowed,
  type VendorBooking,
  type VendorBookingTracking,
  type VendorBookingFilters,
} from "../schemas/vendorBookings.schema";
const countsSchema = vendorRequestCountsSchema.extend({
  community: z.number().int().nonnegative(),
  messages: z.number().int().nonnegative(),
});
export type VendorBookingListArg = SessionScope & { filters: VendorBookingFilters };
export type VendorBookingSelection = SessionScope & { bookingId: string };
export type VendorBookingDecision = VendorBookingSelection & {
  action: "accept" | "reject";
  confirmed: true;
  body: { reason?: string };
};
export function vendorFor(state: RootState, s: SessionScope, write = false) {
  // /vendors/me resolves the JWT actor (owner or active staff); staff profiles
  // retain the owner's userId. Only the active owner role may perform decisions.
  if (
    !scopeMatches(state, s) ||
    !["VENDOR", "VENDOR_STAFF"].includes(s.role) ||
    (write && s.role !== "VENDOR")
  )
    return undefined;
  const query = vendorApi.endpoints.getVendorMe.select()(state);
  const v = query.data;
  if (
    isVendorAccessError(query.error) ||
    !v ||
    !z.uuid().safeParse(v.id).success ||
    !v.dashboardAccess.allowed ||
    !["APPROVED", "PENDING_APPROVAL"].includes(v.status) ||
    (v.user?.status && v.user.status !== "ACTIVE") ||
    (s.role === "VENDOR" && v.userId !== s.userId)
  )
    return undefined;
  return v;
}
export const vendorBookingsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getVendorBookings: b.query<VendorBooking[], VendorBookingListArg>({
      keepUnusedDataFor: 0,
      async queryFn(s, a, _e, q) {
        const v = vendorFor(a.getState() as RootState, s);
        if (!v) return sessionDenied;
        const filters = vendorBookingFiltersSchema.safeParse(s.filters);
        if (!filters.success) return invalidContract;
        const r = await scopedRead(
          a,
          s,
          q,
          { url: "/bookings/vendor/mine", method: "GET", params: filters.data },
          z
            .array(vendorBookingSchema)
            .refine(
              (rows) =>
                rows.every(
                  (row) => row.vendorId === v.id && row.vendor.userId === v.userId,
                ) && new Set(rows.map((row) => row.id)).size === rows.length,
            ),
        );
        return vendorFor(a.getState() as RootState, s)?.id === v.id ? r : sessionDenied;
      },
      providesTags: ["VendorBookings"],
    }),
    getVendorBookingCounts: b.query<z.infer<typeof countsSchema>, SessionScope>({
      keepUnusedDataFor: 0,
      async queryFn(s, a, _e, q) {
        const v = vendorFor(a.getState() as RootState, s);
        if (!v) return sessionDenied;
        const r = await scopedRead(
          a,
          s,
          q,
          { url: "/bookings/vendor/requests/counts", method: "GET" },
          countsSchema,
        );
        return vendorFor(a.getState() as RootState, s)?.id === v.id ? r : sessionDenied;
      },
      providesTags: ["VendorRequests"],
    }),
    getVendorBooking: b.query<VendorBooking, VendorBookingSelection>({
      keepUnusedDataFor: 0,
      async queryFn(s, a, _e, q) {
        const v = vendorFor(a.getState() as RootState, s);
        if (!v || !z.uuid().safeParse(s.bookingId).success) return sessionDenied;
        const r = await scopedRead(
          a,
          s,
          q,
          { url: `/bookings/${s.bookingId}`, method: "GET" },
          vendorBookingSchema.refine(
            (row) =>
              row.id === s.bookingId &&
              row.vendorId === v.id &&
              row.vendor.userId === v.userId,
          ),
        );
        return vendorFor(a.getState() as RootState, s)?.id === v.id ? r : sessionDenied;
      },
      providesTags: (_r, _e, s) => [{ type: "VendorBookings", id: s.bookingId }],
    }),
    getVendorBookingTracking: b.query<VendorBookingTracking, VendorBookingSelection>({
      keepUnusedDataFor: 0,
      async queryFn(
        s,
        a,
        _e,
        q,
      ): Promise<
        QueryReturnValue<VendorBookingTracking, FetchBaseQueryError, undefined>
      > {
        const v = vendorFor(a.getState() as RootState, s);
        const detail = vendorBookingsApi.endpoints.getVendorBooking.select(s)(
          a.getState() as RootState,
        );
        if (
          !v ||
          !z.uuid().safeParse(s.bookingId).success ||
          detail.error ||
          detail.data?.vendorId !== v.id ||
          detail.data.id !== s.bookingId
        )
          return sessionDenied;
        const r = await scopedRead(
          a,
          s,
          q,
          { url: `/bookings/${s.bookingId}/tracking`, method: "GET" },
          vendorBookingTrackingSchema.refine((r) => r.bookingId === s.bookingId),
        );
        return vendorFor(a.getState() as RootState, s)?.id === v.id ? r : sessionDenied;
      },
      providesTags: (_r, _e, s) => [{ type: "VendorBookingTracking", id: s.bookingId }],
    }),
    decideVendorBooking: b.mutation<VendorBooking, VendorBookingDecision>({
      queryFn(
        s,
        a,
        _e,
        q,
      ): Promise<QueryReturnValue<VendorBooking, FetchBaseQueryError, undefined>> {
        return sessionFlight(a, s, `vendor-booking:${s.bookingId}`, async () => {
          const v = vendorFor(a.getState() as RootState, s, true);
          const detail = vendorBookingsApi.endpoints.getVendorBooking.select({
            sessionId: s.sessionId,
            userId: s.userId,
            role: s.role,
            bookingId: s.bookingId,
          })(a.getState() as RootState);
          if (
            !v ||
            !z.uuid().safeParse(s.bookingId).success ||
            s.confirmed !== true ||
            !["accept", "reject"].includes(s.action) ||
            detail.error ||
            !detail.data ||
            detail.data.vendorId !== v.id ||
            detail.data.vendor.userId !== s.userId ||
            !vendorDecisionAllowed(detail.data, s.action)
          )
            return sessionDenied;
          const input = vendorDecisionBodySchema.safeParse(s.body);
          if (!input.success) return invalidContract;
          const r = await scopedRead(
            a,
            s,
            q,
            {
              url: `/bookings/${s.bookingId}/${s.action}`,
              method: "PATCH",
              body: input.data,
            },
            vendorBookingSchema.refine(
              (row) =>
                row.id === s.bookingId &&
                row.vendorId === v.id &&
                row.vendor.userId === s.userId &&
                row.customerId === detail.data?.customerId &&
                row.foodTruckId === detail.data.foodTruckId &&
                row.status === (s.action === "accept" ? "ACCEPTED" : "REJECTED"),
            ),
          );
          if (vendorFor(a.getState() as RootState, s, true)?.id !== v.id)
            return sessionDenied;
          if (scopeMatches(a.getState() as RootState, s))
            a.dispatch(
              baseApi.util.invalidateTags([
                "VendorBookings",
                "VendorRequests",
                { type: "VendorBookingTracking", id: s.bookingId },
                "CustomerBookings",
                { type: "CustomerBookingTracking", id: s.bookingId },
              ]),
            );
          return r;
        });
      },
    }),
  }),
});
export const {
  useGetVendorBookingsQuery,
  useGetVendorBookingCountsQuery,
  useGetVendorBookingQuery,
  useGetVendorBookingTrackingQuery,
} = vendorBookingsApi;
