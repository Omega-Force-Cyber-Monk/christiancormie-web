import { z } from "zod";
import {
  profileCapacityOptions,
  profileCuisineOptions,
  profileDays,
} from "@/features/vendor/data/profile.data";
const time = /^([01]\d|2[0-3]):[0-5]\d$/;
export const vendorProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a truck name.")
    .max(50, "Use no more than 50 characters."),
  handle: z
    .string()
    .trim()
    .transform((v) => v.replace(/^@/, ""))
    .pipe(
      z
        .string()
        .min(1, "Enter a handle.")
        .regex(
          /^[A-Za-z0-9_.-]+$/,
          "Use letters, numbers, periods, underscores or hyphens.",
        ),
    ),
  motto: z.string().trim(),
  location: z.string().trim().min(1, "Enter a location."),
  capacity: z.enum(profileCapacityOptions),
  cuisines: z.array(
    z
      .string()
      .refine(
        (v) => profileCuisineOptions.some((c) => c.id === v),
        "Select a listed cuisine.",
      ),
  ),
  hours: z
    .array(
      z
        .object({
          day: z.enum(profileDays),
          enabled: z.boolean(),
          opens: z.string(),
          closes: z.string(),
        })
        .superRefine((value, ctx) => {
          if (!value.enabled) return;
          if (!time.test(value.opens))
            ctx.addIssue({
              code: "custom",
              path: ["opens"],
              message: "Enter a valid opening time.",
            });
          if (!time.test(value.closes))
            ctx.addIssue({
              code: "custom",
              path: ["closes"],
              message: "Enter a valid closing time.",
            });
        }),
    )
    .length(7)
    .refine(
      (hours) => new Set(hours.map((h) => h.day)).size === 7,
      "Provide one schedule for every day.",
    ),
});
export type VendorProfileValues = z.infer<typeof vendorProfileSchema>;
export const vendorMenuItemSchema = z.object({
  name: z.string().trim().min(1, "Enter an item name."),
  price: z
    .string()
    .trim()
    .regex(/^\d+(?:\.\d{1,2})?$/, "Enter a nonnegative price with up to two decimals.")
    .refine(
      (v) => Number.isSafeInteger(Math.round(Number(v) * 100)),
      "Price is too large.",
    ),
  description: z
    .string()
    .max(120, "Use no more than 120 characters.")
    .transform((v) => v.trim()),
});
export type VendorMenuValues = z.infer<typeof vendorMenuItemSchema>;
