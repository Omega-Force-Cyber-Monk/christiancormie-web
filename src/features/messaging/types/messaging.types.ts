import type { z } from "zod";
import type {
  conversationSchema,
  messageSchema,
  recipientSchema,
  directConversationSchema,
} from "../schemas/messaging.schema";
export type Conversation = z.infer<typeof conversationSchema>;
export type ChatMessage = z.infer<typeof messageSchema>;
export type Recipient = z.infer<typeof recipientSchema>;
export type DirectTarget = z.infer<typeof directConversationSchema>;
export type MessagingScope = { sessionId: string; role: string };
export type ConversationScope = MessagingScope & { conversationId: string };
export type ConversationRow = {
  id: string;
  name: string;
  preview: string;
  age: string;
  unread: number;
  status: string;
  avatarUrl: string;
};
export type MessageRow = {
  id: string;
  direction: "incoming" | "outgoing";
  body: string;
  time: string;
  sender: string;
  attachmentUrl: string;
  messageType: string;
};
