import { z } from "zod";
import { passwordFieldsSchema } from "@/features/account/schemas/account.schema";
export const vendorStaffEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid staff email address.")),
});
export type VendorStaffEmailValues = z.infer<typeof vendorStaffEmailSchema>;
export const vendorStaffPinSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, "Enter exactly four numeric digits."),
});
export const createVendorStaffSchema = vendorStaffEmailSchema.extend(
  vendorStaffPinSchema.shape,
);
export type CreateVendorStaffValues = z.infer<typeof createVendorStaffSchema>;
export type VendorStaffPinValues = z.infer<typeof vendorStaffPinSchema>;
export const vendorPasswordPreviewSchema = passwordFieldsSchema;
export type VendorPasswordPreviewValues = z.infer<typeof vendorPasswordPreviewSchema>;
