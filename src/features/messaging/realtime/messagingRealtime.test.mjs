import assert from "node:assert/strict";
import test from "node:test";
import { URL } from "node:url";
import { setImmediate } from "node:timers/promises";
import { setTimeout as delay } from "node:timers/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { baseApi } from "../../../services/api/baseApi.ts";
import { FakeSocket } from "../../../services/socket/socket.test-fixtures.mjs";
import { messagingApi } from "../api/messaging.api.ts";
import { startMessagingRealtime } from "./messagingRealtime.ts";
import { RealtimeStatus } from "../components/RealtimeStatus.tsx";
import { orderedMessages } from "../utils/messagingAdapters.ts";
import {
  clearSession,
  activeRoleSelected,
  sessionUpdated,
} from "../../auth/store/auth.slice.ts";
import {
  memberStore,
  viewerId,
  memberId,
  scope,
  conversationId as A,
  otherConversationId as B,
  messageId,
  secondMessageId,
  conversationDto,
  messageDto,
  page,
  json,
} from "../utils/messaging.test-fixtures.mjs";

async function setup(t, role = "CUSTOMER", joinTimeoutMs = 10000) {
  const store = memberStore(role);
  const scoped = { ...scope, role };
  const socket = new FakeSocket();
  socket.connected = true;
  const rooms = [];
  const requests = [];
  const conversations = new Map(
    [A, B].map((id) => [
      id,
      conversationDto({ id, lastMessage: messageDto({ conversationId: id }) }),
    ]),
  );
  const histories = new Map(
    [A, B].map((id) => [id, [messageDto({ conversationId: id })]]),
  );
  const errors = new Map();
  const original = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const req = new globalThis.Request(input);
    const path = new URL(req.url).pathname;
    requests.push({ path, method: req.method });
    const id = path.split("/")[5];
    if (errors.has(id)) return json({ message: "Access denied" }, errors.get(id));
    if (path.endsWith("/requests")) return json(page([]));
    if (path.endsWith("/conversations")) return json(page([...conversations.values()]));
    if (path.endsWith("/messages") && req.method === "POST") {
      const item = messageDto({
        id: secondMessageId,
        conversationId: id,
        senderId: viewerId,
        sender: { ...messageDto().sender, id: viewerId },
      });
      histories.set(id, [...histories.get(id), item]);
      socket.server("message:new", item);
      return json({ message: "Sent", item });
    }
    if (path.endsWith("/messages"))
      return json({ message: "History", ...page(histories.get(id) ?? []) });
    return json({ message: "Conversation", conversation: conversations.get(id) });
  };
  const subscriptions = [];
  const args = (id) => ({ ...scoped, conversationId: id });
  const load = async (id) => {
    const sub = store.dispatch(
      messagingApi.endpoints.getConversation.initiate(args(id)),
    );
    subscriptions.push(sub);
    await sub;
    const history = store.dispatch(
      messagingApi.endpoints.getMessages.initiate(args(id)),
    );
    subscriptions.push(history);
    await history;
  };
  const list = store.dispatch(
    messagingApi.endpoints.getConversations.initiate({
      ...scoped,
      kind: "conversations",
    }),
  );
  subscriptions.push(list);
  await list;
  await load(A);
  const controller = startMessagingRealtime({
    store,
    socket,
    scope: scoped,
    viewer: viewerId,
    token: "test-access",
    isSocketCurrent: () => true,
    onRoom: (status) => rooms.push(status),
    joinTimeoutMs,
  });
  const settle = async () => {
    for (let i = 0; i < 8; i++) {
      await setImmediate();
      await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));
    }
  };
  const join = async (id = A) => {
    controller.select(id);
    await settle();
    socket.server("conversation:joined", {
      message: "Joined",
      conversation: conversations.get(id),
    });
    await settle();
  };
  t.after(() => {
    controller.stop();
    subscriptions.forEach((s) => s.unsubscribe());
    store.dispatch(baseApi.util.resetApiState());
    globalThis.fetch = original;
  });
  return {
    store,
    scoped,
    socket,
    rooms,
    requests,
    conversations,
    histories,
    errors,
    args,
    load,
    controller,
    settle,
    join,
    history: (id) =>
      messagingApi.endpoints.getMessages
        .select(args(id))(store.getState())
        .data?.pages.flatMap((p) => p.items) ?? [],
    count: (suffix) => requests.filter((r) => r.path.endsWith(suffix)).length,
  };
}

for (const role of ["CUSTOMER", "VENDOR"])
  test(`${role}: validates HTTP membership before named room join; leaves on cleanup`, async (t) => {
    const h = await setup(t, role);
    await h.join();
    assert.equal(h.rooms.at(-1), "joined");
    assert.deepEqual(h.socket.sent[0], {
      name: "conversation:join",
      payload: { conversationId: A },
    });
    assert.ok(h.count(`/${A}`) >= 2);
    h.controller.stop();
    assert.equal(h.socket.sent.at(-1).name, "conversation:leave");
    assert.ok([...h.socket.handlers.values()].every((s) => s.size === 0));
  });

