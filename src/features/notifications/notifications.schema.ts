import { z } from "zod";
const nullableId = z.uuid().nullable();
export const notificationSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  actorUserId: nullableId,
  type: z.enum([
    "GENERAL",
    "NEARBY_DROP",
    "FOLLOWED_TRUCK_UPDATE",
    "FAVORITE_TRUCK_UPDATE",
    "NEW_TRUCK_IN_AREA",
    "PROMOTION",
    "BOOKING",
    "PAYMENT",
    "MESSAGE",
    "REVIEW",
    "REWARD",
    "REFERRAL",
    "CHECK_IN",
    "BADGE",
    "ADMIN",
  ]),
  title: z.string(),
  message: z.string(),
  foodTruckId: nullableId,
  bookingId: nullableId,
  postId: nullableId,
  conversationId: nullableId,
  actionUrl: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  isRead: z.boolean(),
  readAt: z.iso.datetime({ offset: true }).nullable(),
  createdAt: z.iso.datetime({ offset: true }),
});
export const notificationListSchema = z
  .array(
    notificationSchema.extend({
      foodTruck: z
        .object({
          id: z.uuid(),
          name: z.string(),
          slug: z.string(),
          profileImageUrl: z.string().nullable(),
        })
        .nullable(),
      booking: z
        .object({ id: z.uuid(), bookingNumber: z.string(), status: z.string() })
        .nullable(),
      post: z.object({ id: z.uuid(), content: z.string().nullable() }).nullable(),
    }),
  )
  .refine((items) => new Set(items.map((n) => n.id)).size === items.length);
export type Notification = z.infer<typeof notificationSchema>;
export const notificationFiltersSchema = z
  .object({
    unreadOnly: z.boolean(),
    limit: z.number().int().min(1).max(50),
    offset: z.number().int().min(0),
  })
  .strict();
