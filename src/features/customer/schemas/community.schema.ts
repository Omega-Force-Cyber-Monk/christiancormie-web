import { z } from "zod";

export const communityLocationSchema = z.object({
  city: z.string().trim().min(1, "Enter a city to preview."),
});
export type CommunityLocationValues = z.infer<typeof communityLocationSchema>;

export const communityPostSchema = z.object({
  category: z.enum(["Community", "Need a truck", "Callout", "For sale"]),
  body: z.string().trim().min(1, "Enter a post to preview."),
});
export type CommunityPostValues = z.infer<typeof communityPostSchema>;

export const communityReportReasons = [
  "Spam or irrelevant",
  "Inappropriate content",
  "Harassment",
  "Scam or fraud",
  "Not food truck related",
] as const;
export const communityReportSchema = z.object({
  reason: z.enum(communityReportReasons),
});
export type CommunityReportValues = z.infer<typeof communityReportSchema>;