test("switch leaves old room; delayed join/leave cannot replace selected room", async (t) => {
  const h = await setup(t);
  await h.join();
  await h.load(B);
  h.controller.select(B);
  await h.settle();
  h.socket.server("conversation:joined", {
    message: "Late",
    conversation: h.conversations.get(A),
  });
  assert.equal(h.socket.sent.at(-1).payload.conversationId, A);
  h.socket.server("conversation:joined", {
    message: "Joined",
    conversation: h.conversations.get(B),
  });
  h.socket.server("conversation:left", { conversationId: B });
  await h.settle();
  assert.equal(h.rooms.at(-1), "joined");
});

test("reconnect refetches selected detail/history and refuses revoked membership", async (t) => {
  const h = await setup(t);
  await h.join();
  const count = h.count(`/${A}/messages`);
  h.socket.server("disconnect");
  h.socket.server("connect");
  await h.settle();
  assert.ok(h.count(`/${A}/messages`) > count);
  h.socket.server("conversation:joined", {
    message: "Joined",
    conversation: h.conversations.get(A),
  });
  await h.settle();
  const joins = h.socket.sent.filter((e) => e.name === "conversation:join").length;
  h.errors.set(A, 403);
  h.socket.server("disconnect");
  h.socket.server("connect");
  await h.settle();
  assert.equal(h.rooms.at(-1), "error");
  assert.equal(
    h.socket.sent.filter((e) => e.name === "conversation:join").length,
    joins,
  );
});

test("invalid selection and denied detail never join; timeout stays HTTP recoverable", async (t) => {
  const h = await setup(t, "CUSTOMER", 15);
  h.controller.select("fixture");
  await h.settle();
  assert.equal(h.socket.sent.length, 0);
  h.errors.set(B, 404);
  h.controller.select(B);
  await h.settle();
  assert.equal(h.rooms.at(-1), "error");
  h.controller.select(A);
  await h.settle();
  await delay(25);
  assert.equal(h.rooms.at(-1), "error");
  h.controller.retry();
  await h.settle();
  h.socket.server("conversation:joined", {
    message: "Joined",
    conversation: h.conversations.get(A),
  });
  await h.settle();
  assert.equal(h.rooms.at(-1), "joined");
});

test("message events revalidate server history/unread, deduplicate UUIDs and reject foreign payloads", async (t) => {
  const h = await setup(t);
  await h.join();
  const later = messageDto({ id: secondMessageId, createdAt: "2026-10-28T11:00:00Z" });
  h.histories.set(A, [later, messageDto()]);
  h.conversations.get(A).unreadCount = 7;
  h.socket.server("message:new", later);
  await h.settle();
  assert.deepEqual(
    orderedMessages(h.history(A), viewerId).map((m) => m.id),
    [messageId, secondMessageId],
  );
  assert.equal(
    messagingApi.endpoints.getConversation.select(h.args(A))(h.store.getState()).data
      .unreadCount,
    7,
  );
  const count = h.requests.length;
  h.socket.server("message:new", later);
  h.socket.server("message:new", { ...later, id: "fake" });
  h.socket.server("message:new", { ...later, id: memberId, senderId: A, sender: null });
  h.socket.server("message:new", { ...later, id: viewerId, conversationId: memberId });
  await h.settle();
  assert.equal(h.requests.length, count);
  h.socket.server("message:new", messageDto());
  await h.settle();
  assert.equal(h.history(A).length, 2);
  assert.ok(
    h.socket.sent.every((e) =>
      ["conversation:join", "conversation:leave"].includes(e.name),
    ),
  );
});

test("HTTP send plus broadcast echo produces one real bubble and one HTTP write", async (t) => {
  const h = await setup(t);
  await h.join();
  const result = await h.store.dispatch(
    messagingApi.endpoints.sendTextMessage.initiate({
      ...h.args(A),
      body: { messageType: "TEXT", content: "Hello" },
    }),
  );
  assert.equal(result.error, undefined);
  await h.settle();
  assert.equal(h.history(A).filter((m) => m.id === secondMessageId).length, 1);
  assert.equal(h.requests.filter((r) => r.method === "POST").length, 1);
  assert.ok(h.socket.sent.every((e) => e.name !== "message:send"));
});

