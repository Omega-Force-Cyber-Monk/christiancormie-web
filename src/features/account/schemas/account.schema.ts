import { z } from "zod";
export const profilePatchSchema = z
  .strictObject({
    displayName: z.string().max(150).optional(),
    email: z.email().optional(),
    phone: z.string().max(30).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "No supported profile changes.");
export const editableProfileSchema = z.object({
  displayName: z.string().trim().max(150),
  email: z.email("Enter a valid email address."),
  phone: z.string().trim().max(30),
});
export const passwordFieldsSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(
        /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
        "Use uppercase, lowercase, and a number or special character.",
      ),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .superRefine((v, c) => {
    if (v.newPassword !== v.confirmPassword)
      c.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords must match.",
      });
    if (v.newPassword === v.currentPassword)
      c.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "Choose a different new password.",
      });
  });
export const changePasswordSchema = z
  .strictObject({
    currentPassword: z.string(),
    newPassword: z.string(),
    confirmNewPassword: z.string(),
  })
  .refine(
    (v) =>
      passwordFieldsSchema.safeParse({
        currentPassword: v.currentPassword,
        newPassword: v.newPassword,
        confirmPassword: v.confirmNewPassword,
      }).success,
  );
export const leadSchema = z.strictObject({
  truckName: z.string().trim().min(1).max(255),
  ownerPhone: z.string().max(30).optional(),
  notes: z.string().optional(),
});
export type EditableProfile = z.infer<typeof editableProfileSchema>;
export type PasswordFields = z.infer<typeof passwordFieldsSchema>;
