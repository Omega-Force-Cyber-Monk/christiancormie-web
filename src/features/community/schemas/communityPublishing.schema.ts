import { z } from "zod";
import { communityCategorySchema, communityPostSchema } from "./community.schema";
import { remoteMedia } from "@/utils/files/remoteMedia";
export const communityMediaSchema = z
  .object({
    mediaUrl: z
      .string()
      .refine(
        (v) => v.startsWith("https://") && !!remoteMedia(v),
        "Attachments require a safe HTTPS URL",
      ),
    mediaType: z.enum(["IMAGE", "PDF"]),
  })
  .strict();
export const communityEventTypes = [
  "CORPORATE_EVENT",
  "BIRTHDAY_PARTY",
  "WEDDING_RECEPTION",
  "GRADUATION_PARTY",
  "COMMUNITY_EVENT",
  "FUNDRAISER",
  "OTHER",
] as const;
const date = z
  .string()
  .refine(
    (v) =>
      /^\d{4}-\d{2}-\d{2}$/.test(v) &&
      Number.isFinite(Date.parse(`${v}T00:00:00Z`)) &&
      new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v,
    "Enter a valid date",
  );
const amount = z.number().finite().min(0).max(9999999999.99);
const fields = z
  .object({
    category: communityCategorySchema,
    title: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().min(1).max(5000),
    eventType: z.enum(communityEventTypes).optional(),
    eventDate: date.optional(),
    startTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .optional(),
    address: z.string().trim().min(1).optional(),
    guestCount: z.number().int().min(1).max(2147483647).optional(),
    budgetMin: amount.optional(),
    budgetMax: amount.optional(),
    preferredMenuItems: z.array(z.string().trim().min(1).max(150)).max(30).optional(),
    media: z.array(communityMediaSchema).max(5).optional(),
  })
  .strict();
export const createCommunitySchema = fields.superRefine((v, c) => {
  if (v.category === "FOR_SALE" && !v.title)
    c.addIssue({ code: "custom", path: ["title"], message: "Enter the item name" });
  if (v.category === "NEED_TRUCK")
    for (const key of [
      "eventType",
      "eventDate",
      "startTime",
      "address",
      "guestCount",
    ] as const)
      if (!v[key])
        c.addIssue({ code: "custom", path: [key], message: `${key} is required` });
  if (
    v.budgetMin !== undefined &&
    v.budgetMax !== undefined &&
    v.budgetMin > v.budgetMax
  )
    c.addIssue({
      code: "custom",
      path: ["budgetMin"],
      message: "Minimum budget cannot exceed maximum",
    });
  if (v.eventDate && v.eventDate < new Date().toISOString().slice(0, 10))
    c.addIssue({
      code: "custom",
      path: ["eventDate"],
      message: "Event date cannot be in the past",
    });
});
export const updateCommunitySchema = fields
  .omit({ category: true })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "No changes to save")
  .refine(
    (v) =>
      v.budgetMin === undefined ||
      v.budgetMax === undefined ||
      v.budgetMin <= v.budgetMax,
    "Minimum budget cannot exceed maximum",
  )
  .refine(
    (v) => !v.eventDate || v.eventDate >= new Date().toISOString().slice(0, 10),
    "Event date cannot be in the past",
  );
export const communityCreateResponseSchema = z.object({
  message: z.string(),
  post: communityPostSchema,
  rewardStatus: z.enum(["AWARDED", "NOT_AWARDED", "UNCONFIRMED"]),
  rewardMessage: z.string().optional(),
});
export const communityUploadResponseSchema = z.object({
  message: z.string(),
  media: z.array(communityMediaSchema).min(1).max(5),
});
export const communityDeleteResponseSchema = z.object({
  message: z.string(),
  deleted: z.literal(true),
});
export type CommunityWrite = z.infer<typeof createCommunitySchema>;
export type CommunityPatch = z.infer<typeof updateCommunitySchema>;
export type CommunityMedia = z.infer<typeof communityMediaSchema>;
export type CommunityCreated = z.infer<typeof communityCreateResponseSchema>;
