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

export const communityPostTypes = [
  "Need a truck",
  "Callout",
  "For sale",
  "Hiring / jobs",
  "Community help",
  "Community",
] as const;
export const communityEventTypes = [
  "Corporate Event",
  "Birthday Party",
  "Wedding Reception",
  "Graduation Party",
  "Community Event",
  "Fundraiser",
  "Other",
] as const;
export const communityMenuChoices = [
  "Tacos",
  "Burgers",
  "Pizza",
  "BBQ",
  "Asian Cuisine",
  "Vegan Options",
  "Vegetarian",
  "Seafood",
  "Desserts",
  "Beverages",
  "Sandwiches",
  "Pasta",
];
export const communityComposerSchema = z
  .object({
    category: z.enum(communityPostTypes),
    body: z.string().trim().min(1, "Describe your post.").max(5000),
    itemName: z.string().trim().max(200),
    eventType: z.string(),
    date: z.string(),
    time: z.string(),
    location: z.string().trim(),
    guests: z.string(),
    budget: z.string().trim(),
    menus: z.array(z.string()),
  })
  .superRefine((values, ctx) => {
    const error = (field: keyof typeof values, message: string) =>
      ctx.addIssue({ code: "custom", path: [field], message });
    if (values.category === "For sale" && !values.itemName)
      error("itemName", "Enter the item name.");
    if (values.category !== "Need a truck") return;
    if (!communityEventTypes.some((value) => value === values.eventType))
      error("eventType", "Select an event type.");
    const date = new Date(`${values.date}T00:00:00Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(values.date) ||
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== values.date
    )
      error("date", "Enter a valid event date.");
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(values.time))
      error("time", "Enter a valid event time.");
    if (!values.location) error("location", "Enter the event location.");
    if (
      !/^[1-9]\d*$/.test(values.guests) ||
      !Number.isSafeInteger(Number(values.guests))
    )
      error("guests", "Enter a positive whole guest count.");
    if (!values.budget) error("budget", "Enter the budget range.");
  });
export type CommunityComposerValues = z.infer<typeof communityComposerSchema>;
export const emptyCommunityComposer: CommunityComposerValues = {
  category: "Community",
  body: "",
  itemName: "",
  eventType: "",
  date: "",
  time: "",
  location: "",
  guests: "",
  budget: "",
  menus: [],
};
export const communityIssueSchema = z.object({
  details: z.string().trim().min(1, "Please describe the issue.").max(2000),
});
export const communityQuoteConsentSchema = z.object({
  terms: z.boolean().refine(Boolean, "Acknowledge the booking terms preview."),
  deposit: z.boolean().refine(Boolean, "Acknowledge the deposit preview."),
});
