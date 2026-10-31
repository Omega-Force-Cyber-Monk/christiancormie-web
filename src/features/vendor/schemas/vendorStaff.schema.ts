import { z } from "zod";

// Deliberately omit PIN material from the backend presenter before caching.
export const vendorStaffSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  status: z.enum(["ACTIVE", "DISABLED"]),
  addedAt: z.iso.datetime({ offset: true }),
});
export const vendorStaffListSchema = z.object({ items: z.array(vendorStaffSchema) });
export const vendorStaffChangeSchema = vendorStaffSchema.extend({
  message: z.string(),
});
export const vendorStaffDeleteSchema = z.object({
  deleted: z.literal(true),
  message: z.string(),
});
export type VendorStaff = z.infer<typeof vendorStaffSchema>;
