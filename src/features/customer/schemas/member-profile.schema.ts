import { z } from "zod";
export const memberProfileEditSchema = z.object({
  name: z.string().trim().min(1, "Enter a profile name."),
});
export type MemberProfileEditValues = z.infer<typeof memberProfileEditSchema>;
