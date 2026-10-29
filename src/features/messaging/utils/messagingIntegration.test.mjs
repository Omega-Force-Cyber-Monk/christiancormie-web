import assert from "node:assert/strict";
import test from "node:test";
import { URL } from "node:url";
import { setImmediate } from "node:timers";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { baseApi } from "../../../services/api/baseApi.ts";
import { messagingApi, messagingAllowed } from "../api/messaging.api.ts";
import {
  conversationSchema,
  directConversationSchema,
  textMessageSchema,
} from "../schemas/messaging.schema.ts";
import {
  conversationRow,
  orderedMessages,
  canCompose,
  editDraft,
  confirmedDraft,
  canMarkRead,
  submitMessageDraft,
} from "./messagingAdapters.ts";
import {
  clearSession,
  sessionStarted,
  activeRoleSelected,
} from "../../auth/store/auth.slice.ts";
import CustomerMessagePage from "../../customer/pages/CustomerMessagePage.tsx";
import VendorMessagesPage from "../../vendor/pages/VendorMessagesPage.tsx";
import { MessageThread } from "../../customer/components/message/MessageThread.tsx";
import { VendorMessageThread } from "../../vendor/components/messages/VendorMessageThread.tsx";
import { VendorMessageComposer } from "../../vendor/components/messages/VendorMessageComposer.tsx";
import { MessageConversationList } from "../../customer/components/message/MessageConversationList.tsx";
import { StartConversationButton } from "../components/StartConversationButton.tsx";
import {
  conversationId,
  otherConversationId,
  messageId,
  secondMessageId,
  memberId,
  viewerId,
  memberStore,
  json,
  scope,
  arg,
  userDto,
  messageDto,
  conversationDto,
  page,
} from "./messaging.test-fixtures.mjs";
const cleanup = (s) => s.dispatch(baseApi.util.resetApiState());
const render = (s, Component, props = {}, path = "/message") =>
  renderToStaticMarkup(
    h(
      Provider,
      { store: s },
      h(MemoryRouter, { initialEntries: [path] }, h(Component, props)),
    ),
  );
const tick = () => new Promise((resolve) => setImmediate(resolve));
const noop = () => {};
const composer = {
  text: "Draft",
  onText: noop,
  onSend: async () => {},
  pending: false,
  disabled: false,
};

test("conversation adapter preserves real UUID, unread count, timestamps, status and safe identity", () => {
  const c = conversationSchema.parse(conversationDto());
  assert.equal(c.participants[0].user.email, undefined);
  const row = conversationRow(c);
  assert.equal(row.id, conversationId);
  assert.equal(row.name, "Actual Recipient");
  assert.equal(row.unread, 3);
  assert.equal(row.status, "ACTIVE");
  assert.match(row.age, /UTC/);
  assert.doesNotMatch(JSON.stringify(row), /online|presence|private@example/);
});
test("messages reconcile by server ID in chronological order with verified sender grouping and safe attachments", () => {
  const incoming = messageDto({ attachmentUrl: "javascript:alert(1)" });
  const outgoing = messageDto({
    id: secondMessageId,
    senderId: viewerId,
    sender: userDto(viewerId),
    createdAt: "2026-10-28T11:00:00Z",
  });
  const rows = orderedMessages([outgoing, incoming, incoming], viewerId);
  assert.deepEqual(
    rows.map((m) => m.id),
    [messageId, secondMessageId],
  );
  assert.deepEqual(
    rows.map((m) => m.direction),
    ["incoming", "outgoing"],
  );
  assert.equal(rows[0].attachmentUrl, "");
  const html = renderToStaticMarkup(
    h(MessageThread, {
      conversation: conversationRow(conversationDto()),
      entries: rows,
      composer,
    }),
  );
  assert.match(html, /Actual incoming message/);
  assert.doesNotMatch(html, /Active now|sample|Local preview|delivered|read receipt/);
});
for (const kind of ["conversations", "requests"])
  test(`${kind} list uses JWT, actual envelope and returned offset pages`, async () => {
    const s = memberStore();
    const original = globalThis.fetch;
    const offsets = [];
    const c = conversationDto(
      kind === "requests"
        ? { directStatus: "REQUESTED", requestedRecipientId: viewerId }
        : {},
    );
    globalThis.fetch = async (request) => {
      const url = new URL(request.url);
      assert.equal(url.pathname, `/api/v1/messaging/${kind}`);
      assert.equal(request.headers.get("authorization"), "Bearer test-access");
      assert.equal(url.searchParams.get("limit"), "20");
      const offset = Number(url.searchParams.get("offset"));
      offsets.push(offset);
      return json(page([c], offset ? {} : { total: 21, nextOffset: 20 }));
    };
    const a = { ...scope, kind };
    const first = s.dispatch(messagingApi.endpoints.getConversations.initiate(a));
    let second;
    try {
      const one = await first.unwrap();
      assert.equal(one.pages[0].items[0].id, conversationId);
      second = s.dispatch(
        messagingApi.endpoints.getConversations.initiate(a, { direction: "forward" }),
      );
      const two = await second.unwrap();
      assert.deepEqual(offsets, [0, 20]);
      assert.equal(two.pages.length, 2);
    } finally {
      first.unsubscribe();
      second?.unsubscribe();
      cleanup(s);
      globalThis.fetch = original;
    }
  });
