import { z } from "zod";

export const staffLoginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
  pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits."),
});
export type StaffLoginValues = z.infer<typeof staffLoginSchema>;
