import {
  memberId,
  viewerId,
  memberStore,
  json,
} from "../../social/utils/member.test-fixtures.mjs";
export { viewerId, memberId, memberStore, json };
export const conversationId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
export const otherConversationId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
export const messageId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
export const secondMessageId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
export const scope = { sessionId: "member-test", role: "CUSTOMER" };
export const arg = { ...scope, conversationId };
export const userDto = (id = memberId) => ({
  id,
  email: "private@example.invalid",
  displayName: id === memberId ? "Actual Recipient" : "Actual Viewer",
  accountType: "CUSTOMER",
  avatarUrl: null,
  vendor: null,
});
export const messageDto = (overrides = {}) => ({
  id: messageId,
  conversationId,
  senderId: memberId,
  sender: userDto(),
  messageType: "TEXT",
  content: "Actual incoming message",
  attachmentUrl: null,
  createdAt: "2026-10-28T10:00:00.000Z",
  editedAt: null,
  ...overrides,
});
export const conversationDto = (overrides = {}) => {
  const participants = [viewerId, memberId].map((id) => ({
    id,
    userId: id,
    user: userDto(id),
    lastReadAt: null,
    isMuted: false,
  }));
  return {
    id: conversationId,
    type: "DIRECT",
    title: null,
    isClosed: false,
    directStatus: "ACTIVE",
    requestedRecipientId: null,
    acceptedAt: "2026-10-28T09:00:00.000Z",
    createdAt: "2026-10-28T09:00:00.000Z",
    lastMessageAt: "2026-10-28T10:00:00.000Z",
    unreadCount: 3,
    messageCount: 1,
    participants,
    otherParticipant: participants[1],
    lastMessage: messageDto(),
    ...overrides,
  };
};
export const page = (items, overrides = {}) => ({
  items,
  total: items.length,
  nextOffset: null,
  ...overrides,
});