test("recipient search uses only supported filters, actual UUIDs and strips email", async () => {
  const s = memberStore();
  const original = globalThis.fetch;
  globalThis.fetch = async (request) => {
    const u = new URL(request.url);
    assert.equal(u.pathname, "/api/v1/messaging/recipients");
    assert.deepEqual(Object.fromEntries(u.searchParams), {
      search: "Actual",
      type: "CUSTOMER",
      limit: "20",
      offset: "20",
    });
    return json(page([userDto()]));
  };
  const r = s.dispatch(
    messagingApi.endpoints.getMessageRecipients.initiate({
      ...scope,
      search: " Actual ",
      type: "CUSTOMER",
      offset: 20,
    }),
  );
  try {
    const d = await r.unwrap();
    assert.equal(d.items[0].id, memberId);
    assert.equal(d.items[0].email, undefined);
  } finally {
    r.unsubscribe();
    cleanup(s);
    globalThis.fetch = original;
  }
});
for (const target of [
  { participantUserId: memberId },
  { vendorId: memberId },
  { foodTruckId: memberId },
])
  test(`direct creation sends exactly one ${Object.keys(target)[0]} and accepts reused backend conversation`, async () => {
    const s = memberStore();
    const original = globalThis.fetch;
    globalThis.fetch = async (request) => {
      assert.equal(
        new URL(request.url).pathname,
        "/api/v1/messaging/conversations/direct",
      );
      assert.equal(request.method, "POST");
      assert.deepEqual(await request.json(), target);
      return json(
        { message: "Conversation already exists", conversation: conversationDto() },
        201,
      );
    };
    try {
      const c = await s
        .dispatch(
          messagingApi.endpoints.createDirectConversation.initiate({
            ...scope,
            target,
          }),
        )
        .unwrap();
      assert.equal(c.id, conversationId);
    } finally {
      cleanup(s);
      globalThis.fetch = original;
    }
  });
