import { z } from "zod";
export const operatingStatusSchema = z.enum(["OPEN", "CLOSED", "BUSY", "UNAVAILABLE"]);
const date = z.iso.datetime({ offset: true });
const coordinates = {
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
};
export const locationInputSchema = z
  .object({
    ...coordinates,
    address: z.string().optional(),
    validForMinutes: z.number().int().min(1).max(1440).optional(),
  })
  .strict();
export const dropInputSchema = z
  .object({
    ...coordinates,
    address: z.string().optional(),
    title: z.string().max(255).optional(),
    message: z.string().optional(),
    durationMinutes: z.number().int().min(1).max(1440),
  })
  .strict();
export const locationResultSchema = z.object({
  id: z.uuid(),
  currentAddress: z.string().nullable(),
  ...coordinates,
  locationUpdatedAt: date,
  locationValidUntil: date.nullable(),
  operatingStatus: operatingStatusSchema,
});
export const dropResultSchema = z.object({
  id: z.uuid(),
  foodTruckId: z.uuid(),
  title: z.string().nullable(),
  message: z.string().nullable(),
  address: z.string().nullable(),
  ...coordinates,
  startsAt: date,
  endsAt: date.nullable(),
  status: z.enum(["SCHEDULED", "ACTIVE", "COMPLETED", "CANCELLED"]),
  createdAt: date,
});
export type ServerDrop = z.infer<typeof dropResultSchema>;
export type DropInput = z.infer<typeof dropInputSchema>;
export const promotionTypeSchema = z.enum([
  "PERCENTAGE",
  "FIXED_AMOUNT",
  "FREE_ITEM",
  "CUSTOM",
]);
const amount = z.number().finite().min(0);
const promotionFields = {
  title: z.string().max(255),
  description: z.string().optional(),
  type: promotionTypeSchema,
  value: amount.optional(),
  couponCode: z.string().max(100).optional(),
  minimumSpend: amount.optional(),
  maximumDiscount: amount.optional(),
  isFollowerOnly: z.boolean().optional(),
  usageLimit: z.number().int().min(1).optional(),
  startsAt: date,
  endsAt: date,
  isActive: z.boolean().optional(),
};
export const promotionInputSchema = z
  .object(promotionFields)
  .strict()
  .refine(
    (p) => Date.parse(p.startsAt) < Date.parse(p.endsAt),
    "Start must precede end",
  )
  .refine(
    (p) => p.type !== "PERCENTAGE" || p.value === undefined || p.value <= 100,
    "Percentage cannot exceed 100",
  );
export const promotionPatchSchema = z
  .object(promotionFields)
  .partial()
  .extend({
    description: z.string().nullable().optional(),
    couponCode: z.string().max(100).nullable().optional(),
    value: amount.nullable().optional(),
    minimumSpend: amount.nullable().optional(),
    maximumDiscount: amount.nullable().optional(),
    usageLimit: z.number().int().min(1).nullable().optional(),
  })
  .strict()
  .refine((p) => Object.keys(p).length > 0);
const decimal = z
  .string()
  .regex(/^-?\d+(\.\d+)?$/)
  .nullable();
export const managedPromotionSchema = z.object({
  id: z.uuid(),
  foodTruckId: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  type: promotionTypeSchema,
  value: decimal,
  couponCode: z.string().nullable(),
  minimumSpend: decimal,
  maximumDiscount: decimal,
  isFollowerOnly: z.boolean(),
  usageLimit: z.number().int().positive().nullable(),
  startsAt: date,
  endsAt: date,
  isActive: z.boolean(),
});
export const managedPromotionsSchema = z.array(managedPromotionSchema);
export type ManagedPromotion = z.infer<typeof managedPromotionSchema>;
export type PromotionInput = z.infer<typeof promotionInputSchema>;
export function durationMinutes(hours: number, minutes: number) {
  const total = hours * 60 + minutes;
  return Number.isInteger(hours) &&
    hours >= 0 &&
    Number.isInteger(minutes) &&
    minutes >= 0 &&
    minutes <= 59 &&
    total >= 1 &&
    total <= 1440
    ? total
    : null;
}
export function parseDropCoordinates(latitude: string, longitude: string) {
  if (!latitude.trim() || !longitude.trim()) return null;
  const r = locationInputSchema.safeParse({
    latitude: Number(latitude),
    longitude: Number(longitude),
  });
  return r.success ? { latitude: r.data.latitude, longitude: r.data.longitude } : null;
}
