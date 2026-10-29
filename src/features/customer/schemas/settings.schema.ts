import { z } from "zod";
import { passwordFieldsSchema } from "@/features/account/schemas/account.schema";

export const settingsProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required."),
  displayName: z.string().trim(),
  bio: z.string().trim(),
  email: z.email("Enter a valid email address."),
  phone: z.string().trim().min(7, "Enter a valid phone number."),
});
export type SettingsProfileValues = z.infer<typeof settingsProfileSchema>;

export const settingsPasswordSchema = passwordFieldsSchema;
export type SettingsPasswordValues = z.infer<typeof settingsPasswordSchema>;

export const truckRequestSchema = z.object({
  truckName: z.string().trim().min(1, "Enter the truck name.").max(255),
  location: z.string().trim().min(1, "Enter the usual location."),
  phone: z.string().trim().max(30),
  description: z.string().trim(),
  reason: z.string().trim(),
});
export type TruckRequestValues = z.infer<typeof truckRequestSchema>;
export const settingsIssueSchema = z.object({
  subject: z.string().trim().min(1, "Enter a subject."),
  message: z.string().trim().min(1, "Describe your issue."),
});
export type SettingsIssueValues = z.infer<typeof settingsIssueSchema>;
export const settingsMessageSchema = z
  .object({ text: z.string().trim(), attachment: z.custom<File | null>() })
  .refine((values) => Boolean(values.text || values.attachment), {
    path: ["text"],
    message: "Enter a message or attach a photo.",
  });
export type SettingsMessageValues = z.infer<typeof settingsMessageSchema>;