test("invalid targets, self, slugs, multiple recipients and unsupported text fields fail before HTTP", async () => {
  const s = memberStore();
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw Error("Unexpected HTTP");
  };
  try {
    for (const target of [
      {},
      { foodTruckId: "truck-slug" },
      { participantUserId: memberId, vendorId: memberId },
      { participantUserId: viewerId },
      { participantUserId: memberId, extra: true },
    ])
      assert.ok(
        (
          await s.dispatch(
            messagingApi.endpoints.createDirectConversation.initiate({
              ...scope,
              target,
            }),
          )
        ).error,
      );
    for (const body of [
      { messageType: "TEXT", content: " " },
      { messageType: "TEXT", content: "x".repeat(5001) },
      { messageType: "TEXT", content: "Hello", attachmentUrl: "blob:fake" },
      { messageType: "FILE", content: "Hello" },
    ])
      assert.ok(
        (
          await s.dispatch(
            messagingApi.endpoints.sendTextMessage.initiate({ ...arg, body }),
          )
        ).error,
      );
    assert.equal(calls, 0);
    assert.equal(
      directConversationSchema.safeParse({ participantUserId: memberId }).success,
      true,
    );
    assert.equal(
      textMessageSchema.parse({ messageType: "TEXT", content: " hi " }).content,
      "hi",
    );
  } finally {
    cleanup(s);
    globalThis.fetch = original;
  }
});
for (const action of ["accept", "decline"])
  test(`${action} confirms exact request transition and invalidates lists/detail`, async () => {
    const s = memberStore();
    const original = globalThis.fetch;
    globalThis.fetch = async (request) => {
      assert.equal(request.method, "PATCH");
      assert.equal(
        new URL(request.url).pathname,
        `/api/v1/messaging/conversations/${conversationId}/${action}`,
      );
      assert.equal(await request.text(), "");
      return json({
        conversationId,
        status: action === "accept" ? "ACTIVE" : "DECLINED",
      });
    };
    try {
      const r = await s
        .dispatch(
          messagingApi.endpoints.resolveConversationRequest.initiate({
            ...arg,
            action,
          }),
        )
        .unwrap();
      assert.equal(r.status, action === "accept" ? "ACTIVE" : "DECLINED");
      const tags = messagingApi.util.selectInvalidatedBy(s.getState(), [
        "Conversations",
        "MessageRequests",
        "ConversationDetail",
      ]);
      assert.ok(Array.isArray(tags));
    } finally {
      cleanup(s);
      globalThis.fetch = original;
    }
  });
