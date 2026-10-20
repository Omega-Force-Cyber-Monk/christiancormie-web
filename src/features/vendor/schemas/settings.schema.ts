import { z } from "zod";
export const vendorStaffEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid staff email address.")),
});
export type VendorStaffEmailValues = z.infer<typeof vendorStaffEmailSchema>;
export const vendorPasswordPreviewSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().min(1, "Enter a new password."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .superRefine((values, context) => {
    if (values.newPassword !== values.confirmPassword)
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    if (values.currentPassword && values.currentPassword === values.newPassword)
      context.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "Choose a different new password.",
      });
  });
export type VendorPasswordPreviewValues = z.infer<typeof vendorPasswordPreviewSchema>;
