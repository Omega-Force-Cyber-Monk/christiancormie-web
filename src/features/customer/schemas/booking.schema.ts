import { z } from "zod";
import { bookingQuoteSchema } from "@/features/bookings/schemas/bookingQuote.schema";

const uuid = z.uuid();
const date = z.iso.datetime({ offset: true });
export const bookingStatusSchema = z.enum([
  "PENDING",
  "QUOTED",
  "ACCEPTED",
  "PAYMENT_PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
  "EXPIRED",
]);
// Project only the fields this read-only Customer view needs; strip private relations.
export const bookingSchema = z
  .object({
    id: uuid,
    bookingNumber: z.string(),
    customerId: uuid,
    vendorId: uuid,
    foodTruckId: uuid,
    status: bookingStatusSchema,
    bookingType: z.enum([
      "QUICK_BOOKING",
      "EVENT",
      "CATERING",
      "PRIVATE_REQUEST",
      "COMMUNITY_REQUEST",
    ]),
    eventType: z
      .enum([
        "BIRTHDAY_PARTY",
        "CORPORATE_EVENT",
        "WEDDING",
        "WEDDING_RECEPTION",
        "GRADUATION_PARTY",
        "COMMUNITY_EVENT",
        "FUNDRAISER",
        "PRIVATE_PARTY",
        "OTHER",
      ])
      .nullable(),
    eventName: z.string().nullable(),
    eventDescription: z.string().nullable(),
    startsAt: date,
    endsAt: date.nullable(),
    guestCount: z.number().int(),
    address: z.string(),
    specialInstructions: z.string().nullable(),
    createdAt: date,
    vendor: z.object({ id: uuid, businessName: z.string() }),
    foodTruck: z.object({ id: uuid, vendorId: uuid, name: z.string() }),
  })
  .refine(
    (b) =>
      b.vendor.id === b.vendorId &&
      b.foodTruck.id === b.foodTruckId &&
      b.foodTruck.vendorId === b.vendorId,
  );
export type CustomerBooking = z.infer<typeof bookingSchema>;
export const bookingDetailSchema = bookingSchema
  .safeExtend({
    quotes: z.array(bookingQuoteSchema).optional(),
    completionRequestedAt: date.nullable(),
    completionApprovedAt: date.nullable(),
    completedAt: date.nullable(),
    paymentReleasedAt: date.nullable(),
  })
  .refine(
    (b) =>
      !b.quotes ||
      b.quotes.every((q) => q.bookingId === b.id && q.vendorId === b.vendorId),
  );
export type CustomerBookingDetail = z.infer<typeof bookingDetailSchema>;
export const trackingSchema = z.object({
  bookingId: uuid,
  bookingNumber: z.string(),
  roleView: z.literal("CUSTOMER"),
  currentStep: z.string(),
  completion: z.object({
    requestedAt: date.nullable(),
    approvedAt: date.nullable(),
    paymentReleasedAt: date.nullable(),
    hasOpenIssue: z.boolean(),
  }),
  steps: z.array(
    z.object({
      key: z.enum([
        "BOOKING_CONFIRMED",
        "DEPOSIT",
        "EVENT_DAY",
        "REQUEST_PENDING",
        "PAYMENT_RELEASED",
      ]),
      label: z.string(),
      status: z.enum(["DONE", "CURRENT", "PENDING"]),
      completedAt: date.nullable(),
    }),
  ),
});
export type BookingTracking = z.infer<typeof trackingSchema>;