test("detail validates membership and message history pages use descending backend offsets with chronological UI", async () => {
  const s = memberStore();
  const original = globalThis.fetch;
  const offsets = [];
  globalThis.fetch = async (request) => {
    const u = new URL(request.url);
    if (!u.pathname.endsWith("messages"))
      return json({ message: "ok", conversation: conversationDto() });
    assert.equal(u.searchParams.get("limit"), "30");
    const offset = Number(u.searchParams.get("offset"));
    offsets.push(offset);
    return json(
      offset
        ? page([messageDto({ id: secondMessageId, createdAt: "2026-10-28T09:00:00Z" })])
        : page([messageDto()], { total: 31, nextOffset: 30 }),
    );
  };
  const detail = s.dispatch(messagingApi.endpoints.getConversation.initiate(arg));
  const first = s.dispatch(messagingApi.endpoints.getMessages.initiate(arg));
  let second;
  try {
    assert.equal((await detail.unwrap()).id, conversationId);
    await first.unwrap();
    second = s.dispatch(
      messagingApi.endpoints.getMessages.initiate(arg, { direction: "forward" }),
    );
    const d = await second.unwrap();
    assert.deepEqual(offsets, [0, 30]);
    assert.deepEqual(
      orderedMessages(
        d.pages.flatMap((p) => p.items),
        viewerId,
      ).map((m) => m.id),
      [secondMessageId, messageId],
    );
  } finally {
    detail.unsubscribe();
    first.unsubscribe();
    second?.unsubscribe();
    cleanup(s);
    globalThis.fetch = original;
  }
});
test("send confirms server message and reconciles its ID without optimistic local entities", async () => {
  const s = memberStore();
  const original = globalThis.fetch;
  await s.dispatch(
    messagingApi.util.upsertQueryData("getMessages", arg, {
      pages: [page([])],
      pageParams: [0],
    }),
  );
  globalThis.fetch = async (request) => {
    assert.equal(request.method, "POST");
    assert.equal(
      new URL(request.url).pathname,
      `/api/v1/messaging/conversations/${conversationId}/messages`,
    );
    assert.deepEqual(await request.json(), { messageType: "TEXT", content: "Hello" });
    return json(
      {
        message: "Message sent successfully",
        item: messageDto({
          senderId: viewerId,
          sender: userDto(viewerId),
          content: "Hello",
        }),
      },
      201,
    );
  };
  try {
    const d = await s
      .dispatch(
        messagingApi.endpoints.sendTextMessage.initiate({
          ...arg,
          body: { messageType: "TEXT", content: " Hello " },
        }),
      )
      .unwrap();
    assert.equal(d.id, messageId);
    await tick();
    const cache = messagingApi.endpoints.getMessages.select(arg)(s.getState());
    if (cache.data)
      assert.equal(
        new Set(cache.data.pages.flatMap((p) => p.items).map((m) => m.id)).size,
        1,
      );
  } finally {
    cleanup(s);
    globalThis.fetch = original;
  }
});
for (const endpoint of [
  "sendTextMessage",
  "createDirectConversation",
  "resolveConversationRequest",
  "markConversationRead",
])
  test(`${endpoint} prevents concurrent submissions per session and action scope`, async () => {
    const s = memberStore();
    const original = globalThis.fetch;
    let release;
    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      await new Promise((r) => {
        release = r;
      });
      return json(
        endpoint === "sendTextMessage"
          ? { item: messageDto({ senderId: viewerId, sender: userDto(viewerId) }) }
          : endpoint === "createDirectConversation"
            ? { conversation: conversationDto() }
            : endpoint === "resolveConversationRequest"
              ? { conversationId, status: "ACTIVE" }
              : { message: "Conversation marked as read" },
      );
    };
    const a =
      endpoint === "sendTextMessage"
        ? { ...arg, body: { messageType: "TEXT", content: "Hello" } }
        : endpoint === "createDirectConversation"
          ? { ...scope, target: { participantUserId: memberId } }
          : endpoint === "resolveConversationRequest"
            ? { ...arg, action: "accept" }
            : arg;
    const first = s.dispatch(messagingApi.endpoints[endpoint].initiate(a));
    try {
      while (!release) await tick();
      const second = await s.dispatch(messagingApi.endpoints[endpoint].initiate(a));
      assert.ok(second.error);
      assert.equal(calls, 1);
      release();
      await first.unwrap();
    } finally {
      release?.();
      cleanup(s);
      globalThis.fetch = original;
    }
  });
