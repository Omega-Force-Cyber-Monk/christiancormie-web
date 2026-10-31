import { z } from "zod";
import type { RootState } from "@/app/store";
import { baseApi } from "@/services/api/baseApi";
import { scopedRead, sessionDenied, sessionFlight } from "@/services/api/sessionGuard";
import { invalidContract } from "@/services/api/validatedQuery";
import {
  vendorFor,
  vendorBookingsApi,
  type VendorBookingSelection,
} from "./vendorBookings.api";
import { vendorBookingSchema } from "../schemas/vendorBookings.schema";
import {
  bookingQuoteSchema,
  quoteInputSchema,
  validQuoteForGuests,
  type QuoteInput,
} from "@/features/bookings/schemas/bookingQuote.schema";
export const quoteResultSchema = z.object({
  message: z.string(),
  booking: vendorBookingSchema,
  quote: bookingQuoteSchema,
  breakdown: z.object({
    commissionAmount: z.number().finite(),
    vendorNetAmount: z.number().finite(),
  }),
});
export const vendorQuotesApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    createVendorBookingQuote: b.mutation<
      z.infer<typeof quoteResultSchema>,
      VendorBookingSelection & { confirmed: true; body: QuoteInput }
    >({
      queryFn(s, a, _e, q) {
        return sessionFlight(a, s, `vendor-booking:${s.bookingId}`, async () => {
          const state = a.getState() as RootState;
          const v = vendorFor(state, s, true);
          const selection = {
            sessionId: s.sessionId,
            userId: s.userId,
            role: s.role,
            bookingId: s.bookingId,
          };
          const detail =
            vendorBookingsApi.endpoints.getVendorBooking.select(selection)(state);
          const booking = detail.data;
          if (
            !v ||
            !z.uuid().safeParse(s.bookingId).success ||
            s.confirmed !== true ||
            detail.error ||
            !booking ||
            booking.vendorId !== v.id ||
            booking.vendor.userId !== s.userId ||
            !booking.endsAt ||
            !["PENDING", "ACCEPTED"].includes(booking.status)
          )
            return sessionDenied;
          const input = quoteInputSchema.safeParse(s.body);
          if (!input.success || !validQuoteForGuests(input.data, booking.guestCount))
            return invalidContract;
          const result = await scopedRead(
            a,
            s,
            q,
            {
              url: `/bookings/${s.bookingId}/quotes`,
              method: "POST",
              body: input.data,
            },
            quoteResultSchema.refine(
              (r) =>
                r.booking.id === s.bookingId &&
                r.booking.vendorId === v.id &&
                r.booking.vendor.userId === s.userId &&
                r.booking.customerId === booking.customerId &&
                r.booking.foodTruckId === booking.foodTruckId &&
                r.booking.status === "QUOTED" &&
                r.quote.bookingId === s.bookingId &&
                r.quote.vendorId === v.id &&
                r.quote.status === "PENDING",
            ),
          );
          if (vendorFor(a.getState() as RootState, s, true)?.id !== v.id)
            return sessionDenied;
          a.dispatch(
            baseApi.util.invalidateTags([
              "VendorBookings",
              "VendorRequests",
              "CustomerBookings",
              { type: "VendorBookingTracking", id: s.bookingId },
              { type: "CustomerBookingTracking", id: s.bookingId },
            ]),
          );
          // No retry of a POST: a lost notification/response may follow a committed quote.
          const refresh = a.dispatch(
            vendorBookingsApi.endpoints.getVendorBooking.initiate(selection, {
              forceRefetch: true,
              subscribe: false,
            }),
          );
          await refresh;
          return vendorFor(a.getState() as RootState, s, true)?.id === v.id
            ? result
            : sessionDenied;
        });
      },
    }),
  }),
});
