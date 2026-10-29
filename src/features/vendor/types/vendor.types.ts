import type { z } from "zod";
import type {
  vendorProfileSchema,
  vendorTrucksSchema,
  vendorAnalyticsSchema,
  vendorRequestCountsSchema,
  vendorQrSchema,
  vendorRecentBookingSchema,
} from "@/features/vendor/schemas/vendor.schema";

// HTTP DTOs inferred from runtime schemas; no shared response envelope is assumed.
export type VendorProfileResponse = z.infer<typeof vendorProfileSchema>;
export type VendorTrucksResponse = z.infer<typeof vendorTrucksSchema>;
export type VendorAnalyticsResponse = z.infer<typeof vendorAnalyticsSchema>;
export type VendorRequestCountsResponse = z.infer<typeof vendorRequestCountsSchema>;
export type VendorQrResponse = z.infer<typeof vendorQrSchema>;
export type VendorRecentBooking = z.infer<typeof vendorRecentBookingSchema>;