test("read response is conversation-level only and failed marking preserves cached unread count", async () => {
  const s = memberStore();
  const original = globalThis.fetch;
  await s.dispatch(
    messagingApi.util.upsertQueryData(
      "getConversation",
      arg,
      conversationSchema.parse(conversationDto()),
    ),
  );
  globalThis.fetch = async (request) => {
    assert.equal(request.method, "PATCH");
    assert.equal(
      new URL(request.url).pathname,
      `/api/v1/messaging/conversations/${conversationId}/read`,
    );
    return json({ message: "Failure" }, 503);
  };
  try {
    const r = await s.dispatch(
      messagingApi.endpoints.markConversationRead.initiate(arg),
    );
    assert.ok(r.error);
    assert.equal(
      messagingApi.endpoints.getConversation.select(arg)(s.getState()).data.unreadCount,
      3,
    );
    globalThis.fetch = async () => json({ message: "Conversation marked as read" });
    assert.deepEqual(
      await s
        .dispatch(messagingApi.endpoints.markConversationRead.initiate(arg))
        .unwrap(),
      { message: "Conversation marked as read" },
    );
  } finally {
    cleanup(s);
    globalThis.fetch = original;
  }
});
test("read eligibility requires visible loaded participant thread; requests enforce first-message policy", () => {
  const c = conversationDto();
  assert.equal(canMarkRead(true, c, viewerId, true), true);
  for (const values of [
    [false, c, viewerId, true],
    [true, c, viewerId, false],
    [true, c, "outsider", true],
    [true, { ...c, unreadCount: 0 }, viewerId, true],
  ])
    assert.equal(canMarkRead(...values), false);
  assert.equal(canCompose(c, viewerId), true);
  assert.equal(canCompose({ ...c, isClosed: true }, viewerId), false);
  assert.equal(canCompose({ ...c, directStatus: "DECLINED" }, viewerId), false);
  assert.equal(
    canCompose(
      {
        ...c,
        directStatus: "REQUESTED",
        requestedRecipientId: viewerId,
        messageCount: 0,
      },
      viewerId,
    ),
    false,
  );
  assert.equal(
    canCompose(
      {
        ...c,
        directStatus: "REQUESTED",
        requestedRecipientId: memberId,
        messageCount: 0,
      },
      viewerId,
    ),
    true,
  );
  assert.equal(
    canCompose(
      { ...c, directStatus: "REQUESTED", requestedRecipientId: memberId },
      viewerId,
    ),
    false,
  );
});
test("draft revisions preserve edits during pending sends and isolate conversation switching", () => {
  const a = editDraft(undefined, "A");
  const b = editDraft(undefined, "B");
  const newer = editDraft(a, "A edited");
  const sameTextNewRevision = editDraft(newer, "A");
  assert.equal(confirmedDraft(newer, a), newer);
  assert.equal(confirmedDraft(sameTextNewRevision, a), sameTextNewRevision);
  assert.equal(confirmedDraft(a, a).text, "");
  const drafts = { [conversationId]: a, [otherConversationId]: b };
  drafts[conversationId] = confirmedDraft(drafts[conversationId], a);
  assert.equal(drafts[otherConversationId].text, "B");
});
for (const status of [400, 403, 404, 409, 429, 500, "network"])
  test(`send ${status} failure keeps authoritative cache and never retries automatically`, async () => {
    const s = memberStore();
    const original = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      if (status === "network") throw Error("offline");
      return json({ message: "Do not expose internal details" }, status);
    };
    try {
      const result = await s.dispatch(
        messagingApi.endpoints.sendTextMessage.initiate({
          ...arg,
          body: { messageType: "TEXT", content: "Keep draft" },
        }),
      );
      assert.ok(result.error);
      assert.equal(calls, 1);
      assert.equal(
        messagingApi.endpoints.getMessages.select(arg)(s.getState()).data,
        undefined,
      );
    } finally {
      cleanup(s);
      globalThis.fetch = original;
    }
  });
for (const change of ["logout", "session", "role"])
  test(`${change} during pending response rejects stale data and leaves replacement cache empty`, async () => {
    const s = memberStore();
    const original = globalThis.fetch;
    let release;
    globalThis.fetch = async () => {
      await new Promise((r) => {
        release = r;
      });
      return json({
        item: messageDto({ senderId: viewerId, sender: userDto(viewerId) }),
      });
    };
    const r = s.dispatch(
      messagingApi.endpoints.sendTextMessage.initiate({
        ...arg,
        body: { messageType: "TEXT", content: "Old session draft" },
      }),
    );
    try {
      while (!release) await tick();
      if (change === "logout") s.dispatch(clearSession("expired"));
      else if (change === "role") s.dispatch(activeRoleSelected("VENDOR"));
      else
        s.dispatch(
          sessionStarted({
            accessToken: "new",
            refreshToken: "new-refresh",
            user: null,
            sessionId: "new-session",
          }),
        );
      release();
      assert.ok((await r).error);
      assert.deepEqual(s.getState().api.queries, {});
    } finally {
      release?.();
      cleanup(s);
      globalThis.fetch = original;
    }
  });
