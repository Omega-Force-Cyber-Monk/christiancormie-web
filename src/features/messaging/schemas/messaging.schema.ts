import { z } from "zod";

const id = z.uuid();
const date = z.iso.datetime({ offset: true });
export const recipientSchema = z.object({
  id,
  accountType: z.enum(["CUSTOMER", "VENDOR"]),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  vendor: z
    .object({
      id,
      businessName: z.string(),
      logoUrl: z.string().nullable(),
      foodTruck: z
        .object({
          id,
          name: z.string(),
          slug: z.string(),
          profileImageUrl: z.string().nullable(),
        })
        .nullable(),
    })
    .nullable(),
});
// Email is deliberately excluded from the client cache/presentation.
export const messageSchema = z
  .object({
    id,
    conversationId: id,
    senderId: id,
    messageType: z.enum(["TEXT", "IMAGE", "FILE", "SYSTEM", "OFFER"]),
    content: z.string().nullable(),
    attachmentUrl: z.string().nullable(),
    createdAt: date,
    editedAt: date.nullable(),
    sender: recipientSchema.nullable(),
  })
  .refine((m) => !m.sender || m.sender.id === m.senderId);
const participantSchema = z
  .object({
    id,
    userId: id,
    lastReadAt: date.nullable(),
    isMuted: z.boolean(),
    user: recipientSchema.nullable(),
  })
  .refine((p) => !p.user || p.user.id === p.userId);
export const conversationSchema = z
  .object({
    id,
    type: z.enum(["DIRECT", "BOOKING", "COMMUNITY_REQUEST", "SUPPORT"]),
    title: z.string().nullable(),
    isClosed: z.boolean(),
    directStatus: z.enum(["ACTIVE", "REQUESTED", "DECLINED"]),
    requestedRecipientId: id.nullable(),
    acceptedAt: date.nullable(),
    createdAt: date,
    lastMessageAt: date.nullable(),
    unreadCount: z.number().int().nonnegative(),
    messageCount: z.number().int().nonnegative(),
    otherParticipant: participantSchema.nullable(),
    participants: z.array(participantSchema).min(1),
    lastMessage: messageSchema.nullable(),
  })
  .refine(
    (c) =>
      (!c.lastMessage || c.lastMessage.conversationId === c.id) &&
      (!c.otherParticipant ||
        c.participants.some((p) => p.userId === c.otherParticipant?.userId)),
  );
const paging = {
  total: z.number().int().nonnegative(),
  nextOffset: z.number().int().nonnegative().nullable(),
};
export const conversationsSchema = z.object({
  items: z.array(conversationSchema),
  ...paging,
});
export const recipientsSchema = z.object({
  items: z.array(recipientSchema.nullable()),
  ...paging,
});
export const messagesSchema = z.object({ items: z.array(messageSchema), ...paging });
export const directConversationSchema = z
  .strictObject({
    participantUserId: id.optional(),
    vendorId: id.optional(),
    foodTruckId: id.optional(),
    title: z.string().max(255).optional(),
  })
  .refine(
    (v) =>
      [v.participantUserId, v.vendorId, v.foodTruckId].filter(Boolean).length === 1,
  );
export const textMessageSchema = z.strictObject({
  messageType: z.literal("TEXT"),
  content: z.string().max(5000).trim().min(1, "Enter a message."),
});
export const composerSchema = z.object({
  content: z
    .string()
    .max(5000, "Use at most 5,000 characters.")
    .trim()
    .min(1, "Enter a message."),
});
