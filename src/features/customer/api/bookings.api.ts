import { z } from "zod";
import { baseApi } from "@/services/api/baseApi";
import {
  scopedRead,
  sessionDenied,
  type SessionScope,
} from "@/services/api/sessionGuard";
import {
  bookingSchema,
  bookingDetailSchema,
  type CustomerBookingDetail,
  trackingSchema,
  type CustomerBooking,
  type BookingTracking,
} from "../schemas/booking.schema";

export type BookingSelection = SessionScope & { bookingId: string };
const validCustomer = (scope: SessionScope) =>
  scope.role === "CUSTOMER" && z.uuid().safeParse(scope.userId).success;
export const bookingsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getCustomerBookings: b.query<CustomerBooking[], SessionScope>({
      keepUnusedDataFor: 0,
      queryFn(scope, a, _e, q) {
        if (!validCustomer(scope)) return sessionDenied;
        return scopedRead(
          a,
          scope,
          q,
          { url: "/bookings/mine", method: "GET" },
          z
            .array(bookingSchema)
            .refine(
              (rows) =>
                rows.every((row) => row.customerId === scope.userId) &&
                new Set(rows.map((r) => r.id)).size === rows.length,
            ),
        );
      },
      providesTags: ["CustomerBookings"],
    }),
    getCustomerBooking: b.query<CustomerBookingDetail, BookingSelection>({
      keepUnusedDataFor: 0,
      queryFn(scope, a, _e, q) {
        if (!validCustomer(scope) || !z.uuid().safeParse(scope.bookingId).success)
          return sessionDenied;
        return scopedRead(
          a,
          scope,
          q,
          { url: `/bookings/${scope.bookingId}`, method: "GET" },
          bookingDetailSchema.refine(
            (row) => row.id === scope.bookingId && row.customerId === scope.userId,
          ),
        );
      },
      providesTags: (_r, _e, s) => [{ type: "CustomerBookings", id: s.bookingId }],
    }),
    getCustomerBookingTracking: b.query<BookingTracking, BookingSelection>({
      keepUnusedDataFor: 0,
      queryFn(scope, a, _e, q) {
        if (!validCustomer(scope) || !z.uuid().safeParse(scope.bookingId).success)
          return sessionDenied;
        return scopedRead(
          a,
          scope,
          q,
          { url: `/bookings/${scope.bookingId}/tracking`, method: "GET" },
          trackingSchema.refine((row) => row.bookingId === scope.bookingId),
        );
      },
      providesTags: (_r, _e, s) => [
        { type: "CustomerBookingTracking", id: s.bookingId },
      ],
    }),
  }),
});
export const {
  useGetCustomerBookingsQuery,
  useGetCustomerBookingQuery,
  useGetCustomerBookingTrackingQuery,
} = bookingsApi;
