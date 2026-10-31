import { z } from "zod";
import type { Socket } from "socket.io-client";
import type { AppDispatch, RootState } from "@/app/store";
import { selectCurrentRole } from "@/features/auth/store/auth.selectors";
import { baseApi } from "@/services/api/baseApi";
import { messagingAllowed, messagingApi } from "../api/messaging.api";
import { conversationSchema, messageSchema } from "../schemas/messaging.schema";
import type { Conversation, MessagingScope } from "../types/messaging.types";

export type RoomStatus = "idle" | "checking" | "joining" | "joined" | "error";
type Store = {
  getState: () => RootState;
  dispatch: AppDispatch;
  subscribe: (f: () => void) => () => void;
};
type Tag =
  | "Conversations"
  | "MessageRequests"
  | { type: "ConversationDetail" | "MessageHistory"; id: string };
const joinedSchema = z.object({
  message: z.string(),
  conversation: conversationSchema,
});
const leftSchema = z.object({ conversationId: z.uuid() });
const readSchema = z.object({
  conversationId: z.uuid(),
  userId: z.uuid(),
  readAt: z.iso.datetime({ offset: true }),
});

// Socket data is a hint to revalidate the existing HTTP caches, never a second
// message store or authorization source. The gateway emits named WsResponses.
export function startMessagingRealtime({
  store,
  socket,
  scope,
  viewer,
  token,
  isSocketCurrent,
  onRoom,
  joinTimeoutMs = 10000,
}: {
  store: Store;
  socket: Socket;
  scope: MessagingScope;
  viewer: string;
  token: string;
  isSocketCurrent: () => boolean;
  onRoom: (s: RoomStatus) => void;
  joinTimeoutMs?: number;
}) {
  let stopped = false;
  let selected = "";
  let joined = "";
  let pending = "";
  let epoch = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let authRevalidated = false;
  const seen = new Set<string>();
  const reads = new Map<string, number>();
  const queued = new Map<string, Tag>();
  let scheduled = false;
  const current = () => {
    const s = store.getState();
    return (
      !stopped &&
      isSocketCurrent() &&
      messagingAllowed(s) &&
      s.auth.sessionId === scope.sessionId &&
      s.auth.user?.id === viewer &&
      selectCurrentRole(s) === scope.role &&
      s.auth.accessToken === token
    );
  };
  const args = (id: string) => ({ ...scope, conversationId: id });
  const member = (c: Conversation | undefined): c is Conversation =>
    !!c && c.participants.some((p) => p.userId === viewer);
  function known(id: string): Conversation | undefined {
    const state = store.getState();
    const detail = messagingApi.endpoints.getConversation.select(args(id))(state);
    if (detail.error) return undefined;
    if (member(detail.data)) return detail.data;
    for (const arg of messagingApi.util.selectCachedArgsForQuery(
      state,
      "getConversations",
    )) {
      if (arg.sessionId !== scope.sessionId || arg.role !== scope.role) continue;
      const list = messagingApi.endpoints.getConversations.select(arg)(state);
      if (list.error) continue;
      const c = list.data?.pages.flatMap((p) => p.items).find((c) => c.id === id);
      if (member(c)) return c;
    }
    return undefined;
  }
  function enqueue(tags: Tag[]) {
    for (const t of tags)
      queued.set(typeof t === "string" ? t : `${t.type}:${t.id}`, t);
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      const tags = [...queued.values()];
      queued.clear();
      if (current() && tags.length) store.dispatch(baseApi.util.invalidateTags(tags));
    });
  }
  const listTags: Tag[] = ["Conversations", "MessageRequests"];
  function leave(id: string) {
    if (id && socket.connected && isSocketCurrent())
      socket.emit("conversation:leave", { conversationId: id });
  }
  function clearRoom() {
    if (timer) clearTimeout(timer);
    timer = undefined;
    const previous = new Set([joined, pending]);
    joined = "";
    pending = "";
    previous.forEach(leave);
  }
  async function recover() {
    const generation = ++epoch;
    clearRoom();
    if (!current() || !socket.connected) return;
    enqueue(listTags);
    const id = selected;
    if (!id) {
      onRoom("idle");
      return;
    }
    onRoom("checking");
    const request = store.dispatch(
      messagingApi.endpoints.getConversation.initiate(args(id), {
        forceRefetch: true,
        subscribe: false,
      }),
    );
    try {
      const c = await request.unwrap();
      if (!current() || generation !== epoch || id !== selected || !socket.connected)
        return;
      if (!member(c) || c.id !== id) {
        onRoom("error");
        return;
      }
      pending = id;
      onRoom("joining");
      timer = setTimeout(() => {
        if (current() && pending === id && generation === epoch) {
          clearRoom();
          onRoom("error");
        }
      }, joinTimeoutMs);
      socket.emit("conversation:join", { conversationId: id });
      enqueue([{ type: "MessageHistory", id }]);
    } catch {
      if (current() && generation === epoch) onRoom("error");
    }
  }
  function onJoined(payload: unknown) {
    if (!current() || !socket.connected) return;
    const r = joinedSchema.safeParse(payload);
    if (!r.success) return;
    const c = r.data.conversation;
    if (c.id !== selected || c.id !== pending || !member(c) || !member(known(c.id))) {
      if (c.id !== joined) leave(c.id);
      return;
    }
    if (timer) clearTimeout(timer);
    timer = undefined;
    joined = c.id;
    pending = "";
    onRoom("joined");
    enqueue([
      { type: "MessageHistory", id: c.id },
      { type: "ConversationDetail", id: c.id },
      ...listTags,
    ]);
  }
  function onLeft(payload: unknown) {
    const r = leftSchema.safeParse(payload);
    if (!current() || !r.success) return;
    // A delayed leave response must not clear a newer join of the same room.
  }
  function onMessage(payload: unknown) {
    if (!current() || !socket.connected) return;
    const r = messageSchema.safeParse(payload);
    if (!r.success) return;
    const m = r.data;
    const c = known(m.conversationId);
    if (
      !member(c) ||
      !c.participants.some((p) => p.userId === m.senderId) ||
      seen.has(m.id)
    )
      return;
    seen.add(m.id);
    if (seen.size > 512) {
      const first = seen.values().next().value;
      if (first) seen.delete(first);
    }
    const cached = messagingApi.endpoints.getMessages
      .select(args(c.id))(store.getState())
      .data?.pages.some((p) => p.items.some((item) => item.id === m.id));
    enqueue([
      ...listTags,
      { type: "ConversationDetail", id: c.id },
      ...(cached ? [] : [{ type: "MessageHistory" as const, id: c.id }]),
    ]);
  }
  function onRead(payload: unknown) {
    if (!current() || !socket.connected) return;
    const r = readSchema.safeParse(payload);
    if (!r.success) return;
    const c = known(r.data.conversationId);
    const p = c?.participants.find((p) => p.userId === r.data.userId);
    if (!member(c) || !p) return;
    const key = `${c.id}:${p.userId}`;
    const at = Date.parse(r.data.readAt);
    if (
      at <=
      Math.max(
        reads.get(key) ?? -Infinity,
        p.lastReadAt ? Date.parse(p.lastReadAt) : -Infinity,
      )
    )
      return;
    reads.set(key, at);
    if (reads.size > 512) {
      const first = reads.keys().next().value;
      if (first) reads.delete(first);
    }
    enqueue([...listTags, { type: "ConversationDetail", id: c.id }]);
  }
  const onConnect = () => {
    if (current()) void recover();
  };
  const onDisconnect = () => {
    ++epoch;
    clearRoom();
    if (current()) onRoom("idle");
  };
  function onException() {
    if (!current()) return;
    ++epoch;
    clearRoom();
    onRoom("error");
    if (selected)
      enqueue([
        { type: "ConversationDetail", id: selected },
        { type: "MessageHistory", id: selected },
        ...listTags,
      ]);
  }
  function onAuthenticationError() {
    if (!current() || authRevalidated) return;
    authRevalidated = true;
    onException();
    enqueue(listTags);
  }
  socket.on("connect", onConnect);
  socket.on("disconnect", onDisconnect);
  socket.on("conversation:joined", onJoined);
  socket.on("conversation:left", onLeft);
  socket.on("message:new", onMessage);
  socket.on("conversation:read", onRead);
  socket.on("exception", onException);
  socket.on("error", onAuthenticationError);
  const unsubscribe = store.subscribe(() => {
    if (!current()) {
      ++epoch;
      clearRoom();
      return;
    }
    const detail = selected
      ? messagingApi.endpoints.getConversation.select(args(selected))(store.getState())
      : undefined;
    if ((joined || pending) && detail?.error) {
      ++epoch;
      clearRoom();
      onRoom("error");
    }
  });
  if (socket.connected && current()) enqueue(listTags);
  return {
    select(id: string) {
      const next = z.uuid().safeParse(id).success ? id : "";
      if (next === selected) return;
      selected = next;
      ++epoch;
      clearRoom();
      onRoom("idle");
      if (current() && socket.connected) void recover();
    },
    retry() {
      if (current() && socket.connected) void recover();
    },
    refreshAuthentication: onAuthenticationError,
    stop() {
      if (stopped) return;
      ++epoch;
      clearRoom();
      stopped = true;
      queued.clear();
      unsubscribe();
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("conversation:joined", onJoined);
      socket.off("conversation:left", onLeft);
      socket.off("message:new", onMessage);
      socket.off("conversation:read", onRead);
      socket.off("exception", onException);
      socket.off("error", onAuthenticationError);
    },
  };
}
