import { z } from "zod";

export const signupSchema = z
  .object({
    name: z.string().min(2, "Full name is required."),
    businessName: z.string().min(2, "Business name is required."),
    address_Pickup_Location: z.string().min(2, "Pickup location is required."),
    phone: z.string().min(7, "Phone number is required."),
    email: z.email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });

export type SignupFormValues = z.infer<typeof signupSchema>;
