import { z } from "zod";
const profile = z
  .object({ displayName: z.string().nullable(), avatarUrl: z.string().nullable() })
  .nullable();
const user = z.object({ id: z.uuid(), profile });
export const communityCommentSchema = z.object({
  id: z.uuid(),
  parentCommentId: z.uuid().nullable(),
  content: z.string(),
  createdAt: z.iso.datetime({ offset: true }),
  user,
});
export const communityCommentsSchema = z.object({
  message: z.string(),
  items: z.array(communityCommentSchema),
  pagination: z.object({
    total: z.number().int().nonnegative(),
    limit: z.number().int().min(1).max(100),
    offset: z.number().int().nonnegative(),
    nextOffset: z.number().int().nonnegative().nullable(),
  }),
});
export const createdCommunityCommentSchema = z.object({
  message: z.string(),
  comment: communityCommentSchema.extend({
    communityRequestId: z.uuid(),
    userId: z.uuid(),
    deletedAt: z.null(),
  }),
});
export const communityReactionSchema = z.object({
  message: z.string(),
  reaction: z.object({
    id: z.uuid(),
    communityRequestId: z.uuid(),
    userId: z.uuid(),
    reaction: z.literal("LIKE"),
  }),
});
export const communityReportReasons = {
  "Spam or irrelevant": "SPAM_OR_IRRELEVANT",
  "Inappropriate content": "INAPPROPRIATE_CONTENT",
  Harassment: "HARASSMENT",
  "Scam or fraud": "SCAM_OR_FRAUD",
  "Not food truck related": "NOT_FOOD_TRUCK_RELATED",
} as const;
export const reportReasonSchema = z.enum([
  "SPAM_OR_IRRELEVANT",
  "INAPPROPRIATE_CONTENT",
  "HARASSMENT",
  "SCAM_OR_FRAUD",
  "NOT_FOOD_TRUCK_RELATED",
]);
export const communityReportedSchema = z.object({
  message: z.string(),
  report: z.object({
    id: z.uuid(),
    postId: z.uuid(),
    reason: reportReasonSchema,
    status: z.enum(["PENDING", "REVIEWING", "RESOLVED", "DISMISSED"]),
    createdAt: z.iso.datetime({ offset: true }),
  }),
});
export const communityInterestsSchema = z.object({
  message: z.string(),
  total: z.number().int().nonnegative(),
  items: z.array(
    z.object({
      id: z.uuid(),
      message: z.string().nullable(),
      createdAt: z.iso.datetime({ offset: true }),
      user: user.extend({
        vendor: z
          .object({
            id: z.uuid(),
            businessName: z.string(),
            logoUrl: z.string().nullable(),
            isVerified: z.boolean(),
          })
          .nullable(),
      }),
    }),
  ),
});
export const communityMessageSchema = z.object({ message: z.string().min(1) });
export const communityCommentInputSchema = z
  .object({
    content: z.string().trim().min(1, "Comment cannot be empty").max(2000),
    parentCommentId: z.uuid().optional(),
  })
  .strict();
export const communityInterestInputSchema = z
  .object({
    message: z
      .string()
      .trim()
      .min(1, "Enter an introduction before sending interest")
      .max(2000),
  })
  .strict();
export const communityInteractionInputSchema = z.discriminatedUnion("kind", [
  z
    .object({ kind: z.literal("comment"), ...communityCommentInputSchema.shape })
    .strict(),
  z.object({ kind: z.literal("react") }).strict(),
  z.object({ kind: z.literal("report"), reason: reportReasonSchema }).strict(),
  z.object({ kind: z.literal("ignore") }).strict(),
  z.object({ kind: z.literal("restore") }).strict(),
  z
    .object({ kind: z.literal("interest"), ...communityInterestInputSchema.shape })
    .strict(),
  z.object({ kind: z.literal("withdraw") }).strict(),
]);
export type CommunityComment = z.infer<typeof communityCommentSchema>;
export type CommunityComments = z.infer<typeof communityCommentsSchema>;
export type CommunityInterests = z.infer<typeof communityInterestsSchema>;
export type CommunityInteraction = z.infer<typeof communityInteractionInputSchema>;
export type CommunityInteractionResponse =
  | z.infer<typeof createdCommunityCommentSchema>
  | z.infer<typeof communityReactionSchema>
  | z.infer<typeof communityReportedSchema>
  | z.infer<typeof communityMessageSchema>;
