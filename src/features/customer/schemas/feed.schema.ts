import { z } from "zod";

export const feedCommentSchema = z.object({
  comment: z.string().trim().min(1, "Enter a comment to preview."),
});

export type FeedCommentValues = z.infer<typeof feedCommentSchema>;
