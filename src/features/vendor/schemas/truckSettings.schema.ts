import { z } from "zod";
import { profileDays } from "../data/profile.data";
export const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
export const operatingHourSchema = z
  .strictObject({
    dayOfWeek: z.number().int().min(0).max(6),
    isClosed: z.boolean(),
    openingTime: z.string().regex(timePattern).optional(),
    closingTime: z.string().regex(timePattern).optional(),
  })
  .refine((h) => h.isClosed || Boolean(h.openingTime && h.closingTime));
export const truckSettingsPatchSchema = z
  .strictObject({
    name: z.string().trim().min(1).max(255).optional(),
    handle: z
      .string()
      .max(80)
      .regex(/^[A-Za-z0-9._-]+$/)
      .optional(),
    description: z.string().optional(),
    profileImageUrl: z.url().optional(),
    cuisines: z
      .array(z.strictObject({ cuisineId: z.uuid(), isPrimary: z.boolean() }))
      .min(1)
      .refine((v) => new Set(v.map((c) => c.cuisineId)).size === v.length)
      .optional(),
    operatingHours: z
      .array(operatingHourSchema)
      .refine((v) => new Set(v.map((h) => h.dayOfWeek)).size === v.length)
      .optional(),
  })
  .refine((v) => Object.keys(v).length > 0);
export const truckProfileFormSchema = z.object({
  name: z.string().trim().min(1).max(255),
  handle: z
    .string()
    .trim()
    .max(80)
    .refine(
      (s) => !s || /^[A-Za-z0-9._-]+$/.test(s),
      "Use letters, digits, dots, underscores or hyphens; no @.",
    ),
  motto: z.string(),
  location: z.string(),
  capacity: z.string(),
  cuisines: z.array(z.uuid()),
  hours: z
    .array(
      z
        .object({
          day: z.enum(profileDays),
          enabled: z.boolean(),
          opens: z.string(),
          closes: z.string(),
        })
        .refine(
          (h) =>
            !h.enabled || (timePattern.test(h.opens) && timePattern.test(h.closes)),
          "Open days need valid HH:mm opening and closing times.",
        ),
    )
    .length(7),
});
export type TruckProfileForm = z.infer<typeof truckProfileFormSchema>;
export const cuisineCatalogSchema = z.array(
  z.object({
    id: z.uuid(),
    name: z.string(),
    slug: z.string(),
    iconUrl: z.string().nullable().optional(),
  }),
);