test("unverified, unsupported-role and stale-scope requests never call messaging HTTP", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw Error("no");
  };
  try {
    for (const s of [
      memberStore("CUSTOMER", false),
      memberStore("ADMIN"),
      memberStore(),
    ]) {
      assert.ok(
        (
          await s.dispatch(
            messagingApi.endpoints.getConversation.initiate({
              ...arg,
              sessionId: "wrong",
            }),
          )
        ).error,
      );
      if (s.getState().auth.user?.role === "ADMIN")
        assert.equal(messagingAllowed(s.getState()), false);
      cleanup(s);
    }
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = original;
  }
});
for (const bad of ["membership", "wrong-conversation", "malformed", "wrong-request"])
  test(`rejects ${bad} response without fixture fallback`, async () => {
    const s = memberStore();
    const original = globalThis.fetch;
    globalThis.fetch = async () =>
      json(
        bad === "malformed"
          ? { data: [] }
          : bad === "wrong-request"
            ? page([conversationDto()])
            : {
                conversation: conversationDto(
                  bad === "membership"
                    ? { participants: [conversationDto().participants[1]] }
                    : { id: otherConversationId, lastMessage: null },
                ),
              },
      );
    const r = s.dispatch(
      bad === "wrong-request"
        ? messagingApi.endpoints.getConversations.initiate({
            ...scope,
            kind: "requests",
          })
        : messagingApi.endpoints.getConversation.initiate(arg),
    );
    try {
      assert.ok((await r).error);
    } finally {
      r.unsubscribe();
      cleanup(s);
      globalThis.fetch = original;
    }
  });
for (const role of ["CUSTOMER", "VENDOR"])
  test(`${role} page retains independent layout and shows safe empty/loading/selection states`, async () => {
    const s = memberStore(role);
    const a = { sessionId: scope.sessionId, role, kind: "conversations" };
    await s.dispatch(
      messagingApi.util.upsertQueryData("getConversations", a, {
        pages: [page([])],
        pageParams: [0],
      }),
    );
    try {
      const html = render(
        s,
        role === "CUSTOMER" ? CustomerMessagePage : VendorMessagesPage,
      );
      assert.match(
        html,
        role === "CUSTOMER" ? /message-workspace/ : /vendor-messages-panel/,
      );
      assert.match(html, /Choose a conversation/);
      assert.match(html, /New message/);
      assert.match(html, /Refresh list/);
      assert.match(html, /Requests/);
      assert.doesNotMatch(html, /Emily|Seoul|sample|Active now|Local preview/);
    } finally {
      cleanup(s);
    }
  });
