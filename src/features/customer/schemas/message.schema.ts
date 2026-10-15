import { z } from "zod";

export const messagePreviewSchema = z.object({
  body: z.string().trim().min(1, "Enter a message to preview. Nothing will be sent."),
});
export type MessagePreviewValues = z.infer<typeof messagePreviewSchema>;
