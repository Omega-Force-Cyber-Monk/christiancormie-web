import { z } from "zod";
const nullableText = z.string().nullable();
export const socialUserSchema = z.object({
  userId: z.uuid(),
  accountType: z.enum(["CUSTOMER", "VENDOR"]),
  displayName: z.string(),
  avatarUrl: nullableText,
  vendorId: z.uuid().nullable(),
  foodTruckId: z.uuid().nullable(),
  foodTruckSlug: nullableText,
  isVerified: z.boolean(),
});
export const memberProfileSchema = socialUserSchema.extend({
  bio: nullableText,
  city: nullableText,
  state: nullableText,
  postCount: z.number().nonnegative(),
  followerCount: z.number().nonnegative(),
  followingCount: z.number().nonnegative(),
  isFollowing: z.boolean(),
});
export const socialPostSchema = z.object({
  id: z.uuid(),
  authorUserId: z.uuid().nullable().optional(),
  content: z.string(),
  createdAt: z.string(),
  publishedAt: nullableText.optional(),
  author: socialUserSchema.nullable(),
  media: z.array(
    z.object({
      id: z.uuid(),
      mediaType: z.string(),
      mediaUrl: z.string(),
      sortOrder: z.number().optional(),
    }),
  ),
});
export const memberPostsSchema = z.object({
  items: z.array(socialPostSchema),
  nextCursor: z.uuid().nullable(),
});
export const memberConnectionsSchema = z.object({
  items: z.array(
    socialUserSchema.extend({ followedAt: z.string(), isFollowing: z.boolean() }),
  ),
  total: z.number().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  nextOffset: z.number().int().nonnegative().nullable(),
});
export type MemberProfile = z.infer<typeof memberProfileSchema>;
export type SocialPost = z.infer<typeof socialPostSchema>;