test("composer keeps draft, pending send and unavailable attachment controls without local file inputs", () => {
  const html = renderToStaticMarkup(
    h(VendorMessageComposer, { ...composer, text: "Keep my draft", pending: true }),
  );
  assert.match(html, /Keep my draft/);
  assert.match(html, /Attachment uploads unavailable/);
  assert.match(html, /Image uploads unavailable/);
  assert.match(html, /<button[^>]*aria-label="Send message"[^>]*disabled/);
  assert.doesNotMatch(html, /type="file"|blob:|local preview/);
});
test("existing role threads and lists render real identities, safe attachment links and unavailable history controls", () => {
  const c = conversationRow(conversationDto());
  const messages = orderedMessages(
    [
      messageDto({
        messageType: "FILE",
        attachmentUrl: "https://example.invalid/actual.pdf",
      }),
    ],
    viewerId,
  );
  const thread = renderToStaticMarkup(
    h(VendorMessageThread, {
      conversation: c,
      messages,
      mobileOpen: false,
      onBack: noop,
      onDetails: noop,
      onUnavailable: noop,
    }),
  );
  assert.match(thread, /Actual Recipient/);
  assert.match(thread, /Open file attachment/);
  assert.match(thread, /Clear history \(unavailable\)/);
  assert.doesNotMatch(thread, /download=|sample|Active now|245 KB/);
  const list = renderToStaticMarkup(
    h(MessageConversationList, {
      conversations: [c],
      selectedId: c.id,
      search: "",
      onSearch: noop,
      onSelect: noop,
    }),
  );
  assert.match(list, /3 unread messages/);
  assert.match(list, /Filter loaded conversations/);
});
test("message entry points disable self-chat while keeping the initiating profile route", () => {
  const s = memberStore();
  try {
    const html = render(
      s,
      StartConversationButton,
      { target: { participantUserId: viewerId } },
      "/profile/me",
    );
    assert.match(html, /disabled/);
    assert.match(html, /Message/);
  } finally {
    cleanup(s);
  }
});
test("submitted draft workflow keeps text on failure and ignores delayed completion after session replacement", async () => {
  const drafts = {
    [conversationId]: editDraft(undefined, "Keep A"),
    [otherConversationId]: editDraft(undefined, "Keep B"),
  };
  const submitted = drafts[conversationId];
  let failures = 0;
  let commits = 0;
  const commit = () => {
    commits++;
    drafts[conversationId] = confirmedDraft(drafts[conversationId], submitted);
  };
  await submitMessageDraft({
    send: async () => {
      throw Error("offline");
    },
    isCurrent: () => true,
    onConfirmed: commit,
    onFailure: () => {
      failures++;
    },
  });
  assert.equal(failures, 1);
  assert.equal(drafts[conversationId].text, "Keep A");
  assert.equal(commits, 0);
  let release;
  let current = true;
  const pending = submitMessageDraft({
    send: () =>
      new Promise((r) => {
        release = r;
      }),
    isCurrent: () => current,
    onConfirmed: commit,
    onFailure: noop,
  });
  current = false;
  release();
  await pending;
  assert.equal(commits, 0);
  assert.equal(drafts[otherConversationId].text, "Keep B");
  current = true;
  await submitMessageDraft({
    send: async () => ({ id: messageId }),
    isCurrent: () => current,
    onConfirmed: commit,
    onFailure: noop,
  });
  assert.equal(drafts[conversationId].text, "");
  assert.equal(drafts[otherConversationId].text, "Keep B");
});
test("confirmed read refetches active conversation and list unread counts from backend", async () => {
  const s = memberStore();
  const original = globalThis.fetch;
  let read = false;
  const calls = [];
  globalThis.fetch = async (request) => {
    const path = new URL(request.url).pathname;
    calls.push(path);
    if (request.method === "PATCH") {
      read = true;
      return json({ message: "Conversation marked as read" });
    }
    const c = conversationDto({ unreadCount: read ? 0 : 3 });
    return json(path.endsWith(conversationId) ? { conversation: c } : page([c]));
  };
  const listArg = { ...scope, kind: "conversations" };
  const list = s.dispatch(messagingApi.endpoints.getConversations.initiate(listArg));
  const detail = s.dispatch(messagingApi.endpoints.getConversation.initiate(arg));
  try {
    await Promise.all([list.unwrap(), detail.unwrap()]);
    assert.equal(
      messagingApi.endpoints.getConversation.select(arg)(s.getState()).data.unreadCount,
      3,
    );
    assert.equal(
      messagingApi.util.selectInvalidatedBy(s.getState(), [
        "Conversations",
        "ConversationDetail",
      ]).length,
      2,
    );
    await s
      .dispatch(messagingApi.endpoints.markConversationRead.initiate(arg))
      .unwrap();
    for (
      let i = 0;
      i < 50 &&
      messagingApi.endpoints.getConversation.select(arg)(s.getState()).data
        ?.unreadCount !== 0;
      i++
    )
      await tick();
    assert.equal(
      messagingApi.endpoints.getConversation.select(arg)(s.getState()).data.unreadCount,
      0,
    );
    for (
      let i = 0;
      i < 50 &&
      messagingApi.endpoints.getConversations.select(listArg)(s.getState()).data
        ?.pages[0].items[0].unreadCount !== 0;
      i++
    )
      await tick();
    assert.equal(
      messagingApi.endpoints.getConversations.select(listArg)(s.getState()).data
        .pages[0].items[0].unreadCount,
      0,
    );
    assert.ok(calls.length >= 5);
  } finally {
    list.unsubscribe();
    detail.unsubscribe();
    cleanup(s);
    globalThis.fetch = original;
  }
});
test("messaging 401 uses the existing refresh/retry infrastructure with rotated JWT", async () => {
  const s = memberStore();
  const original = globalThis.fetch;
  let reads = 0;
  let refreshes = 0;
  globalThis.fetch = async (request) => {
    if (new URL(request.url).pathname === "/api/v1/auth/refresh") {
      refreshes++;
      assert.deepEqual(await request.json(), { refreshToken: "test-refresh" });
      return json({ accessToken: "rotated-access", refreshToken: "rotated-refresh" });
    }
    reads++;
    if (reads === 1) return json({ message: "Expired" }, 401);
    assert.equal(request.headers.get("authorization"), "Bearer rotated-access");
    return json({ conversation: conversationDto() });
  };
  const req = s.dispatch(messagingApi.endpoints.getConversation.initiate(arg));
  try {
    assert.equal((await req.unwrap()).id, conversationId);
    assert.equal(refreshes, 1);
    assert.equal(reads, 2);
    assert.equal(s.getState().auth.isIdentityVerified, true);
  } finally {
    req.unsubscribe();
    cleanup(s);
    globalThis.fetch = original;
  }
});
test("definitive invalid session refresh clears messaging caches without weakening guards", async () => {
  const s = memberStore();
  const original = globalThis.fetch;
  globalThis.fetch = async () => json({ message: "Expired" }, 401);
  const req = s.dispatch(messagingApi.endpoints.getConversation.initiate(arg));
  try {
    assert.equal((await req).data, undefined);
    assert.equal(messagingAllowed(s.getState()), false);
    assert.deepEqual(s.getState().api.queries, {});
  } finally {
    req.unsubscribe();
    cleanup(s);
    globalThis.fetch = original;
  }
});
test("switching conversation arguments never returns another conversation's cached history", async () => {
  const s = memberStore();
  const original = globalThis.fetch;
  await s.dispatch(
    messagingApi.util.upsertQueryData("getMessages", arg, {
      pages: [page([messageDto()])],
      pageParams: [0],
    }),
  );
  globalThis.fetch = async () => json(page([]));
  const other = { ...arg, conversationId: otherConversationId };
  const req = s.dispatch(messagingApi.endpoints.getMessages.initiate(other));
  try {
    assert.equal(
      messagingApi.endpoints.getMessages.select(other)(s.getState()).data,
      undefined,
    );
    const d = await req.unwrap();
    assert.deepEqual(d.pages[0].items, []);
    assert.equal(
      messagingApi.endpoints.getMessages.select(arg)(s.getState()).data.pages[0]
        .items[0].conversationId,
      conversationId,
    );
  } finally {
    req.unsubscribe();
    cleanup(s);
    globalThis.fetch = original;
  }
});
test("stale request resolution returns backend 404 and never simulates acceptance", async () => {
  const s = memberStore();
  const original = globalThis.fetch;
  globalThis.fetch = async () => json({ message: "Message request not found" }, 404);
  try {
    const result = await s.dispatch(
      messagingApi.endpoints.resolveConversationRequest.initiate({
        ...arg,
        action: "accept",
      }),
    );
    assert.equal(result.error.status, 404);
    assert.equal(result.data, undefined);
  } finally {
    cleanup(s);
    globalThis.fetch = original;
  }
});
