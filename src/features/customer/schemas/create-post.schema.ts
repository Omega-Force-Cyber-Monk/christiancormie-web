import { z } from "zod";
import type { PostMedia } from "@/features/customer/data/create-post.data";

export const createPostSchema = z
  .object({
    text: z.string().trim().max(2200),
    media: z.array(z.custom<PostMedia>()),
    locationId: z.string(),
    friendIds: z.array(z.string()),
  })
  .superRefine((draft, context) => {
    if (!draft.text && !draft.media.length) {
      context.addIssue({
        code: "custom",
        path: ["text"],
        message: "Write something or add a photo before posting.",
      });
    }
  });
