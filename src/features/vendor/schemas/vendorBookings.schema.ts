import { z } from "zod";
import {
  bookingDetailSchema,
  bookingStatusSchema,
  trackingSchema,
} from "@/features/customer/schemas/booking.schema";
export const vendorBookingSchema = bookingDetailSchema
  .safeExtend({
    communityRequestId: z.uuid().nullable(),
    contactPhone: z.string().nullable(),
    totalAmount: z.string().regex(/^-?\d+(\.\d+)?$/),
    customer: z.object({
      id: z.uuid(),
      email: z.string(),
      phone: z.string().nullable(),
      profile: z
        .object({
          displayName: z.string().nullable(),
          firstName: z.string().nullable(),
          lastName: z.string().nullable(),
          avatarUrl: z.string().nullable(),
        })
        .nullable(),
    }),
    vendor: z.object({
      id: z.uuid(),
      userId: z.uuid(),
      businessName: z.string(),
      businessPhone: z.string().nullable(),
    }),
  })
  .refine((b) => b.customer.id === b.customerId);
export type VendorBooking = z.infer<typeof vendorBookingSchema>;
export const vendorBookingFiltersSchema = z
  .object({
    tab: z.enum(["REQUESTS", "ORDERS", "ALL"]).optional(),
    source: z.enum(["DIRECT", "COMMUNITY", "ALL"]).optional(),
    status: z
      .string()
      .refine(
        (s) =>
          s.split(",").some((v) => v.trim()) &&
          s
            .split(",")
            .filter((v) => v.trim())
            .every(
              (v) => bookingStatusSchema.safeParse(v.trim().toUpperCase()).success,
            ),
      )
      .optional(),
    foodTruckId: z.uuid().optional(),
  })
  .strict();
export type VendorBookingFilters = z.infer<typeof vendorBookingFiltersSchema>;
export const vendorBookingTrackingSchema = trackingSchema.extend({
  roleView: z.literal("VENDOR"),
  steps: z.array(
    z.object({
      key: z.enum([
        "BOOKING_CONFIRMED",
        "DEPOSIT",
        "EVENT_DAY",
        "COMPLETION_REQUEST_SENT",
        "COMPLETED",
      ]),
      label: z.string(),
      status: z.enum(["DONE", "CURRENT", "PENDING"]),
      completedAt: z.iso.datetime({ offset: true }).nullable(),
    }),
  ),
});
export type VendorBookingTracking = z.infer<typeof vendorBookingTrackingSchema>;
export const vendorDecisionBodySchema = z
  .object({ reason: z.string().trim().optional() })
  .strict()
  .transform((b) => (b.reason ? { reason: b.reason } : {}));
export function vendorDecisionAllowed(b: VendorBooking, action: "accept" | "reject") {
  return (
    !!b.endsAt &&
    (action === "accept"
      ? b.status === "PENDING"
      : ["PENDING", "ACCEPTED", "QUOTED"].includes(b.status))
  );
}
