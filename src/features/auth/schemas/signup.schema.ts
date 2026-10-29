import { z } from "zod";

const email = z.email("Enter a valid email address.");
const password = z.string().min(8, "Password must be at least 8 characters.").max(128);
const dateOfBirth = z.iso.date("Enter a valid date of birth.");
// International format UX check; Nest's IsPhoneNumber remains authoritative.
const phone = z
  .string()
  .regex(
    /^\+[1-9]\d{6,14}$/,
    "Use international format, including + and country code.",
  );
const referralCode = z.string().trim().toUpperCase().max(50).optional();

export const registerCustomerSchema = z.strictObject({
  name: z.string().trim().min(2, "Full name is required.").max(150),
  email,
  password,
  dateOfBirth,
  referralCode,
});
export const registerVendorSchema = z.strictObject({
  email,
  phone,
  password,
  dateOfBirth: dateOfBirth.optional(),
  businessName: z.string().max(255).optional(),
  businessEmail: email.optional(),
  businessPhone: phone.optional(),
  description: z.string().optional(),
  websiteUrl: z.url().optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  displayName: z.string().max(150).optional(),
  timezone: z.string().max(100).optional(),
  referralCode,
});
export const verifyEmailSchema = z.strictObject({
  email,
  code: z.string().length(6, "Enter the six-character verification code."),
});
export const resendVerificationSchema = z.strictObject({ email });
export const pendingVerificationSchema = z.object({
  success: z.literal(true),
  status: z.literal("PENDING"),
  message: z.string(),
  email,
});

export const signupSchema = z
  .object({
    accountType: z.enum(["CUSTOMER", "VENDOR"]),
    name: z.string().trim().min(2, "Full name is required.").max(150),
    businessName: z.string().trim().max(255),
    phone: z.string(),
    dateOfBirth: z.string(),
    email,
    password,
    confirmPassword: z.string(),
  })
  .superRefine((values, context) => {
    if (values.password !== values.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords must match.",
      });
    }
    const result =
      values.accountType === "CUSTOMER"
        ? registerCustomerSchema.safeParse({
            name: values.name,
            email: values.email,
            password: values.password,
            dateOfBirth: values.dateOfBirth,
          })
        : registerVendorSchema.safeParse({
            email: values.email,
            password: values.password,
            phone: values.phone,
          });
    if (!result.success)
      for (const issue of result.error.issues)
        context.addIssue({ code: "custom", path: issue.path, message: issue.message });
  });
export type SignupFormValues = z.infer<typeof signupSchema>;
export const toCustomerRegistration = (values: SignupFormValues) =>
  registerCustomerSchema.parse({
    name: values.name,
    email: values.email.trim(),
    password: values.password,
    dateOfBirth: values.dateOfBirth,
  });
export const toVendorRegistration = (values: SignupFormValues) =>
  registerVendorSchema.parse({
    displayName: values.name,
    email: values.email.trim(),
    password: values.password,
    phone: values.phone,
    ...(values.businessName ? { businessName: values.businessName } : {}),
  });