test("read state is server authoritative; repeated/older/foreign read events cannot regress it", async (t) => {
  const h = await setup(t);
  await h.join();
  const readAt = "2026-10-28T12:00:00Z";
  h.conversations.get(A).unreadCount = 0;
  h.conversations.get(A).participants[0].lastReadAt = readAt;
  h.socket.server("conversation:read", { conversationId: A, userId: viewerId, readAt });
  await h.settle();
  assert.equal(
    messagingApi.endpoints.getConversation.select(h.args(A))(h.store.getState()).data
      .unreadCount,
    0,
  );
  const count = h.requests.length;
  for (const at of [readAt, "2026-10-28T11:00:00Z", "invalid"])
    h.socket.server("conversation:read", {
      conversationId: A,
      userId: viewerId,
      readAt: at,
    });
  h.socket.server("conversation:read", { conversationId: A, userId: A, readAt });
  await h.settle();
  assert.equal(h.requests.length, count);
  assert.ok(h.socket.sent.every((e) => e.name !== "conversation:read"));
});

test("queued event for known previous chat refreshes list without leaking into selected thread", async (t) => {
  const h = await setup(t);
  await h.join();
  await h.load(B);
  const count = h.count("/conversations");
  h.socket.server(
    "message:new",
    messageDto({ id: secondMessageId, conversationId: B }),
  );
  await h.settle();
  assert.ok(h.count("/conversations") > count);
  assert.ok(h.history(A).every((m) => m.conversationId === A));
});

for (const transition of ["logout", "role", "token"])
  test(`${transition}: captured old callbacks cannot read or write new-session cache`, async (t) => {
    const h = await setup(t);
    await h.join();
    const callback = [...h.socket.handlers.get("message:new")][0];
    if (transition === "logout") h.store.dispatch(clearSession());
    else if (transition === "role") h.store.dispatch(activeRoleSelected("VENDOR"));
    else
      h.store.dispatch(
        sessionUpdated({
          accessToken: "rotated-access",
          refreshToken: "rotated-refresh",
        }),
      );
    await h.settle();
    const count = h.requests.length;
    callback(messageDto({ id: secondMessageId }));
    h.controller.retry();
    await h.settle();
    assert.equal(h.requests.length, count);
    assert.equal(h.socket.sent.at(-1).name, "conversation:leave");
  });

test("failed gateway join and authentication recovery are bounded; stop cancels queued work", async (t) => {
  const h = await setup(t);
  await h.join();
  h.socket.server("exception", { message: "private backend detail" });
  await h.settle();
  assert.equal(h.rooms.at(-1), "error");
  h.controller.refreshAuthentication();
  await h.settle();
  const count = h.requests.length;
  h.controller.refreshAuthentication();
  await h.settle();
  assert.equal(h.requests.length, count);
  h.socket.server("message:new", messageDto({ id: secondMessageId }));
  h.controller.stop();
  await h.settle();
  assert.equal(h.requests.length, count);
});

test("switch during reconnect authorization ignores delayed detail for previous selection", async (t) => {
  const h = await setup(t);
  await h.load(B);
  await h.settle();
  const fetch = globalThis.fetch;
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  globalThis.fetch = async (input) => {
    if (new URL(input.url).pathname.endsWith(`/${A}`)) await gate;
    return fetch(input);
  };
  t.after(release);
  h.controller.select(A);
  await setImmediate();
  h.controller.select(B);
  await setImmediate();
  release();
  await h.settle();
  assert.ok(
    h.socket.sent
      .filter((e) => e.name === "conversation:join")
      .every((e) => e.payload.conversationId === B),
  );
  h.socket.server("conversation:joined", {
    message: "Joined",
    conversation: h.conversations.get(B),
  });
  await h.settle();
  assert.equal(h.rooms.at(-1), "joined");
});

test("untrusted room payload cannot authorize membership or interpret an ack wrapper", async (t) => {
  const h = await setup(t);
  h.controller.select(A);
  await h.settle();
  h.socket.server("conversation:joined", {
    event: "conversation:joined",
    data: { message: "Joined", conversation: h.conversations.get(A) },
  });
  h.socket.server("conversation:joined", {
    message: "Joined",
    conversation: { ...h.conversations.get(A), participants: [] },
  });
  assert.notEqual(h.rooms.at(-1), "joined");
  h.socket.server("conversation:joined", {
    message: "Joined",
    conversation: h.conversations.get(A),
  });
  await h.settle();
  assert.equal(h.rooms.at(-1), "joined");
});

test("HTTP fallback and recovery states render safe supported-feature labels", () => {
  for (const status of [
    "idle",
    "unavailable",
    "connecting",
    "reconnecting",
    "disconnected",
    "error",
    "expired",
    "connected",
  ]) {
    const html = renderToStaticMarkup(
      createElement(RealtimeStatus, {
        realtime: { status, room: "error", retry() {} },
      }),
    );
    assert.match(html, /role="status"/);
    assert.match(html, /HTTP/);
    assert.match(html, /Presence and per-message receipts are unavailable/);
    assert.doesNotMatch(html, /private backend detail|test-access/);
  }
});
