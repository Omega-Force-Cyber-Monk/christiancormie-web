import { z } from "zod";

export const dropHours = [1, 2, 3, 4, 5, 6, 8, 12] as const;
export const dropMinutes = [0, 15, 30, 45] as const;
export const dropDurationSchema = z.object({
  hours: z
    .number()
    .refine(
      (value) => dropHours.some((hour) => hour === value),
      "Choose one of the available hours.",
    ),
  minutes: z
    .number()
    .refine(
      (value) => dropMinutes.some((minute) => minute === value),
      "Choose one of the available minutes.",
    ),
});
export type CustomDropDuration = z.infer<typeof dropDurationSchema>;
export const countPromoWords = (text: string) =>
  text.trim() ? text.trim().split(/\s+/u).length : 0;
export const dropPromoSchema = z
  .object({
    name: z.string().trim().min(1, "Enter a promo name."),
    message: z
      .string()
      .trim()
      .min(1, "Enter a message for customers.")
      .refine((text) => countPromoWords(text) <= 25, "Use 25 words or fewer."),
    hasDuration: z.boolean(),
    hours: z.number(),
    minutes: z.number(),
  })
  .superRefine((values, context) => {
    if (!values.hasDuration) return;
    const parsed = dropDurationSchema.safeParse(values);
    if (!parsed.success)
      for (const issue of parsed.error.issues)
        context.addIssue({ code: "custom", path: issue.path, message: issue.message });
  });
export type DropPromoValues = z.infer<typeof dropPromoSchema>;
