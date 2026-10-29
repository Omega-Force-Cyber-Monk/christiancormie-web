import { z } from "zod";

export const communityCategorySchema = z.enum([
  "NEED_TRUCK",
  "VENDOR_CALLOUT",
  "FOR_SALE",
  "HIRING_JOBS",
  "COMMUNITY_HELP",
  "COMMUNITY",
]);
const count = z.number().int().nonnegative().nullish();
const decimal = z
  .union([z.number().finite(), z.string().regex(/^\d+(\.\d+)?$/)])
  .nullish();
export const communityPostSchema = z.object({
  id: z.uuid(),
  category: communityCategorySchema,
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(["DRAFT", "OPEN", "MATCHED", "CLOSED", "CANCELLED", "EXPIRED"]),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  createdAt: z.iso.datetime({ offset: true }),
  eventType: z.string().nullish(),
  eventDate: z.string().nullish(),
  startTime: z.string().nullish(),
  endTime: z.string().nullish(),
  eventTimezone: z.string().nullish(),
  expiresAt: z.iso.datetime({ offset: true }).nullish(),
  allowPublicComments: z.boolean().optional(),
  preferredMenuItems: z.array(z.string()).nullish(),
  address: z.string().nullish(),
  guestCount: count,
  budgetMin: decimal,
  budgetMax: decimal,
  spotsOpen: count,
  attendanceMin: count,
  attendanceMax: count,
  distanceKm: z.number().finite().nonnegative().nullish(),
  media: z
    .array(z.object({ id: z.uuid(), mediaUrl: z.string(), mediaType: z.string() }))
    .nullish(),
  author: z
    .object({
      id: z.uuid(),
      displayName: z.string().nullable(),
      avatarUrl: z.string().nullable(),
      roles: z.array(z.string()),
      vendor: z
        .object({
          businessName: z.string(),
          logoUrl: z.string().nullable(),
          isVerified: z.boolean(),
        })
        .nullable(),
    })
    .nullable(),
  counts: z
    .object({
      comments: count,
      reactions: count,
      offers: count,
      interestedVendors: count,
    })
    .nullish(),
  viewer: z
    .object({ isOwner: z.boolean(), isIgnored: z.boolean(), isInterested: z.boolean() })
    .nullish(),
  allowedActions: z
    .object({
      canEdit: z.boolean(),
      canDelete: z.boolean(),
      canQuote: z.boolean(),
      canSendInterest: z.boolean(),
    })
    .nullish(),
});
export const communityListSchema = z.object({
  message: z.string(),
  items: z.array(communityPostSchema),
  pagination: z.object({
    total: z.number().int().nonnegative(),
    limit: z.number().int().min(1).max(100),
    offset: z.number().int().nonnegative(),
    nextOffset: z.number().int().nonnegative().nullable(),
  }),
});
export const communityDetailSchema = z.object({
  message: z.string(),
  post: communityPostSchema,
});
export const communityQuerySchema = z
  .object({
    category: communityCategorySchema.optional(),
    tab: z.enum(["ALL", "MINE", "REQUESTS"]).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    radiusKm: z.number().int().min(1).max(500).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    offset: z.number().int().min(0).max(100000).optional(),
  })
  .strict()
  .refine(
    (v) => (v.latitude === undefined) === (v.longitude === undefined),
    "Coordinates must be provided together",
  )
  .refine(
    (v) => v.radiusKm === undefined || v.latitude !== undefined,
    "Radius requires coordinates",
  )
  .refine(
    (v) =>
      v.tab !== "REQUESTS" ||
      !v.category ||
      ["NEED_TRUCK", "VENDOR_CALLOUT"].includes(v.category),
    "Unsupported Requests category",
  );
export type CommunityPost = z.infer<typeof communityPostSchema>;
export type CommunityList = z.infer<typeof communityListSchema>;
export type CommunityCategory = z.infer<typeof communityCategorySchema>;
export type CommunityQuery = z.infer<typeof communityQuerySchema>;
