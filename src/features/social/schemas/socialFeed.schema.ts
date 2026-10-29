import { z } from "zod";
import { socialPostSchema } from "./socialProfile.schema";
export const feedPostSchema = socialPostSchema.extend({
  likeCount: z.number().nonnegative(),
  commentCount: z.number().nonnegative(),
  shareCount: z.number().nonnegative(),
  viewCount: z.number().nonnegative().optional(),
  isLiked: z.boolean(),
  isSaved: z.boolean().optional(),
  location: z
    .object({ id: z.uuid(), name: z.string(), address: z.string().nullable() })
    .nullable()
    .optional(),
  vendor: z
    .object({ businessName: z.string(), logoUrl: z.string().nullable() })
    .nullable()
    .optional(),
  foodTruck: z
    .object({
      id: z.uuid(),
      name: z.string(),
      slug: z.string(),
      profileImageUrl: z.string().nullable(),
    })
    .nullable()
    .optional(),
});
export const feedSchema = z.object({
  items: z.array(feedPostSchema),
  nextCursor: z.string().nullable(),
});
export const uploadMediaSchema = z.object({
  media: z
    .array(
      z.object({
        mediaType: z.literal("IMAGE"),
        mediaUrl: z.url().refine((value) => /^https?:\/\//i.test(value)),
        sortOrder: z.number().int().nonnegative(),
      }),
    )
    .length(1),
});
export const createSocialPostSchema = z
  .object({
    content: z.string().trim().max(2200).optional(),
    foodTruckId: z.uuid().optional(),
    locationId: z.uuid().optional(),
    taggedUserIds: z
      .array(z.uuid({ version: "v4" }))
      .max(20)
      .optional(),
    status: z.literal("PUBLISHED"),
    media: z
      .array(
        z.object({
          mediaType: z.literal("IMAGE"),
          mediaUrl: z.url().refine((value) => /^https?:\/\//i.test(value)),
          sortOrder: z.number().int().nonnegative(),
        }),
      )
      .max(10)
      .optional(),
  })
  .strict()
  .refine((data) => Boolean(data.content?.trim() || data.media?.length), {
    message: "Write content or add an image.",
  });
const comment = z.object({
  id: z.uuid(),
  postId: z.uuid(),
  parentCommentId: z.uuid().nullable().optional(),
  content: z.string(),
  likeCount: z.number().nonnegative(),
  isLiked: z.boolean(),
  createdAt: z.string(),
  author: z.object({
    id: z.uuid(),
    displayName: z.string(),
    avatarUrl: z.string().nullable(),
  }),
});
export const commentSchema = comment;
export const commentsSchema = z.object({
  totalCount: z.number().nonnegative(),
  comments: z.array(comment.extend({ replies: z.array(comment) })),
});
export const shareSchema = z.object({
  success: z.literal(true),
  postId: z.uuid(),
  shareCount: z.number().nonnegative(),
  shareUrl: z.string(),
  shareText: z.string(),
});
export const placesSchema = z.array(
  z.object({ id: z.uuid(), name: z.string(), address: z.string().nullable() }),
);
export type FeedResponse = z.infer<typeof feedSchema>;
export type CreateSocialPost = z.infer<typeof createSocialPostSchema>;
export type UploadedMedia = z.infer<typeof uploadMediaSchema>["media"][number];
export type SocialComment = z.infer<typeof commentSchema>;
