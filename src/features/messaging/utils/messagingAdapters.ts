import type {
  ChatMessage,
  Conversation,
  ConversationRow,
  MessageRow,
} from "../types/messaging.types";
import { remoteMedia } from "@/utils/files/remoteMedia";
export const messageTime = (value: string) =>
  `${new Date(value).toLocaleString("en-US", { timeZone: "UTC" })} UTC`;
export function conversationRow(c: Conversation): ConversationRow {
  return {
    id: c.id,
    name: c.otherParticipant?.user?.displayName || c.title || "Conversation",
    preview:
      c.lastMessage?.content ||
      (c.lastMessage ? `${c.lastMessage.messageType} message` : "No messages"),
    age: messageTime(c.lastMessageAt ?? c.createdAt),
    unread: c.unreadCount,
    status: c.isClosed ? "Closed" : c.directStatus,
    avatarUrl: remoteMedia(c.otherParticipant?.user?.avatarUrl),
  };
}
export function orderedMessages(messages: ChatMessage[], viewer: string): MessageRow[] {
  return [...new Map(messages.map((m) => [m.id, m])).values()]
    .sort(
      (a, b) =>
        Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id),
    )
    .map((m) => ({
      id: m.id,
      direction: m.senderId === viewer ? "outgoing" : "incoming",
      body: m.content ?? "",
      time: messageTime(m.createdAt),
      sender: m.sender?.displayName || "Participant",
      attachmentUrl: remoteMedia(m.attachmentUrl),
      messageType: m.messageType,
    }));
}
export function canCompose(c: Conversation, viewer: string) {
  if (c.isClosed || c.directStatus === "DECLINED") return false;
  // Incoming requests use explicit accept/decline before replying. The server also auto-accepts on reply.
  return (
    c.directStatus !== "REQUESTED" ||
    (c.requestedRecipientId !== viewer && c.messageCount === 0)
  );
}
export type Draft = { text: string; revision: number };
export const editDraft = (previous: Draft | undefined, text: string): Draft => ({
  text,
  revision: (previous?.revision ?? 0) + 1,
});
export const confirmedDraft = (current: Draft | undefined, submitted: Draft) =>
  current?.revision === submitted.revision ? editDraft(current, "") : current;
export async function submitMessageDraft({
  send,
  isCurrent,
  onConfirmed,
  onFailure,
}: {
  send: () => Promise<unknown>;
  isCurrent: () => boolean;
  onConfirmed: () => void;
  onFailure: (error: unknown) => void;
}) {
  try {
    await send();
    if (isCurrent()) onConfirmed();
  } catch (error) {
    if (isCurrent()) onFailure(error);
  }
}
export const canMarkRead = (
  visible: boolean,
  c: Conversation | undefined,
  viewer: string,
  loaded: boolean,
) =>
  Boolean(
    visible &&
    loaded &&
    c?.unreadCount &&
    c.participants.some((p) => p.userId === viewer),
  );
