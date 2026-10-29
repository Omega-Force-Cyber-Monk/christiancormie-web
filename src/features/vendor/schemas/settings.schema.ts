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
export const vendorPasswordPreviewSchema = passwordFieldsSchema;
export type VendorPasswordPreviewValues = z.infer<typeof vendorPasswordPreviewSchema>;
