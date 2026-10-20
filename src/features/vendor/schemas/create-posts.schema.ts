import { z } from "zod";
import {
  truckEventTypes,
  truckMenuOptions,
} from "@/features/vendor/data/create-posts.data";

export const generalPostSchema = z
  .object({
    category: z.enum(["callout", "sale", "jobs", "help", "community"]),
    title: z.string().trim(),
    description: z.string().trim().min(1, "Describe your post before saving it."),
  })
  .superRefine((values, ctx) => {
    if (values.category === "sale" && !values.title)
      ctx.addIssue({ code: "custom", path: ["title"], message: "Enter an item name." });
  });
export type GeneralPostValues = z.infer<typeof generalPostSchema>;
export const isRealEventDate = (date: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === date;
};
export function parsePostBudget(
  value: string,
): { low: number; high: number } | undefined {
  const match =
    /^\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:[-\u2013]\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?))?\s*$/.exec(
      value,
    );
  if (!match) return;
  const low = Math.round(Number(match[1].replaceAll(",", "")) * 100);
  const high = match[2] ? Math.round(Number(match[2].replaceAll(",", "")) * 100) : low;
  if (!Number.isSafeInteger(low) || !Number.isSafeInteger(high) || low > high) return;
  return { low, high };
}
export const truckPostSchema = z.object({
  eventType: z
    .string()
    .refine((v) => truckEventTypes.some((t) => t === v), "Select an event type."),
  date: z.string().refine(isRealEventDate, "Enter a valid event date."),
  time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Enter a valid event time."),
  location: z.string().trim().min(1, "Enter the event location."),
  guests: z
    .string()
    .trim()
    .regex(/^\d+$/, "Enter a whole number of guests.")
    .refine(
      (v) => Number.isSafeInteger(Number(v)) && Number(v) > 0,
      "Enter a positive number of guests.",
    ),
  budget: z
    .string()
    .trim()
    .refine(
      (v) => !!parsePostBudget(v),
      "Enter a valid budget or range, e.g. $500-800. Minimum cannot exceed maximum.",
    ),
  description: z.string().trim().min(1, "Describe your event."),
  menus: z.array(
    z
      .string()
      .refine(
        (v) => truckMenuOptions.some((m) => m.label === v),
        "Choose a listed menu item.",
      ),
  ),
});
export type TruckPostValues = z.infer<typeof truckPostSchema>;
export const emptyTruckPost = (): TruckPostValues => ({
  eventType: "",
  date: "",
  time: "",
  location: "",
  guests: "",
  budget: "",
  description: "",
  menus: [],
});
