import { z } from "zod";
import type { CustomerBookingDetail } from "./booking.schema";
const date = z.iso.datetime({ offset: true });
export const issueMessageInputSchema = z
  .object({
    message: z
      .string()
      .trim()
      .min(1, "Please enter a message.")
      .max(2000, "Message must be 2000 characters or less."),
  })
  .strict();
export const bookingIssueSchema = z.object({
  id: z.uuid(),
  bookingId: z.uuid(),
  status: z.enum(["OPEN", "RESOLVED", "DISMISSED"]),
  message: z.string(),
  resolutionDecision: z.enum(["RELEASE_PAYOUT", "FULL_REFUND"]).nullable(),
  resolutionNote: z.string().nullable(),
  resolvedById: z.uuid().nullable(),
  createdAt: date,
  resolvedAt: date.nullable(),
});
export const bookingIssueMessageSchema = z.object({
  id: z.uuid(),
  senderUserId: z.uuid().nullable(),
  senderRole: z.enum(["CUSTOMER", "VENDOR", "ADMIN"]),
  senderName: z.string(),
  message: z.string(),
  createdAt: date,
});
export const bookingIssuesSchema = z.object({
  items: z.array(
    bookingIssueSchema.safeExtend({
      messagesCount: z.number().int().nonnegative(),
      lastMessage: bookingIssueMessageSchema.nullable(),
      messages: z.array(bookingIssueMessageSchema),
    }),
  ),
});
export const bookingIssueThreadSchema = z.object({
  issue: bookingIssueSchema,
  messages: z.array(bookingIssueMessageSchema),
});
export const createdBookingIssueSchema = z.object({
  message: z.string(),
  issue: bookingIssueSchema,
});
export const sentBookingIssueMessageSchema = z.object({
  message: z.string(),
  item: bookingIssueMessageSchema,
});
export type BookingIssue = z.infer<typeof bookingIssueSchema>;
export type BookingIssues = z.infer<typeof bookingIssuesSchema>;
export type BookingIssueThread = z.infer<typeof bookingIssueThreadSchema>;
export type CreatedBookingIssue = z.infer<typeof createdBookingIssueSchema>;
export type SentBookingIssueMessage = z.infer<typeof sentBookingIssueMessageSchema>;
export function canCreateBookingIssue(
  booking: CustomerBookingDetail,
  issues: BookingIssues,
) {
  return (
    !!booking.completionRequestedAt &&
    !booking.completedAt &&
    booking.status !== "COMPLETED" &&
    !issues.items.some((i) => i.status === "OPEN")
  );
}
